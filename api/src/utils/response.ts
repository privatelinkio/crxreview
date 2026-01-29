import type { AppContext, ApiResponse } from '../types/index';

/**
 * Enhanced API response type with meta information
 */
export interface EnhancedApiResponse<T = any> extends ApiResponse<T> {
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
    path?: string;
  };
}

/**
 * Error details for error responses
 */
export interface ErrorDetails {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId: string;
  path: string;
}

/**
 * Create success response with consistent formatting
 *
 * @param c - Hono context
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns Formatted response with metadata
 */
export function successResponse<T>(
  c: AppContext,
  data: T,
  status: number = 200
): Response {
  const response: EnhancedApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId') || crypto.randomUUID(),
      version: c.env.API_VERSION || '1.0.0',
      path: c.req.path,
    },
  };

  return c.json(response, status);
}

/**
 * Create error response with consistent formatting
 *
 * @param c - Hono context
 * @param code - Error code
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @param details - Additional error details
 * @returns Formatted error response
 */
export function errorResponse(
  c: AppContext,
  code: string,
  message: string,
  status: number = 500,
  details?: Record<string, any>
): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
    message: code,
    statusCode: status,
    timestamp: new Date().toISOString(),
    path: c.req.path,
  };

  if (details) {
    // Add details to response if provided
    Object.assign(response, { details });
  }

  return c.json(response, status);
}

/**
 * Create paginated response
 *
 * @param c - Hono context
 * @param data - Array of items
 * @param total - Total count of items
 * @param offset - Current offset
 * @param limit - Items per page
 * @returns Paginated response
 */
export function paginatedResponse<T>(
  c: AppContext,
  data: T[],
  total: number,
  offset: number,
  limit: number
): Response {
  const response: EnhancedApiResponse<any> = {
    success: true,
    data: {
      items: data,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + data.length < total,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId') || crypto.randomUUID(),
      version: c.env.API_VERSION || '1.0.0',
      path: c.req.path,
    },
  };

  return c.json(response, 200);
}

/**
 * Create file download response
 *
 * @param data - File content (string, ArrayBuffer, or ReadableStream)
 * @param contentType - MIME type
 * @param filename - Optional filename for Content-Disposition header
 * @returns Download response
 */
export function downloadResponse(
  data: string | ArrayBuffer | ReadableStream<Uint8Array>,
  contentType: string,
  filename?: string
): Response {
  const headers: Record<string, string> = {
    'Content-Type': contentType,
  };

  if (filename) {
    // Sanitize filename for header
    const sanitized = filename.replace(/[^a-z0-9.-]/gi, '_');
    headers['Content-Disposition'] = `attachment; filename="${sanitized}"`;
  }

  return new Response(data, { headers });
}

/**
 * Create JSON stream response for large datasets
 *
 * @param generator - Async generator that yields JSON-serializable items
 * @returns Streaming response
 */
export async function streamResponse<T>(
  generator: AsyncGenerator<T>
): Promise<Response> {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({ success: true, data: [] }) + '\n'
          )
        );

        for await (const item of generator) {
          controller.enqueue(
            new TextEncoder().encode(JSON.stringify(item) + '\n')
          );
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
    },
  });
}

/**
 * Create redirect response
 *
 * @param url - Target URL
 * @param status - HTTP status code (default: 302)
 * @returns Redirect response
 */
export function redirectResponse(
  url: string,
  status: number = 302
): Response {
  return new Response(null, {
    status,
    headers: {
      Location: url,
    },
  });
}

/**
 * Create not found response
 *
 * @param c - Hono context
 * @param resource - Resource name
 * @returns Not found response
 */
export function notFoundResponse(
  c: AppContext,
  resource: string = 'Resource'
): Response {
  return errorResponse(
    c,
    'NOT_FOUND',
    `${resource} not found`,
    404
  );
}

/**
 * Create validation error response
 *
 * @param c - Hono context
 * @param errors - Validation errors by field
 * @returns Validation error response
 */
export function validationErrorResponse(
  c: AppContext,
  errors: Record<string, string[]>
): Response {
  return errorResponse(
    c,
    'VALIDATION_ERROR',
    'Validation failed',
    400,
    { errors }
  );
}

/**
 * Create rate limit error response
 *
 * @param c - Hono context
 * @param retryAfter - Seconds to retry after
 * @returns Rate limit error response
 */
export function rateLimitErrorResponse(
  c: AppContext,
  retryAfter: number
): Response {
  const response = errorResponse(
    c,
    'RATE_LIMITED',
    'Too many requests. Please try again later.',
    429,
    { retryAfter }
  );

  // Add Retry-After header
  response.headers.set('Retry-After', retryAfter.toString());

  return response;
}

/**
 * Create unauthorized response
 *
 * @param c - Hono context
 * @param message - Error message
 * @returns Unauthorized response
 */
export function unauthorizedResponse(
  c: AppContext,
  message: string = 'Unauthorized'
): Response {
  return errorResponse(
    c,
    'UNAUTHORIZED',
    message,
    401
  );
}

/**
 * Create forbidden response
 *
 * @param c - Hono context
 * @param message - Error message
 * @returns Forbidden response
 */
export function forbiddenResponse(
  c: AppContext,
  message: string = 'Forbidden'
): Response {
  return errorResponse(
    c,
    'FORBIDDEN',
    message,
    403
  );
}

/**
 * Create bad request response
 *
 * @param c - Hono context
 * @param message - Error message
 * @param details - Additional details
 * @returns Bad request response
 */
export function badRequestResponse(
  c: AppContext,
  message: string = 'Bad request',
  details?: Record<string, any>
): Response {
  return errorResponse(
    c,
    'BAD_REQUEST',
    message,
    400,
    details
  );
}

/**
 * Create conflict response
 *
 * @param c - Hono context
 * @param message - Error message
 * @returns Conflict response
 */
export function conflictResponse(
  c: AppContext,
  message: string
): Response {
  return errorResponse(
    c,
    'CONFLICT',
    message,
    409
  );
}

/**
 * Create internal server error response
 *
 * @param c - Hono context
 * @param message - Error message
 * @returns Internal error response
 */
export function internalErrorResponse(
  c: AppContext,
  message: string = 'Internal server error'
): Response {
  return errorResponse(
    c,
    'INTERNAL_ERROR',
    message,
    500
  );
}

/**
 * Create service unavailable response
 *
 * @param c - Hono context
 * @param message - Error message
 * @returns Service unavailable response
 */
export function serviceUnavailableResponse(
  c: AppContext,
  message: string = 'Service temporarily unavailable'
): Response {
  return errorResponse(
    c,
    'SERVICE_UNAVAILABLE',
    message,
    503
  );
}

/**
 * Add rate limit headers to response
 *
 * @param response - Base response
 * @param limit - Rate limit
 * @param remaining - Remaining requests
 * @param reset - Unix timestamp when limit resets
 * @returns Response with rate limit headers
 */
export function addRateLimitHeaders(
  response: Response,
  limit: number,
  remaining: number,
  reset: number
): Response {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toString());

  return response;
}

/**
 * Add cache headers to response
 *
 * @param response - Base response
 * @param maxAge - Cache duration in seconds
 * @param isPublic - Whether cache is public or private
 * @returns Response with cache headers
 */
export function addCacheHeaders(
  response: Response,
  maxAge: number,
  isPublic: boolean = true
): Response {
  const cacheControl = `${isPublic ? 'public' : 'private'}, max-age=${maxAge}`;
  response.headers.set('Cache-Control', cacheControl);

  return response;
}

/**
 * Add CORS headers to response
 *
 * @param response - Base response
 * @param origin - Allowed origin
 * @returns Response with CORS headers
 */
export function addCorsHeaders(
  response: Response,
  origin: string
): Response {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-API-Key'
  );

  return response;
}
