import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authMiddleware } from '../../middleware/auth.js';
import { rateLimitMiddleware } from '../../middleware/rate-limit.js';
import { budgetCheckMiddleware } from '../../middleware/budget-check.js';
import { getSoulById, getSoulBySlug } from '../../souls/repository.js';
import { chatWithFallback, getDefaultProvider, streamWithFallback } from '../../providers/index.js';
import { logUsage } from '../../cost/index.js';
import { calculateCostCents } from '../../utils/tokens.js';
import { generateId } from '../../utils/crypto.js';
import { OpenHingeError, toOpenAIError } from '../../utils/errors.js';
import type { ChatMessage, ToolCall, ToolDefinition } from '../../providers/types.js';

type ResponseContentPart = {
  type?: string;
  text?: string;
  content?: string;
  input?: unknown;
  call_id?: string;
  tool_call_id?: string;
  output?: string | Array<{ type?: string; text?: string }>;
};

type ResponseInputItem = {
  role?: string;
  type?: string;
  content?: string | ResponseContentPart[];
  call_id?: string;
  name?: string;
  arguments?: string;
  output?: string | Array<{ type?: string; text?: string }>;
};

interface ResponsesBody {
  model?: string;
  input: string | ResponseInputItem[];
  instructions?: string;
  temperature?: number;
  max_output_tokens?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: ToolDefinition[];
  tool_choice?: unknown;
  top_p?: number;
  metadata?: { user_id?: string };
  user?: string;
  store?: boolean;
  previous_response_id?: string;
}

export async function responsesRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: ResponsesBody }>('/v1/responses', {
    preHandler: [authMiddleware, rateLimitMiddleware, budgetCheckMiddleware],
  }, handleResponses);
}

function textFromPart(part: ResponseContentPart): string {
  if (typeof part.text === 'string') return part.text;
  if (typeof part.content === 'string') return part.content;
  if (typeof part.output === 'string') return part.output;
  if (Array.isArray(part.output)) {
    return part.output.map((p) => p.text || '').join('');
  }
  return '';
}

function textFromContent(content: string | ResponseContentPart[] | undefined): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(textFromPart).join('');
  return '';
}

function convertResponsesInput(input: ResponsesBody['input'], instructions?: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  if (instructions) messages.push({ role: 'system', content: instructions });

  if (typeof input === 'string') {
    messages.push({ role: 'user', content: input });
    return messages;
  }

  for (const item of input) {
    if (item.type === 'function_call') {
      messages.push({
        role: 'assistant',
        content: '',
        tool_calls: [{
          id: item.call_id || generateId(),
          type: 'function',
          function: {
            name: item.name || '',
            arguments: item.arguments || '{}',
          },
        }],
      });
      continue;
    }

    if (item.type === 'function_call_output') {
      messages.push({
        role: 'tool',
        tool_call_id: item.call_id,
        content: textFromContent(item.content) || (
          typeof item.output === 'string'
            ? item.output
            : Array.isArray(item.output)
              ? item.output.map((p) => p.text || '').join('')
              : ''
        ),
      });
      continue;
    }

    const content = textFromContent(item.content);
    if (!content && item.role !== 'assistant') continue;
    messages.push({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content,
    });
  }

  return messages;
}

function resolveFinishReason(reason: string | null): string {
  if (!reason) return 'stop';
  const r = reason.toLowerCase();
  if (r === 'tool_use' || r === 'tool_calls') return 'tool_calls';
  if (r === 'max_tokens' || r === 'length') return 'length';
  return 'stop';
}

function responseMessageItem(id: string, content: string) {
  return {
    id,
    type: 'message',
    status: 'completed',
    role: 'assistant',
    content: [{
      type: 'output_text',
      text: content,
      annotations: [],
    }],
  };
}

function responseToolItem(toolCall: ToolCall) {
  return {
    id: toolCall.id,
    type: 'function_call',
    status: 'completed',
    call_id: toolCall.id,
    name: toolCall.function.name,
    arguments: toolCall.function.arguments,
  };
}

function writeSse(reply: FastifyReply, event: string, data: Record<string, unknown>): void {
  reply.raw.write(`event: ${event}\n`);
  reply.raw.write(`data: ${JSON.stringify({ type: event, ...data })}\n\n`);
}

async function handleResponses(
  request: FastifyRequest<{ Body: ResponsesBody }>,
  reply: FastifyReply,
): Promise<void> {
  const requestId = generateId();
  const responseId = `resp_${requestId}`;
  const start = Date.now();
  const key = request.apiKey!;
  const body = request.body;

  let soul = null;
  if (key.soul_ids && key.soul_ids.length === 1) {
    soul = getSoulById(key.soul_ids[0]);
  } else if (key.soul_id) {
    soul = getSoulById(key.soul_id);
  } else {
    const soulHeader = (request.headers['x-astra-profile'] || request.headers['x-openhinge-soul']) as string;
    if (soulHeader) soul = getSoulBySlug(soulHeader);
  }

  if (soul && key.soul_ids && key.soul_ids.length > 0 && !key.soul_ids.includes(soul.id)) {
    throw new OpenHingeError('Key does not have access to this soul', 403, 'SOUL_ACCESS_DENIED');
  }

  const messages = convertResponsesInput(body.input, soul?.system_prompt || body.instructions);
  const providerIds: string[] = [];
  if (soul?.provider_id) providerIds.push(soul.provider_id);
  if (soul?.fallback_chain) providerIds.push(...soul.fallback_chain);
  const defaultProvider = getDefaultProvider();
  if (defaultProvider && !providerIds.includes(defaultProvider.id)) {
    providerIds.push(defaultProvider.id);
  }

  if (providerIds.length === 0) {
    throw new OpenHingeError('No providers configured', 503, 'NO_PROVIDERS');
  }

  const chatParams = {
    messages,
    model: soul?.model || body.model || undefined,
    temperature: body.temperature ?? soul?.temperature,
    max_tokens: body.max_output_tokens || body.max_tokens || soul?.max_tokens,
    stream: body.stream,
    tools: body.tools,
    tool_choice: body.tool_choice,
    top_p: body.top_p,
    metadata: body.metadata,
    user: body.user,
  };

  if (body.stream) {
    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      'connection': 'keep-alive',
      'x-request-id': requestId,
    });

    const outputItemId = `msg_${requestId}`;
    let contentStarted = false;
    let fullText = '';
    let totalInput = 0;
    let totalOutput = 0;
    let usedProvider = '';
    let usedModel = body.model || '';
    let streamError: Error | null = null;

    writeSse(reply, 'response.created', {
      response: {
        id: responseId,
        object: 'response',
        created_at: Math.floor(Date.now() / 1000),
        status: 'in_progress',
        model: usedModel,
        output: [],
      },
    });

    try {
      for await (const { provider, chunk } of streamWithFallback(providerIds, chatParams)) {
        usedProvider = provider.id;
        usedModel = chunk.model;

        if (chunk.delta) {
          if (!contentStarted) {
            writeSse(reply, 'response.output_item.added', {
              output_index: 0,
              item: {
                id: outputItemId,
                type: 'message',
                status: 'in_progress',
                role: 'assistant',
                content: [],
              },
            });
            writeSse(reply, 'response.content_part.added', {
              item_id: outputItemId,
              output_index: 0,
              content_index: 0,
              part: { type: 'output_text', text: '', annotations: [] },
            });
            contentStarted = true;
          }
          fullText += chunk.delta;
          writeSse(reply, 'response.output_text.delta', {
            item_id: outputItemId,
            output_index: 0,
            content_index: 0,
            delta: chunk.delta,
          });
        }

        if (chunk.tool_calls?.length) {
          for (const toolCall of chunk.tool_calls) {
            const item = responseToolItem(toolCall);
            writeSse(reply, 'response.output_item.added', { output_index: 1, item });
            writeSse(reply, 'response.function_call_arguments.delta', {
              item_id: toolCall.id,
              output_index: 1,
              delta: toolCall.function.arguments,
            });
            writeSse(reply, 'response.function_call_arguments.done', {
              item_id: toolCall.id,
              output_index: 1,
              arguments: toolCall.function.arguments,
            });
            writeSse(reply, 'response.output_item.done', { output_index: 1, item });
          }
        }

        if (chunk.input_tokens) totalInput = chunk.input_tokens;
        if (chunk.output_tokens) totalOutput = chunk.output_tokens;
      }

      if (contentStarted) {
        writeSse(reply, 'response.output_text.done', {
          item_id: outputItemId,
          output_index: 0,
          content_index: 0,
          text: fullText,
        });
        writeSse(reply, 'response.content_part.done', {
          item_id: outputItemId,
          output_index: 0,
          content_index: 0,
          part: { type: 'output_text', text: fullText, annotations: [] },
        });
        writeSse(reply, 'response.output_item.done', {
          output_index: 0,
          item: responseMessageItem(outputItemId, fullText),
        });
      }

      writeSse(reply, 'response.completed', {
        response: {
          id: responseId,
          object: 'response',
          created_at: Math.floor(Date.now() / 1000),
          status: 'completed',
          model: usedModel,
          output: contentStarted ? [responseMessageItem(outputItemId, fullText)] : [],
          usage: {
            input_tokens: totalInput,
            output_tokens: totalOutput,
            total_tokens: totalInput + totalOutput,
          },
        },
      });
      reply.raw.write('data: [DONE]\n\n');
    } catch (err: any) {
      streamError = err instanceof Error ? err : new Error(String(err));
      writeSse(reply, 'response.failed', {
        response: {
          id: responseId,
          object: 'response',
          status: 'failed',
          model: usedModel,
          error: toOpenAIError(err),
        },
      });
    } finally {
      reply.raw.end();
      logUsage({
        request_id: requestId,
        api_key_id: key.id,
        soul_id: soul?.id || 'none',
        provider_id: usedProvider,
        model: usedModel || chatParams.model || 'unknown',
        input_tokens: totalInput,
        output_tokens: totalOutput,
        cost_cents: calculateCostCents(usedModel || chatParams.model || 'unknown', totalInput, totalOutput),
        latency_ms: Date.now() - start,
        status: streamError ? 'error' : 'success',
        error_message: streamError?.message,
      });
    }
    return;
  }

  try {
    const { provider, response } = await chatWithFallback(providerIds, chatParams);
    const output = response.tool_calls?.length
      ? response.tool_calls.map(responseToolItem)
      : [responseMessageItem(`msg_${requestId}`, response.content)];
    const costCents = calculateCostCents(response.model, response.input_tokens, response.output_tokens);

    logUsage({
      request_id: requestId,
      api_key_id: key.id,
      soul_id: soul?.id || 'none',
      provider_id: provider.id,
      model: response.model,
      input_tokens: response.input_tokens,
      output_tokens: response.output_tokens,
      cost_cents: costCents,
      latency_ms: Date.now() - start,
      status: 'success',
    });

    reply.send({
      id: responseId,
      object: 'response',
      created_at: Math.floor(Date.now() / 1000),
      status: 'completed',
      model: response.model,
      output,
      output_text: response.content,
      usage: {
        input_tokens: response.input_tokens,
        output_tokens: response.output_tokens,
        total_tokens: response.input_tokens + response.output_tokens,
      },
      incomplete_details: null,
      error: null,
      _openhinge: {
        request_id: requestId,
        soul: soul?.slug || null,
        provider: provider.name,
        cost_cents: costCents,
        finish_reason: resolveFinishReason(response.finish_reason),
        fallback_attempts: response.fallback_attempts || undefined,
      },
    });
  } catch (err: any) {
    logUsage({
      request_id: requestId,
      api_key_id: key.id,
      soul_id: soul?.id || 'none',
      provider_id: 'none',
      model: chatParams.model || 'unknown',
      input_tokens: 0,
      output_tokens: 0,
      cost_cents: 0,
      latency_ms: Date.now() - start,
      status: 'error',
      error_message: err.message,
    });
    throw err;
  }
}
