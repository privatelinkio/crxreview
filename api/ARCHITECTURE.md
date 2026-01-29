# API Architecture

Complete system design documentation for the CRX Review API.

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Component Architecture](#component-architecture)
4. [Request/Response Flow](#requestresponse-flow)
5. [Data Storage Patterns](#data-storage-patterns)
6. [Session Lifecycle](#session-lifecycle)
7. [Error Handling](#error-handling)
8. [Security Architecture](#security-architecture)
9. [Performance Considerations](#performance-considerations)
10. [Scalability](#scalability)

## Overview

The CRX Review API is a serverless REST API built on Cloudflare Workers. It provides endpoints for uploading, analyzing, and managing Chrome extensions with support for CRX2 and CRX3 parsing.

**Key design principles:**

- **Edge computing**: Cloudflare Workers run code on the edge
- **Stateless requests**: Each request is independent
- **Distributed storage**: R2 for files, KV for sessions
- **Efficient parsing**: In-memory CRX extraction and ZIP handling
- **Rate limiting**: Per-key and per-IP throttling
- **Automatic cleanup**: Scheduled job removes expired sessions

## System Architecture

High-level system diagram:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Applications                          │
│          (Web browsers, CLIs, custom GPTs, Scripts)              │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Global Edge Network                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │        CRX Review API (Cloudflare Worker)                  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Router (Hono)                                       │  │ │
│  │  │  - Route matching and dispatching                    │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Middleware Stack                                    │  │ │
│  │  │  - Authentication (API key validation)               │  │ │
│  │  │  - CORS headers                                      │  │ │
│  │  │  - Rate limiting                                     │  │ │
│  │  │  - Error handling                                    │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Request Handlers                                    │  │ │
│  │  │  - Upload handler                                    │  │ │
│  │  │  - Download handler                                  │  │ │
│  │  │  - Extension metadata                                │  │ │
│  │  │  - File operations                                   │  │ │
│  │  │  - Search functionality                              │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Services Layer                                      │  │ │
│  │  │  - Session management                                │  │ │
│  │  │  - CRX parsing and extraction                        │  │ │
│  │  │  - Storage operations                                │  │ │
│  │  │  - Search indexing                                   │  │ │
│  │  │  - Cleanup scheduler                                 │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────┬────────────────┬───────────────────┬────────────────────┘
       │                │                   │
       ▼                ▼                   ▼
   ┌────────────┐  ┌────────────┐  ┌──────────────┐
   │ Cloudflare │  │ Cloudflare │  │   Incoming   │
   │     R2     │  │     KV     │  │   Requests   │
   │  (Files)   │  │ (Sessions) │  │ (Chrome Web  │
   │            │  │            │  │    Store)    │
   └────────────┘  └────────────┘  └──────────────┘
```

### Component Layers

The API is organized into distinct layers:

```
┌──────────────────────────────────────────┐
│   HTTP Request                           │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│   Router Layer (Hono)                    │
│   - Route pattern matching               │
│   - Method validation                    │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│   Middleware Layer                       │
│   - Authentication                       │
│   - Authorization                        │
│   - CORS                                 │
│   - Rate limiting                        │
│   - Error handling                       │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│   Handler Layer                          │
│   - Request validation                   │
│   - Service orchestration                │
│   - Response formatting                  │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│   Service Layer                          │
│   - Business logic                       │
│   - Data processing                      │
│   - Storage coordination                 │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│   Storage Layer                          │
│   - R2 for files                         │
│   - KV for sessions                      │
│   - Network for Chrome Web Store         │
└──────────────────────────────────────────┘
```

## Component Architecture

### Router (Hono)

The Hono framework provides HTTP routing and middleware support:

```typescript
// Routes defined in src/index.ts or handlers/router.ts
POST   /api/v1/extensions/upload      // Upload CRX file
POST   /api/v1/extensions/download    // Download from Chrome Web Store
GET    /api/v1/extensions/:id         // Get extension metadata
GET    /api/v1/extensions/:id/manifest
POST   /api/v1/extensions/:id/search
GET    /api/v1/extensions/:id/files
POST   /api/v1/extensions/:id/files/filter
GET    /api/v1/extensions/:id/file
DELETE /api/v1/extensions/:id
GET    /health                        // Health check
```

**Responsibilities:**
- URL pattern matching
- HTTP method validation
- Parameter extraction
- Middleware chaining
- Response transmission

### Middleware Stack

Middleware processes each request:

```
Request
  │
  ├─ Authentication Middleware
  │   └─ Validate X-API-Key header
  │
  ├─ CORS Middleware
  │   └─ Add appropriate CORS headers
  │
  ├─ Rate Limiting Middleware
  │   └─ Check rate limits, return 429 if exceeded
  │
  ├─ Route Handler
  │   └─ Process request, call services
  │
  └─ Error Handling Middleware
      └─ Catch errors, format response
Response
```

### Authentication Middleware

Validates API keys for each request:

```typescript
// Middleware checks:
1. X-API-Key header exists
2. Key is in valid format
3. Key is not revoked
4. Key has required permissions (if roles implemented)

// Stores authenticated key in context for use by handlers
context.apiKey = "sk-prod-..."
```

**Endpoints exempt from auth:**
- `GET /health` - Health checks don't require authentication

### Rate Limiting Middleware

Enforces per-key and per-IP rate limits:

```typescript
// Rate limit keys:
const limits = {
  upload: { max: 5, window: 3600 },        // 5/hour per key
  download: { max: 10, window: 3600 },     // 10/hour per IP
  search: { max: 30, window: 60 },         // 30/minute per key
  general: { max: 100, window: 3600 }      // 100/hour per key
};

// Implementation:
// 1. Create rate limit key: `limit:${endpoint}:${apiKey or IP}`
// 2. Store counter in KV with timestamp
// 3. Increment counter
// 4. Check if exceeds limit
// 5. Return X-RateLimit-* headers
```

### Error Handling Middleware

Catches all errors and returns consistent format:

```typescript
// Standardized error response:
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "meta": {
    "statusCode": 400,
    "timestamp": "2024-01-28T10:00:00Z",
    "requestId": "req_123"  // For debugging
  }
}
```

## Component Architecture

### Session Service

Manages session lifecycle:

```typescript
class SessionService {
  // Create session from uploaded or downloaded CRX
  async createSession(data: ExtensionData): Promise<string>

  // Get session data and metadata
  async getSession(sessionId: string): Promise<Session>

  // List files in session
  async listFiles(sessionId: string): Promise<File[]>

  // Update session (TTL extension, etc)
  async updateSession(sessionId: string, data: any)

  // Delete session and cleanup files
  async deleteSession(sessionId: string): Promise<void>
}
```

**Session structure (stored in KV):**

```json
{
  "id": "sess_abc123xyz",
  "extensionId": "cjpalhdlnbpafiamejdnhcphjbkeiagm",
  "name": "Extension Name",
  "version": "1.0.0",
  "createdAt": "2024-01-28T10:00:00Z",
  "expiresAt": "2024-01-28T10:30:00Z",
  "files": {
    "count": 25,
    "totalSize": 1048576,
    "categories": {
      "javascript": 10,
      "json": 5,
      "html": 3,
      "css": 2,
      "other": 5
    }
  },
  "metadata": {
    "source": "upload|download",
    "manifest": { /* manifest.json content */ }
  }
}
```

### CRX Service

Handles CRX parsing and extraction:

```typescript
class CRXService {
  // Parse CRX file and extract ZIP content
  async parseCRX(buffer: ArrayBuffer): Promise<CRXData>

  // Download CRX from Chrome Web Store
  async downloadFromWebStore(extensionId: string): Promise<ArrayBuffer>
}

// CRX format handling:
// CRX Header Structure:
// - Bytes 0-3: Magic "Cr24"
// - Bytes 4-7: Version (CRX2 = 2, CRX3 = 3)
// - CRX2: Public key length + signature length + data
// - CRX3: Proof length + proof data + ZIP content
```

**Parsing flow:**

```
Raw CRX file
      │
      ▼
Validate magic bytes
      │
      ▼
Read version
      │
      ├─ CRX2 path: Extract public key, verify signature
      ├─ CRX3 path: Extract proof
      │
      ▼
Extract ZIP content
      │
      ▼
Parse manifest.json
      │
      ▼
Index all files
      │
      ▼
Return CRXData
```

### Storage Service

Abstracts file and session storage:

```typescript
class StorageService {
  // File operations (R2)
  async uploadFile(sessionId: string, path: string, content: ArrayBuffer)
  async downloadFile(sessionId: string, path: string): Promise<ArrayBuffer>
  async listFiles(sessionId: string): Promise<string[]>
  async deleteSession(sessionId: string): Promise<void>

  // Session operations (KV)
  async createSession(sessionId: string, data: any, ttl: number)
  async getSession(sessionId: string): Promise<any>
  async updateSession(sessionId: string, data: any)
  async deleteSession(sessionId: string)

  // Cache operations (KV)
  async getCache(key: string): Promise<any>
  async setCache(key: string, data: any, ttl?: number)
}
```

### Search Service

Implements full-text and regex search:

```typescript
class SearchService {
  // Search across all files
  async search(
    sessionId: string,
    query: string,
    regex: boolean = false,
    contextLines: number = 3
  ): Promise<SearchResult[]>
}

// Search result format:
interface SearchResult {
  file: string;
  matches: {
    line: number;
    column: number;
    text: string;
    context: string[];
  }[];
}
```

**Search algorithm:**

```
1. Get session files list
2. For each file:
   a. Download file from R2
   b. Decode content (UTF-8)
   c. Split into lines
   d. If regex: compile pattern and search
   e. If literal: use string match
   f. For each match:
      - Record line/column
      - Extract context lines
      - Store in results
3. Return aggregated results
```

## Request/Response Flow

### Upload Flow

```
1. Client sends POST /api/v1/extensions/upload with CRX file
                    │
                    ▼
2. Router matches endpoint, extracts file
                    │
                    ▼
3. Auth middleware validates API key
                    │
                    ▼
4. Rate limit middleware checks quota
                    │
                    ▼
5. Upload handler validates file size (<50MB)
                    │
                    ▼
6. CRX service parses file
   - Validates magic bytes
   - Reads version
   - Handles CRX2/CRX3 extraction
   - Parses ZIP content
   - Extracts manifest.json
                    │
                    ▼
7. Storage service uploads extracted files to R2
   - Creates session directory
   - Stores individual files
                    │
                    ▼
8. Session service creates session in KV
   - Generates session ID
   - Stores metadata
   - Sets TTL (30 minutes)
                    │
                    ▼
9. Handler formats response with session ID
                    │
                    ▼
10. Response middleware adds headers
                    │
                    ▼
11. Client receives 201 Created with session data
```

### Download Flow

```
1. Client sends POST /api/v1/extensions/download with extension ID
                    │
                    ▼
2. Auth middleware validates API key
                    │
                    ▼
3. Rate limit checks per-IP quota
                    │
                    ▼
4. Download handler validates extension ID format
                    │
                    ▼
5. Check CACHE KV for recent downloads
   - If found: return cached version
   - If not found: proceed to download
                    │
                    ▼
6. CRX service downloads from Chrome Web Store
   - Constructs download URL
   - Sends HTTP request
   - Validates response
   - Returns CRX file
                    │
                    ▼
7. CRX service parses downloaded file
   - Validates magic bytes
   - Extracts ZIP content
   - Parses manifest
                    │
                    ▼
8. Storage service uploads files to R2
   - Creates directory for session
   - Stores all files
                    │
                    ▼
9. Session service creates session in KV
   - Sets TTL (30 minutes)
                    │
                    ▼
10. Cache service stores manifest in CACHE KV
    - For future downloads of same extension
                    │
                    ▼
11. Response with session ID
```

### Search Flow

```
1. Client sends POST /api/v1/extensions/{id}/search with query
                    │
                    ▼
2. Auth + rate limit middleware
                    │
                    ▼
3. Handler validates session exists
                    │
                    ▼
4. Search service receives query
                    │
                    ├─ If regex: Compile pattern
                    │
                    ├─ For each file:
                    │  - Download from R2
                    │  - Parse UTF-8 content
                    │  - Apply pattern matching
                    │  - Extract context lines
                    │
                    ▼
5. Aggregate results from all files
                    │
                    ▼
6. Format response with matches
                    │
                    ▼
7. Return to client
```

## Data Storage Patterns

### R2 Storage Structure

Files are organized by session ID:

```
crxreview-storage/
├── sess_abc123xyz/
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   └── styles/
│       └── style.css
│
├── sess_def456uvw/
│   ├── manifest.json
│   └── index.js
│
└── ...
```

**Key decisions:**
- Session-based organization enables quick cleanup
- Flat structure within session for efficient listing
- Individual files stored (not as single archive) for granular access

### KV Storage Structure

```
SESSIONS namespace:
├── sess_abc123xyz -> { session metadata JSON }
├── sess_def456uvw -> { session metadata JSON }
└── ...

CACHE namespace:
├── manifest:cjpalhdlnbpafiamejdnhcphjbkeiagm -> { manifest.json }
├── manifest:abcdefghijklmnopqrstuvwxyz123456 -> { manifest.json }
└── ...
```

**TTL Configuration:**
- SESSIONS: 1800 seconds (30 minutes) - auto-expires
- CACHE: 86400 seconds (24 hours) - optional, for performance

## Session Lifecycle

```
Created
   │
   ├─ Active (0-30 minutes)
   │  │
   │  ├─ User performs operations
   │  │  - Get metadata
   │  │  - Search
   │  │  - Retrieve files
   │  │
   │  └─ User deletes explicitly
   │      └─ Immediately removed
   │
   └─ Expired (after 30 minutes)
      │
      └─ Cleanup job runs (every 6 hours)
         │
         └─ Session removed from KV
         └─ Associated files removed from R2
```

**Cleanup Process:**

```typescript
async function cleanupExpiredSessions() {
  // 1. Query KV for all sessions
  const allSessions = await KV.list({ prefix: 'sess_' });

  // 2. For each session, check expiration
  for (const session of allSessions) {
    const data = await KV.get(session.name);
    const sessionData = JSON.parse(data);

    // 3. If expired, delete from both storages
    if (sessionData.expiresAt < Date.now()) {
      // Delete from KV
      await KV.delete(session.name);

      // Delete files from R2
      await deleteR2Directory(session.name);
    }
  }
}
```

## Error Handling

### Error Classification

```
Client Errors (4xx)
├── 400 Bad Request
│   └─ Invalid request format, missing fields
├── 401 Unauthorized
│   └─ Missing or invalid API key
├── 404 Not Found
│   └─ Session doesn't exist
├── 413 Payload Too Large
│   └─ File exceeds size limit
└── 429 Too Many Requests
    └─ Rate limit exceeded

Server Errors (5xx)
├── 500 Internal Server Error
│   └─ Unexpected error
├── 502 Bad Gateway
│   └─ Worker crashed or timeout
└── 503 Service Unavailable
    └─ Cloudflare service issue
```

### Error Response Format

```json
{
  "success": false,
  "error": "File too large. Maximum size: 50MB",
  "code": "FILE_TOO_LARGE",
  "meta": {
    "statusCode": 413,
    "timestamp": "2024-01-28T10:00:00Z",
    "requestId": "req_abc123",
    "retryAfter": 3600  // For rate limit errors
  }
}
```

## Security Architecture

### Authentication

```
API Key Management:
├─ Keys stored as Cloudflare secrets
├─ Never logged or exposed
├─ X-API-Key header validation
└─ Bearer token alternative support

Authorization:
├─ All endpoints require valid API key
├─ Key format validation
└─ Revocation support (if implemented)
```

### CORS

```
Allowed origins:
├─ *.crxreview.com
├─ *.openai.com (for Custom GPT)
├─ localhost:3000 (development)
└─ Configurable per environment
```

### Data Protection

```
In Transit:
├─ HTTPS/TLS for all requests
├─ Enforced by Cloudflare

At Rest:
├─ R2 encryption (automatic)
├─ KV encryption (automatic)
└─ No sensitive data logging
```

### Input Validation

```
File uploads:
├─ Magic bytes validation (Cr24)
├─ Size validation (<50MB)
├─ CRX version validation (2 or 3)

API parameters:
├─ Zod schema validation
├─ Type checking
├─ Length/format validation
```

## Performance Considerations

### Cold Start

Cloudflare Workers typically start in <1ms. No warm-up needed.

### CPU Limits

```
Execution time: 50ms per request
├─ CRX parsing: 10-20ms (small files)
├─ Upload to R2: 15-25ms
├─ KV operations: 1-5ms each
└─ Search operations: 20-40ms (depends on file count)
```

### Caching Strategy

```
Browser cache:
├─ Health endpoint: short or no cache
├─ API responses: no cache (dynamic data)
├─ OpenAPI spec: cache 1 day

KV cache:
├─ Manifest cache: 24 hours
├─ Session data: 30 minutes (TTL)
└─ Rate limit counters: 1 hour (window)

R2 caching:
├─ Files accessed frequently
├─ Served with If-Modified-Since headers
└─ Cloudflare edge caching: automatic
```

### Optimization Techniques

```
Payload size:
├─ Compress large responses
├─ Pagination for large file lists
├─ Context-aware data filtering

Memory usage:
├─ Stream files when possible
├─ Process in chunks
├─ Cleanup temporary data

Search optimization:
├─ Index files on upload
├─ Cache search results (short-term)
├─ Limit context lines retrieved
```

## Scalability

### Horizontal Scaling

Cloudflare Workers automatically scale:

```
Traffic increase
      │
      ▼
Cloudflare automatically:
├─ Routes requests to nearest edge
├─ Spawns additional Workers
├─ Distributes load globally
└─ No manual scaling needed
```

### Storage Scaling

```
R2 (file storage):
├─ Unlimited objects per bucket
├─ Automatic scaling
├─ No size limits per file

KV (sessions/cache):
├─ Strong consistency reads
├─ Auto-scaling
├─ Eventual consistency writes
├─ Good for session data
```

### Rate Limiting Scaling

```
Per-API-key limits:
├─ Prevents single user abuse
├─ Scales with user base

Per-IP limits:
├─ Prevents address-based abuse
├─ Fair for shared networks

Both tracked in KV:
├─ Distributed counters
├─ Auto-reset window
```

### Limitations and Tradeoffs

```
Cloudflare Workers:
├─ 50ms CPU time limit per request
├─ No persistent local state
├─ Memory limited per request
└─ Pricing based on requests

Best for:
├─ Stateless API operations
├─ Parse + process + store workflows
├─ Global low-latency access
└─ API gateway patterns

Not ideal for:
├─ Long-running processes
├─ Streaming large files
├─ Complex computations
└─ Local caching
```

---

## Deployment Architecture

### Multi-Environment Setup

```
Repository branches:
├─ main → Production deployment
│          └─ High reliability, strict rate limits
│
├─ develop → Staging deployment
│            └─ Testing new features
│
└─ feature/* → Local development
               └─ Wrangler local dev server

Cloudflare Workers:
├─ crxreview-api (production)
├─ crxreview-api-staging
└─ crxreview-api-dev (local)
```

### Infrastructure Components

```
Cloudflare Global Network:
├─ 200+ data centers worldwide
├─ Automatic routing to nearest location
├─ Built-in DDoS protection
├─ SSL/TLS certificates

Associated services:
├─ DNS (Cloudflare)
├─ R2 (object storage)
├─ KV (distributed cache)
├─ Workers Analytics Engine
└─ Logs (real-time request logs)
```

---

This architecture ensures reliability, performance, and scalability for the CRX Review API across a global user base.
