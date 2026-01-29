import type { ErrorResponse } from '../types/index';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON(): ErrorResponse {
    return {
      success: false,
      error: this.message,
      code: this.code,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Common error factory functions
 */
export const Errors = {
  /**
   * 400 Bad Request
   */
  badRequest: (message: string, details?: Record<string, any>) =>
    new ApiError(400, 'BAD_REQUEST', message, details),

  /**
   * 401 Unauthorized
   */
  unauthorized: (message: string = 'Unauthorized') =>
    new ApiError(401, 'UNAUTHORIZED', message),

  /**
   * 403 Forbidden
   */
  forbidden: (message: string = 'Forbidden') =>
    new ApiError(403, 'FORBIDDEN', message),

  /**
   * 404 Not Found
   */
  notFound: (resource: string = 'Resource') =>
    new ApiError(404, 'NOT_FOUND', `${resource} not found`),

  /**
   * 409 Conflict
   */
  conflict: (message: string) =>
    new ApiError(409, 'CONFLICT', message),

  /**
   * 413 Payload Too Large
   */
  payloadTooLarge: (message: string = 'File too large') =>
    new ApiError(413, 'PAYLOAD_TOO_LARGE', message),

  /**
   * 429 Too Many Requests
   */
  rateLimited: (retryAfter?: number) => {
    const error = new ApiError(
      429,
      'RATE_LIMITED',
      'Too many requests. Please try again later.'
    );
    if (retryAfter) {
      error.details = { retryAfter };
    }
    return error;
  },

  /**
   * 500 Internal Server Error
   */
  internalError: (message: string = 'Internal server error') =>
    new ApiError(500, 'INTERNAL_ERROR', message),

  /**
   * 503 Service Unavailable
   */
  serviceUnavailable: (message: string = 'Service temporarily unavailable') =>
    new ApiError(503, 'SERVICE_UNAVAILABLE', message),
};

/**
 * Validation error helper
 */
export function createValidationError(
  errors: Record<string, string[]>
): ApiError {
  return new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', {
    errors,
  });
}
