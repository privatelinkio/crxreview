/**
 * Middleware Barrel Export
 *
 * Exports all middleware functions for easy importing throughout the application.
 *
 * @example
 * ```typescript
 * import {
 *   authMiddleware,
 *   corsMiddleware,
 *   rateLimitMiddleware,
 *   setupErrorHandler,
 * } from './middleware';
 * ```
 */

// Authentication middleware
export {
  authMiddleware,
  optionalAuthMiddleware,
} from './auth';

// CORS and security headers middleware
export {
  corsMiddleware,
  securityHeadersMiddleware,
  combinedCorsMiddleware,
  type CorsOptions,
} from './cors';

// Error handling middleware
export {
  setupErrorHandler,
  setupNotFoundHandler,
  errorHandlerMiddleware,
} from './errorHandler';

// Rate limiting middleware
export {
  rateLimitMiddleware,
  createRateLimiter,
  resetRateLimit,
  getRateLimitStatus,
  RATE_LIMIT_CONFIGS,
  type RateLimitType,
  type RateLimitConfig,
} from './rateLimiter';
