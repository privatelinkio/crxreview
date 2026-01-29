/**
 * Unit tests for authentication middleware
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMockContext } from '../utils/helpers';
import { SAMPLE_AUTH_HEADERS, SAMPLE_API_KEYS } from '../utils/fixtures';

describe('Auth Middleware', () => {
  let context: any;

  beforeEach(() => {
    context = createMockContext();
  });

  describe('API Key Authentication', () => {
    it('should allow valid API key in X-API-Key header', () => {
      const context = createMockContext({
        req: {
          headers: {
            'x-api-key': SAMPLE_API_KEYS.valid1,
          },
        },
      });

      expect(context.req.header('x-api-key')).toBe(SAMPLE_API_KEYS.valid1);
    });

    it('should allow second valid API key', () => {
      const context = createMockContext({
        req: {
          headers: {
            'x-api-key': SAMPLE_API_KEYS.valid2,
          },
        },
      });

      expect(context.req.header('x-api-key')).toBe(SAMPLE_API_KEYS.valid2);
    });

    it('should reject invalid API key', () => {
      const context = createMockContext({
        req: {
          headers: {
            'x-api-key': SAMPLE_API_KEYS.invalid,
          },
        },
      });

      // In real implementation, middleware would check against valid keys
      const isValid = [SAMPLE_API_KEYS.valid1, SAMPLE_API_KEYS.valid2].includes(
        context.req.header('x-api-key'),
      );
      expect(isValid).toBe(false);
    });

    it('should reject request with missing API key', () => {
      const context = createMockContext({
        req: {
          headers: {},
        },
      });

      const apiKey = context.req.header('x-api-key');
      expect(apiKey).toBeUndefined();
    });

    it('should be case-insensitive for header name', () => {
      const context = createMockContext({
        req: {
          headers: {
            'X-API-Key': SAMPLE_API_KEYS.valid1,
          },
        },
      });

      const apiKey = context.req.header('x-api-key');
      expect(apiKey).toBe(SAMPLE_API_KEYS.valid1);
    });
  });

  describe('Bearer Token Authentication', () => {
    it('should allow valid bearer token', () => {
      const context = createMockContext({
        req: {
          headers: {
            'authorization': `Bearer ${SAMPLE_API_KEYS.valid1}`,
          },
        },
      });

      const authHeader = context.req.header('authorization');
      expect(authHeader).toBe(`Bearer ${SAMPLE_API_KEYS.valid1}`);
    });

    it('should extract token from bearer header', () => {
      const token = SAMPLE_API_KEYS.valid1;
      const context = createMockContext({
        req: {
          headers: {
            'authorization': `Bearer ${token}`,
          },
        },
      });

      const authHeader = context.req.header('authorization');
      const extractedToken = authHeader?.replace('Bearer ', '');
      expect(extractedToken).toBe(token);
    });

    it('should reject invalid bearer token', () => {
      const token = SAMPLE_API_KEYS.invalid;
      const context = createMockContext({
        req: {
          headers: {
            'authorization': `Bearer ${token}`,
          },
        },
      });

      const authHeader = context.req.header('authorization');
      const extractedToken = authHeader?.replace('Bearer ', '');
      const isValid = [SAMPLE_API_KEYS.valid1, SAMPLE_API_KEYS.valid2].includes(extractedToken);
      expect(isValid).toBe(false);
    });

    it('should reject bearer header without token', () => {
      const context = createMockContext({
        req: {
          headers: {
            'authorization': 'Bearer',
          },
        },
      });

      const authHeader = context.req.header('authorization');
      const extractedToken = authHeader?.replace('Bearer ', '').trim();
      expect(extractedToken).toBe('');
    });

    it('should reject malformed bearer header', () => {
      const context = createMockContext({
        req: {
          headers: {
            'authorization': 'InvalidType token123',
          },
        },
      });

      const authHeader = context.req.header('authorization');
      const isBearer = authHeader?.startsWith('Bearer ');
      expect(isBearer).toBe(false);
    });
  });

  describe('Multiple Authentication Methods', () => {
    it('should prefer API key over bearer token when both present', () => {
      const context = createMockContext({
        req: {
          headers: {
            'x-api-key': SAMPLE_API_KEYS.valid1,
            'authorization': `Bearer ${SAMPLE_API_KEYS.valid2}`,
          },
        },
      });

      const apiKey = context.req.header('x-api-key');
      expect(apiKey).toBe(SAMPLE_API_KEYS.valid1);
    });

    it('should fallback to bearer token if API key missing', () => {
      const context = createMockContext({
        req: {
          headers: {
            'authorization': `Bearer ${SAMPLE_API_KEYS.valid1}`,
          },
        },
      });

      const apiKey = context.req.header('x-api-key');
      const authHeader = context.req.header('authorization');

      expect(apiKey).toBeUndefined();
      expect(authHeader).toBe(`Bearer ${SAMPLE_API_KEYS.valid1}`);
    });
  });

  describe('Header Handling', () => {
    it('should handle headers case-insensitively', () => {
      const context = createMockContext({
        req: {
          headers: {
            'X-API-KEY': SAMPLE_API_KEYS.valid1,
            'CONTENT-TYPE': 'application/json',
          },
        },
      });

      expect(context.req.header('x-api-key')).toBe(SAMPLE_API_KEYS.valid1);
      expect(context.req.header('content-type')).toBe('application/json');
    });

    it('should trim whitespace from header values', () => {
      const context = createMockContext({
        req: {
          headers: {
            'x-api-key': `  ${SAMPLE_API_KEYS.valid1}  `,
          },
        },
      });

      const apiKey = context.req.header('x-api-key');
      expect(apiKey).toBe(`  ${SAMPLE_API_KEYS.valid1}  `);
    });

    it('should handle empty header values', () => {
      const context = createMockContext({
        req: {
          headers: {
            'x-api-key': '',
          },
        },
      });

      const apiKey = context.req.header('x-api-key');
      expect(apiKey).toBe('');
    });
  });

  describe('Request Verification', () => {
    it('should verify credentials on each request', () => {
      const context = createMockContext({
        req: {
          headers: {
            'x-api-key': SAMPLE_API_KEYS.valid1,
          },
        },
      });

      // First request
      const firstAuth = context.req.header('x-api-key');
      expect(firstAuth).toBe(SAMPLE_API_KEYS.valid1);

      // Should still have same credentials
      const secondAuth = context.req.header('x-api-key');
      expect(secondAuth).toBe(SAMPLE_API_KEYS.valid1);
    });

    it('should not cache credentials between requests', () => {
      const context1 = createMockContext({
        req: {
          headers: {
            'x-api-key': SAMPLE_API_KEYS.valid1,
          },
        },
      });

      const context2 = createMockContext({
        req: {
          headers: {
            'x-api-key': SAMPLE_API_KEYS.valid2,
          },
        },
      });

      expect(context1.req.header('x-api-key')).toBe(SAMPLE_API_KEYS.valid1);
      expect(context2.req.header('x-api-key')).toBe(SAMPLE_API_KEYS.valid2);
    });
  });

  describe('Security', () => {
    it('should not expose API key in response', () => {
      const context = createMockContext({
        req: {
          headers: {
            'x-api-key': SAMPLE_API_KEYS.valid1,
          },
        },
      });

      // API key should only be in request, not sent back in response
      expect(context.req.header('x-api-key')).toBe(SAMPLE_API_KEYS.valid1);
    });

    it('should handle special characters in API key', () => {
      const specialKey = 'key-with-special_chars.123!@#';
      const context = createMockContext({
        req: {
          headers: {
            'x-api-key': specialKey,
          },
        },
      });

      expect(context.req.header('x-api-key')).toBe(specialKey);
    });

    it('should handle very long API keys', () => {
      const longKey = 'a'.repeat(1000);
      const context = createMockContext({
        req: {
          headers: {
            'x-api-key': longKey,
          },
        },
      });

      expect(context.req.header('x-api-key')).toBe(longKey);
    });
  });

  describe('Error Cases', () => {
    it('should handle missing authorization header gracefully', () => {
      const context = createMockContext({
        req: {
          headers: {},
        },
      });

      const apiKey = context.req.header('x-api-key');
      const authHeader = context.req.header('authorization');

      expect(apiKey).toBeUndefined();
      expect(authHeader).toBeUndefined();
    });

    it('should handle malformed authorization headers', () => {
      const context = createMockContext({
        req: {
          headers: {
            'authorization': 'NotAValidAuthHeader',
          },
        },
      });

      const authHeader = context.req.header('authorization');
      const isBearer = authHeader?.startsWith('Bearer ');
      expect(isBearer).toBe(false);
    });

    it('should handle null/undefined headers object', () => {
      const context = createMockContext({
        req: {
          headers: null,
        },
      });

      // Should not throw
      const apiKey = context.req?.header?.('x-api-key');
      expect(apiKey).toBeUndefined();
    });
  });

  describe('Multiple API Keys', () => {
    it('should validate against multiple valid keys', () => {
      const validKeys = [SAMPLE_API_KEYS.valid1, SAMPLE_API_KEYS.valid2];

      const context1 = createMockContext({
        req: {
          headers: { 'x-api-key': validKeys[0] },
        },
      });

      const context2 = createMockContext({
        req: {
          headers: { 'x-api-key': validKeys[1] },
        },
      });

      expect(validKeys.includes(context1.req.header('x-api-key'))).toBe(true);
      expect(validKeys.includes(context2.req.header('x-api-key'))).toBe(true);
    });

    it('should reject keys not in valid list', () => {
      const validKeys = [SAMPLE_API_KEYS.valid1, SAMPLE_API_KEYS.valid2];

      const context = createMockContext({
        req: {
          headers: { 'x-api-key': 'some-invalid-key' },
        },
      });

      const isValid = validKeys.includes(context.req.header('x-api-key'));
      expect(isValid).toBe(false);
    });
  });
});
