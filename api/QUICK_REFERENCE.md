# CRX Review API - Quick Reference

Fast lookup guide for common API operations and use cases.

## API Base URL

```
Production: https://api.crxreview.com
Development: http://localhost:8787 (local dev server)
Preview: https://your-worker-id.workers.dev
```

## Authentication

All endpoints except `/health` require authentication:

```bash
# Using X-API-Key header (recommended)
curl -H "X-API-Key: your-api-key" https://api.crxreview.com/api/v1/...

# Using Bearer token
curl -H "Authorization: Bearer your-api-key" https://api.crxreview.com/api/v1/...
```

## Common Operations

### 1. Upload and Analyze Local Extension

```bash
# Upload the CRX file
RESPONSE=$(curl -X POST https://api.crxreview.com/api/v1/extensions/upload \
  -H "X-API-Key: your-api-key" \
  -F "file=@extension.crx")

SESSION_ID=$(echo $RESPONSE | jq -r '.data.sessionId')

# Get extension info
curl https://api.crxreview.com/api/v1/extensions/$SESSION_ID \
  -H "X-API-Key: your-api-key" | jq '.data'

# Get manifest
curl https://api.crxreview.com/api/v1/extensions/$SESSION_ID/manifest \
  -H "X-API-Key: your-api-key" | jq '.data.manifest'

# Search for specific code
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "eval\\(", "regex": true}'

# Cleanup
curl -X DELETE https://api.crxreview.com/api/v1/extensions/$SESSION_ID \
  -H "X-API-Key: your-api-key"
```

### 2. Download and Analyze Chrome Web Store Extension

```bash
# Download extension by ID (uBlock Origin)
RESPONSE=$(curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"input": "cjpalhdlnbpafiamejdnhcphjbkeiagm"}')

SESSION_ID=$(echo $RESPONSE | jq -r '.data.sessionId')

# Analyze the extension
curl https://api.crxreview.com/api/v1/extensions/$SESSION_ID/manifest \
  -H "X-API-Key: your-api-key" | jq '.data.manifest.permissions'
```

### 3. Search for Dangerous APIs

```bash
# Search for network access
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "(chrome\\.webRequest|fetch|XMLHttpRequest)",
    "regex": true,
    "contextLines": 2
  }' | jq '.data.results'

# Search for eval usage
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "eval\\(", "regex": true}' | jq '.data.results'
```

### 4. List and Filter Files

```bash
# List all files
curl https://api.crxreview.com/api/v1/extensions/$SESSION_ID/files \
  -H "X-API-Key: your-api-key" | jq '.data.files'

# Filter JavaScript files only
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/files/filter \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"pattern": "\\.js$"}' | jq '.data.files'

# Get a specific file content
curl "https://api.crxreview.com/api/v1/extensions/$SESSION_ID/file?path=src/main.js" \
  -H "X-API-Key: your-api-key" | jq '.data.content'
```

## Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check (no auth) |
| POST | `/api/v1/extensions/upload` | Upload CRX file |
| POST | `/api/v1/extensions/download` | Download from Chrome Web Store |
| GET | `/api/v1/extensions/{id}` | Get extension metadata |
| GET | `/api/v1/extensions/{id}/manifest` | Get manifest.json |
| GET | `/api/v1/extensions/{id}/files` | List all files |
| POST | `/api/v1/extensions/{id}/files/filter` | Filter files by pattern |
| GET | `/api/v1/extensions/{id}/file` | Get single file content |
| POST | `/api/v1/extensions/{id}/search` | Search file contents |
| DELETE | `/api/v1/extensions/{id}` | Delete session |

## Error Codes

| Code | HTTP | Meaning | Solution |
|------|------|---------|----------|
| `UNAUTHORIZED` | 401 | Invalid API key | Check X-API-Key header |
| `RATE_LIMITED` | 429 | Too many requests | Wait and retry |
| `SESSION_NOT_FOUND` | 404 | Session expired or invalid | Create new session |
| `FILE_TOO_LARGE` | 413 | Upload exceeds 50MB | Use Chrome Web Store download |
| `INVALID_CRX` | 400 | CRX parsing failed | Ensure valid CRX file |
| `INVALID_PATTERN` | 400 | Invalid regex pattern | Check regex syntax |
| `SERVER_ERROR` | 500 | Unexpected error | Check logs, retry |

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Upload | 5 | per hour per API key |
| Download | 10 | per hour per IP |
| Search | 30 | per minute per API key |
| File ops | 20 | per minute per API key |
| General | 100 | per hour per API key |

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123...",
    "name": "Extension Name",
    "version": "1.0.0"
  },
  "meta": {
    "statusCode": 200,
    "timestamp": "2024-01-28T10:00:00Z"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "meta": {
    "statusCode": 400,
    "timestamp": "2024-01-28T10:00:00Z",
    "retryAfter": 3600
  }
}
```

## Common Extension IDs

For testing or example purposes:

| Extension | ID |
|-----------|-----|
| uBlock Origin | `cjpalhdlnbpafiamejdnhcphjbkeiagm` |
| Cloudflare Warp | `gkobjohfobjkeieidibfkmiofjmhbghi` |
| Chrome Remote Desktop | `inomeogfingihgjfjlpooikiigcfgceh` |

Visit https://chrome.google.com/webstore to find more extension IDs.

## JavaScript Examples

### Node.js / JavaScript

```javascript
const apiKey = process.env.CRX_API_KEY;
const baseUrl = 'https://api.crxreview.com';

// Upload extension
async function uploadExtension(filePath) {
  const fs = require('fs');
  const FormData = require('form-data');

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const response = await fetch(`${baseUrl}/api/v1/extensions/upload`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      ...form.getHeaders()
    },
    body: form
  });

  return response.json();
}

// Download extension
async function downloadExtension(extensionId) {
  const response = await fetch(`${baseUrl}/api/v1/extensions/download`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input: extensionId })
  });

  return response.json();
}

// Search
async function search(sessionId, query, regex = false) {
  const response = await fetch(
    `${baseUrl}/api/v1/extensions/${sessionId}/search`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        regex,
        contextLines: 3
      })
    }
  );

  return response.json();
}
```

### Python

```python
import requests
import os
from typing import Dict, Any

API_KEY = os.getenv('CRX_API_KEY')
BASE_URL = 'https://api.crxreview.com'

def upload_extension(file_path: str) -> Dict[str, Any]:
    """Upload a CRX file"""
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(
            f'{BASE_URL}/api/v1/extensions/upload',
            headers={'X-API-Key': API_KEY},
            files=files
        )
    return response.json()

def download_extension(extension_id: str) -> Dict[str, Any]:
    """Download extension from Chrome Web Store"""
    response = requests.post(
        f'{BASE_URL}/api/v1/extensions/download',
        headers={
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json'
        },
        json={'input': extension_id}
    )
    return response.json()

def search_files(session_id: str, query: str, regex: bool = False) -> Dict[str, Any]:
    """Search file contents"""
    response = requests.post(
        f'{BASE_URL}/api/v1/extensions/{session_id}/search',
        headers={
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json'
        },
        json={
            'query': query,
            'regex': regex,
            'contextLines': 3
        }
    )
    return response.json()

def get_manifest(session_id: str) -> Dict[str, Any]:
    """Get extension manifest"""
    response = requests.get(
        f'{BASE_URL}/api/v1/extensions/{session_id}/manifest',
        headers={'X-API-Key': API_KEY}
    )
    return response.json()

# Usage
if __name__ == '__main__':
    # Download uBlock Origin
    result = download_extension('cjpalhdlnbpafiamejdnhcphjbkeiagm')
    session_id = result['data']['sessionId']

    # Get manifest
    manifest = get_manifest(session_id)
    print(manifest['data']['manifest'])

    # Search for eval usage
    results = search_files(session_id, 'eval\\(', regex=True)
    print(f"Found {len(results['data']['results'])} matches")
```

### Bash

```bash
#!/bin/bash

API_KEY="${CRX_API_KEY:-your-api-key}"
BASE_URL="https://api.crxreview.com"

# Health check
health() {
  curl "$BASE_URL/health"
}

# Upload extension
upload() {
  local file="$1"
  curl -X POST "$BASE_URL/api/v1/extensions/upload" \
    -H "X-API-Key: $API_KEY" \
    -F "file=@$file"
}

# Download extension
download() {
  local id="$1"
  curl -X POST "$BASE_URL/api/v1/extensions/download" \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"input\": \"$id\"}"
}

# Search
search() {
  local session="$1"
  local query="$2"
  local regex="${3:-false}"
  curl -X POST "$BASE_URL/api/v1/extensions/$session/search" \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$query\", \"regex\": $regex}"
}

# Get files
get_files() {
  local session="$1"
  curl "$BASE_URL/api/v1/extensions/$session/files" \
    -H "X-API-Key: $API_KEY"
}

# Usage
SESSION=$(upload "extension.crx" | jq -r '.data.sessionId')
search "$SESSION" "chrome\\.tabs" true
get_files "$SESSION"
```

## Environment Setup

### Create .env file (never commit!)

```bash
# .env
CRX_API_KEY=your-api-key-here
CRX_BASE_URL=https://api.crxreview.com
```

### Load in shell

```bash
source .env
# Now use $CRX_API_KEY in commands
```

## Troubleshooting Quick Tips

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check X-API-Key header, verify key is correct |
| 404 Session Not Found | Session expired after 30 min, create new one |
| 429 Rate Limited | Wait until X-RateLimit-Reset time |
| 413 File Too Large | Use download endpoint instead of upload |
| Invalid regex | Use escaped backslashes: `\\` not `\` |
| No search results | Try literal string first (regex=false) |

## Links

- [Full API Documentation](README.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Architecture](ARCHITECTURE.md)
- [OpenAPI Spec](openapi/openapi.yaml)
- [GitHub Repository](https://github.com/brentlangston/crxreview)
