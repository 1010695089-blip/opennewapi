import type { FastifyRequest, FastifyReply } from 'fastify';
import { BudgetExceededError } from '../utils/errors.js';
import { getDailySpend, getMonthlySpend, logUsage } from '../cost/index.js';
import { generateId } from '../utils/crypto.js';

export async function budgetCheckMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const key = request.apiKey;
  if (!key) return;

  if (key.daily_budget_cents) {
    const spent = getDailySpend(key.id);
    if (spent >= key.daily_budget_cents) {
      const msg = `Daily budget exceeded: $${(spent / 100).toFixed(2)} / $${(key.daily_budget_cents / 100).toFixed(2)}`;
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
        status: 'budget_exceeded',
        error_message: msg,
      });
      throw new BudgetExceededError(msg);
    }
  }

  if (key.monthly_budget_cents) {
    const spent = getMonthlySpend(key.id);
    if (spent >= key.monthly_budget_cents) {
      const msg = `Monthly budget exceeded: $${(spent / 100).toFixed(2)} / $${(key.monthly_budget_cents / 100).toFixed(2)}`;
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
        status: 'budget_exceeded',
        error_message: msg,
      });
      throw new BudgetExceededError(msg);
    }
  }
}
