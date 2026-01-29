import type { AppContext, RateLimitInfo } from '../types/index';
import { Errors } from '../utils/errors';
import { createRateLimitHeaders } from '../utils/helpers';
import { getLogger } from '../utils/logger';

/**
 * Rate Limiting Middleware
 *
 * Implements rate limiting using Cloudflare KV for distributed state tracking.
 * Supports different rate limits for different endpoint types (download, general, etc.)
 * Uses sliding window algorithm for accurate rate limiting.
 * Gracefully handles KV failures (fail open for availability).
 */

/**
 * Rate limit type - defines different rate limit policies
 */
export type RateLimitType = 'download' | 'upload' | 'search' | 'general' | 'default';

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Maximum requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Custom key generator function
   * Defaults to IP-based or API key-based depending on limit type
   */
  keyGenerator?: (c: AppContext) => string;

  /**
   * Whether to use sliding window (true) or fixed window (false)
   * Default: true (sliding window)
   */
  slidingWindow?: boolean;
}

/**
 * Default configurations for different endpoint types
 *
 * - download: 10 requests/hour per IP (strict for resource-intensive operations)
 * - upload: 5 requests/hour per IP (very strict to prevent abuse)
 * - search: 30 requests/minute per IP (moderate for read-heavy operations)
 * - general: 100 requests/hour per API key (standard API usage)
 * - default: 100 requests/minute per IP (fallback)
 */
export const RATE_LIMIT_CONFIGS: Record<RateLimitType, RateLimitConfig> = {
  download: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    slidingWindow: true,
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    slidingWindow: true,
  },
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    slidingWindow: true,
  },
  general: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
    slidingWindow: true,
  },
  default: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    slidingWindow: false,
  },
};

/**
 * Rate limit data stored in KV
 */
interface RateLimitData {
  count: number;
  resetAt: number;
  requests?: number[]; // Timestamps for sliding window
}

/**
 * Create rate limiter middleware
 *
 * @param limitType - Type of rate limit to apply
 * @param customConfig - Optional custom configuration (overrides defaults)
 *
 * @example
 * ```typescript
 * // Use predefined limit type
 * app.post('/api/download', rateLimitMiddleware('download'), handler);
 *
 * // Use custom configuration
 * app.get('/api/data', rateLimitMiddleware('general', {
 *   maxRequests: 50,
 *   windowMs: 60000,
 * }), handler);
 * ```
 */
export function rateLimitMiddleware(
  limitType: RateLimitType = 'default',
  customConfig?: Partial<RateLimitConfig>
) {
  const config = {
    ...RATE_LIMIT_CONFIGS[limitType],
    ...customConfig,
  };

  return async (c: AppContext, next: () => Promise<void>): Promise<void | Response> => {
    const logger = getLogger({ requestId: c.get('requestId') });

    // Generate rate limit key
    const identifier = config.keyGenerator
      ? config.keyGenerator(c)
      : getRateLimitIdentifier(c, limitType);

    // Calculate hour bucket for key (groups by hour for consistent storage)
    const now = Date.now();
    const hourBucket = Math.floor(now / (60 * 60 * 1000));
    const rateLimitKey = `ratelimit:${limitType}:${identifier}:${hourBucket}`;

    try {
      const kv = c.env.SESSIONS; // Using SESSIONS KV for rate limiting

      // Get current rate limit data
      const data = await kv.get<RateLimitData>(rateLimitKey, 'json');

      let rateLimitData: RateLimitData = data || {
        count: 0,
        resetAt: now + config.windowMs,
        requests: [],
      };

      // Handle sliding window
      if (config.slidingWindow) {
        // Filter out requests outside the current window
        const windowStart = now - config.windowMs;
        rateLimitData.requests = (rateLimitData.requests || []).filter(
          (timestamp) => timestamp > windowStart
        );
        rateLimitData.count = rateLimitData.requests.length;
      } else {
        // Fixed window: reset if expired
        if (now > rateLimitData.resetAt) {
          rateLimitData = {
            count: 0,
            resetAt: now + config.windowMs,
            requests: [],
          };
        }
      }

      // Check if limit exceeded
      if (rateLimitData.count >= config.maxRequests) {
        const resetAt = Math.floor(
          config.slidingWindow
            ? (rateLimitData.requests![0] + config.windowMs) / 1000
            : rateLimitData.resetAt / 1000
        );
        const retryAfter = Math.ceil(
          config.slidingWindow
            ? (rateLimitData.requests![0] + config.windowMs - now) / 1000
            : (rateLimitData.resetAt - now) / 1000
        );

        logger.warn('Rate limit exceeded', {
          identifier,
          limitType,
          count: rateLimitData.count,
          maxRequests: config.maxRequests,
          retryAfter,
        });

        const rateLimitInfo: RateLimitInfo = {
          limit: config.maxRequests,
          remaining: 0,
          reset: resetAt,
          retryAfter,
        };

        const error = Errors.rateLimited(retryAfter);

        return c.json(error.toJSON(), 429, {
          ...createRateLimitHeaders(rateLimitInfo),
        });
      }

      // Increment counter
      rateLimitData.count++;
      if (config.slidingWindow) {
        rateLimitData.requests!.push(now);
      }

      // Store updated data
      await kv.put(rateLimitKey, JSON.stringify(rateLimitData), {
        expirationTtl: Math.ceil(config.windowMs / 1000) + 3600, // Add 1 hour buffer
      });

      // Calculate rate limit info for headers
      const resetAt = Math.floor(
        config.slidingWindow
          ? (rateLimitData.requests![0] + config.windowMs) / 1000
          : rateLimitData.resetAt / 1000
      );
      const rateLimitInfo: RateLimitInfo = {
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - rateLimitData.count),
        reset: resetAt,
      };

      // Add rate limit headers to response
      for (const [key, value] of Object.entries(
        createRateLimitHeaders(rateLimitInfo)
      )) {
        c.header(key, value);
      }

      logger.debug('Rate limit check passed', {
        identifier,
        limitType,
        count: rateLimitData.count,
        remaining: rateLimitInfo.remaining,
      });

      await next();
    } catch (error) {
      logger.error('Rate limiter error - failing open', error, {
        identifier,
        limitType,
      });

      // On error, allow request to proceed (fail open for availability)
      // Still add headers with default values
      const rateLimitInfo: RateLimitInfo = {
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: Math.floor((now + config.windowMs) / 1000),
      };

      for (const [key, value] of Object.entries(
        createRateLimitHeaders(rateLimitInfo)
      )) {
        c.header(key, value);
      }

      await next();
    }
  };
}

/**
 * Create custom rate limiter with specific configuration
 *
 * @example
 * ```typescript
 * const customLimiter = createRateLimiter({
 *   windowMs: 60000,
 *   maxRequests: 30,
 *   keyGenerator: (c) => c.get('user')?.userId || getClientIP(c),
 * });
 * ```
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (c: AppContext, next: () => Promise<void>) => {
    return rateLimitMiddleware('default', config)(c, next);
  };
}

/**
 * Get client IP address from request headers
 */
function getClientIP(c: AppContext): string {
  // Cloudflare-specific header (most reliable on Cloudflare Workers)
  const cfIP = c.req.header('cf-connecting-ip');
  if (cfIP) {
    return cfIP;
  }

  // Standard forwarded headers
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = c.req.header('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Get rate limit identifier based on limit type
 *
 * - download/upload: IP-based (per-user limits)
 * - general: API key-based (per-account limits)
 * - default: IP-based
 */
function getRateLimitIdentifier(c: AppContext, limitType: RateLimitType): string {
  // For general API limits, use API key if available
  if (limitType === 'general' || limitType === 'search') {
    const user = c.get('user');
    if (user?.userId) {
      return `user:${user.userId}`;
    }

    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.substring(7);
    if (apiKey) {
      // Use first 16 chars of API key as identifier
      return `apikey:${apiKey.substring(0, 16)}`;
    }
  }

  // For download/upload or when no API key, use IP address
  const ip = getClientIP(c);
  return `ip:${ip}`;
}

/**
 * Reset rate limit for a key (admin operation)
 */
export async function resetRateLimit(
  kv: KVNamespace,
  key: string
): Promise<void> {
  const rateLimitKey = `ratelimit:${key}`;
  await kv.delete(rateLimitKey);
}

/**
 * Get rate limit status
 */
export async function getRateLimitStatus(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitInfo | null> {
  const rateLimitKey = `ratelimit:${key}`;
  const data = await kv.get(rateLimitKey);

  if (!data) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Math.floor((Date.now() + config.windowMs) / 1000),
    };
  }

  const window = JSON.parse(data) as { count: number; resetAt: number };

  return {
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - window.count),
    reset: Math.floor(window.resetAt / 1000),
  };
}
