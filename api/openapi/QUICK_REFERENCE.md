# CRX Review API - Quick Reference

## Base URL
- **Production:** `https://api.crxreview.com/api/v1`
- **Development:** `http://localhost:8787/api/v1`

## Authentication
```
Header: X-API-Key: your-api-key
```

## Endpoints Summary

| Method | Path | Description | Auth | Rate Limit |
|--------|------|-------------|------|-----------|
| POST | `/extensions/upload` | Upload CRX file | Required | 5/hr |
| POST | `/extensions/download` | Download from Web Store | Required | 10/hr |
| GET | `/extensions/{sessionId}` | Get metadata | Required | 100/hr |
| DELETE | `/extensions/{sessionId}` | Delete session | Required | 100/hr |
| GET | `/extensions/{sessionId}/manifest` | Get manifest | Required | 100/hr |
| GET | `/extensions/{sessionId}/files` | Get file tree | Required | 100/hr |
| GET | `/extensions/{sessionId}/files/{path}` | Extract file | Required | 100/hr |
| GET | `/extensions/{sessionId}/download/zip` | Download ZIP | Required | 100/hr |
| POST | `/extensions/{sessionId}/search` | Search files | Required | 30/min |
| POST | `/extensions/{sessionId}/filter` | Filter files | Required | 100/hr |
| GET | `/health` | Health check | None | None |

## Common Requests

### Upload Extension
```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/upload \
  -H "X-API-Key: your-api-key" \
  -F "file=@extension.crx"
```

### Download Extension
```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"input": "cjpalhdlnbpafiamejdnhcphjbkeiagm"}'
```

### Get Manifest
```bash
curl https://api.crxreview.com/api/v1/extensions/{sessionId}/manifest \
  -H "X-API-Key: your-api-key"
```

### Search Files
```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/{sessionId}/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "chrome.storage",
    "useRegex": false,
    "maxResults": 100
  }'
```

### Filter Files
```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/{sessionId}/filter \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "namePattern": "*.js",
    "categories": ["code", "config"]
  }'
```

### Extract File
```bash
curl https://api.crxreview.com/api/v1/extensions/{sessionId}/files/manifest.json \
  -H "X-API-Key: your-api-key"
```

### Download as ZIP
```bash
curl https://api.crxreview.com/api/v1/extensions/{sessionId}/download/zip \
  -H "X-API-Key: your-api-key" \
  -o extension.zip
```

## Response Examples

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-28T15:30:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.0.0",
    "path": "/api/v1/extensions/upload"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Invalid file format",
  "message": "BAD_REQUEST",
  "details": { ... },
  "timestamp": "2025-01-28T15:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "statusCode": 400
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid API key |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict |
| 413 | Payload Too Large - File too large |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Server Error - Internal error |
| 502 | Bad Gateway - Download failed |
| 503 | Service Unavailable - Service down |

## Error Codes

| Code | Status | Cause |
|------|--------|-------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `BAD_REQUEST` | 400 | Invalid request |
| `UNAUTHORIZED` | 401 | Missing/invalid API key |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service unavailable |

## Query Parameters

### File Tree
```
?type=tree    # Nested hierarchy (default)
?type=flat    # Flat list
```

### File Extraction
```
?encoding=utf-8    # UTF-8 text (default)
?encoding=base64   # Base64 binary
```

## Request Body Examples

### SearchRequest
```json
{
  "query": "string",               // Required: search term
  "caseSensitive": false,          // Optional: case sensitivity
  "useRegex": false,               // Optional: treat as regex
  "wholeWord": false,              // Optional: whole word match
  "contextLines": 2,               // Optional: context lines (0-10)
  "filePattern": "*.js",           // Optional: file filter
  "maxResults": 100                // Optional: max results (1-1000)
}
```

### FilterRequest
```json
{
  "namePattern": "*.js",           // Optional: file pattern
  "useRegex": false,               // Optional: treat as regex
  "categories": ["code"],          // Optional: file categories
  "caseSensitive": false,          // Optional: case sensitivity
  "minSize": 0,                    // Optional: min file size
  "maxSize": 52428800              // Optional: max file size
}
```

### DownloadRequest
```json
{
  "input": "string"                // Required: extension ID or URL
}
```

## Response Headers

### Rate Limiting
```
X-RateLimit-Limit: 100             # Request limit
X-RateLimit-Remaining: 95          # Remaining requests
X-RateLimit-Reset: 1611874800      # Unix timestamp of reset
```

### Rate Limit Exceeded
```
Retry-After: 3600                  # Seconds to wait
```

### File Download
```
Content-Type: application/zip
Content-Disposition: attachment; filename="extension.zip"
```

## Field Categories

| Category | Examples |
|----------|----------|
| `code` | .js, .jsx, .ts, .tsx, .css, .html |
| `config` | manifest.json, package.json, config files |
| `resource` | Images, fonts, media files |
| `documentation` | README, .md, .txt files |
| `asset` | Static files, data |
| `other` | Other file types |

## File Paths

File paths use forward slashes and are relative to extension root:

- `manifest.json` - Root level file
- `src/content.js` - Nested file
- `images/icon-16.png` - Image in subdirectory

## Search Patterns

### Simple Text
```json
{"query": "chrome.storage"}
```

### Case-Insensitive
```json
{"query": "Permission", "caseSensitive": false}
```

### Regex Pattern
```json
{
  "query": "console\\.log\\(.*\\)",
  "useRegex": true
}
```

### Whole Words
```json
{"query": "permission", "wholeWord": true}
```

### Limited Results
```json
{"query": "search term", "maxResults": 50}
```

## Filter Patterns

### All JavaScript Files
```json
{"namePattern": "*.js"}
```

### All JS and Config
```json
{
  "categories": ["code", "config"]
}
```

### Large Files
```json
{"minSize": 1000000}
```

### Small Files
```json
{"maxSize": 10000}
```

### Case-Sensitive Pattern
```json
{
  "namePattern": "index.js",
  "caseSensitive": true
}
```

## Limits

| Item | Limit |
|------|-------|
| File Size | 50 MB |
| Query Length | 1000 chars |
| Max Results | 1000 |
| Context Lines | 10 |
| Session TTL | 30 min |
| Upload Rate | 5/hour |
| Download Rate | 10/hour |
| Search Rate | 30/minute |
| General Rate | 100/hour |

## Workflow Example

```bash
# 1. Upload
SESSION=$(curl -X POST https://api.crxreview.com/api/v1/extensions/upload \
  -H "X-API-Key: key" -F "file=@ext.crx" | jq -r '.data.sessionId')

# 2. Get info
curl https://api.crxreview.com/api/v1/extensions/$SESSION \
  -H "X-API-Key: key" | jq .

# 3. Search
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION/search \
  -H "X-API-Key: key" -H "Content-Type: application/json" \
  -d '{"query": "chrome.tabs"}' | jq .

# 4. Export
curl https://api.crxreview.com/api/v1/extensions/$SESSION/download/zip \
  -H "X-API-Key: key" -o export.zip

# 5. Clean up
curl -X DELETE https://api.crxreview.com/api/v1/extensions/$SESSION \
  -H "X-API-Key: key"
```

## Integration Guides

- **JavaScript/Node.js** - Use OpenAPI client generator
- **Python** - Use OpenAPI client generator
- **Custom GPT** - Import spec in ChatGPT settings
- **Postman** - Import spec directly
- **API Gateway** - AWS/Azure/GCP integration

## Support Resources

- **Specification:** `/api/openapi/openapi.yaml`
- **Documentation:** `/api/openapi/README.md`
- **Repository:** https://github.com/yourusername/crxreview
- **Issues:** https://github.com/yourusername/crxreview/issues

## Tips

1. Always use session IDs immediately after creation (30 min expiration)
2. Cache manifest and file tree if doing multiple operations
3. Use `filePattern` in search to reduce search scope
4. Combine filter operations to narrow results efficiently
5. Monitor rate limit headers to avoid throttling
6. Use base64 encoding for binary file extraction
7. Handle 404 errors gracefully (session expired)
8. Implement retry logic for network errors (502, 503)
