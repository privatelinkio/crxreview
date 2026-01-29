# CRX Review API

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![API Version](https://img.shields.io/badge/API-v1.0.0-green.svg)](https://github.com/brentlangston/crxreview)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

REST API for Chrome Extension (CRX) file analysis, parsing, and review. Built on Cloudflare Workers for global edge deployment with support for CRX2 and CRX3 formats.

## Overview

The CRX Review API is a high-performance REST API for uploading, analyzing, and managing Chrome extensions. Deploy globally on Cloudflare Workers with automatic file cleanup, rate limiting, and comprehensive search capabilities.

**Key capabilities:**
- Parse CRX files (CRX2 and CRX3 formats) and extract ZIP contents
- Download extensions directly from Chrome Web Store
- Search file contents with full regex support
- Extract and filter files by category
- Generate hierarchical file trees
- Session-based storage with automatic 30-minute cleanup
- Built-in authentication and rate limiting

## Features

- **CRX Parsing**: Support for both CRX2 and CRX3 formats with automatic header detection
- **Chrome Web Store Integration**: Download extensions directly by extension ID with CORS proxy support
- **File Management**: Extract, filter, and categorize files from extensions
- **Search**: Full-text and regex search across all files in an extension
- **Session Management**: KV-backed session storage with automatic TTL-based cleanup
- **Manifest Extraction**: Automatically parse and return manifest.json data
- **Rate Limiting**: Per-API-key and per-IP rate limiting with standard headers
- **File Tree**: Hierarchical representation of extension file structure
- **Error Handling**: Comprehensive error responses with standardized codes and debugging info
- **CORS Support**: Configured for production and custom GPT integration
- **Edge Deployment**: Cloudflare Workers for global availability and low latency

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [API Endpoints](#api-endpoints)
4. [Authentication](#authentication)
5. [Rate Limits](#rate-limits)
6. [Example Workflows](#example-workflows)
7. [Custom GPT Integration](#custom-gpt-integration)
8. [Local Development](#local-development)
9. [Configuration](#configuration)
10. [Project Structure](#project-structure)
11. [Troubleshooting](#troubleshooting)
12. [Documentation](#documentation)
13. [Contributing](#contributing)
14. [License](#license)

## Quick Start

Test the API with these simple commands:

```bash
# Health check
curl https://api.crxreview.com/health

# Download extension by ID
curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"input": "cjpalhdlnbpafiamejdnhcphjbkeiagm"}'

# Upload a CRX file
curl -X POST https://api.crxreview.com/api/v1/extensions/upload \
  -H "X-API-Key: your-api-key" \
  -F "file=@extension.crx"
```

## Installation

### Prerequisites

- **Node.js**: 18 or later
- **npm**: Version 9 or later
- **Cloudflare account**: With Workers enabled
- **Wrangler CLI**: Latest version (`npm install -g wrangler`)

### Setup Steps

1. **Clone and install dependencies:**

```bash
git clone https://github.com/yourusername/crxreview.git
cd crxreview/api
npm install
```

2. **Authenticate with Cloudflare:**

```bash
wrangler auth
```

3. **Set up Cloudflare resources** (see [DEPLOYMENT.md](DEPLOYMENT.md) for detailed steps):

```bash
# Create KV namespaces
wrangler kv:namespace create "SESSIONS"
wrangler kv:namespace create "CACHE"

# Create R2 bucket
wrangler r2 bucket create crxreview-storage
```

4. **Update `wrangler.toml`** with your namespace IDs and configuration

5. **Deploy:**

```bash
npm run deploy
```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## API Endpoints

All endpoints require authentication via `X-API-Key` header. Responses follow a standard format with success/error metadata.

### System Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API health check and version info |

### Extension Management

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/extensions/upload` | Upload a CRX file |
| POST | `/api/v1/extensions/download` | Download extension by ID from Chrome Web Store |
| GET | `/api/v1/extensions/{sessionId}` | Get extension metadata and file tree |
| GET | `/api/v1/extensions/{sessionId}/manifest` | Get parsed manifest.json |
| GET | `/api/v1/extensions/{sessionId}/file` | Get individual file from extension |
| DELETE | `/api/v1/extensions/{sessionId}` | Delete session and cleanup files |

### Search

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/extensions/{sessionId}/search` | Search file contents with regex |

### File Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/extensions/{sessionId}/files` | List all files in extension |
| POST | `/api/v1/extensions/{sessionId}/files/filter` | Filter files by pattern/category |

**Complete OpenAPI specification:** See [openapi/openapi.yaml](openapi/openapi.yaml) or view interactive docs at https://swagger.io/tools/swagger-ui/

## Authentication

The API uses API key authentication via HTTP headers. Obtain your API key by contacting support or creating one through the dashboard.

### Authentication Methods

**Option 1: X-API-Key Header (Recommended)**
```
X-API-Key: your-api-key-here
```

**Option 2: Bearer Token**
```
Authorization: Bearer your-api-key-here
```

### Example Request

```bash
curl -X GET https://api.crxreview.com/api/v1/extensions/abc123 \
  -H "X-API-Key: your-api-key"
```

### Security Best Practices

- Never commit API keys to version control
- Rotate keys periodically
- Use separate keys for development and production
- Restrict key permissions by endpoint (if available)
- Store keys in environment variables or secure vaults

## Rate Limits

Rate limits are enforced per API key and per IP address. Limits reset hourly or per-minute depending on the endpoint.

| Endpoint | Limit | Window |
|----------|-------|--------|
| Upload | 5 requests | per hour per key |
| Download (Chrome Web Store) | 10 requests | per hour per IP |
| Search | 30 requests | per minute per key |
| General | 100 requests | per hour per key |
| File retrieval | 20 requests | per minute per key |

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1674000000
```

When rate limited, you'll receive a 429 response:

```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again after 1674000000",
  "code": "RATE_LIMITED",
  "meta": {
    "retryAfter": 3600
  }
}
```

**Best Practice**: Implement exponential backoff when receiving 429 responses.

## Configuration

### Environment Variables

Configure these variables in `wrangler.toml` or via Cloudflare dashboard:

| Variable | Default | Description |
|----------|---------|-------------|
| SESSION_TTL | 1800 | Session expiration time in seconds (30 minutes) |
| MAX_FILE_SIZE | 52428800 | Maximum upload file size in bytes (50MB) |
| RATE_LIMIT_DOWNLOAD | 10 | Rate limit for Chrome Web Store downloads per hour |
| RATE_LIMIT_UPLOAD | 5 | Rate limit for uploads per hour |
| RATE_LIMIT_SEARCH | 30 | Rate limit for search per minute |
| API_VERSION | 1.0.0 | API version string |
| ENVIRONMENT | production | Deployment environment |

### wrangler.toml

Key configuration:

```toml
name = "crxreview-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
node_compat = true

[[kv_namespaces]]
binding = "SESSIONS"
id = "your-sessions-id"

[[kv_namespaces]]
binding = "CACHE"
id = "your-cache-id"

[[r2_buckets]]
binding = "CRX_STORAGE"
bucket_name = "crxreview-storage"

[env.production]
vars = { SESSION_TTL = "1800", MAX_FILE_SIZE = "52428800" }
```

For detailed setup, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Example Workflows

### Workflow 1: Download and Analyze Extension from Chrome Web Store

This workflow shows how to download an extension (uBlock Origin) and analyze its contents.

```bash
# 1. Download extension by ID
SESSION_ID=$(curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"input": "cjpalhdlnbpafiamejdnhcphjbkeiagm"}' | jq -r '.data.sessionId')

echo "Session ID: $SESSION_ID"

# 2. Get extension metadata and file tree
curl https://api.crxreview.com/api/v1/extensions/$SESSION_ID \
  -H "X-API-Key: your-api-key" | jq '.'

# 3. Extract and view manifest
curl https://api.crxreview.com/api/v1/extensions/$SESSION_ID/manifest \
  -H "X-API-Key: your-api-key" | jq '.data.manifest'

# 4. Search for specific API usage
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "chrome\\.tabs", "regex": true, "contextLines": 3}' | jq '.'

# 5. Clean up session
curl -X DELETE https://api.crxreview.com/api/v1/extensions/$SESSION_ID \
  -H "X-API-Key: your-api-key"
```

### Workflow 2: Upload and Search Local CRX File

Upload a CRX file from your computer and search its contents.

```bash
# 1. Upload CRX file
SESSION_ID=$(curl -X POST https://api.crxreview.com/api/v1/extensions/upload \
  -H "X-API-Key: your-api-key" \
  -F "file=@my-extension.crx" | jq -r '.data.sessionId')

# 2. List all files
curl https://api.crxreview.com/api/v1/extensions/$SESSION_ID/files \
  -H "X-API-Key: your-api-key" | jq '.data.files'

# 3. Filter JavaScript files
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/files/filter \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"pattern": "\\.js$"}' | jq '.data.files'

# 4. Get a specific file
curl "https://api.crxreview.com/api/v1/extensions/$SESSION_ID/file?path=src/main.js" \
  -H "X-API-Key: your-api-key"
```

### Workflow 3: Permission and Security Analysis

Search for dangerous permissions and API calls.

```bash
# Search for network access patterns
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "(chrome\\.webRequest|fetch|XMLHttpRequest)",
    "regex": true
  }'

# Search for permission declarations
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "permissions",
    "regex": false
  }'
```

## Custom GPT Integration

The CRX Review API works seamlessly with ChatGPT's custom GPT feature for interactive extension analysis.

### Setup Instructions

1. **Create a custom GPT:**
   - Go to https://chatgpt.com/gpts/editor
   - Click "Create new GPT"
   - Fill in basic information

2. **Configure Actions:**
   - Scroll to "Actions"
   - Click "Create new action"
   - Click "Import from URL"
   - Enter: `https://api.crxreview.com/openapi/openapi.yaml`

3. **Set Authentication:**
   - Select "API Key" as auth type
   - Header name: `X-API-Key`
   - Obtain your API key from CRX Review dashboard

4. **Test with Sample Queries:**

```
"Download and analyze the uBlock Origin extension.
ID: cjpalhdlnbpafiamejdnhcphjbkeiagm.
Show me its manifest and search for any network access patterns."
```

```
"Upload this extension file and tell me which permissions it requests
and what APIs it uses."
```

## Local Development

### Development Server

Start the development server with Cloudflare Workers emulation:

```bash
npm run dev
```

Server runs at `http://localhost:8787`. Supports auto-reload on file changes.

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

### Type Checking

```bash
npm run type-check
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint -- --fix

# Format code
npm run format
```

### Project Structure

```
/api
├── src/
│   ├── handlers/          # Route handlers for each endpoint
│   ├── services/          # Business logic (sessions, storage)
│   ├── middleware/        # Request middleware (auth, CORS, errors)
│   ├── lib/
│   │   ├── crx/          # CRX parsing and downloading
│   │   ├── zip/          # ZIP extraction utilities
│   │   └── search/       # Full-text search implementation
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Shared utilities (validation, responses)
│   └── index.ts          # Main Worker entry point
├── openapi/
│   └── openapi.yaml      # OpenAPI 3.0 specification
├── wrangler.toml         # Cloudflare configuration
├── tsconfig.json         # TypeScript config
└── package.json          # Dependencies and scripts
```

## Troubleshooting

For detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

### Common Issues

**"Unauthorized" error**
- Verify API key in X-API-Key header
- Check that key hasn't expired
- Confirm key has required permissions

**"Session not found"**
- Session may have expired (30-minute default TTL)
- Create a new session and retry
- Check session ID is correct

**"Rate limit exceeded"**
- Wait until X-RateLimit-Reset timestamp
- Implement exponential backoff in your code
- Consider batching requests to reduce rate limit hits

**"File too large"**
- Maximum upload size is 50MB
- For larger extensions, download from Chrome Web Store instead
- Contact support for custom limits

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more issues and solutions.

## Documentation

Complete documentation is available:

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide for Cloudflare Workers
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and implementation details
- **[openapi/README.md](openapi/README.md)** - OpenAPI specification overview
- **[openapi/openapi.yaml](openapi/openapi.yaml)** - Complete API specification

## Contributing

We welcome contributions! Please:

1. Follow the TypeScript strict mode configuration
2. Add tests for new features
3. Update OpenAPI spec for new endpoints
4. Update documentation for user-facing changes
5. Follow the existing code style (ESLint + Prettier)

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:

1. **Check the documentation:**
   - [README.md](README.md) - Quick start
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment help
   - [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System design

2. **Review the API specification:**
   - [openapi/openapi.yaml](openapi/openapi.yaml) - Full API spec
   - [openapi/README.md](openapi/README.md) - OpenAPI overview

3. **Search existing issues:**
   - GitHub Issues (this repository)
   - Stack Overflow (tag: cloudflare-workers)

4. **Contact support:**
   - Create an issue with detailed information
   - Include error messages, steps to reproduce, and environment details
