/**
 * Examples demonstrating response builder utilities usage
 */

import {
  successResponse,
  errorResponse,
  paginatedResponse,
  downloadResponse,
  redirectResponse,
  notFoundResponse,
  validationErrorResponse,
  rateLimitErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  conflictResponse,
  internalErrorResponse,
  serviceUnavailableResponse,
  addRateLimitHeaders,
  addCacheHeaders,
  addCorsHeaders,
} from '../response';

import type { AppContext, ExtensionSessionResponse } from '../../types';

/**
 * Success Response Examples
 */

// Basic success response
function handleUploadSuccess(c: AppContext, sessionId: string): Response {
  const data: ExtensionSessionResponse = {
    sessionId,
    extensionId: 'abcdefghijklmnopqrstuvwxyz123456',
    fileName: 'extension.crx',
    fileCount: 42,
    size: 2097152,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    version: '1.0.0',
  };

  return successResponse(c, data, 201); // 201 Created
}

/**
 * Paginated Response Examples
 */

interface SearchMatch {
  file: string;
  line: number;
  match: string;
}

function handleSearchResults(
  c: AppContext,
  matches: SearchMatch[],
  total: number,
  page: number,
  limit: number
): Response {
  const offset = (page - 1) * limit;
  return paginatedResponse(c, matches, total, offset, limit);
}

/**
 * Error Response Examples
 */

// Not found error
function handleExtensionNotFound(c: AppContext): Response {
  return notFoundResponse(c, 'Extension');
}

// Validation error
function handleInvalidInput(c: AppContext): Response {
  const errors = {
    'query': ['Query must be at least 1 character long'],
    'maxResults': ['Max results must be between 1 and 1000'],
  };
  return validationErrorResponse(c, errors);
}

// Rate limit error
function handleRateLimited(c: AppContext): Response {
  const retryAfter = 60; // seconds
  return rateLimitErrorResponse(c, retryAfter);
}

// Authorization errors
function handleUnauthorized(c: AppContext): Response {
  return unauthorizedResponse(c, 'API key is required');
}

function handleForbidden(c: AppContext): Response {
  return forbiddenResponse(c, 'You do not have permission to access this resource');
}

// Bad request error
function handleBadRequest(c: AppContext, message: string): Response {
  return badRequestResponse(c, message, {
    details: 'Additional error context',
  });
}

// Conflict error
function handleConflict(c: AppContext): Response {
  return conflictResponse(c, 'Extension with this ID already exists');
}

// Server errors
function handleInternalError(c: AppContext): Response {
  return internalErrorResponse(c, 'An unexpected error occurred');
}

function handleServiceUnavailable(c: AppContext): Response {
  return serviceUnavailableResponse(c, 'Storage service is temporarily unavailable');
}

/**
 * File Download Examples
 */

function handleFileDownload(
  c: AppContext,
  content: string,
  filename: string
): Response {
  return downloadResponse(content, 'text/plain', filename);
}

function handleImageDownload(
  c: AppContext,
  buffer: ArrayBuffer
): Response {
  return downloadResponse(buffer, 'image/png', 'icon.png');
}

/**
 * Redirect Examples
 */

function handleRedirect(c: AppContext): Response {
  return redirectResponse('https://example.com/resource', 301);
}

/**
 * Response Headers Examples
 */

// Add rate limit headers
function handleWithRateLimit(c: AppContext, data: unknown): Response {
  let response = successResponse(c, data);
  response = addRateLimitHeaders(
    response,
    limit = 100, // rate limit per minute
    remaining = 99, // remaining requests
    reset = Math.floor(Date.now() / 1000) + 60 // reset in 60 seconds
  );
  return response;
}

// Add cache headers
function handleWithCache(c: AppContext, data: unknown): Response {
  let response = successResponse(c, data);
  response = addCacheHeaders(
    response,
    maxAge = 3600, // 1 hour
    isPublic = true // public cache
  );
  return response;
}

// Add CORS headers
function handleWithCors(c: AppContext, data: unknown, origin: string): Response {
  let response = successResponse(c, data);
  response = addCorsHeaders(response, origin);
  return response;
}

/**
 * Combined Headers Example
 */

function handleFullResponse(c: AppContext, data: unknown): Response {
  let response = successResponse(c, data);

  // Add multiple headers
  response = addRateLimitHeaders(response, 100, 99, Math.floor(Date.now() / 1000) + 60);
  response = addCacheHeaders(response, 3600, true);
  response = addCorsHeaders(response, 'https://example.com');

  return response;
}

/**
 * Conditional Response Examples
 */

type RequestStatus = 'success' | 'error' | 'not_found' | 'unauthorized' | 'rate_limited';

function handleConditionalResponse(
  c: AppContext,
  status: RequestStatus,
  data?: unknown,
  error?: string
): Response {
  switch (status) {
    case 'success':
      return successResponse(c, data || {});

    case 'error':
      return badRequestResponse(c, error || 'Invalid request');

    case 'not_found':
      return notFoundResponse(c, 'Resource');

    case 'unauthorized':
      return unauthorizedResponse(c);

    case 'rate_limited':
      return rateLimitErrorResponse(c, 60);

    default:
      return internalErrorResponse(c);
  }
}

/**
 * Handler with Error Handling Example
 */

async function safeHandler(
  c: AppContext,
  fn: () => Promise<unknown>
): Promise<Response> {
  try {
    const data = await fn();
    return successResponse(c, data);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Not found')) {
        return notFoundResponse(c);
      }
      if (error.message.includes('Unauthorized')) {
        return unauthorizedResponse(c);
      }
      return badRequestResponse(c, error.message);
    }
    return internalErrorResponse(c);
  }
}

/**
 * Streaming Response Example
 */

async function* generateSearchResults(
  query: string,
  limit: number
): AsyncGenerator<SearchMatch> {
  for (let i = 0; i < limit; i++) {
    yield {
      file: `file-${i}.js`,
      line: i + 1,
      match: query,
    };
    // Simulate async work
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

/**
 * Complex Response Scenario
 */

interface SearchOptions {
  query: string;
  limit: number;
  page: number;
  sort?: 'relevance' | 'date';
}

async function handleComplexSearch(
  c: AppContext,
  options: SearchOptions
): Promise<Response> {
  try {
    // Validate input
    if (!options.query || options.query.length === 0) {
      return badRequestResponse(c, 'Query is required');
    }

    if (options.limit > 1000) {
      return badRequestResponse(c, 'Limit cannot exceed 1000');
    }

    // Perform search (pseudo-code)
    // const results = await search(options);
    const results: SearchMatch[] = []; // placeholder
    const total = 42; // placeholder

    // Build response with pagination
    const offset = (options.page - 1) * options.limit;
    let response = paginatedResponse(c, results, total, offset, options.limit);

    // Add headers
    response = addCacheHeaders(response, 300); // Cache for 5 minutes
    response = addRateLimitHeaders(response, 1000, 999, Math.floor(Date.now() / 1000) + 60);

    return response;
  } catch (error) {
    console.error('Search failed:', error);
    return internalErrorResponse(c, 'Search operation failed');
  }
}

/**
 * Error Handler Pattern
 */

class ApiErrorHandler {
  static handle(c: AppContext, error: unknown): Response {
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        return badRequestResponse(c, error.message);
      }
      if (error.name === 'NotFoundError') {
        return notFoundResponse(c);
      }
      if (error.name === 'UnauthorizedError') {
        return unauthorizedResponse(c);
      }
      if (error.name === 'RateLimitError') {
        return rateLimitErrorResponse(c, 60);
      }
    }
    return internalErrorResponse(c);
  }
}

export {
  handleUploadSuccess,
  handleSearchResults,
  handleExtensionNotFound,
  handleInvalidInput,
  handleRateLimited,
  handleUnauthorized,
  handleForbidden,
  handleBadRequest,
  handleConflict,
  handleInternalError,
  handleServiceUnavailable,
  handleFileDownload,
  handleImageDownload,
  handleRedirect,
  handleWithRateLimit,
  handleWithCache,
  handleWithCors,
  handleFullResponse,
  handleConditionalResponse,
  safeHandler,
  generateSearchResults,
  handleComplexSearch,
  ApiErrorHandler,
};
