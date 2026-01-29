/**
 * Mock implementations for Cloudflare Workers R2 and KV storage
 * Provides in-memory storage for testing with call tracking
 */

import type { R2Bucket, R2Object } from '@cloudflare/workers-types';

/**
 * Mock R2 file metadata
 */
export interface MockR2ObjectMetadata {
  size: number;
  etag: string;
  httpEtag?: string;
  contentType?: string;
  contentLanguage?: string;
  cacheControl?: string;
  cacheExpiration?: Date;
  expires?: Date;
  metadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
  uploaded: Date;
}

/**
 * Mock R2 object implementation
 */
export class MockR2Object implements R2Object {
  body: ReadableStream<Uint8Array>;
  bodyUsed: boolean = false;

  constructor(
    public key: string,
    private data: Uint8Array,
    public metadata: MockR2ObjectMetadata,
  ) {
    this.body = this.createReadableStream();
  }

  private createReadableStream(): ReadableStream<Uint8Array> {
    let sent = false;
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(data));
        controller.close();
      },
    });
  }

  async text(): Promise<string> {
    return new TextDecoder().decode(this.data);
  }

  async json(): Promise<any> {
    return JSON.parse(await this.text());
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.data.buffer;
  }

  async blob(): Promise<Blob> {
    return new Blob([this.data], { type: this.metadata.contentType });
  }
}

/**
 * Mock R2Bucket for testing
 */
export class MockR2Bucket implements Partial<R2Bucket> {
  private storage: Map<string, { data: Uint8Array; metadata: MockR2ObjectMetadata }> = new Map();
  public calls: Array<{ method: string; args: any[]; timestamp: number }> = [];
  public errors: Map<string, Error> = new Map();

  /**
   * Simulate an error for a specific operation
   */
  simulateError(key: string, error: Error): void {
    this.errors.set(key, error);
  }

  /**
   * Clear simulated errors
   */
  clearErrors(): void {
    this.errors.clear();
  }

  /**
   * Track a method call
   */
  private track(method: string, args: any[]): void {
    this.calls.push({ method, args, timestamp: Date.now() });
  }

  /**
   * Get call history
   */
  getCallHistory(method?: string): Array<{ method: string; args: any[]; timestamp: number }> {
    if (method) {
      return this.calls.filter((call) => call.method === method);
    }
    return this.calls;
  }

  /**
   * Clear call history
   */
  clearCallHistory(): void {
    this.calls = [];
  }

  /**
   * Put (upload) a file
   */
  async put(
    key: string,
    value: ReadableStream<Uint8Array> | ArrayBuffer | string | null,
    options?: any,
  ): Promise<MockR2Object> {
    this.track('put', [key, options]);

    if (this.errors.has(key)) {
      throw this.errors.get(key);
    }

    let data: Uint8Array;

    if (value === null) {
      data = new Uint8Array(0);
    } else if (typeof value === 'string') {
      data = new TextEncoder().encode(value);
    } else if (value instanceof ArrayBuffer) {
      data = new Uint8Array(value);
    } else if (value instanceof ReadableStream) {
      const chunks: Uint8Array[] = [];
      const reader = value.getReader();
      try {
        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          if (chunk) chunks.push(chunk);
        }
      } finally {
        reader.releaseLock();
      }
      data = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.length;
      }
    } else {
      data = new Uint8Array(0);
    }

    const metadata: MockR2ObjectMetadata = {
      size: data.length,
      etag: `"${this.generateETag()}"`,
      contentType: options?.contentType || 'application/octet-stream',
      uploaded: new Date(),
      ...options,
    };

    this.storage.set(key, { data, metadata });

    return new MockR2Object(key, data, metadata);
  }

  /**
   * Get (download) a file
   */
  async get(key: string): Promise<MockR2Object | null> {
    this.track('get', [key]);

    if (this.errors.has(key)) {
      throw this.errors.get(key);
    }

    const entry = this.storage.get(key);
    if (!entry) {
      return null;
    }

    return new MockR2Object(key, entry.data, entry.metadata);
  }

  /**
   * Delete a file
   */
  async delete(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];
    this.track('delete', [keys]);

    for (const k of keys) {
      if (this.errors.has(k)) {
        throw this.errors.get(k);
      }
      this.storage.delete(k);
    }
  }

  /**
   * List files with prefix
   */
  async list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<any> {
    this.track('list', [options]);

    const prefix = options?.prefix || '';
    const limit = options?.limit || 1000;

    const matching = Array.from(this.storage.keys())
      .filter((key) => key.startsWith(prefix))
      .sort();

    const objects = matching.slice(0, limit).map((key) => {
      const entry = this.storage.get(key)!;
      return {
        key,
        size: entry.metadata.size,
        etag: entry.metadata.etag,
        uploaded: entry.metadata.uploaded,
      };
    });

    return {
      objects,
      truncated: matching.length > limit,
      cursor: matching.length > limit ? matching[limit]?.substring(0, prefix.length) : undefined,
    };
  }

  /**
   * Head - get metadata without body
   */
  async head(key: string): Promise<MockR2Object | null> {
    this.track('head', [key]);

    const entry = this.storage.get(key);
    if (!entry) {
      return null;
    }

    return new MockR2Object(key, new Uint8Array(0), entry.metadata);
  }

  /**
   * Clear all storage
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Check if file exists
   */
  has(key: string): boolean {
    return this.storage.has(key);
  }

  /**
   * Generate a mock ETag
   */
  private generateETag(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

/**
 * Mock KVNamespace for testing
 */
export class MockKVNamespace implements Partial<KVNamespace> {
  private storage: Map<string, { value: string; metadata?: Record<string, any> }> = new Map();
  public calls: Array<{ method: string; args: any[]; timestamp: number }> = [];
  public errors: Map<string, Error> = new Map();

  /**
   * Simulate an error for a specific operation
   */
  simulateError(key: string, error: Error): void {
    this.errors.set(key, error);
  }

  /**
   * Clear simulated errors
   */
  clearErrors(): void {
    this.errors.clear();
  }

  /**
   * Track a method call
   */
  private track(method: string, args: any[]): void {
    this.calls.push({ method, args, timestamp: Date.now() });
  }

  /**
   * Get call history
   */
  getCallHistory(method?: string): Array<{ method: string; args: any[]; timestamp: number }> {
    if (method) {
      return this.calls.filter((call) => call.method === method);
    }
    return this.calls;
  }

  /**
   * Clear call history
   */
  clearCallHistory(): void {
    this.calls = [];
  }

  /**
   * Get a value
   */
  async get(key: string, type?: 'text' | 'json' | 'arrayBuffer'): Promise<any> {
    this.track('get', [key, type]);

    if (this.errors.has(key)) {
      throw this.errors.get(key);
    }

    const entry = this.storage.get(key);
    if (!entry) {
      return null;
    }

    if (type === 'json') {
      return JSON.parse(entry.value);
    }
    return entry.value;
  }

  /**
   * Put a value
   */
  async put(
    key: string,
    value: string | ArrayBuffer,
    options?: { expirationTtl?: number; metadata?: Record<string, any> },
  ): Promise<void> {
    this.track('put', [key, typeof value === 'string' ? value.substring(0, 50) : 'ArrayBuffer', options]);

    if (this.errors.has(key)) {
      throw this.errors.get(key);
    }

    const stringValue = typeof value === 'string' ? value : new TextDecoder().decode(value);
    this.storage.set(key, {
      value: stringValue,
      metadata: options?.metadata,
    });
  }

  /**
   * Delete a value
   */
  async delete(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];
    this.track('delete', [keys]);

    for (const k of keys) {
      if (this.errors.has(k)) {
        throw this.errors.get(k);
      }
      this.storage.delete(k);
    }
  }

  /**
   * List keys
   */
  async list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<any> {
    this.track('list', [options]);

    const prefix = options?.prefix || '';
    const limit = options?.limit || 1000;

    const matching = Array.from(this.storage.keys())
      .filter((key) => key.startsWith(prefix))
      .sort();

    const keys = matching.slice(0, limit);

    return {
      keys: keys.map((key) => ({ name: key, metadata: this.storage.get(key)?.metadata })),
      list_complete: matching.length <= limit,
      cursor: matching.length > limit ? matching[limit] : undefined,
    };
  }

  /**
   * Clear all storage
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.storage.has(key);
  }

  /**
   * Get all data (for testing)
   */
  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, { value }] of this.storage) {
      try {
        result[key] = JSON.parse(value);
      } catch {
        result[key] = value;
      }
    }
    return result;
  }
}

/**
 * Mock Cloudflare ExecutionContext
 */
export class MockExecutionContext {
  waitUntil(promise: Promise<any>): void {
    // No-op for testing
  }

  passThroughOnException(): void {
    // No-op for testing
  }
}

/**
 * Create a mock Cloudflare Env object
 */
export function createMockEnv(overrides?: Partial<any>): any {
  return {
    R2_BUCKET: new MockR2Bucket(),
    SESSION_KV: new MockKVNamespace(),
    ENVIRONMENT: 'test',
    SESSION_TTL: 1800,
    MAX_FILE_SIZE: 52428800,
    RATE_LIMIT_DOWNLOAD: 10,
    RATE_LIMIT_WINDOW: 3600,
    API_KEY_1: 'test-api-key-1',
    API_KEY_2: 'test-api-key-2',
    ALLOWED_ORIGINS: '*',
    ...overrides,
  };
}

/**
 * Global fetch mock for download testing
 */
export class MockFetchResponse {
  constructor(
    public data: ArrayBuffer | string,
    public status: number = 200,
    public headers: Record<string, string> = {},
  ) {}

  async arrayBuffer(): Promise<ArrayBuffer> {
    if (typeof this.data === 'string') {
      return new TextEncoder().encode(this.data).buffer;
    }
    return this.data;
  }

  async text(): Promise<string> {
    if (typeof this.data === 'string') {
      return this.data;
    }
    return new TextDecoder().decode(this.data);
  }

  async blob(): Promise<Blob> {
    const buf = await this.arrayBuffer();
    return new Blob([buf], { type: this.headers['content-type'] });
  }

  async json(): Promise<any> {
    return JSON.parse(await this.text());
  }

  get ok(): boolean {
    return this.status >= 200 && this.status < 300;
  }

  get statusText(): string {
    return this.status === 200 ? 'OK' : 'Error';
  }
}

/**
 * Mock fetch implementation for testing
 */
export class MockFetcher {
  private responses: Map<string | RegExp, MockFetchResponse | ((url: string) => MockFetchResponse)> =
    new Map();

  /**
   * Register a response for a URL or pattern
   */
  registerResponse(
    urlPattern: string | RegExp,
    response: MockFetchResponse | ((url: string) => MockFetchResponse),
  ): void {
    this.responses.set(urlPattern, response);
  }

  /**
   * Perform a mock fetch
   */
  async fetch(url: string, options?: RequestInit): Promise<MockFetchResponse> {
    for (const [pattern, response] of this.responses) {
      let matches = false;

      if (typeof pattern === 'string') {
        matches = url.includes(pattern);
      } else {
        matches = pattern.test(url);
      }

      if (matches) {
        if (typeof response === 'function') {
          return response(url);
        }
        return response;
      }
    }

    // Default 404 response
    return new MockFetchResponse('Not Found', 404);
  }

  /**
   * Clear all registered responses
   */
  clear(): void {
    this.responses.clear();
  }
}
