import { AppError } from './app.error.js';

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class AIInvalidResponseError extends AppError {
  constructor(message = 'Invalid or unparseable response from AI decision model', details?: unknown) {
    super(message, 502, 'AI_INVALID_RESPONSE', details);
  }
}

export class PolicyViolationError extends AppError {
  constructor(message = 'Action violates active recovery policies', details?: unknown) {
    super(message, 422, 'POLICY_VIOLATION', details);
  }
}

export class PaymentProviderError extends AppError {
  constructor(message = 'Payment provider operation failed', details?: unknown) {
    super(message, 502, 'PAYMENT_PROVIDER_ERROR', details);
  }
}

