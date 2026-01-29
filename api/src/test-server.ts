import { createApp } from './router';
import type { Env } from './types';

/**
 * Local development server for testing the CRX Review API
 *
 * This server mocks the Cloudflare Worker environment for local development.
 * It provides mock implementations of R2 and KV bindings.
 *
 * Usage:
 *   npm run dev:local
 *
 * The server will run on http://localhost:8787
 */

// Mock R2 Bucket implementation for local testing
class MockR2Bucket {
  private storage = new Map<string, ArrayBuffer>();

  async put(key: string, value: ArrayBuffer | ReadableStream): Promise<void> {
    if (value instanceof ReadableStream) {
      const reader = value.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        chunks.push(chunk);
      }
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      this.storage.set(key, result.buffer);
    } else {
      this.storage.set(key, value);
    }
    console.log(`[Mock R2] PUT ${key} (${this.storage.get(key)?.byteLength || 0} bytes)`);
  }

  async get(key: string): Promise<{ body: ReadableStream; size: number } | null> {
    const data = this.storage.get(key);
    if (!data) {
      console.log(`[Mock R2] GET ${key} - NOT FOUND`);
      return null;
    }
    console.log(`[Mock R2] GET ${key} (${data.byteLength} bytes)`);
    return {
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(data));
          controller.close();
        },
      }),
      size: data.byteLength,
    };
  }

  async delete(key: string): Promise<void> {
    const existed = this.storage.delete(key);
    console.log(`[Mock R2] DELETE ${key} - ${existed ? 'SUCCESS' : 'NOT FOUND'}`);
  }

  async list(options?: { prefix?: string }): Promise<{ objects: Array<{ key: string }> }> {
    const keys = Array.from(this.storage.keys());
    const filtered = options?.prefix
      ? keys.filter((k) => k.startsWith(options.prefix!))
      : keys;
    console.log(`[Mock R2] LIST prefix=${options?.prefix || '*'} - ${filtered.length} objects`);
    return { objects: filtered.map((key) => ({ key })) };
  }
}

// Mock KV Namespace implementation for local testing
class MockKVNamespace {
  private storage = new Map<string, string>();
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  async get(key: string): Promise<string | null> {
    const value = this.storage.get(key) || null;
    console.log(`[Mock KV:${this.name}] GET ${key} - ${value ? 'FOUND' : 'NOT FOUND'}`);
    return value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    this.storage.set(key, value);
    console.log(
      `[Mock KV:${this.name}] PUT ${key} (${value.length} bytes)${
        options?.expirationTtl ? ` TTL=${options.expirationTtl}s` : ''
      }`
    );
  }

  async delete(key: string): Promise<void> {
    const existed = this.storage.delete(key);
    console.log(`[Mock KV:${this.name}] DELETE ${key} - ${existed ? 'SUCCESS' : 'NOT FOUND'}`);
  }

  async list(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string }> }> {
    const keys = Array.from(this.storage.keys());
    const filtered = options?.prefix
      ? keys.filter((k) => k.startsWith(options.prefix!))
      : keys;
    console.log(
      `[Mock KV:${this.name}] LIST prefix=${options?.prefix || '*'} - ${filtered.length} keys`
    );
    return { keys: filtered.map((name) => ({ name })) };
  }
}

// Create mock environment for local development
const mockEnv: Env = {
  // Environment configuration
  ENVIRONMENT: 'development',
  SESSION_TTL: '1800',
  MAX_FILE_SIZE: '157286400',
  RATE_LIMIT_DOWNLOAD: '10',
  RATE_LIMIT_UPLOAD: '5',
  RATE_LIMIT_SEARCH: '20',
  RATE_LIMIT_GENERAL: '100',
  API_VERSION: '1.0.0-dev',

  // API Keys for testing
  API_KEY_1: 'test-api-key-local-dev-12345',
  API_KEY_2: 'test-api-key-secondary-67890',

  // CORS configuration
  ALLOWED_ORIGINS: '*',

  // Mock storage bindings
  CRX_STORAGE: new MockR2Bucket() as any,
  SESSIONS: new MockKVNamespace('SESSIONS') as any,
  CACHE: new MockKVNamespace('CACHE') as any,
};

// Create the Hono app
const app = createApp();

// Start the local development server
const PORT = 8787;

// Use dynamic import to avoid Bun type issues during TypeScript checking
// At runtime, Bun will be available
const server = (globalThis as any).Bun.serve({
  port: PORT,
  async fetch(request: Request) {
    // Mock ExecutionContext for local development
    const ctx: ExecutionContext = {
      waitUntil: (promise: Promise<any>) => {
        promise.catch((err) => console.error('[ExecutionContext] waitUntil error:', err));
      },
      passThroughOnException: () => {},
      props: {},
    };

    return app.fetch(request, mockEnv, ctx);
  },
});

console.log('\n' + '='.repeat(60));
console.log('CRX Review API - Local Development Server');
console.log('='.repeat(60));
console.log(`\nServer running at: http://localhost:${server.port}`);
console.log(`\nAPI Keys for testing:`);
console.log(`  Primary:   ${mockEnv.API_KEY_1}`);
console.log(`  Secondary: ${mockEnv.API_KEY_2}`);
console.log(`\nConfiguration:`);
console.log(`  Session TTL:        ${mockEnv.SESSION_TTL}s`);
console.log(`  Max File Size:      ${(Number(mockEnv.MAX_FILE_SIZE) / 1024 / 1024).toFixed(0)}MB`);
console.log(`  Environment:        ${mockEnv.ENVIRONMENT}`);

console.log(`\nAvailable Endpoints:`);
console.log(`\n  Health Check:`);
console.log(`    GET  /health`);
console.log(`\n  Extension Management:`);
console.log(`    POST /api/v1/extensions/upload`);
console.log(`    POST /api/v1/extensions/download`);
console.log(`    GET  /api/v1/extensions/:sessionId`);
console.log(`    DELETE /api/v1/extensions/:sessionId`);
console.log(`\n  Extension Content:`);
console.log(`    GET  /api/v1/extensions/:sessionId/manifest`);
console.log(`    GET  /api/v1/extensions/:sessionId/files`);
console.log(`    GET  /api/v1/extensions/:sessionId/files/*`);
console.log(`    GET  /api/v1/extensions/:sessionId/download/zip`);
console.log(`\n  Search & Filter:`);
console.log(`    POST /api/v1/extensions/:sessionId/search`);
console.log(`    POST /api/v1/extensions/:sessionId/filter`);

console.log(`\nExample cURL commands:`);
console.log(`\n  Health check:`);
console.log(`    curl http://localhost:${PORT}/health`);
console.log(`\n  Upload extension:`);
console.log(`    curl -X POST http://localhost:${PORT}/api/v1/extensions/upload \\`);
console.log(`      -H "Authorization: Bearer ${mockEnv.API_KEY_1}" \\`);
console.log(`      -F "file=@extension.crx"`);
console.log(`\n  Download extension:`);
console.log(`    curl -X POST http://localhost:${PORT}/api/v1/extensions/download \\`);
console.log(`      -H "Authorization: Bearer ${mockEnv.API_KEY_1}" \\`);
console.log(`      -H "Content-Type: application/json" \\`);
console.log(`      -d '{"extensionId": "nmmhkkegccagdldgiimedpiccmgmieda"}'`);

console.log(`\n${'='.repeat(60)}\n`);
