import type { Env, AppContext } from '../types/index';
import { Hono } from 'hono';
import { ApiError } from '../utils/errors';
import { getLogger } from '../utils/logger';
import { generateRequestId } from '../utils/helpers';

/**
 * Global Error Handler Middleware
 *
 * Catches all errors thrown in handlers and formats them consistently.
 * Maps different error types to appropriate HTTP status codes.
 * Logs errors with stack traces (without exposing to client in production).
 * Adds request ID to all error responses for debugging.
 */

/**
 * Error response format
 */
interface ErrorResponseFormat {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
    path?: string;
    stack?: string; // Only in development
  };
}

/**
 * Known error types that we can map to specific status codes
 */
const ERROR_TYPE_MAPPING: Record<string, number> = {
  ValidationError: 400,
  ZodError: 400,
  SyntaxError: 400,
  TypeError: 400,
  RangeError: 413,
  SessionNotFoundError: 404,
  StorageError: 500,
  CRXError: 422,
  TimeoutError: 504,
};

/**
 * Format error response with consistent structure
 */
function formatErrorResponse(
  err: Error | ApiError,
  requestId: string,
  path: string,
  includeStack: boolean = false
): ErrorResponseFormat {
  const timestamp = new Date().toISOString();

  // Handle ApiError
  if (err instanceof ApiError) {
    return {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp,
        requestId,
        path,
        ...(includeStack && err.stack ? { stack: err.stack } : {}),
      },
    };
  }

  // Handle standard errors
  const errorType = err.constructor.name;
  const code = errorType.toUpperCase().replace(/ERROR$/, '_ERROR');

  return {
    error: {
      code,
      message: err.message || 'An unexpected error occurred',
      timestamp,
      requestId,
      path,
      ...(includeStack && err.stack ? { stack: err.stack } : {}),
    },
  };
}

/**
 * Get status code for error
 */
function getStatusCodeForError(err: Error | ApiError): number {
  // ApiError has status code
  if (err instanceof ApiError) {
    return err.statusCode;
  }

  // Check error type mapping
  const errorType = err.constructor.name;
  if (ERROR_TYPE_MAPPING[errorType]) {
    return ERROR_TYPE_MAPPING[errorType];
  }

  // Check error name
  if (err.name && ERROR_TYPE_MAPPING[err.name]) {
    return ERROR_TYPE_MAPPING[err.name];
  }

  // Check specific error messages
  if (err.message.includes('JSON')) {
    return 400;
  }

  if (err.message.includes('not found')) {
    return 404;
  }

  if (err.message.includes('unauthorized') || err.message.includes('authentication')) {
    return 401;
  }

  if (err.message.includes('forbidden') || err.message.includes('permission')) {
    return 403;
  }

  if (err.message.includes('too large') || err.message.includes('exceeded')) {
    return 413;
  }

  if (err.message.includes('rate limit')) {
    return 429;
  }

  // Default to 500 for unknown errors
  return 500;
}

/**
 * Setup error handler for Hono app
 *
 * @example
 * ```typescript
 * const app = new Hono<{ Bindings: Env }>();
 * setupErrorHandler(app);
 * ```
 */
export function setupErrorHandler(app: Hono<{ Bindings: Env }>) {
  app.onError((err, c) => {
    const requestId = c.get('requestId') || generateRequestId();
    const logger = getLogger({ requestId });
    const path = c.req.path;
    const method = c.req.method;

    // Determine if we should include stack traces (only in development)
    const isDevelopment = !c.env.ENVIRONMENT || c.env.ENVIRONMENT === 'development';
    const includeStack = isDevelopment;

    // Get status code
    const statusCode = getStatusCodeForError(err);

    // Log based on severity
    if (statusCode >= 500) {
      logger.error('Server error', err, {
        statusCode,
        path,
        method,
        errorType: err.constructor.name,
      });
    } else if (statusCode >= 400) {
      logger.warn('Client error', {
        statusCode,
        path,
        method,
        errorType: err.constructor.name,
        message: err.message,
      });
    }

    // Handle Zod validation errors specially
    if (err.name === 'ZodError' && 'issues' in err) {
      const zodError = err as any;
      const validationDetails = {
        errors: zodError.issues?.map((issue: any) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
      };

      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validationDetails,
            timestamp: new Date().toISOString(),
            requestId,
            path,
          },
        },
        400
      );
    }

    // Format and return error response
    const errorResponse = formatErrorResponse(err, requestId, path, includeStack);
    return c.json(errorResponse, statusCode);
  });
}

/**
 * Setup not found handler
 *
 * @example
 * ```typescript
 * const app = new Hono<{ Bindings: Env }>();
 * setupNotFoundHandler(app);
 * ```
 */
export function setupNotFoundHandler(app: Hono<{ Bindings: Env }>) {
  app.notFound((c) => {
    const requestId = c.get('requestId') || generateRequestId();
    const logger = getLogger({ requestId });
    const path = c.req.path;

    logger.warn('Route not found', {
      path,
      method: c.req.method,
    });

    return c.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: `Route not found: ${c.req.method} ${path}`,
          timestamp: new Date().toISOString(),
          requestId,
          path,
        },
      },
      404
    );
  });
}

/**
 * Error handler middleware (can be used inline)
 *
 * This is an alternative to setupErrorHandler that can be used as middleware.
 * Useful when you want to apply error handling to specific routes only.
 *
 * @example
 * ```typescript
 * app.use('/api/*', errorHandlerMiddleware());
 * ```
 */
export function errorHandlerMiddleware() {
  return async (c: AppContext, next: () => Promise<void>): Promise<void | Response> => {
    try {
      await next();
    } catch (err) {
      const requestId = c.get('requestId') || generateRequestId();
      const logger = getLogger({ requestId });
      const path = c.req.path;
      const isDevelopment = !c.env.ENVIRONMENT || c.env.ENVIRONMENT === 'development';
      const statusCode = getStatusCodeForError(err as Error);

      // Log error
      if (statusCode >= 500) {
        logger.error('Server error', err);
      } else {
        logger.warn('Client error', { error: err });
      }

      // Format and return error response
      const errorResponse = formatErrorResponse(
        err as Error,
        requestId,
        path,
        isDevelopment
      );
      return c.json(errorResponse, statusCode);
    }
  };
}
