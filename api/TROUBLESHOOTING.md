# Troubleshooting Guide

Common issues and solutions for the CRX Review API.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Upload and Download Problems](#upload-and-download-problems)
3. [CRX Parsing Errors](#crx-parsing-errors)
4. [Rate Limiting](#rate-limiting)
5. [Session Management](#session-management)
6. [Search and File Operations](#search-and-file-operations)
7. [Deployment Issues](#deployment-issues)
8. [Performance Problems](#performance-problems)
9. [Storage Issues](#storage-issues)
10. [Debugging Techniques](#debugging-techniques)

## Authentication Issues

### Error: "Unauthorized" (401)

**Symptom:** All API requests return 401 Unauthorized.

**Cause:** Missing, invalid, or expired API key.

**Solutions:**

```bash
# Verify you're including the X-API-Key header
curl -X GET https://api.crxreview.com/api/v1/extensions/abc123 \
  -H "X-API-Key: your-api-key"

# Check that the API key is correct (no extra spaces or quotes)
# Ensure you're using the full key, not a truncated version

# If using Bearer token, check the format
curl -X GET https://api.crxreview.com/api/v1/extensions/abc123 \
  -H "Authorization: Bearer your-api-key"
```

**Debug steps:**

1. Verify the exact API key being used
2. Try a health check endpoint first (doesn't require auth):
   ```bash
   curl https://api.crxreview.com/health
   ```
3. Copy the API key fresh from your dashboard/config
4. Ensure no trailing whitespace in the key
5. Check if the key has been revoked or expired
6. For Bearer tokens, ensure the header uses "Bearer " prefix

**If still failing:**

- Contact support with your account details
- Request API key reset or regeneration
- Check if your account has API access enabled

### Error: "Invalid API Key"

**Symptom:** Clear API key error message or 401 after authentication attempt.

**Cause:** The provided key doesn't match any valid key in the system.

**Solutions:**

```bash
# Verify the exact key you're using
echo "Your key: $API_KEY"

# Test with explicit key
curl -H "X-API-Key: sk-prod-abc123xyz..." \
  https://api.crxreview.com/health
```

**Steps:**

1. Generate a new API key if you suspect it's been compromised
2. Use the key exactly as shown in the dashboard
3. Ensure no environment variable substitution issues
4. Check that you're using the correct environment's key (prod vs preview)

---

## Upload and Download Problems

### Error: "File too large" (413)

**Symptom:** Upload fails with message about file size limit.

**Cause:** CRX file exceeds the 50MB maximum.

**Solutions:**

```bash
# Check the file size
ls -lh my-extension.crx

# For large extensions, download from Chrome Web Store instead
curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"input": "extension-id-here"}'

# Contact support for custom limits if genuinely needed
```

**Note:** Most extensions are well under 50MB. This limit exists to prevent abuse. Downloading from Chrome Web Store is preferred for analysis.

### Error: "Failed to download from Chrome Web Store"

**Symptom:** Download endpoint returns error or timeout.

**Cause:** Chrome Web Store API issues, network problems, or invalid extension ID.

**Solutions:**

```bash
# Verify the extension ID is correct
# It should be a 32-character alphanumeric string
# Example: cjpalhdlnbpafiamejdnhcphjbkeiagm (uBlock Origin)

# Verify extension exists in Chrome Web Store
# Visit: https://chrome.google.com/webstore/detail/<extension-id>

# Try again - network issues may be temporary
curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"input": "cjpalhdlnbpafiamejdnhcphjbkeiagm"}'

# Check if the extension is still available (not removed from store)
# If removed, try uploading the CRX file directly instead
```

**Debug:**

1. Verify extension ID format (32 alphanumeric characters)
2. Check the extension is available in Chrome Web Store
3. Ensure the extension isn't restricted or removed
4. Try a different extension ID to rule out extension-specific issues
5. Check API status at https://status.cloudflare.com

### Error: "Failed to parse CRX" or "Invalid CRX header"

**Symptom:** Upload succeeds but parsing fails.

**Cause:** File is not a valid CRX format, or is corrupted.

**Solutions:**

```bash
# Verify the file is actually a CRX
# CRX files start with "Cr24" magic bytes
xxd -l 16 my-extension.crx | head -1
# Should show: 43 72 32 34 = "Cr24"

# Download from Chrome Web Store instead of manual CRX
curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"input": "extension-id"}'

# If you have the source, rebuild the CRX:
# 1. Load unpacked in Chrome
# 2. Right-click extension > Manage extensions > Details > Pack extension
# 3. Select the extension directory
# 4. Chrome generates a valid CRX file
```

**Valid CRX file format:**

- Starts with "Cr24" magic bytes (hex: 43 72 32 34)
- Followed by version number (4 bytes)
- Then public key, signature, and ZIP content
- Total size under 50MB

### Error: "No files found in CRX"

**Symptom:** Upload succeeds but extension appears empty.

**Cause:** CRX parsing succeeded but ZIP extraction found no files.

**Solutions:**

```bash
# Verify the CRX file isn't empty
file my-extension.crx
du -h my-extension.crx

# Try downloading a known working extension first
curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"input": "cjpalhdlnbpafiamejdnhcphjbkeiagm"}'

# If that works, your CRX file may be corrupted
# Rebuild it from source
```

---

## CRX Parsing Errors

### Error: "Unsupported CRX version"

**Symptom:** API indicates CRX version is not supported.

**Cause:** API only supports CRX2 and CRX3 formats. CRX1 (deprecated) is not supported.

**Solutions:**

```bash
# Check your CRX version by examining the header
# First 4 bytes after magic: 0x00 0x00 0x00 0x02 = CRX2, 0x00 0x00 0x00 0x03 = CRX3
xxd -l 8 my-extension.crx

# Rebuild the extension to create a valid CRX
# Download from Chrome Web Store (always gives valid format)
curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"input": "your-extension-id"}'
```

### Error: "ZIP parsing failed" or "Invalid manifest.json"

**Symptom:** CRX parsed but manifest extraction failed.

**Cause:** Corrupted or malformed manifest.json in the extension.

**Solutions:**

```bash
# Check if the session was created anyway
curl https://api.crxreview.com/api/v1/extensions/$SESSION_ID \
  -H "X-API-Key: your-api-key"

# Try retrieving just the file list
curl https://api.crxreview.com/api/v1/extensions/$SESSION_ID/files \
  -H "X-API-Key: your-api-key" | jq '.data.files | length'

# If files are accessible but manifest fails:
# - The manifest.json file may be present but invalid JSON
# - Try searching for the file to examine it
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "manifest\\.json", "regex": false}'
```

---

## Rate Limiting

### Error: "Rate limit exceeded" (429)

**Symptom:** Requests return 429 Too Many Requests.

**Cause:** Exceeded the rate limit for your API key or IP address.

**Solutions:**

```bash
# Check the rate limit headers in the response
curl -v https://api.crxreview.com/api/v1/extensions/abc123 \
  -H "X-API-Key: your-api-key" 2>&1 | grep "X-RateLimit"

# The response includes:
# X-RateLimit-Limit: Maximum requests in the window
# X-RateLimit-Remaining: Requests left before hitting limit
# X-RateLimit-Reset: Unix timestamp when limit resets

# Wait until X-RateLimit-Reset timestamp before retrying
sleep_seconds=$(($(date -d @$RESET_TIME +%s) - $(date +%s)))
echo "Wait $sleep_seconds seconds before retrying"

# Implement exponential backoff in your code:
# 1. First retry: wait 1 second
# 2. Second retry: wait 2 seconds
# 3. Third retry: wait 4 seconds
# etc.
```

**Rate limit values:**

| Endpoint | Limit | Window |
|----------|-------|--------|
| Upload | 5 | per hour per key |
| Download (Chrome Web Store) | 10 | per hour per IP |
| Search | 30 | per minute per key |
| General | 100 | per hour per key |
| File retrieval | 20 | per minute per key |

**Optimization strategies:**

```bash
# 1. Batch operations when possible
# Instead of multiple file requests, use /files endpoint

# 2. Cache results locally
# Store previously fetched sessions

# 3. Reuse sessions while valid (30-minute TTL)
SESSION_ID="keep-using-same-session-for-30min"

# 4. Use download instead of upload
# Chrome Web Store downloads count separately
# Downloads: 10/hour per IP (less restrictive)
# Uploads: 5/hour per key (more restrictive)

# 5. Stagger requests
# Don't send all requests at once
# Spread requests over time
```

### Rate Limit Headers in 429 Response

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

**retryAfter** indicates seconds to wait before retrying.

---

## Session Management

### Error: "Session not found" (404)

**Symptom:** Getting 404 when accessing a session ID.

**Cause:** Session expired, invalid ID, or already deleted.

**Solutions:**

```bash
# Sessions expire after SESSION_TTL (default 30 minutes)
# Solution: Create a new session

# Upload a new CRX
SESSION_ID=$(curl -X POST https://api.crxreview.com/api/v1/extensions/upload \
  -H "X-API-Key: your-api-key" \
  -F "file=@extension.crx" | jq -r '.data.sessionId')

# Or download from Chrome Web Store
SESSION_ID=$(curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"input": "extension-id"}' | jq -r '.data.sessionId')

# Verify the session exists
curl https://api.crxreview.com/api/v1/extensions/$SESSION_ID \
  -H "X-API-Key: your-api-key"
```

**Tips for session management:**

```bash
# Keep session ID in a variable during analysis
SESSION_ID="abc123..."

# Check session metadata
curl https://api.crxreview.com/api/v1/extensions/$SESSION_ID \
  -H "X-API-Key: your-api-key" | jq '.data'

# Explicitly delete when done (cleanup)
curl -X DELETE https://api.crxreview.com/api/v1/extensions/$SESSION_ID \
  -H "X-API-Key: your-api-key"
```

### Session expires mid-analysis

**Symptom:** Can't access session after 30 minutes of analysis.

**Cause:** 30-minute session TTL (configurable) expires.

**Solutions:**

```bash
# Work faster - do all analysis within 30 minutes
# Or use a more efficient workflow

# Download all files first
curl https://api.crxreview.com/api/v1/extensions/$SESSION_ID/files \
  -H "X-API-Key: your-api-key" > all-files.json

# Then analyze the cached files locally without making API calls

# If you need longer sessions, contact support
# TTL is configurable per deployment
```

---

## Search and File Operations

### Error: "Invalid regex pattern"

**Symptom:** Search endpoint returns error about regex.

**Cause:** The regex pattern syntax is invalid.

**Solutions:**

```bash
# Escape special characters properly
# Wrong: "query": "chrome.tabs"
# Right: "query": "chrome\\.tabs"

curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "chrome\\.tabs",
    "regex": true
  }'

# Test regex online before using
# Resources:
# - https://regex101.com
# - https://regexr.com

# Common patterns:
# Match API calls: "chrome\\.(tabs|webRequest|storage)"
# Match permissions: "permissions"
# Match specific function: "eval\\("
```

**Regex syntax tips:**

```
. = any character (use \. for literal dot)
* = zero or more
+ = one or more
? = zero or one
[] = character class
() = grouping
| = or
^ = start of line
$ = end of line
\ = escape special chars
```

### Error: "File not found" when retrieving a specific file

**Symptom:** Getting 404 when requesting a file that exists.

**Cause:** Incorrect file path format.

**Solutions:**

```bash
# First, list all files to get the correct path
curl https://api.crxreview.com/api/v1/extensions/$SESSION_ID/files \
  -H "X-API-Key: your-api-key" | jq '.data.files[] | .path'

# Use the exact path returned
CORRECT_PATH="src/lib/parser.js"

curl "https://api.crxreview.com/api/v1/extensions/$SESSION_ID/file?path=$CORRECT_PATH" \
  -H "X-API-Key: your-api-key"

# URL-encode the path if it contains special characters
curl "https://api.crxreview.com/api/v1/extensions/$SESSION_ID/file?path=src%2Flib%2Fparser.js" \
  -H "X-API-Key: your-api-key"
```

### Search returns no results

**Symptom:** Search query runs but returns empty results.

**Cause:** Pattern doesn't match any content, or regex is wrong.

**Solutions:**

```bash
# Try a simple literal string first
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "function",
    "regex": false
  }'

# If that works, try with regex
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "function\\s+\\w+",
    "regex": true
  }'

# Adjust context lines to see more of the matches
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "your-pattern",
    "regex": false,
    "contextLines": 5
  }'
```

---

## Deployment Issues

### Error: "Failed to deploy" from Wrangler

**Symptom:** Deployment fails during `npm run deploy`.

**Cause:** Various - usually compilation, auth, or config issues.

**Solutions:**

```bash
# 1. Check TypeScript compilation
npm run type-check
# Fix any type errors

# 2. Check linting
npm run lint -- --fix
# Fix any code style issues

# 3. Verify Wrangler authentication
wrangler whoami
# If fails, authenticate again
wrangler auth

# 4. Check Cloudflare resources exist
wrangler kv:namespace list
wrangler r2 bucket list

# 5. Verify wrangler.toml is valid
wrangler publish --dry-run

# 6. Try building first
npm run build

# 7. Then deploy
wrangler deploy
```

### Error: "Namespace not found"

**Symptom:** Deployment fails saying namespace doesn't exist.

**Cause:** wrangler.toml references non-existent namespace IDs.

**Solutions:**

```bash
# List existing namespaces
wrangler kv:namespace list

# Update wrangler.toml with correct IDs
# Find the ID for SESSIONS and CACHE

# Or create new namespaces
wrangler kv:namespace create "SESSIONS"
wrangler kv:namespace create "CACHE"

# Update wrangler.toml with output IDs
```

### Error: "Auth token expired"

**Symptom:** Deployment or Wrangler commands fail with auth error.

**Cause:** Cloudflare authentication expired.

**Solutions:**

```bash
# Re-authenticate
wrangler logout
wrangler auth

# Alternatively, use API token if set
# Set CLOUDFLARE_API_TOKEN environment variable instead

export CLOUDFLARE_API_TOKEN="your-token-from-dashboard"
wrangler deploy
```

### Worker not responding after deployment

**Symptom:** API endpoint returns 502 Bad Gateway or times out.

**Cause:** Worker crashed or has a runtime error.

**Solutions:**

```bash
# Check worker logs
wrangler tail

# Look for errors in the logs

# Verify the worker is deployed
wrangler list

# Check if it's disabled
wrangler deployments list

# Redeploy
wrangler deploy

# If that fails, check logs more carefully
wrangler tail --status 500
```

---

## Performance Problems

### Slow upload or download

**Symptom:** File upload/download takes longer than expected.

**Cause:** Network issues, large file, or R2 performance.

**Solutions:**

```bash
# For uploads, check file size
ls -lh file.crx

# Use timeout parameter
curl --max-time 300 \
  -X POST https://api.crxreview.com/api/v1/extensions/upload \
  -H "X-API-Key: your-api-key" \
  -F "file=@large-extension.crx"

# For Chrome Web Store downloads, be patient
# First download for an extension is slower (downloading, parsing, storing)
# Subsequent requests may use cache

# Check your network speed
# Use Cloudflare Analytics for performance metrics
```

### Search queries slow on large extensions

**Symptom:** Search requests take very long or timeout.

**Cause:** Large number of files, complex regex, or Cloudflare Workers CPU limit.

**Solutions:**

```bash
# Use simpler patterns (literal string instead of complex regex)
# Slower: "query": "[a-zA-Z]+\\s*=\\s*['\\\"][^'\\\"]*['\\\"]"
# Faster: "query": "chrome.storage"

# Search specific file types instead of all files
# Use files/filter first to narrow down
curl -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/files/filter \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"pattern": "\\.js$"}'

# Then search only in results

# Break large searches into smaller ones
# Search for multiple patterns separately and combine results

# Contact support if searches consistently timeout
# Cloudflare Workers have 50ms CPU time limit
```

### High latency from specific regions

**Symptom:** Requests are slow from certain geographic locations.

**Cause:** Network routing, regional issues, or rate limiting.

**Solutions:**

```bash
# Cloudflare Workers are deployed globally
# Latency should be low from anywhere

# If experiencing high latency:
# 1. Check your internet connection
# 2. Try from a different network
# 3. Try at different times
# 4. Use curl -w to see timing breakdown
curl -w '@curl-format.txt' \
  https://api.crxreview.com/health

# Check Cloudflare status
# https://status.cloudflare.com

# Contact support with timing data if regional issues persist
```

---

## Storage Issues

### Error: "Storage quota exceeded"

**Symptom:** Uploads fail with storage error.

**Cause:** R2 bucket is full or quota exceeded.

**Solutions:**

```bash
# Check R2 bucket size
wrangler r2 bucket info crxreview-storage

# List recent uploads
wrangler r2 object list crxreview-storage --limit 50

# Delete old uploads if not needed
wrangler r2 object delete crxreview-storage/old-session-id/* --recursive

# Enable lifecycle rules to auto-delete old files
# Via Cloudflare Dashboard:
# 1. R2 > crxreview-storage > Settings
# 2. Lifecycle rules > Add rule
# 3. Delete after 30 days
```

### KV storage errors

**Symptom:** Session/cache operations fail with storage error.

**Cause:** KV quota exceeded or namespace issues.

**Solutions:**

```bash
# KV is usually very large, but can be limited by plan
# Check Cloudflare plan limits

# Clear old sessions manually if needed
wrangler kv:key list --namespace-id <SESSIONS_ID> --limit 100

# See if many expired sessions exist
# If so, ensure cleanup job is running

# Check cleanup logs
wrangler tail --search "cleanup"
```

---

## Debugging Techniques

### Enable verbose logging

```bash
# Set log level environment variable
export LOG_LEVEL=debug

# Deploy or run dev server
npm run dev

# Watch logs
wrangler tail
```

### Check HTTP headers

```bash
# View all response headers
curl -i https://api.crxreview.com/api/v1/extensions/abc123 \
  -H "X-API-Key: your-api-key"

# View verbose request/response
curl -v https://api.crxreview.com/api/v1/extensions/abc123 \
  -H "X-API-Key: your-api-key"

# Save request details to file
curl -v https://api.crxreview.com/api/v1/extensions/abc123 \
  -H "X-API-Key: your-api-key" \
  2>&1 | tee request.log
```

### Test with cURL step-by-step

```bash
# 1. Test health endpoint (no auth needed)
curl -i https://api.crxreview.com/health

# 2. Test with valid API key
curl -i https://api.crxreview.com/api/v1/extensions/abc123 \
  -H "X-API-Key: your-key"

# 3. Test upload
curl -i -X POST https://api.crxreview.com/api/v1/extensions/upload \
  -H "X-API-Key: your-key" \
  -F "file=@test.crx"

# 4. Test search with valid session
curl -i -X POST https://api.crxreview.com/api/v1/extensions/$SESSION_ID/search \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

### Check Cloudflare dashboard

1. Workers > Your Worker > Logs
2. Analytics > Requests to see traffic patterns
3. Workers > Settings > View logs

### Local testing

```bash
# Run local development server
npm run dev

# This emulates Cloudflare Workers and R2
# http://localhost:8787

curl -X POST http://localhost:8787/api/v1/extensions/upload \
  -H "X-API-Key: dev-key" \
  -F "file=@extension.crx"
```

### Inspect network requests

Use your browser's Developer Tools:

1. Open https://api.crxreview.com
2. DevTools > Network tab
3. Make API request
4. View request/response details, headers, timing

### Check logs for specific errors

```bash
# Search logs for errors
wrangler tail --search "ERROR"

# Search for specific session
wrangler tail --search "SESSION_ID"

# Search for specific endpoint
wrangler tail --search "POST /api/v1/extensions/upload"

# Filter by status code
wrangler tail --status 500
```

---

## Getting Help

If you can't solve the issue:

1. **Check the documentation:**
   - [README.md](README.md) - API overview and quick start
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
   - [openapi/openapi.yaml](openapi/openapi.yaml) - Full API spec

2. **Search existing issues:**
   - GitHub Issues
   - Stack Overflow (tag: cloudflare-workers)

3. **Gather diagnostic information:**
   - Error message (full text)
   - cURL command that reproduces the issue
   - API response (headers and body)
   - Logs from wrangler tail
   - Your environment details (OS, Node version, etc.)

4. **Create an issue with:**
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - All diagnostic information above

5. **Contact support:**
   - Cloudflare Support (for infrastructure issues)
   - Project GitHub Issues (for API issues)

---

## Common Patterns and Best Practices

### Proper error handling

```bash
# Always check response status
response=$(curl -s -w "\n%{http_code}" https://api.crxreview.com/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" != "200" ]; then
  echo "Error: $http_code"
  echo "$body" | jq '.error'
  exit 1
fi
```

### Retry logic

```bash
# Implement exponential backoff
retry() {
  local n=1
  local max=5
  local delay=1
  while true; do
    "$@" && break || {
      if [[ $n -lt $max ]]; then
        ((n++))
        sleep $delay
        delay=$((delay * 2))
      else
        return 1
      fi
    }
  done
}

# Usage
retry curl -X POST https://api.crxreview.com/api/v1/extensions/download \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"input": "extension-id"}'
```

### Secure API key handling

```bash
# Never hardcode keys
# Use environment variables
export CRX_API_KEY="your-key"

# Access safely
curl https://api.crxreview.com/api/v1/extensions/abc \
  -H "X-API-Key: $CRX_API_KEY"

# Or use a .env file (never commit!)
# .env (add to .gitignore):
# CRX_API_KEY=your-key
```
