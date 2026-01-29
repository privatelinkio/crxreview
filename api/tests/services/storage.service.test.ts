/**
 * Unit tests for storage service (R2 operations)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMockContext, getMockStorageFromContext, clearMockStorage, delay } from '../utils/helpers';
import { createValidCRXFile } from '../utils/helpers';

describe('Storage Service - R2 Operations', () => {
  let context: any;
  let bucket: any;

  beforeEach(() => {
    context = createMockContext();
    bucket = getMockStorageFromContext(context).bucket;
  });

  afterEach(() => {
    clearMockStorage(context);
  });

  describe('putFile()', () => {
    it('should successfully upload a file to R2', async () => {
      const key = 'test-file.crx';
      const data = createValidCRXFile();

      const result = await bucket.put(key, data);

      expect(result).toBeDefined();
      expect(result.key).toBe(key);
      expect(result.metadata.size).toBe(data.length);
      expect(bucket.has(key)).toBe(true);
    });

    it('should track put operation in call history', async () => {
      const key = 'test-file.crx';
      const data = createValidCRXFile();

      await bucket.put(key, data);

      const calls = bucket.getCallHistory('put');
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0]).toBe(key);
    });

    it('should handle string data', async () => {
      const key = 'test.json';
      const data = '{"test": "data"}';

      const result = await bucket.put(key, data);

      expect(result.metadata.size).toBe(data.length);
    });

    it('should handle ArrayBuffer data', async () => {
      const key = 'test.bin';
      const data = new TextEncoder().encode('binary data').buffer;

      const result = await bucket.put(key, data);

      expect(result.metadata.size).toBeGreaterThan(0);
    });

    it('should handle null data', async () => {
      const key = 'empty.txt';

      const result = await bucket.put(key, null);

      expect(result.metadata.size).toBe(0);
    });

    it('should preserve custom metadata', async () => {
      const key = 'test.crx';
      const data = createValidCRXFile();
      const customMetadata = { contentType: 'application/x-crx', custom: 'value' };

      const result = await bucket.put(key, data, customMetadata);

      expect(result.metadata.contentType).toBe('application/x-crx');
    });

    it('should throw error when simulated error is set', async () => {
      const key = 'error-file.crx';
      const error = new Error('Upload failed');
      bucket.simulateError(key, error);

      await expect(bucket.put(key, createValidCRXFile())).rejects.toThrow('Upload failed');
    });

    it('should generate unique ETags', async () => {
      const data = createValidCRXFile();
      const result1 = await bucket.put('file1.crx', data);
      const result2 = await bucket.put('file2.crx', data);

      expect(result1.metadata.etag).not.toBe(result2.metadata.etag);
    });

    it('should update metadata when overwriting file', async () => {
      const key = 'overwrite-test.crx';
      const data1 = createValidCRXFile();
      const data2 = new Uint8Array([1, 2, 3, 4, 5]);

      const result1 = await bucket.put(key, data1);
      const result2 = await bucket.put(key, data2);

      expect(result2.metadata.size).toBe(5);
      expect(result2.metadata.size).not.toBe(result1.metadata.size);
    });
  });

  describe('getFile()', () => {
    it('should retrieve an existing file', async () => {
      const key = 'test-file.crx';
      const data = createValidCRXFile();
      await bucket.put(key, data);

      const result = await bucket.get(key);

      expect(result).toBeDefined();
      expect(result.key).toBe(key);
      expect(result.metadata.size).toBe(data.length);
    });

    it('should return null for non-existent file', async () => {
      const result = await bucket.get('non-existent-file.crx');

      expect(result).toBeNull();
    });

    it('should track get operation in call history', async () => {
      const key = 'test-file.crx';
      await bucket.put(key, 'test data');
      bucket.clearCallHistory();

      await bucket.get(key);

      const calls = bucket.getCallHistory('get');
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0]).toBe(key);
    });

    it('should throw error when simulated error is set', async () => {
      const key = 'error-file.crx';
      const error = new Error('Download failed');
      bucket.simulateError(key, error);

      await expect(bucket.get(key)).rejects.toThrow('Download failed');
    });

    it('should return correct metadata for retrieved file', async () => {
      const key = 'metadata-test.crx';
      const data = createValidCRXFile();
      await bucket.put(key, data, { contentType: 'application/x-crx' });

      const result = await bucket.get(key);

      expect(result.metadata.contentType).toBe('application/x-crx');
      expect(result.metadata.uploaded).toBeInstanceOf(Date);
    });
  });

  describe('deleteFile()', () => {
    it('should delete an existing file', async () => {
      const key = 'test-file.crx';
      await bucket.put(key, 'test data');

      await bucket.delete(key);

      expect(bucket.has(key)).toBe(false);
    });

    it('should delete multiple files at once', async () => {
      await bucket.put('file1.crx', 'data1');
      await bucket.put('file2.crx', 'data2');
      await bucket.put('file3.crx', 'data3');

      await bucket.delete(['file1.crx', 'file2.crx']);

      expect(bucket.has('file1.crx')).toBe(false);
      expect(bucket.has('file2.crx')).toBe(false);
      expect(bucket.has('file3.crx')).toBe(true);
    });

    it('should track delete operation in call history', async () => {
      const key = 'test-file.crx';
      await bucket.put(key, 'test data');
      bucket.clearCallHistory();

      await bucket.delete(key);

      const calls = bucket.getCallHistory('delete');
      expect(calls).toHaveLength(1);
    });

    it('should handle deletion of non-existent file gracefully', async () => {
      // Should not throw
      await expect(bucket.delete('non-existent.crx')).resolves.not.toThrow();
    });

    it('should throw error when simulated error is set', async () => {
      const key = 'error-file.crx';
      const error = new Error('Delete failed');
      bucket.simulateError(key, error);

      await expect(bucket.delete(key)).rejects.toThrow('Delete failed');
    });
  });

  describe('listFiles()', () => {
    beforeEach(async () => {
      await bucket.put('extensions/ext1/file.crx', 'data1');
      await bucket.put('extensions/ext2/file.crx', 'data2');
      await bucket.put('extensions/ext3/file.crx', 'data3');
      await bucket.put('logs/log.txt', 'log');
    });

    it('should list all files', async () => {
      const result = await bucket.list();

      expect(result.objects).toHaveLength(4);
    });

    it('should filter by prefix', async () => {
      const result = await bucket.list({ prefix: 'extensions/' });

      expect(result.objects).toHaveLength(3);
      expect(result.objects.every((obj: any) => obj.key.startsWith('extensions/'))).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const result = await bucket.list({ limit: 2 });

      expect(result.objects).toHaveLength(2);
      expect(result.truncated).toBe(true);
    });

    it('should include truncation flag', async () => {
      const result = await bucket.list({ limit: 2 });

      expect(result).toHaveProperty('truncated');
      expect(result.truncated).toBe(true);
    });

    it('should return cursor when truncated', async () => {
      const result = await bucket.list({ limit: 2 });

      expect(result.truncated).toBe(true);
      expect(result.cursor).toBeDefined();
    });

    it('should track list operation in call history', async () => {
      bucket.clearCallHistory();

      await bucket.list({ prefix: 'extensions/' });

      const calls = bucket.getCallHistory('list');
      expect(calls).toHaveLength(1);
    });

    it('should sort results alphabetically', async () => {
      const result = await bucket.list();

      const keys = result.objects.map((obj: any) => obj.key);
      expect(keys).toEqual([...keys].sort());
    });
  });

  describe('headFile()', () => {
    it('should get metadata without body', async () => {
      const key = 'test-file.crx';
      const data = createValidCRXFile();
      await bucket.put(key, data);

      const result = await bucket.head(key);

      expect(result).toBeDefined();
      expect(result.key).toBe(key);
      expect(result.metadata).toBeDefined();
    });

    it('should return null for non-existent file', async () => {
      const result = await bucket.head('non-existent.crx');

      expect(result).toBeNull();
    });

    it('should track head operation', async () => {
      const key = 'test-file.crx';
      await bucket.put(key, 'test data');
      bucket.clearCallHistory();

      await bucket.head(key);

      const calls = bucket.getCallHistory('head');
      expect(calls).toHaveLength(1);
    });
  });

  describe('fileExists()', () => {
    it('should return true for existing file', async () => {
      const key = 'test-file.crx';
      await bucket.put(key, 'test data');

      expect(bucket.has(key)).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      expect(bucket.has('non-existent.crx')).toBe(false);
    });
  });

  describe('getFileMetadata()', () => {
    it('should return file metadata', async () => {
      const key = 'test-file.crx';
      const data = createValidCRXFile();
      await bucket.put(key, data, { contentType: 'application/x-crx' });

      const result = await bucket.head(key);

      expect(result).toBeDefined();
      expect(result.metadata.size).toBe(data.length);
      expect(result.metadata.contentType).toBe('application/x-crx');
      expect(result.metadata.uploaded).toBeInstanceOf(Date);
    });

    it('should include ETag in metadata', async () => {
      const key = 'test-file.crx';
      await bucket.put(key, 'test data');

      const result = await bucket.head(key);

      expect(result.metadata.etag).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should clear simulated errors', async () => {
      const key = 'test-file.crx';
      bucket.simulateError(key, new Error('Test error'));

      bucket.clearErrors();

      await expect(bucket.put(key, 'test data')).resolves.not.toThrow();
    });

    it('should track multiple operations', async () => {
      const key1 = 'file1.crx';
      const key2 = 'file2.crx';

      await bucket.put(key1, 'data1');
      await bucket.get(key1);
      await bucket.put(key2, 'data2');
      await bucket.delete(key1);

      const history = bucket.getCallHistory();
      expect(history).toHaveLength(4);
      expect(history[0].method).toBe('put');
      expect(history[1].method).toBe('get');
      expect(history[2].method).toBe('put');
      expect(history[3].method).toBe('delete');
    });

    it('should handle concurrent operations', async () => {
      const operations = [];

      for (let i = 0; i < 10; i++) {
        operations.push(bucket.put(`file${i}.crx`, `data${i}`));
      }

      await Promise.all(operations);

      const result = await bucket.list();
      expect(result.objects).toHaveLength(10);
    });
  });

  describe('Performance and scale', () => {
    it('should handle large files', async () => {
      const largeData = new Uint8Array(52428800); // 50MB
      const result = await bucket.put('large-file.crx', largeData);

      expect(result.metadata.size).toBe(52428800);
    });

    it('should list many files efficiently', async () => {
      // Create 100 files
      for (let i = 0; i < 100; i++) {
        await bucket.put(`file${i}.crx`, `data${i}`);
      }

      const startTime = Date.now();
      const result = await bucket.list({ limit: 50 });
      const duration = Date.now() - startTime;

      expect(result.objects).toHaveLength(50);
      expect(duration).toBeLessThan(1000); // Should be fast
    });

    it('should handle bulk deletion', async () => {
      const keys = [];
      for (let i = 0; i < 50; i++) {
        const key = `file${i}.crx`;
        await bucket.put(key, `data${i}`);
        keys.push(key);
      }

      await bucket.delete(keys);

      const result = await bucket.list();
      expect(result.objects).toHaveLength(0);
    });
  });
});
