import { createApp } from './router';
import { Env } from './types';
import { cleanupExpiredSessions } from './services/cleanup.service';
import { getLogger } from './utils/logger';

// Initialize logger
const logger = getLogger();

/**
 * CRX Review API - Main Cloudflare Worker Entry Point
 *
 * This Worker provides a REST API for uploading, analyzing, and managing
 * Chrome extensions (.crx files). It handles:
 * - Extension upload and download
 * - File extraction and inspection
 * - Manifest parsing and validation
 * - Full-text search across extension code
 * - Scheduled cleanup of expired sessions
 *
 * Storage:
 * - R2: Binary CRX and ZIP files
 * - KV: Session metadata and extracted file lists
 * - KV: Rate limiting and caching
 */

// Create the Hono app instance
const app = createApp();

/**
 * Main Cloudflare Worker export
 */
export default {
  /**
   * Handles all HTTP requests to the Worker.
   *
   * @param request - Incoming HTTP request
   * @param env - Environment bindings (R2, KV, secrets)
   * @param ctx - Execution context for async operations
   * @returns HTTP response
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Generate unique request ID for tracing
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    logger.info('Request received', {
      requestId,
      method: request.method,
      url: request.url,
      path: new URL(request.url).pathname,
      userAgent: request.headers.get('user-agent'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
    });

    try {
      // Handle the request through Hono router
      const response = await app.fetch(request, env, ctx);

      // Add observability headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

      // Log response
      logger.info('Request completed', {
        requestId,
        status: response.status,
        duration: Date.now() - startTime,
      });

      return response;
    } catch (error) {
      // Catch any unhandled errors
      logger.error('Unhandled error in fetch handler', {
        requestId,
        error,
        duration: Date.now() - startTime,
      });

      // Return generic error response
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            requestId,
          },
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
          },
        }
      );
    }
  },

  /**
   * Handles scheduled cron jobs for maintenance tasks.
   *
   * Configured in wrangler.toml to run every 6 hours.
   * Cleans up expired sessions and associated R2 objects.
   *
   * @param event - Scheduled event details
   * @param env - Environment bindings
   * @param ctx - Execution context
   */
  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const startTime = Date.now();
    const scheduledTime = new Date(event.scheduledTime).toISOString();

    logger.info('Starting scheduled cleanup', {
      scheduledTime,
      cron: event.cron,
      environment: env.ENVIRONMENT,
    });

    try {
      // Run cleanup service
      const result = await cleanupExpiredSessions(env);

      const duration = Date.now() - startTime;

      logger.info('Cleanup completed successfully', {
        scheduledTime,
        deleted: result.deleted,
        failed: result.failed,
        errors: result.errors,
        duration,
      });

      // Log warnings if any deletions failed
      if (result.failed > 0) {
        logger.warn('Some session deletions failed during cleanup', {
          failed: result.failed,
          errors: result.errors.slice(0, 10), // Log first 10 errors
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Cleanup task failed', {
        scheduledTime,
        error,
        duration,
      });

      // Re-throw to mark the cron job as failed
      throw error;
    }
  },
};

/**
 * Export types for use in other modules and for Cloudflare Workers type checking
 */
export { Env };
