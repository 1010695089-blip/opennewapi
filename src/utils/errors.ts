export class OpenHingeError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = 'OpenHingeError';
  }
}

export class AuthError extends OpenHingeError {
  constructor(message = 'Invalid or missing API key') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class NotFoundError extends OpenHingeError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends OpenHingeError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export class BudgetExceededError extends OpenHingeError {
  constructor(message = 'Budget limit exceeded') {
    super(message, 402, 'BUDGET_EXCEEDED');
    this.name = 'BudgetExceededError';
  }
}

export class ProviderError extends OpenHingeError {
  constructor(
    provider: string,
    message: string,
    statusCode = 502,
    code = providerErrorCode(statusCode),
  ) {
    super(`Provider [${provider}]: ${message}`, statusCode, code);
    this.name = 'ProviderError';
  }
}

function providerErrorCode(statusCode: number): string {
  if (statusCode === 429) return 'PROVIDER_RATE_LIMIT';
  if (statusCode === 401 || statusCode === 403) return 'PROVIDER_AUTH_ERROR';
  if (statusCode >= 500) return 'PROVIDER_UPSTREAM_ERROR';
  return 'PROVIDER_ERROR';
}

export function toOpenAIError(error: unknown) {
  const isOpenHingeError = error instanceof OpenHingeError;
  const message = isOpenHingeError && error instanceof Error ? error.message : 'Internal server error';
  const code = isOpenHingeError ? error.code : 'INTERNAL_ERROR';

  return {
    message,
    type: code.toLowerCase(),
    code,
  };
}
