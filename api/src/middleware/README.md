# Middleware Layer

Production-ready middleware for the CRX Review API using Hono framework.

## Overview

This directory contains 4 core middleware modules that handle authentication, CORS, error handling, and rate limiting for the API.

## Middleware Files

### 1. Authentication (`auth.ts`)

API Key authentication middleware that validates requests and attaches user context.

**Features:**
- Validates API keys from `X-API-Key` header or `Authorization: Bearer` header
- Supports multiple API keys via environment variables (`API_KEY_1`, `API_KEY_2`, etc.)
- Optional KV-based API key storage for advanced use cases
- Attaches user context to request for downstream middleware
- Comprehensive logging of authentication attempts

**Usage:**

```typescript
import { authMiddleware, optionalAuthMiddleware } from './middleware';

// Require authentication for all API routes
app.use('/api/*', authMiddleware());

// Check KV store in addition to environment variables
app.use('/api/*', authMiddleware({ useKV: true }));

// Optional authentication (validates if present, allows if missing)
app.use('/api/public/*', optionalAuthMiddleware());
```

**Environment Variables:**
```bash
# Single API key
API_KEY=your-secret-key-here

# Multiple API keys
API_KEY_1=key-for-user-1
API_KEY_2=key-for-user-2
API_KEY_3=key-for-user-3
```

**KV Storage Format (Optional):**
```
Key: api_key:{sha256_hash_of_key}
Value: {
  "userId": "user_123",
  "keyId": "api_key_prod_1",
  "permissions": ["read", "write"],
  "createdAt": "2024-01-01T00:00:00Z",
  "expiresAt": "2025-01-01T00:00:00Z",
  "disabled": false
}
```

---

### 2. CORS (`cors.ts`)

CORS and security headers middleware for web and API access.

**Features:**
- Configurable CORS origins (wildcards, regexes, or specific domains)
- Handles OPTIONS preflight requests automatically
- Comprehensive security headers (CSP, XSS protection, etc.)
- Support for credentials (cookies, authorization headers)
- Environment-based origin configuration

**Usage:**

```typescript
import { corsMiddleware, securityHeadersMiddleware, combinedCorsMiddleware } from './middleware';

// Allow all origins (development)
app.use('*', corsMiddleware());

// Allow specific origins
app.use('*', corsMiddleware({
  origin: ['https://example.com', 'https://app.example.com'],
  credentials: true
}));

// Use environment variable for origins
app.use('*', corsMiddleware({
  allowedOriginsEnv: 'ALLOWED_ORIGINS'
}));

// Apply security headers only
app.use('*', securityHeadersMiddleware());

// Combined CORS + security headers
app.use('*', combinedCorsMiddleware());
```

**Environment Variables:**
```bash
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=https://example.com,https://app.example.com,https://admin.example.com
```

**Security Headers Applied:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()`
- `Content-Security-Policy: default-src 'self'; ...`

---

### 3. Error Handler (`errorHandler.ts`)

Global error handling middleware with consistent error response formatting.

**Features:**
- Catches all errors thrown in handlers
- Maps error types to appropriate HTTP status codes
- Consistent error response format with request ID
- Logs errors with stack traces (without exposing to client)
- Special handling for validation errors (Zod)
- Development vs production error details

**Usage:**

```typescript
import { setupErrorHandler, setupNotFoundHandler, errorHandlerMiddleware } from './middleware';

// Global error handling (recommended)
const app = new Hono<{ Bindings: Env }>();
setupErrorHandler(app);
setupNotFoundHandler(app);

// Or use as inline middleware for specific routes
app.use('/api/*', errorHandlerMiddleware());
```

**Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": [
        {
          "path": "email",
          "message": "Invalid email format",
          "code": "invalid_string"
        }
      ]
    },
    "timestamp": "2024-01-28T12:00:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "path": "/api/v1/users"
  }
}
```

**Error Type Mappings:**
- `ValidationError`, `ZodError`, `SyntaxError`, `TypeError` → 400
- `SessionNotFoundError` → 404
- `RangeError` → 413 (Payload Too Large)
- `CRXError` → 422 (Unprocessable Entity)
- `StorageError` → 500
- `ApiError` → Custom status code
- Unknown errors → 500

---

### 4. Rate Limiter (`rateLimiter.ts`)

Distributed rate limiting using Cloudflare KV with sliding window algorithm.

**Features:**
- Multiple rate limit types (download, upload, search, general)
- Sliding window or fixed window algorithms
- IP-based or API key-based rate limiting
- Graceful failure (fail open on KV errors)
- Rate limit headers on all responses
- Hour-bucketed KV keys for efficient storage

**Usage:**

```typescript
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS } from './middleware';

// Use predefined limit type
app.post('/api/v1/extensions/download',
  rateLimitMiddleware('download'),
  handler
);

// Custom configuration
app.post('/api/v1/extensions/upload',
  rateLimitMiddleware('upload', {
    maxRequests: 3,
    windowMs: 3600000 // 1 hour
  }),
  handler
);

// General API rate limit
app.use('/api/*', rateLimitMiddleware('general'));
```

**Rate Limit Types:**

| Type | Window | Max Requests | Identifier | Use Case |
|------|--------|--------------|------------|----------|
| `download` | 1 hour | 10 | IP address | CRX downloads |
| `upload` | 1 hour | 5 | IP address | CRX uploads |
| `search` | 1 minute | 30 | IP address | Search queries |
| `general` | 1 hour | 100 | API key | General API usage |
| `default` | 1 minute | 100 | IP address | Fallback |

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706443200
Retry-After: 3600
```

**KV Storage Pattern:**
```
Key: ratelimit:{type}:{identifier}:{hourBucket}
Value: {
  "count": 5,
  "resetAt": 1706443200000,
  "requests": [1706439600000, 1706440800000, ...]
}
TTL: windowMs + 1 hour buffer
```

---

## Barrel Export (`index.ts`)

All middleware is exported from a single entry point for convenience:

```typescript
import {
  // Authentication
  authMiddleware,
  optionalAuthMiddleware,

  // CORS
  corsMiddleware,
  securityHeadersMiddleware,
  combinedCorsMiddleware,

  // Error handling
  setupErrorHandler,
  setupNotFoundHandler,
  errorHandlerMiddleware,

  // Rate limiting
  rateLimitMiddleware,
  createRateLimiter,
  resetRateLimit,
  getRateLimitStatus,
  RATE_LIMIT_CONFIGS,
} from './middleware';
```

---

## Complete Example

Here's how to use all middleware together in a Hono application:

```typescript
import { Hono } from 'hono';
import type { Env } from './types';
import {
  combinedCorsMiddleware,
  authMiddleware,
  rateLimitMiddleware,
  setupErrorHandler,
  setupNotFoundHandler,
} from './middleware';

const app = new Hono<{ Bindings: Env }>();

// 1. Apply global error handlers
setupErrorHandler(app);
setupNotFoundHandler(app);

// 2. Apply CORS and security headers to all routes
app.use('*', combinedCorsMiddleware());

// 3. Request ID middleware (should be early)
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  await next();
});

// 4. Authentication for API routes
app.use('/api/*', authMiddleware());

// 5. Rate limiting for specific endpoints
app.post('/api/v1/extensions/download',
  rateLimitMiddleware('download'),
  async (c) => {
    // Handler implementation
  }
);

app.post('/api/v1/extensions/upload',
  rateLimitMiddleware('upload'),
  async (c) => {
    // Handler implementation
  }
);

// 6. General rate limit for other API routes
app.use('/api/*', rateLimitMiddleware('general'));

export default app;
```

---

## Middleware Order

The recommended middleware order is:

1. **Error Handlers** - Global error and 404 handlers (via `onError` and `notFound`)
2. **CORS & Security Headers** - Applied first to all requests
3. **Request ID** - Generate unique ID for tracking
4. **Authentication** - Validate API keys and attach user context
5. **Rate Limiting** - Apply rate limits based on endpoint type
6. **Route Handlers** - Your actual business logic

---

## Environment Variables

Complete list of environment variables used by middleware:

```bash
# Authentication
API_KEY=your-default-api-key
API_KEY_1=key-for-user-1
API_KEY_2=key-for-user-2
# ... up to API_KEY_10

# CORS
ALLOWED_ORIGINS=https://example.com,https://app.example.com

# Environment
ENVIRONMENT=production  # or development

# KV Namespaces (wrangler.toml)
# [[kv_namespaces]]
# binding = "SESSIONS"
# id = "..."
```

---

## Advanced Usage

### Custom Rate Limit Key

```typescript
import { createRateLimiter } from './middleware';

const customRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 30,
  keyGenerator: (c) => {
    const user = c.get('user');
    return user?.userId || getClientIP(c);
  },
});

app.use('/api/premium/*', customRateLimiter);
```

### Conditional Authentication

```typescript
app.use('/api/v1/*', async (c, next) => {
  const path = c.req.path;

  // Public endpoints don't require auth
  if (path.startsWith('/api/v1/health')) {
    return next();
  }

  // Everything else requires auth
  return authMiddleware()(c, next);
});
```

### Development vs Production CORS

```typescript
const isDev = process.env.ENVIRONMENT === 'development';

app.use('*', corsMiddleware({
  origin: isDev ? '*' : ['https://example.com'],
  credentials: !isDev,
}));
```

---

## Testing

The middleware can be tested using Hono's test utilities:

```typescript
import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware } from './auth';

describe('authMiddleware', () => {
  it('should return 401 without API key', async () => {
    const app = new Hono();
    app.use('*', authMiddleware());
    app.get('/', (c) => c.json({ ok: true }));

    const res = await app.request('/', {
      method: 'GET',
    });

    expect(res.status).toBe(401);
  });

  it('should pass with valid API key', async () => {
    const app = new Hono();
    app.use('*', authMiddleware());
    app.get('/', (c) => c.json({ ok: true }));

    const res = await app.request('/', {
      method: 'GET',
      headers: {
        'X-API-Key': 'test-key',
      },
    });

    expect(res.status).toBe(200);
  });
});
```

---

## Troubleshooting

### Rate Limiting Not Working

- Check that KV namespace is properly bound in `wrangler.toml`
- Verify KV namespace has write permissions
- Check logs for "Rate limiter error" messages
- Remember rate limiting fails open on errors

### CORS Errors

- Verify `ALLOWED_ORIGINS` environment variable is set correctly
- Check that origins are comma-separated without spaces
- Ensure OPTIONS requests are being handled
- Check browser console for specific CORS error messages

### Authentication Failures

- Verify API keys are set in environment variables
- Check that header name is `X-API-Key` (case-sensitive)
- For Bearer tokens, ensure format is `Authorization: Bearer <token>`
- Check logs for "Authentication failed" messages

---

## Performance Considerations

1. **Rate Limiting**: Uses KV which has eventual consistency. High-throughput APIs may see race conditions.
2. **Authentication**: API key validation is synchronous and fast. KV lookups add ~20-50ms latency.
3. **CORS**: Minimal overhead, headers are set once per request.
4. **Error Handling**: Error formatting adds ~1-2ms per error response.

---

## Security Notes

1. **API Keys**: Store API keys in environment variables, never commit to source control
2. **CORS**: Use specific origins in production, avoid wildcards
3. **Error Messages**: Stack traces are only shown in development mode
4. **Rate Limiting**: Adjust limits based on your use case and threat model
5. **Security Headers**: Review CSP policy for your specific application needs

---

## License

Part of the CRX Review API project.
