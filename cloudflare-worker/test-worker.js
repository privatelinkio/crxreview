export default {
  async fetch(request) {
    return new Response('Hello from Cloudflare Worker!', {
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
