import type { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimitError } from '../utils/errors.js';
import { logUsage } from '../cost/index.js';
import { generateId } from '../utils/crypto.js';

// Simple in-memory sliding window rate limiter
const windows = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, window] of windows) {
    if (window.resetAt < now) windows.delete(key);
  }
}, 5 * 60 * 1000).unref();

export async function rateLimitMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const key = request.apiKey;
  if (!key) return;

  const limit = key.rate_limit_rpm;
  const now = Date.now();
  const windowKey = key.id;

  let window = windows.get(windowKey);
  if (!window || window.resetAt < now) {
    window = { count: 0, resetAt: now + 60_000 };
    windows.set(windowKey, window);
  }

  window.count++;

  reply.header('x-ratelimit-limit', limit);
  reply.header('x-ratelimit-remaining', Math.max(0, limit - window.count));
  reply.header('x-ratelimit-reset', Math.ceil(window.resetAt / 1000));

  if (window.count > limit) {
    const msg = `Rate limit exceeded: ${limit} requests per minute`;
    logUsage({
      request_id: generateId(),
      api_key_id: key.id,
      soul_id: '',
      provider_id: '',
      model: '',
      input_tokens: 0,
      output_tokens: 0,
      cost_cents: 0,
      latency_ms: 0,
      status: 'rate_limited',
      error_message: msg,
    });
    throw new RateLimitError(msg);
  }
}
