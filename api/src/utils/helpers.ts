import type { ApiResponse, RateLimitInfo } from '../types/index';
import { randomUUID } from 'node:crypto';

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  message?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): any {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return randomUUID();
}

/**
 * Parse query parameters from URL
 */
export function parseQueryParams(
  url: string
): Record<string, string | string[]> {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string | string[]> = {};

    for (const [key, value] of urlObj.searchParams) {
      if (params[key]) {
        if (Array.isArray(params[key])) {
          (params[key] as string[]).push(value);
        } else {
          params[key] = [params[key] as string, value];
        }
      } else {
        params[key] = value;
      }
    }

    return params;
  } catch {
    return {};
  }
}

/**
 * Calculate pagination offset
 */
export function calculateOffset(
  page: number,
  limit: number
): { offset: number; limit: number } {
  const offset = Math.max(0, (page - 1) * limit);
  return { offset, limit };
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(
  page: any,
  limit: any,
  maxLimit: number = 100
): { page: number; limit: number } {
  const parsedPage = parseInt(page || '1', 10);
  const parsedLimit = parseInt(limit || '10', 10);

  return {
    page: Math.max(1, isNaN(parsedPage) ? 1 : parsedPage),
    limit: Math.min(
      Math.max(1, isNaN(parsedLimit) ? 10 : parsedLimit),
      maxLimit
    ),
  };
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Create rate limit headers
 */
export function createRateLimitHeaders(info: RateLimitInfo): Record<string, string> {
  return {
    'X-RateLimit-Limit': info.limit.toString(),
    'X-RateLimit-Remaining': info.remaining.toString(),
    'X-RateLimit-Reset': info.reset.toString(),
    ...(info.retryAfter && { 'Retry-After': info.retryAfter.toString() }),
  };
}

/**
 * Parse content-type header
 */
export function parseContentType(contentType: string | null): {
  type: string;
  charset?: string;
} {
  if (!contentType) {
    return { type: 'application/octet-stream' };
  }

  const [type, ...params] = contentType.split(';');
  const charset = params
    .find((p) => p.trim().startsWith('charset'))
    ?.split('=')[1]
    ?.trim();

  return { type: type.trim(), charset };
}

/**
 * Create a delay (for retries, etc.)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry logic with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        const delayMs = baseDelay * Math.pow(2, attempt - 1);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/^\.+/, '')
    .replace(/\.{2,}/, '.')
    .slice(0, 255);
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    (error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout'))
  );
}

/**
 * Create abort signal with timeout
 */
export function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}
