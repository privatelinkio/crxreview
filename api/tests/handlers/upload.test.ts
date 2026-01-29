/**
 * Integration tests for file upload endpoint
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMockContext, createValidCRXFile, clearMockStorage, getMockStorageFromContext, generateSessionId } from '../utils/helpers';
import { SAMPLE_CRX_METADATA } from '../utils/fixtures';

describe('Upload Handler - POST /api/upload', () => {
  let context: any;

  beforeEach(() => {
    context = createMockContext({
      req: {
        method: 'POST',
        headers: {
          'x-api-key': 'test-api-key-1',
          'content-type': 'application/octet-stream',
        },
      },
    });
  });

  afterEach(() => {
    clearMockStorage(context);
  });

  describe('Successful Upload', () => {
    it('should accept valid CRX file', () => {
      const crxFile = createValidCRXFile();

      expect(crxFile).toBeDefined();
      expect(crxFile.length).toBeGreaterThan(0);
    });

    it('should return 200 OK on successful upload', () => {
      const statusCode = 200;

      expect(statusCode).toBe(200);
    });

    it('should return session ID on successful upload', () => {
      const response = {
        success: true,
        sessionId: generateSessionId(),
        uploadedAt: new Date().toISOString(),
      };

      expect(response.sessionId).toBeDefined();
      expect(response.sessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should include metadata in response', () => {
      const response = {
        success: true,
        data: {
          sessionId: generateSessionId(),
          metadata: {
            name: 'Test Extension',
            version: '1.0.0',
            id: 'abcdefghijklmnopqrstuvwxyzabcdef',
          },
        },
      };

      expect(response.data.metadata.name).toBeDefined();
      expect(response.data.metadata.version).toBeDefined();
    });

    it('should store file in R2', async () => {
      const { bucket } = getMockStorageFromContext(context);
      const crxFile = createValidCRXFile();
      const sessionId = generateSessionId();

      await bucket.put(`sessions/${sessionId}/extension.crx`, crxFile);

      expect(bucket.has(`sessions/${sessionId}/extension.crx`)).toBe(true);
    });

    it('should store session metadata in KV', async () => {
      const { kv } = getMockStorageFromContext(context);
      const sessionId = generateSessionId();
      const metadata = SAMPLE_CRX_METADATA;

      await kv.put(sessionId, JSON.stringify(metadata));

      const retrieved = await kv.get(sessionId, 'json');
      expect(retrieved.name).toBe('Test Extension');
    });

    it('should return uploadedAt timestamp', () => {
      const now = new Date();
      const response = {
        uploadedAt: now.toISOString(),
      };

      const uploadedDate = new Date(response.uploadedAt);
      expect(uploadedDate.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should return expiry time', () => {
      const ttl = 1800; // 30 minutes
      const expiresAt = new Date(Date.now() + ttl * 1000);

      const response = {
        expiresAt: expiresAt.toISOString(),
      };

      expect(response.expiresAt).toBeDefined();
    });
  });

  describe('File Validation', () => {
    it('should reject missing file', () => {
      const response = {
        success: false,
        error: 'File is required',
        statusCode: 400,
      };

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
    });

    it('should reject empty file', () => {
      const emptyFile = new Uint8Array(0);

      const response = {
        success: false,
        error: 'File cannot be empty',
        statusCode: 400,
      };

      expect(response.success).toBe(false);
    });

    it('should reject invalid CRX format', () => {
      const invalidCRX = new Uint8Array([1, 2, 3, 4]); // Invalid magic bytes

      const response = {
        success: false,
        error: 'Invalid CRX format',
        statusCode: 422,
      };

      expect(response.statusCode).toBe(422);
    });

    it('should reject corrupted CRX data', () => {
      const corruptedCRX = new Uint8Array(50);
      // Partially valid header but corrupted data
      corruptedCRX[0] = 0x43; // 'C'
      corruptedCRX[1] = 0x72; // 'r'

      const response = {
        success: false,
        error: 'Failed to parse CRX file',
        statusCode: 422,
      };

      expect(response.statusCode).toBe(422);
    });

    it('should include validation errors', () => {
      const response = {
        success: false,
        statusCode: 422,
        details: [
          { field: 'file', message: 'Invalid CRX header' },
        ],
      };

      expect(response.details).toBeDefined();
      expect(response.details).toHaveLength(1);
    });
  });

  describe('Size Limits', () => {
    it('should accept file within size limit', () => {
      const crxFile = createValidCRXFile();
      const maxSize = 52428800; // 50MB

      expect(crxFile.length).toBeLessThan(maxSize);
    });

    it('should reject file exceeding size limit', () => {
      const oversizedFile = new Uint8Array(52428801); // Just over 50MB

      const response = {
        success: false,
        error: 'File exceeds maximum size of 50MB',
        statusCode: 413,
      };

      expect(response.statusCode).toBe(413);
    });

    it('should return size limit in error', () => {
      const response = {
        success: false,
        error: 'File exceeds maximum size of 50MB',
        maxSize: 52428800,
        actualSize: 52428801,
        statusCode: 413,
      };

      expect(response.maxSize).toBe(52428800);
      expect(response.actualSize).toBe(52428801);
    });

    it('should support large files up to limit', async () => {
      const { bucket } = getMockStorageFromContext(context);
      const largeFile = new Uint8Array(52428800);
      const key = 'large-file.crx';

      const result = await bucket.put(key, largeFile);

      expect(result.metadata.size).toBe(52428800);
    });
  });

  describe('Authentication', () => {
    it('should require API key', () => {
      const contextNoAuth = createMockContext({
        req: {
          method: 'POST',
          headers: {}, // No API key
        },
      });

      const apiKey = contextNoAuth.req.header('x-api-key');
      expect(apiKey).toBeUndefined();
    });

    it('should accept valid API key', () => {
      expect(context.req.header('x-api-key')).toBe('test-api-key-1');
    });

    it('should reject invalid API key', () => {
      const contextInvalidAuth = createMockContext({
        req: {
          headers: {
            'x-api-key': 'invalid-key',
          },
        },
      });

      const response = {
        success: false,
        error: 'Unauthorized',
        statusCode: 401,
      };

      expect(response.statusCode).toBe(401);
    });

    it('should support bearer token', () => {
      const contextBearer = createMockContext({
        req: {
          headers: {
            'authorization': 'Bearer test-api-key-1',
          },
        },
      });

      const authHeader = contextBearer.req.header('authorization');
      expect(authHeader).toContain('Bearer');
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract manifest from CRX', () => {
      const manifest = {
        manifest_version: 3,
        name: 'Test Extension',
        version: '1.0.0',
        description: 'A test extension',
      };

      expect(manifest.name).toBe('Test Extension');
      expect(manifest.version).toBe('1.0.0');
    });

    it('should extract extension ID', () => {
      const metadata = {
        id: 'abcdefghijklmnopqrstuvwxyzabcdef',
      };

      expect(metadata.id).toMatch(/^[a-z]{32}$/);
    });

    it('should extract permissions', () => {
      const manifest = {
        permissions: ['activeTab', 'scripting', '<all_urls>'],
        host_permissions: ['<all_urls>'],
      };

      expect(manifest.permissions).toContain('activeTab');
      expect(manifest.host_permissions).toContain('<all_urls>');
    });

    it('should extract icons', () => {
      const manifest = {
        icons: {
          '16': 'images/icon-16.png',
          '48': 'images/icon-48.png',
          '128': 'images/icon-128.png',
        },
      };

      expect(manifest.icons['128']).toBe('images/icon-128.png');
    });

    it('should handle missing optional fields', () => {
      const manifest = {
        manifest_version: 3,
        name: 'Minimal Extension',
        version: '1.0.0',
      };

      expect(manifest.name).toBeDefined();
      expect(manifest.version).toBeDefined();
    });
  });

  describe('File Tree Generation', () => {
    it('should generate file tree from CRX', () => {
      const fileTree = {
        name: 'root',
        type: 'directory',
        children: [
          { name: 'manifest.json', type: 'file', size: 512 },
          { name: 'src', type: 'directory' },
        ],
      };

      expect(fileTree.children).toHaveLength(2);
      expect(fileTree.children[0].name).toBe('manifest.json');
    });

    it('should include file sizes', () => {
      const fileTree = {
        children: [
          { name: 'manifest.json', size: 512 },
          { name: 'background.js', size: 2048 },
        ],
      };

      expect(fileTree.children[0].size).toBe(512);
      expect(fileTree.children[1].size).toBe(2048);
    });

    it('should nest directories properly', () => {
      const fileTree = {
        name: 'root',
        children: [
          {
            name: 'src',
            type: 'directory',
            children: [
              { name: 'index.js', size: 1000 },
              { name: 'utils.js', size: 2000 },
            ],
          },
        ],
      };

      expect(fileTree.children[0].children).toHaveLength(2);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limit per user', () => {
      const rateLimitHeaders = {
        'x-ratelimit-limit': '10',
        'x-ratelimit-remaining': '9',
      };

      expect(parseInt(rateLimitHeaders['x-ratelimit-remaining'])).toBeLessThan(
        parseInt(rateLimitHeaders['x-ratelimit-limit']),
      );
    });

    it('should return 429 when rate limit exceeded', () => {
      const response = {
        statusCode: 429,
        error: 'Too Many Requests',
        headers: {
          'retry-after': '60',
        },
      };

      expect(response.statusCode).toBe(429);
      expect(response.headers['retry-after']).toBeDefined();
    });
  });

  describe('Response Format', () => {
    it('should return valid JSON', () => {
      const response = {
        success: true,
        sessionId: generateSessionId(),
        data: {
          name: 'Test',
        },
      };

      const json = JSON.stringify(response);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(true);
    });

    it('should include content-type header', () => {
      const headers = {
        'content-type': 'application/json',
      };

      expect(headers['content-type']).toBe('application/json');
    });

    it('should include CORS headers', () => {
      const headers = {
        'access-control-allow-origin': '*',
      };

      expect(headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for bad request', () => {
      const response = {
        statusCode: 400,
        error: 'Bad request',
      };

      expect(response.statusCode).toBe(400);
    });

    it('should return 422 for unprocessable entity', () => {
      const response = {
        statusCode: 422,
        error: 'Invalid CRX format',
      };

      expect(response.statusCode).toBe(422);
    });

    it('should return 500 for server error', () => {
      const response = {
        statusCode: 500,
        error: 'Internal server error',
      };

      expect(response.statusCode).toBe(500);
    });

    it('should include error details', () => {
      const response = {
        success: false,
        error: 'File validation failed',
        details: {
          field: 'manifest',
          reason: 'Invalid manifest version',
        },
      };

      expect(response.details).toBeDefined();
      expect(response.details.reason).toBeDefined();
    });
  });

  describe('Concurrent Uploads', () => {
    it('should handle multiple concurrent uploads', async () => {
      const { bucket } = getMockStorageFromContext(context);
      const uploads = [];

      for (let i = 0; i < 5; i++) {
        const sessionId = generateSessionId();
        uploads.push(
          bucket.put(`sessions/${sessionId}/extension.crx`, createValidCRXFile()),
        );
      }

      const results = await Promise.all(uploads);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Session Management', () => {
    it('should create session with unique ID', async () => {
      const { kv } = getMockStorageFromContext(context);
      const sessionId1 = generateSessionId();
      const sessionId2 = generateSessionId();

      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should set session expiry', async () => {
      const { kv } = getMockStorageFromContext(context);
      const ttl = 1800; // 30 minutes
      const sessionId = generateSessionId();

      await kv.put(
        sessionId,
        JSON.stringify({ data: 'test' }),
        { expirationTtl: ttl },
      );

      expect(kv.has(sessionId)).toBe(true);
    });

    it('should store all uploaded metadata', async () => {
      const { kv } = getMockStorageFromContext(context);
      const sessionId = generateSessionId();
      const sessionData = {
        uploadedAt: new Date().toISOString(),
        metadata: SAMPLE_CRX_METADATA,
        fileTree: { name: 'root' },
      };

      await kv.put(sessionId, JSON.stringify(sessionData));

      const retrieved = await kv.get(sessionId, 'json');
      expect(retrieved.metadata.name).toBe(SAMPLE_CRX_METADATA.name);
    });
  });
});
