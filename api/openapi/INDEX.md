# CRX Review API - OpenAPI Documentation

Complete, production-ready OpenAPI 3.0.3 specification for Chrome Extension (CRX) file analysis, parsing, and search.

## Quick Links

- **Full Specification:** [openapi.yaml](openapi.yaml) - Complete OpenAPI 3.0.3 spec
- **API Documentation:** [README.md](README.md) - Comprehensive API guide with examples
- **Quick Reference:** [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Developer cheat sheet
- **Examples:** [EXAMPLES.md](EXAMPLES.md) - Real request/response examples

## What's Included

### 1. openapi.yaml (33 KB)

Complete OpenAPI 3.0.3 specification with:

- **15 Schema definitions** covering all request/response types
- **10 API endpoints** organized into 4 logical groups
- **4 custom headers** for rate limiting and API metadata
- **Full error documentation** with all error codes
- **Rate limit specifications** for each endpoint
- **Security schemes** with API key authentication

Endpoints:
- 4 Extension Management endpoints (upload, download, get, delete)
- 6 Content Access endpoints (manifest, files, extract, download ZIP)
- 2 Analysis endpoints (search, filter)
- 1 System endpoint (health check)

### 2. README.md (12 KB)

Complete API documentation including:

- Quick start guide with curl examples
- Endpoint reference with authentication details
- Response format documentation
- Error handling guide with common error codes
- Rate limiting explanation with examples
- Data types and categories
- Search and filter examples
- Session management lifecycle
- SDK integration instructions
- Custom GPT integration guide
- Postman collection import
- Development and validation instructions

### 3. QUICK_REFERENCE.md (8.8 KB)

Developer quick reference with:

- Base URL and authentication
- All endpoints in table format (11 endpoints)
- Common request patterns
- Response and error examples
- HTTP status codes reference
- Error codes reference
- Query parameters guide
- Request body examples
- Response headers reference
- File categories
- File paths documentation
- Search pattern examples
- Filter pattern examples
- Limits and quotas
- Complete workflow example
- Integration guides
- Quick tips

### 4. EXAMPLES.md (19 KB)

Real request and response examples for every endpoint:

- **Extension Management:**
  - Upload with success and error responses
  - Download (by ID and URL)
  - Get metadata
  - Delete session

- **Content Access:**
  - Get manifest (Manifest v3 example)
  - Get file tree
  - Extract JSON file
  - Extract binary image with base64
  - Download as ZIP

- **Analysis:**
  - Search (simple text and regex patterns)
  - Filter (by name, category, size)

- **System:**
  - Health check (healthy and degraded states)

- **Errors:**
  - 400 Bad Request examples
  - 401 Unauthorized
  - 429 Rate Limited
  - 502 Bad Gateway

- **Workflows:**
  - Complete upload and analysis workflow

## Specification Highlights

### 11 Total Endpoints

**Extension Management (4):**
1. `POST /extensions/upload` - Upload CRX file
2. `POST /extensions/download` - Download from Chrome Web Store
3. `GET /extensions/{sessionId}` - Get session metadata
4. `DELETE /extensions/{sessionId}` - Delete session

**Content Access (6):**
5. `GET /extensions/{sessionId}/manifest` - Get parsed manifest
6. `GET /extensions/{sessionId}/files` - Get file tree/list
7. `GET /extensions/{sessionId}/files/{path}` - Extract specific file
8. `GET /extensions/{sessionId}/download/zip` - Download as ZIP
9. Plus manifest, files, filter, and extraction examples

**Analysis (2):**
10. `POST /extensions/{sessionId}/search` - Search file contents
11. `POST /extensions/{sessionId}/filter` - Filter files

**System (1):**
12. `GET /health` - Health check (no auth required)

### 15 Schema Types

1. **ApiResponse** - Standard success response wrapper
2. **ErrorResponse** - Consistent error format
3. **ExtensionSessionResponse** - Session metadata
4. **ManifestResponse** - Parsed manifest with permissions
5. **FileNode** - File/directory in tree
6. **FileTreeResponse** - Complete file hierarchy
7. **FileExtractionResponse** - Single file content
8. **SearchMatch** - Individual search result
9. **SearchResultResponse** - Search results with pagination
10. **FilterResultResponse** - Filter results
11. **HealthResponse** - Health check status
12. **UploadRequest** - Multipart file upload
13. **DownloadRequest** - Download by ID or URL
14. **SearchRequest** - Advanced search options
15. **FilterRequest** - File filtering options

### Rate Limits

- **Upload:** 5 requests/hour per API key
- **Download:** 10 requests/hour per IP
- **Search:** 30 requests/minute per API key
- **General:** 100 requests/hour per API key

### Error Codes

| Code | Status | Use Case |
|------|--------|----------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `BAD_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Missing API key |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service down |

## File Structure

```
api/openapi/
├── openapi.yaml           # Complete OpenAPI 3.0.3 specification
├── README.md              # Comprehensive API documentation
├── QUICK_REFERENCE.md     # Developer quick reference
├── EXAMPLES.md            # Real request/response examples
└── INDEX.md               # This file
```

Total documentation size: ~73 KB

## Getting Started

### 1. Read Documentation

1. Start with [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for a quick overview
2. Read [README.md](README.md) for detailed API documentation
3. Check [EXAMPLES.md](EXAMPLES.md) for real examples
4. Reference [openapi.yaml](openapi.yaml) for specification details

### 2. Basic API Usage

```bash
# Get API key first (contact support)
API_KEY="your-api-key-here"

# Upload extension
SESSION=$(curl -X POST https://api.crxreview.com/api/v1/extensions/upload \
  -H "X-API-Key: $API_KEY" \
  -F "file=@extension.crx" \
  | jq -r '.data.sessionId')

echo "Session: $SESSION"

# Search for API calls
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION/search \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "chrome.storage"}' | jq '.data.results'

# Download as ZIP
curl https://api.crxreview.com/api/v1/extensions/$SESSION/download/zip \
  -H "X-API-Key: $API_KEY" \
  -o extension.zip
```

### 3. Integration Options

**Option A: Use OpenAPI Directly**
- Import `openapi.yaml` into API tools
- Postman, Insomnia, VS Code extensions support
- Auto-generates client libraries

**Option B: Generate SDK**
```bash
# TypeScript
openapi-generator-cli generate -i openapi.yaml -g typescript-axios

# Python
openapi-generator-cli generate -i openapi.yaml -g python

# Go
openapi-generator-cli generate -i openapi.yaml -g go
```

**Option C: Custom GPT Integration**
1. Create new GPT at https://chatgpt.com/gpts/editor
2. Upload `openapi.yaml` in Schema section
3. Configure actions to use API endpoints
4. Test with natural language queries

### 4. Validation

Verify the specification:

```bash
# Check if YAML is valid
node -e "const yaml = require('js-yaml'); const fs = require('fs'); yaml.load(fs.readFileSync('openapi.yaml', 'utf8')); console.log('Valid OpenAPI spec')"

# Endpoints count
node -e "const yaml = require('js-yaml'); const fs = require('fs'); const doc = yaml.load(fs.readFileSync('openapi.yaml', 'utf8')); console.log('Endpoints:', Object.keys(doc.paths).length)"
```

## Key Features

### Upload & Download
- Upload CRX files (2-3 format support)
- Download directly from Chrome Web Store
- Sessions expire after 30 minutes
- Secure storage in Cloudflare R2

### Content Analysis
- Parse manifest.json
- Extract file tree (hierarchical or flat)
- Extract individual files (with base64 for binary)
- Download as standard ZIP format

### Advanced Search
- Text search with case sensitivity option
- Regex pattern matching
- File pattern filtering
- Context lines (configurable 0-10)
- Pagination support
- Up to 1000 results per query

### Flexible Filtering
- Filter by file name pattern (glob or regex)
- Filter by file category (code, config, resource, etc)
- Filter by file size range
- Combine multiple filters

### Robust Error Handling
- Consistent error format across all endpoints
- Error codes for programmatic handling
- Detailed error messages for debugging
- Request IDs for support inquiries
- Rate limit information in headers

## Documentation Quality

All documentation follows these principles:

- **Production-Ready:** Complete specification ready for deployment
- **Developer-Focused:** Real examples, clear patterns
- **Comprehensive:** Every endpoint, parameter, and error documented
- **Examples-First:** Multiple examples for each endpoint
- **Integration-Ready:** Works with custom GPTs, Postman, SDKs

## Use Cases

1. **Chrome Extension Analysis**
   - Security review of permissions and APIs
   - Code audit with search capabilities
   - Structure analysis with file tree

2. **Automation**
   - CI/CD pipeline integration
   - Batch extension analysis
   - Automated reporting

3. **Custom GPT**
   - Interactive extension analysis
   - Natural language queries
   - Real-time file extraction

4. **Developer Tools**
   - IDE integration via OpenAPI
   - API client generation
   - Desktop application backend

## Support

- **Repository:** https://github.com/yourusername/crxreview
- **Issues:** https://github.com/yourusername/crxreview/issues
- **Documentation:** This directory
- **Specification:** openapi.yaml (valid OpenAPI 3.0.3)

## Standards Compliance

- **OpenAPI:** 3.0.3 specification
- **HTTP:** Follows REST conventions
- **JSON:** RFC 7159 format
- **ISO 8601:** Timestamps
- **Rate Limiting:** RFC 6585 (HTTP 429)
- **Authentication:** API Key in headers

## File Locations

All OpenAPI documentation is in: `/Users/brent.langston/git/crxreview/api/openapi/`

- **openapi.yaml** - Full specification (33 KB)
- **README.md** - API documentation (12 KB)
- **QUICK_REFERENCE.md** - Quick reference (8.8 KB)
- **EXAMPLES.md** - Real examples (19 KB)
- **INDEX.md** - This file

Total: ~73 KB of comprehensive documentation

## Version Information

- **API Version:** 1.0.0
- **OpenAPI Version:** 3.0.3
- **Created:** 2025-01-28
- **Status:** Production-Ready
- **Last Updated:** 2025-01-28

## Next Steps

1. Review [QUICK_REFERENCE.md](QUICK_REFERENCE.md) (5 min read)
2. Try examples from [EXAMPLES.md](EXAMPLES.md)
3. Read full [README.md](README.md) for details
4. Reference [openapi.yaml](openapi.yaml) as needed
5. Integrate with tools of choice
6. Deploy to production

---

**For the most up-to-date specification and examples, refer to files in this directory.**
