import { cors as honoCors } from 'hono/cors';
import type { AppContext } from '../types/index';
import { getLogger } from '../utils/logger';

/**
 * CORS Middleware
 *
 * Handles CORS headers for API access from custom GPTs, web applications, and browser extensions.
 * Supports configurable origins with wildcard support for development and production environments.
 * Also handles OPTIONS preflight requests automatically.
 */

export interface CorsOptions {
  /**
   * Allowed origins - can be string, regex, or array of strings/regexes
   * Default: '*' (allow all origins)
   */
  origin?: string | RegExp | (string | RegExp)[];

  /**
   * Allow credentials (cookies, authorization headers)
   * Default: true
   */
  credentials?: boolean;

  /**
   * Custom environment variable name for allowed origins
   * Default: 'ALLOWED_ORIGINS'
   */
  allowedOriginsEnv?: string;
}

/**
 * CORS configuration for development and production
 *
 * @example
 * ```typescript
 * // Allow all origins (development)
 * app.use('*', corsMiddleware());
 *
 * // Allow specific origins
 * app.use('*', corsMiddleware({
 *   origin: ['https://example.com', 'https://app.example.com']
 * }));
 *
 * // Use environment variable for origins
 * app.use('*', corsMiddleware({
 *   allowedOriginsEnv: 'ALLOWED_ORIGINS'
 * }));
 * ```
 */
export function corsMiddleware(options: CorsOptions = {}) {
  const {
    origin = '*',
    credentials = true,
    allowedOriginsEnv = 'ALLOWED_ORIGINS',
  } = options;

  return async (c: AppContext, next: () => Promise<void>) => {
    const logger = getLogger({ requestId: c.get('requestId') });

    // Get allowed origins from environment variable if specified
    let allowedOrigins: string | RegExp | (string | RegExp)[] = origin;

    if (allowedOriginsEnv && c.env[allowedOriginsEnv]) {
      const envOrigins = c.env[allowedOriginsEnv];
      // Parse comma-separated origins from environment
      allowedOrigins = envOrigins.split(',').map((o: string) => o.trim());
      logger.debug('Using origins from environment', {
        env: allowedOriginsEnv,
        origins: allowedOrigins,
      });
    }

    // Add default development origins
    const defaultOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8787',
      'https://crxreview.dev',
      'https://www.crxreview.dev',
      /^https:\/\/.*\.crxreview\.dev$/,
    ];

    // Combine with allowed origins if specified
    const finalOrigins = origin === '*'
      ? defaultOrigins
      : Array.isArray(allowedOrigins)
      ? [...defaultOrigins, ...allowedOrigins]
      : [...defaultOrigins, allowedOrigins];

    // Configure CORS with Hono's built-in middleware
    // Convert RegExp patterns to strings for Hono compatibility
    const originStrings = origin === '*'
      ? '*'
      : Array.isArray(finalOrigins)
      ? finalOrigins.filter((o): o is string => typeof o === 'string')
      : typeof finalOrigins === 'string'
      ? finalOrigins
      : '*';

    const corsHandler = honoCors({
      origin: originStrings,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowHeaders: [
        'Content-Type',
        'Authorization',
        'X-API-Key',
        'X-Request-ID',
        'Accept',
        'Accept-Language',
      ],
      exposeHeaders: [
        'Content-Type',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'X-Request-ID',
        'Retry-After',
      ],
      maxAge: 86400, // 24 hours
      credentials,
    });

    // Apply CORS handler
    await corsHandler(c, next);
  };
}

/**
 * Security Headers Middleware
 *
 * Adds security headers to all responses to protect against common web vulnerabilities.
 * Should be applied globally before other middleware.
 *
 * @example
 * ```typescript
 * app.use('*', securityHeadersMiddleware());
 * ```
 */
export function securityHeadersMiddleware() {
  return async (c: AppContext, next: () => Promise<void>) => {
    // Prevent MIME type sniffing
    c.header('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    c.header('X-Frame-Options', 'DENY');

    // Enable XSS filter
    c.header('X-XSS-Protection', '1; mode=block');

    // Force HTTPS
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // Control referrer information
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Restrict feature access
    c.header(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=()'
    );

    // Content Security Policy (adjust as needed)
    c.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
    );

    await next();
  };
}

/**
 * Combined CORS and Security Headers Middleware
 *
 * Convenience function that applies both CORS and security headers.
 *
 * @example
 * ```typescript
 * app.use('*', combinedCorsMiddleware());
 * ```
 */
export function combinedCorsMiddleware(options: CorsOptions = {}) {
  return async (c: AppContext, next: () => Promise<void>) => {
    // Apply security headers first
    await securityHeadersMiddleware()(c, async () => {
      // Then apply CORS
      await corsMiddleware(options)(c, next);
    });
  };
}
