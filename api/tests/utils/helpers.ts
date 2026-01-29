/**
 * Test helper functions for creating mock objects and test data
 */

import type { Context } from 'hono';
import { createMockEnv, MockExecutionContext, MockR2Bucket, MockKVNamespace } from './mocks';
import { SAMPLE_SESSION, SAMPLE_AUTH_HEADERS } from './fixtures';

/**
 * Create a mock Hono Context for testing
 */
export function createMockContext(overrides?: Partial<any>): any {
  const env = createMockEnv();

  return {
    req: {
      path: '/',
      method: 'GET',
      header: (key: string) => {
        const headers = {
          'content-type': 'application/json',
          ...SAMPLE_AUTH_HEADERS.apiKey,
          ...overrides?.req?.headers,
        };
        return headers[key.toLowerCase()];
      },
      headers: {
        get: (key: string) => {
          const headers = {
            'content-type': 'application/json',
            ...SAMPLE_AUTH_HEADERS.apiKey,
            ...overrides?.req?.headers,
          };
          return headers[key.toLowerCase()];
        },
      },
      query: (key: string) => {
        const params = { ...overrides?.req?.query };
        return params[key];
      },
      param: (key: string) => {
        const params = { ...overrides?.req?.params };
        return params[key];
      },
      body: async () => overrides?.req?.body || {},
      json: async () => overrides?.req?.json || {},
      text: async () => overrides?.req?.text || '',
      arrayBuffer: async () => overrides?.req?.arrayBuffer || new ArrayBuffer(0),
      formData: async () => overrides?.req?.formData || new FormData(),
      raw: {
        url: overrides?.req?.url || 'http://localhost/',
      },
    },
    env,
    executionCtx: new MockExecutionContext(),
    status: (code: number) => {
      return {
        json: (data: any) => ({ status: code, json: data }),
        text: (text: string) => ({ status: code, text }),
      };
    },
    json: (data: any, status?: number) => ({
      status: status || 200,
      json: data,
    }),
    text: (text: string, status?: number) => ({
      status: status || 200,
      text,
    }),
    ...overrides,
  };
}

/**
 * Generate a UUID v4 for testing
 */
export function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create test session data
 */
export function createTestSession(overrides?: Partial<any>): any {
  const sessionId = generateSessionId();
  const now = Math.floor(Date.now() / 1000);

  return {
    ...SAMPLE_SESSION,
    id: sessionId,
    createdAt: now,
    expiresAt: now + 1800,
    ...overrides,
  };
}

/**
 * Create a valid request body for file upload
 */
export function createUploadRequestBody(fileContent?: Uint8Array): any {
  return {
    file: fileContent || new Uint8Array(100),
  };
}

/**
 * Create a valid CRX file for testing
 */
export function createValidCRXFile(): Uint8Array {
  // CRX3 header
  const magic = new Uint8Array([0x43, 0x72, 0x33, 0x34]); // "Cr34"
  const version = new Uint8Array([0x03, 0x00, 0x00, 0x00]); // Version 3
  const headerSize = new Uint8Array(4);
  new DataView(headerSize.buffer).setUint32(0, 24, true); // 24 bytes

  // Minimal ZIP data (empty archive)
  const zipMagic = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // PK\x03\x04

  const result = new Uint8Array(magic.length + version.length + headerSize.length + 12 + zipMagic.length);
  let offset = 0;

  result.set(magic, offset);
  offset += magic.length;

  result.set(version, offset);
  offset += version.length;

  result.set(headerSize, offset);
  offset += headerSize.length;

  // Minimal header
  offset += 12;

  result.set(zipMagic, offset);

  return result;
}

/**
 * Create a form data with file for testing
 */
export function createFormDataWithFile(file?: Uint8Array): FormData {
  const formData = new FormData();
  const fileContent = file || createValidCRXFile();
  const blob = new Blob([fileContent], { type: 'application/x-crx' });
  formData.append('file', blob, 'extension.crx');
  return formData;
}

/**
 * Create a mock request with headers
 */
export function createMockRequest(
  method: string = 'GET',
  path: string = '/',
  body?: any,
  headers?: Record<string, string>,
): any {
  return {
    method,
    url: `http://localhost${path}`,
    headers: {
      'content-type': 'application/json',
      ...SAMPLE_AUTH_HEADERS.apiKey,
      ...headers,
    },
    body,
  };
}

/**
 * Create a mock response object
 */
export function createMockResponse(): any {
  const response = {
    status: 200,
    statusText: 'OK',
    headers: new Map(),
    body: null,
    json: async () => ({}),
    text: async () => '',
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    clone: function() {
      return this;
    },
  };

  return response;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100,
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Create a promise that rejects after a timeout
 */
export async function createTimeoutPromise<T>(ms: number, value?: T): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
  });
}

/**
 * Assert that a promise rejects
 */
export async function expectToReject(
  promise: Promise<any>,
  expectedMessage?: string | RegExp,
): Promise<Error> {
  try {
    await promise;
    throw new Error('Expected promise to reject, but it resolved');
  } catch (error: any) {
    if (expectedMessage) {
      if (typeof expectedMessage === 'string') {
        if (!error.message?.includes(expectedMessage)) {
          throw new Error(`Expected error message to include "${expectedMessage}", but got "${error.message}"`);
        }
      } else if (expectedMessage instanceof RegExp) {
        if (!expectedMessage.test(error.message)) {
          throw new Error(`Expected error message to match ${expectedMessage}, but got "${error.message}"`);
        }
      }
    }
    return error;
  }
}

/**
 * Create a mock file entry
 */
export function createMockFileEntry(
  name: string,
  size: number = 1024,
  mimeType: string = 'text/plain',
): any {
  return {
    name,
    type: 'file',
    size,
    mimeType,
    lastModified: Date.now(),
  };
}

/**
 * Create a mock directory entry
 */
export function createMockDirectoryEntry(name: string, children: any[] = []): any {
  return {
    name,
    type: 'directory',
    children,
  };
}

/**
 * Flatten file tree to list of files
 */
export function flattenFileTree(entry: any): string[] {
  const files: string[] = [];

  function traverse(node: any, path: string = '') {
    const currentPath = path ? `${path}/${node.name}` : node.name;

    if (node.type === 'file') {
      files.push(currentPath);
    } else if (node.type === 'directory' && node.children) {
      for (const child of node.children) {
        traverse(child, currentPath);
      }
    }
  }

  traverse(entry);
  return files;
}

/**
 * Create a deep copy of an object
 */
export function deepCopy<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepCopy(item)) as any;
  }

  if (obj instanceof Object) {
    const copy = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        (copy as any)[key] = deepCopy((obj as any)[key]);
      }
    }
    return copy;
  }

  return obj;
}

/**
 * Compare two objects deeply
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) {
    return true;
  }

  if (typeof obj1 !== typeof obj2) {
    return false;
  }

  if (obj1 === null || obj2 === null) {
    return obj1 === obj2;
  }

  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    return obj1.every((item, index) => deepEqual(item, obj2[index]));
  }

  if (typeof obj1 === 'object' && typeof obj2 === 'object') {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    return keys1.every((key) => deepEqual(obj1[key], obj2[key]));
  }

  return false;
}

/**
 * Create a delay promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format bytes to human readable size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Create a stub function that tracks calls
 */
export function createSpy<T extends (...args: any[]) => any>(
  implementation?: T,
): T & {
  calls: Array<{ args: any[]; result?: any; error?: any }>;
  reset: () => void;
} {
  const calls: Array<{ args: any[]; result?: any; error?: any }> = [];

  const spy = ((...args: any[]) => {
    try {
      const result = implementation ? implementation(...args) : undefined;
      calls.push({ args, result });
      return result;
    } catch (error) {
      calls.push({ args, error });
      throw error;
    }
  }) as any;

  spy.calls = calls;
  spy.reset = () => {
    calls.length = 0;
  };

  return spy;
}

/**
 * Get the mock storage instances from context
 */
export function getMockStorageFromContext(context: any): {
  bucket: MockR2Bucket;
  kv: MockKVNamespace;
} {
  return {
    bucket: context.env.R2_BUCKET,
    kv: context.env.SESSION_KV,
  };
}

/**
 * Clear all mock storage
 */
export function clearMockStorage(context: any): void {
  const { bucket, kv } = getMockStorageFromContext(context);
  bucket.clear();
  kv.clear();
  bucket.clearCallHistory();
  kv.clearCallHistory();
  bucket.clearErrors();
  kv.clearErrors();
}

/**
 * Assert storage was called with specific arguments
 */
export function assertStorageCalled(
  storage: MockR2Bucket | MockKVNamespace,
  method: string,
  expectedArgs?: any[],
): void {
  const calls = storage.getCallHistory(method);

  if (calls.length === 0) {
    throw new Error(`Expected ${method} to be called, but it was not`);
  }

  if (expectedArgs) {
    const call = calls[0];
    if (JSON.stringify(call.args) !== JSON.stringify(expectedArgs)) {
      throw new Error(
        `Expected ${method} to be called with ${JSON.stringify(expectedArgs)}, but got ${JSON.stringify(call.args)}`,
      );
    }
  }
}

/**
 * Assert storage was called N times
 */
export function assertStorageCallCount(storage: MockR2Bucket | MockKVNamespace, method: string, count: number): void {
  const calls = storage.getCallHistory(method);

  if (calls.length !== count) {
    throw new Error(`Expected ${method} to be called ${count} times, but it was called ${calls.length} times`);
  }
}
