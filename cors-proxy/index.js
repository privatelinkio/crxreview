/**
 * Simple CORS Proxy for Chrome Web Store Downloads
 * Deployed on Cloudflare Workers
 */

export default {
  async fetch(request, env, ctx) {
    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Only allow Chrome Web Store URLs
    const allowedDomains = [
      'clients2.google.com',
      'clients2.googleusercontent.com',
      'chrome.google.com',
    ];

    const targetDomain = new URL(targetUrl).hostname;
    if (!allowedDomains.includes(targetDomain)) {
      return new Response('Domain not allowed', { status: 403 });
    }

    try {
      // Fetch the target URL
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        },
      });

      // Create a new response with CORS headers
      const newResponse = new Response(response.body, response);

      // Add CORS headers
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');

      return newResponse;
    } catch (error) {
      return new Response(`Proxy error: ${error.message}`, { status: 500 });
    }
  },
};
