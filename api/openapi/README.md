# CRX Review API - OpenAPI Specification

Complete REST API specification for Chrome Extension (CRX) file analysis and search.

## Quick Start

### Authentication

All endpoints (except `/health`) require API key authentication:

```bash
# Header format
curl -H "X-API-Key: your-api-key" https://api.crxreview.com/api/v1/health

# Bearer token alternative
curl -H "Authorization: Bearer your-api-key" https://api.crxreview.com/api/v1/health
```

### Upload a CRX File

```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/upload \
  -H "X-API-Key: your-api-key" \
  -F "file=@ublock-origin.crx"
```

Response:
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "extensionId": "cjpalhdlnbpafiamejdnhcphjbkeiagm",
    "fileName": "ublock-origin.crx",
    "fileCount": 247,
    "size": 2457600,
    "createdAt": "2025-01-28T15:00:00.000Z",
    "expiresAt": "2025-01-28T15:30:00.000Z",
    "version": "1.52.0"
  },
  "meta": {
    "timestamp": "2025-01-28T15:00:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0.0",
    "path": "/api/v1/extensions/upload"
  }
}
```

### Download Extension from Chrome Web Store

```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"input": "cjpalhdlnbpafiamejdnhcphjbkeiagm"}'
```

Alternative with URL:
```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"input": "https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm"}'
```

## Endpoints

### 1. Extension Management

#### Upload CRX File
- **POST** `/extensions/upload`
- **Auth:** Required
- **Rate Limit:** 5/hour
- **Request:** multipart/form-data with `file` field
- **Response:** 201 Created with ExtensionSessionResponse

#### Download from Chrome Web Store
- **POST** `/extensions/download`
- **Auth:** Required
- **Rate Limit:** 10/hour per IP
- **Request:** JSON with `input` (extension ID or URL)
- **Response:** 201 Created with ExtensionSessionResponse

#### Get Session Metadata
- **GET** `/extensions/{sessionId}`
- **Auth:** Required
- **Response:** 200 OK with ExtensionSessionResponse

#### Delete Session
- **DELETE** `/extensions/{sessionId}`
- **Auth:** Required
- **Response:** 200 OK with success message

### 2. Content Access

#### Get Manifest
- **GET** `/extensions/{sessionId}/manifest`
- **Auth:** Required
- **Response:** 200 OK with ManifestResponse
- **Returns:** Parsed manifest.json with permissions and host permissions

#### Get File Tree
- **GET** `/extensions/{sessionId}/files?type=tree`
- **Auth:** Required
- **Query Parameters:**
  - `type` (string, default="tree"): Response format (tree|flat)
- **Response:** 200 OK with FileTreeResponse

#### Extract File
- **GET** `/extensions/{sessionId}/files/{path}`
- **Auth:** Required
- **Path Parameters:**
  - `path` (string, required): File path in extension
- **Query Parameters:**
  - `encoding` (string, default="utf-8"): Response encoding (utf-8|base64)
- **Response:** 200 OK with FileExtractionResponse

#### Download as ZIP
- **GET** `/extensions/{sessionId}/download/zip`
- **Auth:** Required
- **Response:** 200 OK with binary ZIP stream
- **Headers:** Content-Disposition with filename

### 3. Analysis

#### Search Content
- **POST** `/extensions/{sessionId}/search`
- **Auth:** Required
- **Rate Limit:** 30/minute
- **Request Body:**
  ```json
  {
    "query": "chrome.storage",
    "caseSensitive": false,
    "useRegex": false,
    "wholeWord": false,
    "contextLines": 2,
    "filePattern": "*.js",
    "maxResults": 100
  }
  ```
- **Response:** 200 OK with SearchResultResponse

#### Filter Files
- **POST** `/extensions/{sessionId}/filter`
- **Auth:** Required
- **Request Body:**
  ```json
  {
    "namePattern": "*.js",
    "useRegex": false,
    "categories": ["code", "config"],
    "caseSensitive": false,
    "minSize": 0,
    "maxSize": 52428800
  }
  ```
- **Response:** 200 OK with FilterResultResponse

### 4. System

#### Health Check
- **GET** `/health`
- **Auth:** Not required
- **Response:** 200 OK with HealthResponse
- **Services Checked:**
  - R2 Storage
  - KV Cache

## Response Format

All successful responses follow this structure:

```json
{
  "success": true,
  "data": {
    // endpoint-specific data
  },
  "meta": {
    "timestamp": "2025-01-28T15:00:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0.0",
    "path": "/api/v1/extensions/upload"
  }
}
```

## Error Responses

All error responses follow this structure:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "message": "ERROR_CODE",
  "details": {
    "field": "additional context"
  },
  "timestamp": "2025-01-28T15:00:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "path": "/api/v1/extensions/upload",
  "statusCode": 400
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `BAD_REQUEST` | 400 | Invalid request |
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## Rate Limiting

Rate limits are enforced per API key and IP address:

- **Upload:** 5 requests/hour per API key
- **Download:** 10 requests/hour per IP
- **Search:** 30 requests/minute per API key
- **General:** 100 requests/hour per API key

Rate limit info is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1611874800
```

When rate limit is exceeded (429):

```
Retry-After: 3600
```

## Data Types

### FileNode
Represents a file or directory in the extension:

```json
{
  "name": "manifest.json",
  "path": "manifest.json",
  "type": "file",
  "size": 1024,
  "category": "config",
  "children": []
}
```

### SearchMatch
A single search result:

```json
{
  "file": "src/content.js",
  "line": 42,
  "column": 15,
  "match": "chrome.storage",
  "context": {
    "before": ["function onReady() {", "  // Get settings"],
    "after": ["    .get(['settings'], (result) => {", "      console.log(result);"]
  }
}
```

### FileCategory
File categories used for filtering and organization:

- `code` - JavaScript, CSS, HTML source files
- `config` - Configuration files (manifest.json, etc)
- `resource` - Images, fonts, media
- `documentation` - Markdown, text, help files
- `asset` - Static assets
- `other` - Other file types

## Search Examples

### Simple Text Search
```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/{sessionId}/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "chrome.tabs",
    "contextLines": 3
  }'
```

### Regex Pattern Search
```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/{sessionId}/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "console\\.log\\(['\''|'\''\\].*['\''|'\''\\]\\)",
    "useRegex": true,
    "filePattern": "*.js",
    "maxResults": 50
  }'
```

### Case-Insensitive Whole Word Match
```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/{sessionId}/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "permissions",
    "caseSensitive": false,
    "wholeWord": true
  }'
```

## Filter Examples

### Filter JavaScript Files
```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/{sessionId}/filter \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "namePattern": "*.js"
  }'
```

### Filter by Category
```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/{sessionId}/filter \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["code", "config"]
  }'
```

### Filter by Size Range
```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/{sessionId}/filter \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "minSize": 1024,
    "maxSize": 1048576
  }'
```

## Session Management

### Session Lifecycle

1. **Creation**: Upload or download an extension
   - Returns `sessionId` valid for 30 minutes
   - Files stored in R2 storage
   - Metadata cached in KV store

2. **Active**: Perform operations on the session
   - Retrieve manifest
   - Extract files
   - Search content
   - Filter files

3. **Expiration**: After 30 minutes of inactivity
   - Session automatically deleted
   - Files removed from storage
   - 404 returned on further requests

4. **Manual Deletion**: Call DELETE endpoint
   - Immediately removes session
   - Frees storage resources
   - 404 returned on further requests

### Example Session Workflow

```bash
# 1. Upload extension
SESSION=$(curl -X POST https://api.crxreview.com/api/v1/extensions/upload \
  -H "X-API-Key: your-api-key" \
  -F "file=@extension.crx" \
  | jq -r '.data.sessionId')

# 2. Get session metadata
curl https://api.crxreview.com/api/v1/extensions/$SESSION \
  -H "X-API-Key: your-api-key"

# 3. Get manifest
curl https://api.crxreview.com/api/v1/extensions/$SESSION/manifest \
  -H "X-API-Key: your-api-key"

# 4. Get file tree
curl https://api.crxreview.com/api/v1/extensions/$SESSION/files \
  -H "X-API-Key: your-api-key"

# 5. Search files
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "chrome.storage"}'

# 6. Download as ZIP
curl https://api.crxreview.com/api/v1/extensions/$SESSION/download/zip \
  -H "X-API-Key: your-api-key" \
  -o extension.zip

# 7. Delete session (optional - auto-deletes after 30 min)
curl -X DELETE https://api.crxreview.com/api/v1/extensions/$SESSION \
  -H "X-API-Key: your-api-key"
```

## SDK Integration

This OpenAPI specification can be used to generate SDKs in multiple languages:

```bash
# Generate TypeScript SDK
openapi-generator-cli generate -i api/openapi/openapi.yaml \
  -g typescript-axios -o sdk/typescript

# Generate Python SDK
openapi-generator-cli generate -i api/openapi/openapi.yaml \
  -g python -o sdk/python

# Generate Go SDK
openapi-generator-cli generate -i api/openapi/openapi.yaml \
  -g go -o sdk/go
```

## Custom GPT Integration

To use this API with OpenAI Custom GPTs:

1. Go to https://chatgpt.com/gpts/editor
2. Click "Create new GPT"
3. In Settings, find "Schema" section
4. Upload or paste the OpenAPI specification
5. Configure actions to use your API endpoints

## Postman Collection

Import this specification into Postman:

1. Click "Import" in Postman
2. Select "Link" tab
3. Paste: `https://api.crxreview.com/api/openapi.yaml`
4. Click "Continue"

Or use the spec file directly:
- File path: `/api/openapi/openapi.yaml`

## Development

### Validate Specification

```bash
# Using npm yaml parser
node -e "
const yaml = require('js-yaml');
const fs = require('fs');
const doc = yaml.load(fs.readFileSync('api/openapi/openapi.yaml', 'utf8'));
console.log('Valid OpenAPI spec - ' + Object.keys(doc.paths).length + ' endpoints');
"
```

### Specification File

- **Location:** `/Users/brent.langston/git/crxreview/api/openapi/openapi.yaml`
- **Format:** OpenAPI 3.0.3
- **Size:** Production-ready
- **Versions:** Updated with each API change

## Support

For questions or issues with the API specification:

- Repository: https://github.com/yourusername/crxreview
- Issues: https://github.com/yourusername/crxreview/issues
- Docs: https://github.com/yourusername/crxreview/wiki
