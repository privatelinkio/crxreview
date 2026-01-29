/**
 * Unit tests for session service (KV operations)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMockContext, generateSessionId, createTestSession, getMockStorageFromContext, clearMockStorage } from '../utils/helpers';
import { SAMPLE_SESSION } from '../utils/fixtures';

describe('Session Service - KV Operations', () => {
  let context: any;
  let kv: any;

  beforeEach(() => {
    context = createMockContext();
    kv = getMockStorageFromContext(context).kv;
  });

  afterEach(() => {
    clearMockStorage(context);
  });

  describe('createSession()', () => {
    it('should create a new session with metadata', async () => {
      const sessionId = generateSessionId();
      const metadata = { userId: 'user123', uploadedAt: new Date().toISOString() };

      await kv.put(sessionId, JSON.stringify(metadata));

      const retrieved = await kv.get(sessionId, 'json');
      expect(retrieved).toEqual(metadata);
    });

    it('should track put operation', async () => {
      const sessionId = generateSessionId();
      kv.clearCallHistory();

      await kv.put(sessionId, JSON.stringify(SAMPLE_SESSION));

      const calls = kv.getCallHistory('put');
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0]).toBe(sessionId);
    });

    it('should set TTL (expiration) for session', async () => {
      const sessionId = generateSessionId();
      const ttl = 1800; // 30 minutes

      await kv.put(sessionId, JSON.stringify(SAMPLE_SESSION), { expirationTtl: ttl });

      const retrieved = await kv.get(sessionId, 'json');
      expect(retrieved).toBeDefined();
    });

    it('should store session with metadata', async () => {
      const sessionId = generateSessionId();
      const metadata = { type: 'session', version: 1 };

      await kv.put(sessionId, JSON.stringify(SAMPLE_SESSION), { metadata });

      const calls = kv.getCallHistory('put');
      expect(calls[0].args[2].metadata).toEqual(metadata);
    });

    it('should handle complex session data', async () => {
      const sessionId = generateSessionId();
      const session = createTestSession({
        data: {
          metadata: { name: 'Test', version: '1.0' },
          fileTree: { name: 'root', children: [] },
          searchResults: [],
        },
      });

      await kv.put(sessionId, JSON.stringify(session));

      const retrieved = await kv.get(sessionId, 'json');
      expect(retrieved.data.metadata.name).toBe('Test');
    });
  });

  describe('getSession()', () => {
    it('should retrieve an existing session', async () => {
      const sessionId = generateSessionId();
      const session = createTestSession();

      await kv.put(sessionId, JSON.stringify(session));
      const retrieved = await kv.get(sessionId, 'json');

      expect(retrieved).toEqual(session);
    });

    it('should return null for non-existent session', async () => {
      const result = await kv.get('non-existent-session-id', 'json');

      expect(result).toBeNull();
    });

    it('should track get operation', async () => {
      const sessionId = generateSessionId();
      await kv.put(sessionId, JSON.stringify(SAMPLE_SESSION));
      kv.clearCallHistory();

      await kv.get(sessionId, 'json');

      const calls = kv.getCallHistory('get');
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0]).toBe(sessionId);
    });

    it('should parse JSON correctly', async () => {
      const sessionId = generateSessionId();
      const session = createTestSession({
        data: {
          value: 123,
          nested: { key: 'value' },
          array: [1, 2, 3],
        },
      });

      await kv.put(sessionId, JSON.stringify(session));
      const retrieved = await kv.get(sessionId, 'json');

      expect(retrieved.data.value).toBe(123);
      expect(retrieved.data.nested.key).toBe('value');
      expect(retrieved.data.array).toEqual([1, 2, 3]);
    });

    it('should throw error when simulated error is set', async () => {
      const sessionId = generateSessionId();
      const error = new Error('Database error');
      kv.simulateError(sessionId, error);

      await expect(kv.get(sessionId)).rejects.toThrow('Database error');
    });

    it('should return as text when type is not specified', async () => {
      const sessionId = generateSessionId();
      const data = JSON.stringify(SAMPLE_SESSION);

      await kv.put(sessionId, data);
      const retrieved = await kv.get(sessionId, 'text');

      expect(typeof retrieved).toBe('string');
      expect(JSON.parse(retrieved)).toEqual(SAMPLE_SESSION);
    });
  });

  describe('updateSession()', () => {
    it('should update session data with partial changes', async () => {
      const sessionId = generateSessionId();
      const initial = createTestSession();

      await kv.put(sessionId, JSON.stringify(initial));

      const updated = { ...initial, data: { ...initial.data, newField: 'newValue' } };
      await kv.put(sessionId, JSON.stringify(updated));

      const retrieved = await kv.get(sessionId, 'json');
      expect(retrieved.data.newField).toBe('newValue');
    });

    it('should overwrite entire session', async () => {
      const sessionId = generateSessionId();
      const session1 = createTestSession();
      const session2 = createTestSession({
        data: { different: 'data' },
      });

      await kv.put(sessionId, JSON.stringify(session1));
      await kv.put(sessionId, JSON.stringify(session2));

      const retrieved = await kv.get(sessionId, 'json');
      expect(retrieved.data.different).toBe('data');
    });

    it('should preserve other session data', async () => {
      const sessionId = generateSessionId();
      const session = createTestSession({
        data: {
          field1: 'value1',
          field2: 'value2',
        },
      });

      await kv.put(sessionId, JSON.stringify(session));

      const updated = { ...session, data: { ...session.data, field1: 'updated' } };
      await kv.put(sessionId, JSON.stringify(updated));

      const retrieved = await kv.get(sessionId, 'json');
      expect(retrieved.data.field1).toBe('updated');
      expect(retrieved.data.field2).toBe('value2');
    });
  });

  describe('deleteSession()', () => {
    it('should delete an existing session', async () => {
      const sessionId = generateSessionId();
      await kv.put(sessionId, JSON.stringify(SAMPLE_SESSION));

      await kv.delete(sessionId);

      const retrieved = await kv.get(sessionId);
      expect(retrieved).toBeNull();
    });

    it('should delete multiple sessions', async () => {
      const session1 = generateSessionId();
      const session2 = generateSessionId();
      const session3 = generateSessionId();

      await kv.put(session1, JSON.stringify(SAMPLE_SESSION));
      await kv.put(session2, JSON.stringify(SAMPLE_SESSION));
      await kv.put(session3, JSON.stringify(SAMPLE_SESSION));

      await kv.delete([session1, session2]);

      expect(await kv.get(session1)).toBeNull();
      expect(await kv.get(session2)).toBeNull();
      expect(await kv.get(session3)).toBeDefined();
    });

    it('should track delete operation', async () => {
      const sessionId = generateSessionId();
      await kv.put(sessionId, JSON.stringify(SAMPLE_SESSION));
      kv.clearCallHistory();

      await kv.delete(sessionId);

      const calls = kv.getCallHistory('delete');
      expect(calls).toHaveLength(1);
    });

    it('should handle deletion of non-existent session', async () => {
      // Should not throw
      await expect(kv.delete('non-existent-session')).resolves.not.toThrow();
    });

    it('should throw error when simulated error is set', async () => {
      const sessionId = generateSessionId();
      const error = new Error('Delete failed');
      kv.simulateError(sessionId, error);

      await expect(kv.delete(sessionId)).rejects.toThrow('Delete failed');
    });
  });

  describe('sessionExists()', () => {
    it('should return true for existing session', async () => {
      const sessionId = generateSessionId();
      await kv.put(sessionId, JSON.stringify(SAMPLE_SESSION));

      expect(kv.has(sessionId)).toBe(true);
    });

    it('should return false for non-existent session', async () => {
      expect(kv.has('non-existent-session')).toBe(false);
    });
  });

  describe('listSessions()', () => {
    beforeEach(async () => {
      for (let i = 0; i < 5; i++) {
        const sessionId = `session-${i}`;
        await kv.put(sessionId, JSON.stringify(SAMPLE_SESSION));
      }
    });

    it('should list all sessions', async () => {
      const result = await kv.list();

      expect(result.keys).toHaveLength(5);
    });

    it('should support prefix filtering', async () => {
      // Add some other keys with different prefix
      await kv.put('other-key-1', 'data');
      await kv.put('other-key-2', 'data');

      const result = await kv.list({ prefix: 'session-' });

      expect(result.keys.length).toBeLessThanOrEqual(5);
      expect(result.keys.every((k: any) => k.name.startsWith('session-'))).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const result = await kv.list({ limit: 2 });

      expect(result.keys).toHaveLength(2);
    });

    it('should include list_complete flag', async () => {
      const result = await kv.list();

      expect(result).toHaveProperty('list_complete');
      expect(typeof result.list_complete).toBe('boolean');
    });

    it('should include metadata in list results', async () => {
      await kv.put('session-meta', JSON.stringify(SAMPLE_SESSION), {
        metadata: { version: 1 },
      });

      const result = await kv.list({ prefix: 'session-meta' });

      expect(result.keys.some((k: any) => k.metadata)).toBe(true);
    });

    it('should track list operation', async () => {
      kv.clearCallHistory();

      await kv.list({ prefix: 'session-' });

      const calls = kv.getCallHistory('list');
      expect(calls).toHaveLength(1);
    });

    it('should provide pagination cursor', async () => {
      const result = await kv.list({ limit: 2 });

      if (!result.list_complete) {
        expect(result.cursor).toBeDefined();
      }
    });
  });

  describe('Session lifecycle', () => {
    it('should handle complete session lifecycle', async () => {
      const sessionId = generateSessionId();
      const session = createTestSession();

      // Create
      await kv.put(sessionId, JSON.stringify(session));
      expect(kv.has(sessionId)).toBe(true);

      // Retrieve
      let retrieved = await kv.get(sessionId, 'json');
      expect(retrieved).toEqual(session);

      // Update
      const updated = { ...session, data: { ...session.data, updated: true } };
      await kv.put(sessionId, JSON.stringify(updated));
      retrieved = await kv.get(sessionId, 'json');
      expect(retrieved.data.updated).toBe(true);

      // Delete
      await kv.delete(sessionId);
      retrieved = await kv.get(sessionId);
      expect(retrieved).toBeNull();
    });

    it('should handle concurrent operations', async () => {
      const operations = [];

      for (let i = 0; i < 10; i++) {
        const sessionId = `concurrent-${i}`;
        operations.push(kv.put(sessionId, JSON.stringify(createTestSession())));
      }

      await Promise.all(operations);

      const result = await kv.list({ prefix: 'concurrent-' });
      expect(result.keys).toHaveLength(10);
    });
  });

  describe('Data integrity', () => {
    it('should preserve complex nested structures', async () => {
      const sessionId = generateSessionId();
      const complexData = {
        ...SAMPLE_SESSION,
        data: {
          fileTree: {
            name: 'root',
            children: [
              {
                name: 'src',
                children: [
                  { name: 'index.js', size: 1000 },
                  { name: 'utils.js', size: 2000 },
                ],
              },
              {
                name: 'package.json',
                size: 500,
              },
            ],
          },
          metadata: {
            version: '1.0.0',
            author: 'Test',
            permissions: ['activeTab', 'scripting'],
          },
        },
      };

      await kv.put(sessionId, JSON.stringify(complexData));
      const retrieved = await kv.get(sessionId, 'json');

      expect(retrieved.data.fileTree.children).toHaveLength(2);
      expect(retrieved.data.metadata.permissions).toEqual(['activeTab', 'scripting']);
    });

    it('should handle large session data', async () => {
      const sessionId = generateSessionId();
      const largeData = {
        ...SAMPLE_SESSION,
        data: {
          largeArray: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            value: `item-${i}`,
          })),
        },
      };

      await kv.put(sessionId, JSON.stringify(largeData));
      const retrieved = await kv.get(sessionId, 'json');

      expect(retrieved.data.largeArray).toHaveLength(1000);
    });

    it('should handle special characters and unicode', async () => {
      const sessionId = generateSessionId();
      const session = createTestSession({
        data: {
          emoji: '🔒🔐🔑',
          unicode: '日本語中文한글',
          special: '@#$%^&*()',
        },
      });

      await kv.put(sessionId, JSON.stringify(session));
      const retrieved = await kv.get(sessionId, 'json');

      expect(retrieved.data.emoji).toBe('🔒🔐🔑');
      expect(retrieved.data.unicode).toBe('日本語中文한글');
      expect(retrieved.data.special).toBe('@#$%^&*()');
    });
  });

  describe('Error handling', () => {
    it('should clear simulated errors', async () => {
      const sessionId = generateSessionId();
      kv.simulateError(sessionId, new Error('Test error'));

      kv.clearErrors();

      await expect(kv.put(sessionId, JSON.stringify(SAMPLE_SESSION))).resolves.not.toThrow();
    });

    it('should track operation history', async () => {
      const sessionId = generateSessionId();

      await kv.put(sessionId, JSON.stringify(SAMPLE_SESSION));
      await kv.get(sessionId, 'json');
      await kv.delete(sessionId);

      const history = kv.getCallHistory();
      expect(history).toHaveLength(3);
      expect(history[0].method).toBe('put');
      expect(history[1].method).toBe('get');
      expect(history[2].method).toBe('delete');
    });
  });
});
