import { Hono } from 'hono';
import { Env } from './types';
import {
  combinedCorsMiddleware,
  authMiddleware,
  rateLimitMiddleware,
  setupErrorHandler,
  setupNotFoundHandler,
} from './middleware';
import {
  uploadHandler,
  downloadHandler,
  metadataHandler,
  manifestHandler,
  filesHandler,
  extractHandler,
  searchHandler,
  filterHandler,
  downloadZipHandler,
  deleteSessionHandler,
  healthHandler,
  openapiHandler,
} from './handlers';

/**
 * Creates and configures the Hono application with all routes and middleware.
 *
 * Middleware execution order:
 * 1. CORS (combinedCorsMiddleware) - handles preflight and CORS headers
 * 2. Error handler - catches and formats all errors
 * 3. Authentication - validates API keys
 * 4. Rate limiting - prevents abuse
 * 5. Route handlers - process requests
 *
 * @returns Configured Hono application instance
 */
export function createApp() {
  const app = new Hono<{ Bindings: Env }>();

  // 1. Global CORS middleware - must be first to handle preflight requests
  app.use('*', combinedCorsMiddleware());

  // 2. Global error and 404 handlers
  setupErrorHandler(app);
  setupNotFoundHandler(app);

  // 3. Public endpoints (no authentication required)
  app.get('/health', healthHandler);
  app.get('/openapi', openapiHandler);

  // 4. API v1 routes with authentication
  const api = new Hono<{ Bindings: Env }>();

  // Apply authentication to all API routes
  api.use('*', authMiddleware());

  // Extension management endpoints
  api.post('/extensions/upload', rateLimitMiddleware('upload'), uploadHandler);
  api.post('/extensions/download', rateLimitMiddleware('download'), downloadHandler);
  api.get('/extensions/:sessionId', metadataHandler);
  api.delete('/extensions/:sessionId', deleteSessionHandler);

  // Extension content endpoints
  api.get('/extensions/:sessionId/manifest', manifestHandler);
  api.get('/extensions/:sessionId/files', filesHandler);
  api.get('/extensions/:sessionId/files/*', extractHandler);
  api.get('/extensions/:sessionId/download/zip', downloadZipHandler);

  // Search and filtering endpoints
  api.post('/extensions/:sessionId/search', rateLimitMiddleware('search'), searchHandler);
  api.post('/extensions/:sessionId/filter', filterHandler);

  // Mount API routes under /api/v1
  app.route('/api/v1', api);

  // Apply general rate limiting to all API routes
  app.use('/api/*', rateLimitMiddleware('general'));

  return app;
}
