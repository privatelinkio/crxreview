# CRX Review API - Request/Response Examples

Complete examples for all API endpoints with real data.

## Table of Contents

1. [Extension Management](#extension-management)
2. [Content Access](#content-access)
3. [Analysis](#analysis)
4. [System](#system)
5. [Error Responses](#error-responses)

---

## Extension Management

### POST /extensions/upload

**Request:**
```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/upload \
  -H "X-API-Key: your-api-key" \
  -F "file=@ublock-origin.crx"
```

**Response (201 Created):**
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

**Response (400 Bad Request - Invalid Format):**
```json
{
  "success": false,
  "error": "Invalid CRX file format (missing Cr24 magic bytes)",
  "message": "BAD_REQUEST",
  "details": {
    "expected": "Cr24",
    "hint": "File must be valid CRX format"
  },
  "timestamp": "2025-01-28T15:00:05.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440001",
  "path": "/api/v1/extensions/upload",
  "statusCode": 400
}
```

**Response (413 Payload Too Large):**
```json
{
  "success": false,
  "error": "File size exceeds maximum allowed (52428800 bytes)",
  "message": "BAD_REQUEST",
  "details": {
    "maxSize": 52428800,
    "actualSize": 104857600,
    "hint": "File must be 50 MB or smaller"
  },
  "timestamp": "2025-01-28T15:00:05.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440001",
  "path": "/api/v1/extensions/upload",
  "statusCode": 413
}
```

---

### POST /extensions/download

**Request (By Extension ID):**
```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "cjpalhdlnbpafiamejdnhcphjbkeiagm"
  }'
```

**Request (By Chrome Web Store URL):**
```bash
curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "sessionId": "660f9511-f3ab-52e5-b827-557766551111",
    "extensionId": "cjpalhdlnbpafiamejdnhcphjbkeiagm",
    "fileName": "ublock-origin-1.52.0.crx",
    "fileCount": 247,
    "size": 2457600,
    "createdAt": "2025-01-28T15:05:00.000Z",
    "expiresAt": "2025-01-28T15:35:00.000Z",
    "version": "1.52.0"
  },
  "meta": {
    "timestamp": "2025-01-28T15:05:00.000Z",
    "requestId": "660f9511-f3ab-52e5-b827-557766551111",
    "version": "1.0.0",
    "path": "/api/v1/extensions/download"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Extension not found on Chrome Web Store",
  "message": "NOT_FOUND",
  "details": {
    "input": "invalid-extension-id",
    "hint": "Check extension ID and try again"
  },
  "timestamp": "2025-01-28T15:05:05.000Z",
  "requestId": "660f9511-f3ab-52e5-b827-557766551112",
  "path": "/api/v1/extensions/download",
  "statusCode": 404
}
```

---

### GET /extensions/{sessionId}

**Request:**
```bash
curl https://api.crxreview.com/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: your-api-key"
```

**Response (200 OK):**
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
    "timestamp": "2025-01-28T15:10:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440002",
    "version": "1.0.0",
    "path": "/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Response (404 Not Found - Expired):**
```json
{
  "success": false,
  "error": "Session not found or expired",
  "message": "NOT_FOUND",
  "details": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "hint": "Session expires 30 minutes after creation"
  },
  "timestamp": "2025-01-28T15:35:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440003",
  "path": "/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000",
  "statusCode": 404
}
```

---

### DELETE /extensions/{sessionId}

**Request:**
```bash
curl -X DELETE https://api.crxreview.com/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: your-api-key"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Session deleted successfully"
  },
  "meta": {
    "timestamp": "2025-01-28T15:15:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440004",
    "version": "1.0.0",
    "path": "/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## Content Access

### GET /extensions/{sessionId}/manifest

**Request:**
```bash
curl https://api.crxreview.com/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/manifest \
  -H "X-API-Key: your-api-key"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "manifest": {
      "name": "uBlock Origin",
      "description": "An efficient blocker: easy on CPU and memory",
      "version": "1.52.0",
      "minimum_chrome_version": "102",
      "manifest_version": 3,
      "default_locale": "en",
      "author": "Raymond Hill",
      "permissions": [
        "storage",
        "webRequest",
        "contentSettings",
        "tabs"
      ],
      "host_permissions": [
        "<all_urls>"
      ],
      "background": {
        "service_worker": "js/background.js",
        "type": "module"
      },
      "action": {
        "default_popup": "popup.html",
        "default_title": "uBlock Origin",
        "default_icon": {
          "16": "img/icon-16.png",
          "32": "img/icon-32.png",
          "64": "img/icon-64.png",
          "128": "img/icon-128.png"
        }
      },
      "content_scripts": [
        {
          "matches": ["<all_urls>"],
          "js": ["js/content.js"],
          "run_at": "document_start",
          "all_frames": true
        }
      ],
      "icons": {
        "16": "img/icon-16.png",
        "32": "img/icon-32.png",
        "64": "img/icon-64.png",
        "128": "img/icon-128.png"
      }
    },
    "manifestVersion": 3,
    "permissions": [
      "storage",
      "webRequest",
      "contentSettings",
      "tabs"
    ],
    "hostPermissions": [
      "<all_urls>"
    ]
  },
  "meta": {
    "timestamp": "2025-01-28T15:20:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440005",
    "version": "1.0.0",
    "path": "/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/manifest"
  }
}
```

---

### GET /extensions/{sessionId}/files

**Request (Tree Format):**
```bash
curl "https://api.crxreview.com/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/files?type=tree" \
  -H "X-API-Key: your-api-key"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "type": "tree",
    "root": {
      "name": "extension-root",
      "path": "",
      "type": "directory",
      "children": [
        {
          "name": "manifest.json",
          "path": "manifest.json",
          "type": "file",
          "size": 1248,
          "category": "config"
        },
        {
          "name": "src",
          "path": "src",
          "type": "directory",
          "children": [
            {
              "name": "content.js",
              "path": "src/content.js",
              "type": "file",
              "size": 4096,
              "category": "code"
            },
            {
              "name": "background.js",
              "path": "src/background.js",
              "type": "file",
              "size": 8192,
              "category": "code"
            }
          ]
        },
        {
          "name": "css",
          "path": "css",
          "type": "directory",
          "children": [
            {
              "name": "style.css",
              "path": "css/style.css",
              "type": "file",
              "size": 2048,
              "category": "code"
            }
          ]
        },
        {
          "name": "img",
          "path": "img",
          "type": "directory",
          "children": [
            {
              "name": "icon-16.png",
              "path": "img/icon-16.png",
              "type": "file",
              "size": 512,
              "category": "resource"
            }
          ]
        }
      ]
    },
    "totalFiles": 247,
    "totalSize": 2457600
  },
  "meta": {
    "timestamp": "2025-01-28T15:20:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440006",
    "version": "1.0.0",
    "path": "/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/files"
  }
}
```

---

### GET /extensions/{sessionId}/files/{path}

**Request (JSON File):**
```bash
curl "https://api.crxreview.com/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/files/manifest.json" \
  -H "X-API-Key: your-api-key"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "path": "manifest.json",
    "content": "{\"name\":\"uBlock Origin\",\"version\":\"1.52.0\",\"manifest_version\":3}",
    "mimeType": "application/json",
    "size": 1248,
    "encoding": "utf-8"
  },
  "meta": {
    "timestamp": "2025-01-28T15:20:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440007",
    "version": "1.0.0",
    "path": "/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/files/manifest.json"
  }
}
```

**Request (Image File):**
```bash
curl "https://api.crxreview.com/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/files/img/icon-16.png?encoding=base64" \
  -H "X-API-Key: your-api-key"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "path": "img/icon-16.png",
    "content": "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAEDgAABA4BPgpQpwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEUSURBVBiVY/wPBAww0KGGPAzQIAazYWCBBozM/+EZWPz5mZmZ+Rn+//+PgQmIGRiYGf7/////PzP+////f+a/v78M/xn+M/wfQCZ//mZmZv7PxPAf6OD//w0MDIz///9nYPj//z8jw//BwcHw7du3/wz//zP8B/oPUMzIzMDAysb2n4XhP8MAIDAz/GcErgcGBiZGhn//QOKMv/8DEJiZ/zP8f/+eAajhPzPwwdPf//9hZmbm/79/fxgamJkZGPoDYwcbE+N/Rub/DAwM/xn+//8P8oEqZvjPwMz0nxkwKLABESMjI8P///8B+aVYSkqKgYGRkYH+vz8Mf/+BxP79+8fAwMAA8v8fGBj+MzAwMLAyM/znZGAHqGZkZGZgYGRgYGABupiJgYGBgYkBLxoAAGVEHNGM+kG6AAAAAElFTkSuQmCC",
    "mimeType": "image/png",
    "size": 512,
    "encoding": "base64"
  },
  "meta": {
    "timestamp": "2025-01-28T15:20:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440008",
    "version": "1.0.0",
    "path": "/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/files/img/icon-16.png"
  }
}
```

---

### GET /extensions/{sessionId}/download/zip

**Request:**
```bash
curl "https://api.crxreview.com/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/download/zip" \
  -H "X-API-Key: your-api-key" \
  -o extension.zip
```

**Response Headers (200 OK):**
```
HTTP/1.1 200 OK
Content-Type: application/zip
Content-Disposition: attachment; filename="cjpalhdlnbpafiamejdnhcphjbkeiagm.zip"
Content-Length: 2457600
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1611874800
```

---

## Analysis

### POST /extensions/{sessionId}/search

**Request (Simple Text Search):**
```bash
curl -X POST "https://api.crxreview.com/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/search" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "chrome.storage",
    "caseSensitive": false,
    "useRegex": false,
    "contextLines": 2,
    "maxResults": 100
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "file": "src/content.js",
        "line": 42,
        "column": 15,
        "match": "chrome.storage",
        "context": {
          "before": [
            "function onReady() {",
            "  // Get settings from storage"
          ],
          "after": [
            "    .get(['settings'], (result) => {",
            "      console.log('Settings:', result);"
          ]
        }
      },
      {
        "file": "src/background.js",
        "line": 127,
        "column": 8,
        "match": "chrome.storage",
        "context": {
          "before": [
            "// Save state to persistent storage",
            "const saveState = () => {"
          ],
          "after": [
            "    .set({ state }, () => {",
            "      console.log('State saved');"
          ]
        }
      },
      {
        "file": "src/options.js",
        "line": 89,
        "column": 20,
        "match": "chrome.storage",
        "context": {
          "before": [
            "document.getElementById('save-btn').onclick = () => {",
            "  const options = {"
          ],
          "after": [
            "    .sync.set(options, () => {",
            "      showNotification('Options saved');"
          ]
        }
      }
    ],
    "totalMatches": 156,
    "searchedFiles": 89,
    "hasMore": true,
    "nextOffset": 100
  },
  "meta": {
    "timestamp": "2025-01-28T15:25:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440009",
    "version": "1.0.0",
    "path": "/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/search"
  }
}
```

**Request (Regex Pattern Search):**
```bash
curl -X POST "https://api.crxreview.com/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/search" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "console\\.log\\(['\''\\\"](.*)['\''\\\"](.*)',
    "useRegex": true,
    "filePattern": "*.js",
    "contextLines": 1
  }'
```

---

### POST /extensions/{sessionId}/filter

**Request (Filter by Name Pattern):**
```bash
curl -X POST "https://api.crxreview.com/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/filter" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "namePattern": "*.js"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "name": "content.js",
        "path": "src/content.js",
        "type": "file",
        "size": 4096,
        "category": "code"
      },
      {
        "name": "background.js",
        "path": "src/background.js",
        "type": "file",
        "size": 8192,
        "category": "code"
      },
      {
        "name": "options.js",
        "path": "src/options.js",
        "type": "file",
        "size": 6144,
        "category": "code"
      }
    ],
    "totalMatched": 47
  },
  "meta": {
    "timestamp": "2025-01-28T15:25:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440010",
    "version": "1.0.0",
    "path": "/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/filter"
  }
}
```

**Request (Filter by Category):**
```bash
curl -X POST "https://api.crxreview.com/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/filter" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["code", "config"]
  }'
```

---

## System

### GET /health

**Request:**
```bash
curl https://api.crxreview.com/api/v1/health
```

**Response (200 OK - Healthy):**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2025-01-28T15:30:00.000Z",
  "version": "1.0.0",
  "services": {
    "r2": "ok",
    "kv": "ok"
  }
}
```

**Response (200 OK - Degraded):**
```json
{
  "success": true,
  "status": "degraded",
  "timestamp": "2025-01-28T15:30:00.000Z",
  "version": "1.0.0",
  "services": {
    "r2": "ok",
    "kv": "error"
  }
}
```

---

## Error Responses

### 400 Bad Request

**Missing Required Field:**
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "VALIDATION_ERROR",
  "details": {
    "errors": {
      "query": ["Query is required"]
    }
  },
  "timestamp": "2025-01-28T15:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440011",
  "path": "/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/search",
  "statusCode": 400
}
```

### 401 Unauthorized

**Missing API Key:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "UNAUTHORIZED",
  "details": {
    "hint": "Provide X-API-Key header"
  },
  "timestamp": "2025-01-28T15:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440012",
  "path": "/api/v1/extensions/upload",
  "statusCode": 401
}
```

### 429 Too Many Requests

**Rate Limit Exceeded:**
```bash
HTTP/1.1 429 Too Many Requests
Retry-After: 3600
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1611878400
```

```json
{
  "success": false,
  "error": "Too many requests. Please try again later.",
  "message": "RATE_LIMITED",
  "details": {
    "retryAfter": 3600,
    "hint": "You have exceeded the rate limit for search requests"
  },
  "timestamp": "2025-01-28T15:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440013",
  "path": "/api/v1/extensions/550e8400-e29b-41d4-a716-446655440000/search",
  "statusCode": 429
}
```

### 502 Bad Gateway

**Download Failure:**
```json
{
  "success": false,
  "error": "Failed to download extension from Chrome Web Store",
  "message": "INTERNAL_ERROR",
  "details": {
    "reason": "Network timeout after 30 seconds",
    "hint": "Chrome Web Store may be temporarily unavailable"
  },
  "timestamp": "2025-01-28T15:30:00.000Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440014",
  "path": "/api/v1/extensions/download",
  "statusCode": 502
}
```

---

## Workflow Examples

### Complete Upload and Analysis Workflow

```bash
# 1. Upload extension
RESPONSE=$(curl -s -X POST https://api.crxreview.com/api/v1/extensions/upload \
  -H "X-API-Key: your-api-key" \
  -F "file=@extension.crx")

SESSION=$(echo $RESPONSE | jq -r '.data.sessionId')
echo "Session: $SESSION"

# 2. Get manifest
curl -s https://api.crxreview.com/api/v1/extensions/$SESSION/manifest \
  -H "X-API-Key: your-api-key" | jq '.data.permissions'

# 3. Search for API calls
curl -s -X POST https://api.crxreview.com/api/v1/extensions/$SESSION/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "chrome\\.", "useRegex": true}' | jq '.data.totalMatches'

# 4. Get file tree
curl -s https://api.crxreview.com/api/v1/extensions/$SESSION/files \
  -H "X-API-Key: your-api-key" | jq '.data.totalFiles'

# 5. Filter JavaScript files
curl -s -X POST https://api.crxreview.com/api/v1/extensions/$SESSION/filter \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"namePattern": "*.js"}' | jq '.data.totalMatched'

# 6. Download as ZIP
curl -s https://api.crxreview.com/api/v1/extensions/$SESSION/download/zip \
  -H "X-API-Key: your-api-key" \
  -o extension.zip

# 7. Clean up
curl -s -X DELETE https://api.crxreview.com/api/v1/extensions/$SESSION \
  -H "X-API-Key: your-api-key" | jq '.data.message'
```
