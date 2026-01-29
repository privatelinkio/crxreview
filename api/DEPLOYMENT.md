# Deployment Guide

Complete guide for deploying the CRX Review API to Cloudflare Workers with production-ready configuration and monitoring.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Cloudflare Resources](#cloudflare-resources)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Post-Deployment](#post-deployment)
7. [Environment Management](#environment-management)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Troubleshooting](#troubleshooting)
10. [Rollback Procedures](#rollback-procedures)

## Prerequisites

Before deploying, ensure you have:

- **Node.js** 18 or later
- **npm** 9 or later
- **Cloudflare Account** with Workers enabled
- **Wrangler CLI** version 3.22+: `npm install -g wrangler`
- **Cloudflare API Token** for automation
- **Git** for version control

### Verify Prerequisites

```bash
# Check Node.js version
node --version  # Should be v18.0.0 or higher

# Check npm version
npm --version  # Should be 9.0.0 or higher

# Install/update Wrangler globally
npm install -g wrangler

# Verify Wrangler installation
wrangler --version  # Should be 3.22.0 or higher
```

## Initial Setup

### 1. Authenticate with Cloudflare

Start the authentication flow with Wrangler:

```bash
wrangler auth
```

This command opens a browser window where you can:
1. Log in to your Cloudflare account (or create one)
2. Grant the CRX Review API application permission to access your account
3. Copy the API token provided
4. Return to the terminal where Wrangler will confirm authentication

Your credentials are stored locally and will be used for all subsequent Wrangler commands.

### 2. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/brentlangston/crxreview.git
cd crxreview/api

# Install Node dependencies
npm install
```

## Cloudflare Resources

The API requires several Cloudflare resources to function properly.

### Create KV Namespaces

KV (Key-Value) storage handles session management and caching:

```bash
# Create production SESSIONS namespace
SESSIONS_ID=$(wrangler kv:namespace create "SESSIONS" | grep -oP '"id":\s*"\K[^"]+')
echo "SESSIONS Production ID: $SESSIONS_ID"

# Create production CACHE namespace
CACHE_ID=$(wrangler kv:namespace create "CACHE" | grep -oP '"id":\s*"\K[^"]+')
echo "CACHE Production ID: $CACHE_ID"

# Create preview namespaces (optional but recommended)
wrangler kv:namespace create "SESSIONS" --preview
wrangler kv:namespace create "CACHE" --preview
```

Update your `wrangler.toml` with these namespace IDs:

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "your-sessions-production-id"
preview_id = "your-sessions-preview-id"

[[kv_namespaces]]
binding = "CACHE"
id = "your-cache-production-id"
preview_id = "your-cache-preview-id"
```

**What these do:**
- **SESSIONS**: Stores active extension analysis sessions with 30-minute TTL
- **CACHE**: Caches Chrome Web Store manifest data to reduce API calls

### Create R2 Buckets

R2 object storage holds uploaded CRX files and extracted contents:

```bash
# Create production bucket
wrangler r2 bucket create crxreview-storage

# Create preview bucket for testing
wrangler r2 bucket create crxreview-storage-preview
```

The `wrangler.toml` already references these bucket names. Verify the bindings:

```toml
[[r2_buckets]]
binding = "CRX_STORAGE"
bucket_name = "crxreview-storage"
preview_bucket_name = "crxreview-storage-preview"
```

**Bucket configuration:**
- **Public access**: Keep private (no public access needed)
- **CORS**: Not required for Workers-to-Workers communication
- **Versioning**: Optional but recommended for safety
- **Lifecycle rules**: Consider adding to clean up old uploads after 30 days

To enable lifecycle rules via Cloudflare Dashboard:
1. Go to R2 > crxreview-storage
2. Settings > Lifecycle rules
3. Add: Delete objects after 30 days to prevent storage buildup

## Configuration

### Environment Variables

Configure variables in `wrangler.toml` for different deployment stages:

```toml
# Production environment
[env.production]
vars = {
  SESSION_TTL = "1800",           # 30 minutes in seconds
  MAX_FILE_SIZE = "52428800",     # 50MB in bytes
  RATE_LIMIT_DOWNLOAD = "10",     # Downloads per hour per IP
  RATE_LIMIT_UPLOAD = "5",        # Uploads per hour per API key
  RATE_LIMIT_SEARCH = "30",       # Searches per minute per API key
  API_VERSION = "1.0.0",
  ENVIRONMENT = "production",
  LOG_LEVEL = "info"
}

# Staging environment
[env.staging]
vars = {
  SESSION_TTL = "1800",
  MAX_FILE_SIZE = "52428800",
  RATE_LIMIT_DOWNLOAD = "20",     # More lenient for testing
  API_VERSION = "1.0.0-staging",
  ENVIRONMENT = "staging",
  LOG_LEVEL = "debug"
}

# Preview/development
[env.preview]
vars = {
  SESSION_TTL = "600",            # 10 minutes for faster testing
  MAX_FILE_SIZE = "52428800",
  RATE_LIMIT_DOWNLOAD = "999",    # Unlimited for dev
  API_VERSION = "1.0.0-preview",
  ENVIRONMENT = "development",
  LOG_LEVEL = "debug"
}
```

### API Keys

Set API keys as Cloudflare secrets (never commit to git):

```bash
# For production
wrangler secret put API_KEY_1 --env production
wrangler secret put API_KEY_2 --env production
# ... add more keys as needed

# For preview/development
wrangler secret put API_KEY_1 --env preview
```

You'll be prompted to enter each key securely. For testing, use simple keys like `dev-key-1`, `dev-key-2`. In production, use strong randomly generated keys.

To generate secure API keys:

```bash
# Using OpenSSL
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Route Configuration

Update the route pattern to match your domain:

```toml
[[routes]]
pattern = "api.yourdomain.com/*"
zone_name = "yourdomain.com"
```

Or use the wildcard approach for all subdomains:

```toml
[[routes]]
pattern = "*.yourdomain.com/*"
zone_name = "yourdomain.com"
```

For development without a custom domain, Wrangler's default route handles incoming requests.

## Deployment

### Build the Project

Before deploying, compile TypeScript and run checks:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```

### Deploy to Production

```bash
# Deploy to production
wrangler deploy --env production

# Output should show:
# Uploaded crxreview-api (X.XX KiB)
# Deployment ID: xxxxx
```

### Deploy to Staging/Preview

```bash
# Deploy to preview environment for testing
wrangler deploy --env preview

# Test endpoints
curl https://your-worker-domain/health
```

### Verify Deployment

After deployment, verify the API is working:

```bash
# Health check (no auth required)
curl https://api.yourdomain.com/health

# Should return:
# {
#   "success": true,
#   "data": {
#     "status": "healthy",
#     "version": "1.0.0",
#     "timestamp": "2024-01-28T10:00:00Z"
#   }
# }
```

Test with a real request:

```bash
curl -X POST https://api.yourdomain.com/api/v1/extensions/download \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"input": "cjpalhdlnbpafiamejdnhcphjbkeiagm"}'
```

## Post-Deployment

### Domain Configuration

If using a custom domain, configure DNS in Cloudflare:

1. Go to Cloudflare Dashboard
2. Navigate to your domain > DNS
3. Add CNAME record:
   - Name: `api`
   - Target: Your Cloudflare Worker URL
   - Proxy status: Proxied

Wait for DNS propagation (usually 5-30 minutes).

### Custom Domain Setup via Wrangler

Alternatively, use Wrangler to configure routes:

```bash
wrangler publish --route "api.yourdomain.com/*"
```

### SSL/TLS Configuration

Cloudflare automatically provides SSL/TLS certificates. Configure in Dashboard:

1. Go to SSL/TLS > Overview
2. Select "Flexible" (minimum) or "Full" (recommended)
3. For production, use "Full (strict)" if your origin supports it

### Caching Configuration

Configure Caching Rules in the Cloudflare Dashboard:

1. Caching > Cache Rules
2. Create rules for static assets:
   - `/openapi/*` - Cache for 1 day
   - `/health` - No cache (or very short)
   - `/api/v1/*` - No cache (responses are dynamic)

Example cache rule:

```
Path matches /openapi/*
```

Then set cache to "Cache everything" with 86400 seconds TTL.

## Environment Management

### Multiple Deployment Environments

The configuration supports three environments:

```bash
# Deploy to production
npm run deploy

# Deploy to preview/staging
wrangler deploy --env preview

# Deploy to specific environment
wrangler deploy --env staging
```

### Blue-Green Deployments

For zero-downtime updates:

1. Deploy new version to preview environment
2. Run full test suite against preview
3. Update routes to point to preview (becomes production)
4. Keep old version running as backup

```bash
# Test preview before promoting
wrangler tail --env preview  # Watch logs

# Once satisfied, promote preview to production
wrangler deploy --env production

# Keep old version as fallback
# Can quickly revert by deploying previous code version
```

### Rollback Strategy

Keep git history clean to enable quick rollbacks:

```bash
# List recent deployments
git log --oneline | head -10

# Rollback to previous version
git reset --hard <commit-hash>
npm run deploy

# Verify rollback
curl https://api.yourdomain.com/health
```

## Monitoring and Logging

### Real-time Logs

Watch live logs from your deployed Worker:

```bash
# Production logs
wrangler tail

# Preview logs
wrangler tail --env preview

# Filter by status codes
wrangler tail --status 500  # Errors only

# Filter by request path
wrangler tail --search "/api/v1/extensions"
```

### Request Metrics

View metrics in Cloudflare Dashboard:

1. Workers > your-worker > Analytics
2. Monitor:
   - Request rate
   - Error rate
   - CPU time
   - Errors by type

### Custom Logging

The API logs errors and important events. Examples visible in tail:

```
2024-01-28 10:15:32.123 [INFO] Request received: POST /api/v1/extensions/upload
2024-01-28 10:15:33.456 [ERROR] CRX parsing failed: Invalid header
2024-01-28 10:15:45.789 [INFO] Cleanup job completed: 5 sessions removed
```

### Performance Monitoring

Key metrics to watch:

- **CPU Time**: Should stay under 50ms per request
- **Request Duration**: Target <500ms for most requests
- **Error Rate**: Keep below 1%
- **Rate Limit Hits**: Monitor for abuse patterns

Set up alerts in Cloudflare > Notifications for:
- Workers CPU time exceeding 100ms
- Error rate above 5%
- 429 rate limit responses spiking

### Scheduled Cleanup

Automated sessions cleanup runs every 6 hours (configured in wrangler.toml):

```toml
[triggers]
crons = ["0 */6 * * *"]  # Every 6 hours
```

This removes expired sessions and cleans up associated R2 objects. Monitor the logs for cleanup job status.

## Troubleshooting

### Deployment Fails

```bash
# Check Wrangler configuration
wrangler publish --dry-run

# Verify credentials
wrangler whoami

# Check KV namespaces exist
wrangler kv:namespace list

# Check R2 buckets exist
wrangler r2 bucket list
```

### Cloudflare Errors

**Error: "Auth token expired"**
```bash
# Re-authenticate
wrangler logout
wrangler auth
```

**Error: "Namespace not found"**
```bash
# Update wrangler.toml with correct IDs
wrangler kv:namespace list
```

**Error: "Failed to upload"**
```bash
# Check code compiles
npm run type-check npm run lint

# Check bundle size (shouldn't exceed 10MB)
wrangler build
ls -lh dist/
```

### API Not Responding

```bash
# Check if Worker is deployed
wrangler list

# Check recent deployments
wrangler deployments list

# View error logs
wrangler tail --status 500

# Redeploy if needed
npm run deploy
```

### Rate Limiting Issues

If legitimate traffic is being rate limited:

```bash
# Update rate limits in wrangler.toml
[env.production]
vars = {
  RATE_LIMIT_DOWNLOAD = "20",  # Increase from 10
  RATE_LIMIT_UPLOAD = "10"     # Increase from 5
}

# Redeploy
npm run deploy
```

## Rollback Procedures

### Quick Rollback

If something goes wrong after deployment:

```bash
# Option 1: Redeploy previous working version
git checkout <previous-commit>
npm run deploy

# Option 2: Redeploy from main branch
git checkout main
npm run deploy
```

### Emergency Rollback

For critical issues, temporarily disable the Worker:

1. Go to Cloudflare Dashboard > Workers
2. Your worker > Settings
3. Click "Disable" to stop all requests

Then investigate and fix the issue locally before redeploying.

### Data Preservation

Session data in KV and files in R2 persist across deployments. To preserve data during rollbacks:

1. Sessions auto-expire after SESSION_TTL (default 30 minutes)
2. Old R2 files need manual cleanup via Dashboard or lifecycle rules
3. KV data survives worker code changes

To completely reset (use carefully!):

```bash
# Clear KV namespaces
wrangler kv:key delete-all --namespace-id <SESSIONS_ID>
wrangler kv:key delete-all --namespace-id <CACHE_ID>

# List R2 objects (review before deleting!)
wrangler r2 object list crxreview-storage

# Delete all R2 objects (DANGEROUS - be sure!)
wrangler r2 object delete crxreview-storage/* --recursive
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy API

on:
  push:
    branches: [main]
    paths: ['api/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: cd api && npm install

      - name: Type check
        run: cd api && npm run type-check

      - name: Lint
        run: cd api && npm run lint

      - name: Deploy
        run: cd api && npm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

Add secrets in GitHub:
1. Settings > Secrets > New repository secret
2. Add `CLOUDFLARE_API_TOKEN` from your Cloudflare Dashboard

### Environment-Specific Deployments

```yaml
name: Deploy to Preview

on:
  push:
    branches: [develop]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd api && npm install
      - run: cd api && npm run lint
      - run: wrangler deploy --env preview
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Next Steps

After successful deployment:

1. Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
2. Check [README.md](README.md) for API usage examples
3. See [openapi/openapi.yaml](openapi/openapi.yaml) for full API specification
4. Configure monitoring and alerts in Cloudflare Dashboard

For support or questions, refer to:
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- Project GitHub Issues
