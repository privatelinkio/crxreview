/**
 * CORS Proxy Worker for CRX Review
 *
 * Proxies requests to Chrome Web Store to bypass CORS restrictions
 */

const ALLOWED_ORIGINS = [
  'https://privatelink.io',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173'
];

const CHROME_WEB_STORE_DOMAINS = [
  'clients2.google.com',
  'clients2.googleapis.com'
];

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORSPreflight(request);
    }

    // Get origin
    const origin = request.headers.get('Origin');

    // Check if origin is allowed
    if (!isOriginAllowed(origin)) {
      return new Response('Forbidden: Origin not allowed', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }

    // Get target URL from query parameter
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Bad Request: Missing url parameter', {
        status: 400,
        headers: corsHeaders(origin)
      });
    }

    // Validate target URL
    let parsedTarget;
    try {
      parsedTarget = new URL(targetUrl);
    } catch (e) {
      return new Response('Bad Request: Invalid url parameter', {
        status: 400,
        headers: corsHeaders(origin)
      });
    }

    // Only allow Chrome Web Store domains
    if (!CHROME_WEB_STORE_DOMAINS.includes(parsedTarget.hostname)) {
      return new Response('Forbidden: Only Chrome Web Store URLs are allowed', {
        status: 403,
        headers: corsHeaders(origin)
      });
    }

    try {
      // Fetch from target
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
      });

      // Clone response and add CORS headers
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      // Remove headers that might cause issues
      newHeaders.delete('content-security-policy');
      newHeaders.delete('x-frame-options');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });

    } catch (error) {
      return new Response(`Proxy Error: ${error.message}`, {
        status: 500,
        headers: corsHeaders(origin)
      });
    }
  }
};

function handleCORSPreflight(request) {
  const origin = request.headers.get('Origin');

  if (!isOriginAllowed(origin)) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    headers: {
      ...corsHeaders(origin),
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') || '*',
      'Access-Control-Max-Age': '86400'
    }
  });
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Type'
  };
}

function isOriginAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
}
