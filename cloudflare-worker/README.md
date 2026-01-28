# Cloudflare Worker CORS Proxy

This worker proxies requests to Chrome Web Store to bypass CORS restrictions.

## Issue: Error 1042

The automated API deployment is encountering Cloudflare error 1042 ("Worker Threw Exception"). This appears to be an account-level configuration issue.

## Manual Deployment (Recommended)

1. Go to [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com/workers-and-pages)
2. Click **"Create Application"** → **"Create Worker"**
3. Name it: `crxreview-cors-proxy`
4. Click **"Deploy"**
5. Click **"Edit Code"**
6. Copy and paste the contents of `cors-proxy.js`
7. Click **"Save and Deploy"**
8. Note the worker URL (e.g., `crxreview-cors-proxy.your-subdomain.workers.dev`)
9. Update `/src/lib/crx/download.ts` with your worker URL

## Update the App

After deploying, update the CORS_PROXY_URL in `/src/lib/crx/download.ts`:

```typescript
const CORS_PROXY_URL = 'https://your-worker-name.your-subdomain.workers.dev';
```

## Testing

Test the worker:
```bash
curl 'https://your-worker.workers.dev/?url=https://clients2.google.com/service/update2/crx?response=redirect' \
  -H 'Origin: https://privatelink.io'
```

You should see a redirect or CRX file data.

## Troubleshooting

If you continue to see error 1042:
1. Contact Cloudflare support about Workers deployment issues
2. Check if your account has Workers enabled
3. Verify the workers.dev subdomain is properly configured

## Alternative: Use CORS Anywhere

If Cloudflare Workers don't work, you can self-host CORS Anywhere:

1. Deploy: https://github.com/Rob--W/cors-anywhere
2. Update `CORS_PROXY_URL` to point to your CORS Anywhere instance

## Security

The worker only allows:
- Origins: `https://privatelink.io`, `localhost` (for development)
- Domains: `clients2.google.com`, `clients2.googleapis.com`
