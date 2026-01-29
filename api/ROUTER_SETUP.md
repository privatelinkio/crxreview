# Router and Entry Point Setup

This document describes the Hono-based router and main Cloudflare Worker entry point implementation.

## Files Created

### 1. `/api/src/router.ts`

The main application router that configures all routes and middleware.

**Key Features:**
- Creates Hono app with proper TypeScript bindings for Cloudflare Workers
- Configures middleware execution order (CORS -> error handling -> auth -> rate limiting)
- Organizes routes into versioned API groups
- Implements separation of concerns between public and authenticated endpoints

**Route Structure:**
```
/health                                      - Public health check
/api/v1/extensions/upload                    - Upload CRX file
/api/v1/extensions/download                  - Download CRX from Chrome Web Store
/api/v1/extensions/:sessionId                - Get session metadata
/api/v1/extensions/:sessionId/manifest       - Get parsed manifest
/api/v1/extensions/:sessionId/files          - Get file tree
/api/v1/extensions/:sessionId/files/*        - Extract specific file
/api/v1/extensions/:sessionId/download/zip   - Download as ZIP
/api/v1/extensions/:sessionId/search         - Search file contents
/api/v1/extensions/:sessionId/filter         - Filter files by type
/api/v1/extensions/:sessionId                - Delete session
```

**Middleware Order:**
1. CORS (handles preflight, sets headers)
2. Error handler (catches all errors)
3. Authentication (validates API keys)
4. Rate limiting (prevents abuse)
5. Route handlers (process requests)

### 2. `/api/src/index.ts`

The main Cloudflare Worker entry point that exports the Worker interface.

**Key Features:**
- Exports default Worker object with `fetch()` and `scheduled()` handlers
- Adds request ID tracking for observability
- Implements comprehensive logging for all requests
- Handles scheduled cleanup via cron jobs
- Catches unhandled errors and returns proper responses

**Request Flow:**
```
Request → Generate Request ID → Log Request → Route through Hono → Add Headers → Log Response → Return
```

**Scheduled Tasks:**
- Runs cleanup every 6 hours via cron
- Deletes expired sessions and R2 objects
- Logs cleanup results and failures

### 3. `/api/src/test-server.ts`

Local development server for testing without deploying to Cloudflare.

**Key Features:**
- Mock implementations of R2 and KV for local development
- Runs on port 8787 (same as Wrangler dev)
- Provides test API keys for local testing
- Logs all R2 and KV operations for debugging
- Displays endpoint documentation on startup

**Mock Storage:**
- `MockR2Bucket` - In-memory R2 implementation
- `MockKVNamespace` - In-memory KV implementation
- Logs all storage operations to console

**Usage:**
```bash
npm run dev:local
```

### 4. Updated `/api/wrangler.toml`

Added scheduled cleanup configuration.

**Changes:**
- Updated cron schedule to run every 6 hours: `"0 */6 * * *"`
- Previous was daily at midnight

### 5. Updated `/api/package.json`

Added new development and deployment scripts.

**New Scripts:**
```json
{
  "dev:local": "bun run src/test-server.ts",
  "deploy:preview": "wrangler deploy --env preview",
  "test:coverage": "vitest run --coverage",
  "tail": "wrangler tail",
  "tail:preview": "wrangler tail --env preview"
}
```

## Architecture

### Middleware Execution Order

The order of middleware is critical for proper functionality:

```
1. CORS Middleware
   - Must be first to handle OPTIONS preflight requests
   - Sets CORS headers on all responses
   - Allows origins from ALLOWED_ORIGINS env var

2. Error Handler
   - Catches errors from all downstream middleware
   - Formats errors into consistent JSON responses
   - Logs errors with request context

3. Not Found Handler
   - Catches undefined routes
   - Returns 404 with helpful message

4. Authentication (API routes only)
   - Validates Bearer token against API_KEY_* env vars
   - Rejects requests with invalid/missing keys
   - Skipped for /health endpoint

5. Rate Limiting (specific endpoints)
   - Applied per-operation (upload, download, search)
   - Uses KV for distributed rate limiting
   - Returns 429 when limits exceeded

6. Route Handlers
   - Process the actual request
   - Return formatted responses
```

### Request/Response Flow

```
┌─────────────────────────────────────────────────────────┐
│ Incoming Request                                        │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│ index.ts: Generate Request ID, Log Request             │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│ router.ts: CORS Middleware                              │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│ router.ts: Error Handler Setup                          │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│ Route: /health OR /api/v1/*                             │
└────────┬────────────────────────────────────────┬───────┘
         │                                        │
         │ /health                                │ /api/v1/*
         │                                        │
         ▼                                        ▼
┌────────────────────┐              ┌─────────────────────────┐
│ healthHandler      │              │ Authentication          │
└────────┬───────────┘              └───────────┬─────────────┘
         │                                      │
         │                                      ▼
         │                          ┌─────────────────────────┐
         │                          │ Rate Limiting           │
         │                          │ (if applicable)         │
         │                          └───────────┬─────────────┘
         │                                      │
         │                                      ▼
         │                          ┌─────────────────────────┐
         │                          │ Route Handler           │
         │                          │ (upload, download, etc) │
         │                          └───────────┬─────────────┘
         │                                      │
         └──────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Add Response Headers          │
                    │ (X-Request-ID, X-Response-Time)│
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Log Response                  │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Return to Client              │
                    └───────────────────────────────┘
```

### Scheduled Cleanup

```
┌─────────────────────────────────────────────────────────┐
│ Cron Trigger: "0 */6 * * *"                             │
│ (Every 6 hours)                                         │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│ index.ts: scheduled() handler                           │
│ - Log start time and cron schedule                      │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│ cleanup.service.ts: cleanupExpiredSessions()            │
│ - List all sessions from KV                             │
│ - Check expiration time                                 │
│ - Delete expired sessions and R2 objects                │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│ index.ts: Log Results                                   │
│ - Sessions deleted                                      │
│ - Failures (if any)                                     │
│ - Duration                                              │
└─────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

All configuration is done through `wrangler.toml` and environment variables:

**Required:**
- `CRX_STORAGE` - R2 bucket binding for CRX/ZIP files
- `SESSIONS` - KV namespace for session metadata
- `CACHE` - KV namespace for caching
- `API_KEY_1` - Primary API key (secret, not in wrangler.toml)
- `API_VERSION` - API version string

**Optional:**
- `API_KEY_2`, `API_KEY_3`, etc. - Additional API keys
- `ALLOWED_ORIGINS` - CORS allowed origins (default: '*')
- `SESSION_TTL` - Session expiration in seconds (default: 1800)
- `MAX_FILE_SIZE` - Max upload size in bytes (default: 52428800)
- `RATE_LIMIT_*` - Rate limit configurations

### Secrets

API keys must be set as secrets (never commit to git):

```bash
# Production
wrangler secret put API_KEY_1 --env production

# Preview
wrangler secret put API_KEY_1 --env preview
```

## Development

### Local Development with Wrangler

Uses real Cloudflare resources (requires setup):

```bash
npm run dev
```

### Local Development with Mock Storage

Uses in-memory mocks (no Cloudflare account needed):

```bash
npm run dev:local
```

This starts a Bun server on http://localhost:8787 with:
- Mock R2 bucket (in-memory)
- Mock KV namespaces (in-memory)
- Test API keys printed in console
- All storage operations logged

### Testing

```bash
# Run tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Type checking
npm run type-check
```

## Deployment

### Preview Environment

```bash
npm run deploy:preview
```

### Production Environment

```bash
npm run deploy
```

### View Logs

```bash
# Production logs
npm run tail

# Preview logs
npm run tail:preview
```

## API Examples

### Using Local Development Server

```bash
# Health check
curl http://localhost:8787/health

# Upload extension
curl -X POST http://localhost:8787/api/v1/extensions/upload \
  -H "Authorization: Bearer test-api-key-local-dev-12345" \
  -F "file=@extension.crx"

# Download extension
curl -X POST http://localhost:8787/api/v1/extensions/download \
  -H "Authorization: Bearer test-api-key-local-dev-12345" \
  -H "Content-Type: application/json" \
  -d '{"extensionId": "nmmhkkegccagdldgiimedpiccmgmieda"}'

# Get session metadata
curl http://localhost:8787/api/v1/extensions/abc123 \
  -H "Authorization: Bearer test-api-key-local-dev-12345"

# Search extension files
curl -X POST http://localhost:8787/api/v1/extensions/abc123/search \
  -H "Authorization: Bearer test-api-key-local-dev-12345" \
  -H "Content-Type: application/json" \
  -d '{"query": "console.log", "regex": false}'
```

## Observability

### Request Tracking

Every request gets a unique ID added to:
- Log entries (for correlation)
- Response headers (`X-Request-ID`)

### Response Time Tracking

Every response includes:
- `X-Response-Time` header with duration in milliseconds

### Logging

All requests are logged with:
- Request ID
- Method and path
- User agent and origin
- Response status
- Duration

Error logs include:
- Error message and stack trace
- Request context
- Request ID for correlation

### Cloudflare Dashboard

View logs, metrics, and analytics in Cloudflare dashboard:
- Request rates
- Error rates
- Response times
- Geographic distribution
- Cache hit rates

## Known Issues

Some type errors exist in other files but don't affect the router/entry point:
- Handler type mismatches (will be fixed in handler refactor)
- Test file type issues (not critical for production)
- Mock types in test-server.ts (only affects local dev)

These will be addressed in future iterations.

## Next Steps

1. Set up testing infrastructure (Task #10)
2. Create OpenAPI specification (Task #8)
3. Create API documentation (Task #9)
4. Fix remaining TypeScript type errors
5. Add integration tests for complete request flow
6. Set up CI/CD pipeline
