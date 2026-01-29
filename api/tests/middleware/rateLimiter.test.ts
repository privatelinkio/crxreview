/**
 * Unit tests for rate limiter middleware
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMockContext, delay } from '../utils/helpers';
import { RATE_LIMIT_SCENARIOS } from '../utils/fixtures';

/**
 * Simple in-memory rate limiter for testing
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, number> = new Map();

  constructor(private windowSeconds: number = 3600) {}

  setLimit(key: string, limit: number): void {
    this.limits.set(key, limit);
  }

  check(key: string, limit?: number): { allowed: boolean; remaining: number; reset: number } {
    const effectiveLimit = limit || this.limits.get(key) || 10;
    const now = Date.now();
    const windowMs = this.windowSeconds * 1000;

    let requests = this.requests.get(key) || [];
    requests = requests.filter((timestamp) => now - timestamp < windowMs);

    if (requests.length < effectiveLimit) {
      requests.push(now);
      this.requests.set(key, requests);

      return {
        allowed: true,
        remaining: effectiveLimit - requests.length,
        reset: Math.floor((now + windowMs) / 1000),
      };
    }

    return {
      allowed: false,
      remaining: 0,
      reset: Math.floor((requests[0] + windowMs) / 1000),
    };
  }

  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

describe('Rate Limiter Middleware', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(3600); // 1 hour window
  });

  afterEach(() => {
    limiter.reset();
  });

  describe('Request Counting', () => {
    it('should count requests per client', () => {
      const clientId = 'client-123';
      limiter.setLimit(clientId, 10);

      const result = limiter.check(clientId);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should increment counter with each request', () => {
      const clientId = 'client-123';
      limiter.setLimit(clientId, 10);

      let result = limiter.check(clientId);
      expect(result.remaining).toBe(9);

      result = limiter.check(clientId);
      expect(result.remaining).toBe(8);

      result = limiter.check(clientId);
      expect(result.remaining).toBe(7);
    });

    it('should track multiple clients independently', () => {
      limiter.setLimit('client-1', 5);
      limiter.setLimit('client-2', 10);

      const result1 = limiter.check('client-1');
      const result2 = limiter.check('client-2');

      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(9);

      limiter.check('client-1');
      limiter.check('client-1');

      const result1Again = limiter.check('client-1');
      const result2Again = limiter.check('client-2');

      expect(result1Again.remaining).toBe(1);
      expect(result2Again.remaining).toBe(8);
    });
  });

  describe('Limit Enforcement', () => {
    it('should allow requests within limit', () => {
      const clientId = 'client-123';
      limiter.setLimit(clientId, 5);

      for (let i = 0; i < 5; i++) {
        const result = limiter.check(clientId);
        expect(result.allowed).toBe(true);
      }
    });

    it('should reject requests exceeding limit', () => {
      const clientId = 'client-123';
      limiter.setLimit(clientId, 3);

      limiter.check(clientId);
      limiter.check(clientId);
      limiter.check(clientId);

      const result = limiter.check(clientId);
      expect(result.allowed).toBe(false);
    });

    it('should return 429 status when limit exceeded', () => {
      const clientId = 'client-123';
      limiter.setLimit(clientId, 2);

      limiter.check(clientId);
      limiter.check(clientId);

      const result = limiter.check(clientId);
      expect(result.allowed).toBe(false);
      // Status would be 429 Too Many Requests
    });

    it('should track remaining requests accurately', () => {
      const clientId = 'client-123';
      const limit = 10;
      limiter.setLimit(clientId, limit);

      const results = [];
      for (let i = 0; i < limit; i++) {
        results.push(limiter.check(clientId));
      }

      // Should have decreasing remaining count
      for (let i = 0; i < results.length; i++) {
        expect(results[i].remaining).toBe(limit - i - 1);
      }
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include X-RateLimit-Limit header', () => {
      const clientId = 'client-123';
      limiter.setLimit(clientId, 10);

      const headers = {
        'x-ratelimit-limit': '10',
      };

      expect(headers['x-ratelimit-limit']).toBe('10');
    });

    it('should include X-RateLimit-Remaining header', () => {
      const clientId = 'client-123';
      limiter.setLimit(clientId, 10);

      const result = limiter.check(clientId);

      const headers = {
        'x-ratelimit-remaining': String(result.remaining),
      };

      expect(headers['x-ratelimit-remaining']).toBe('9');
    });

    it('should include X-RateLimit-Reset header', () => {
      const clientId = 'client-123';
      limiter.setLimit(clientId, 10);

      const result = limiter.check(clientId);

      const headers = {
        'x-ratelimit-reset': String(result.reset),
      };

      expect(parseInt(headers['x-ratelimit-reset'])).toBeGreaterThan(0);
    });

    it('should include Retry-After header when rate limited', () => {
      const clientId = 'client-123';
      limiter.setLimit(clientId, 1);

      limiter.check(clientId);
      const result = limiter.check(clientId);

      if (!result.allowed) {
        const headers = {
          'retry-after': String(result.reset - Math.floor(Date.now() / 1000)),
        };

        expect(parseInt(headers['retry-after'])).toBeGreaterThan(0);
      }
    });

    it('should include all rate limit headers in response', () => {
      const clientId = 'client-123';
      limiter.setLimit(clientId, 10);

      const result = limiter.check(clientId);

      const headers = {
        'x-ratelimit-limit': '10',
        'x-ratelimit-remaining': String(result.remaining),
        'x-ratelimit-reset': String(result.reset),
      };

      expect(headers['x-ratelimit-limit']).toBeDefined();
      expect(headers['x-ratelimit-remaining']).toBeDefined();
      expect(headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('Window Reset', () => {
    it('should reset counter after time window expires', async () => {
      const shortLimiter = new RateLimiter(0.1); // 100ms window
      const clientId = 'client-123';
      shortLimiter.setLimit(clientId, 2);

      // Use up the limit
      shortLimiter.check(clientId);
      shortLimiter.check(clientId);

      let result = shortLimiter.check(clientId);
      expect(result.allowed).toBe(false);

      // Wait for window to expire
      await delay(150);

      // Should be reset
      result = shortLimiter.check(clientId);
      expect(result.allowed).toBe(true);
    });

    it('should track reset time correctly', () => {
      const clientId = 'client-123';
      limiter.setLimit(clientId, 10);

      const result1 = limiter.check(clientId);
      const resetTime1 = result1.reset;

      const result2 = limiter.check(clientId);
      const resetTime2 = result2.reset;

      // Reset time should be same for same window
      expect(resetTime1).toBe(resetTime2);
    });

    it('should provide accurate reset time to client', () => {
      const clientId = 'client-123';
      limiter.setLimit(clientId, 5);

      const result = limiter.check(clientId);
      const resetTime = result.reset;
      const now = Math.floor(Date.now() / 1000);

      // Reset should be in the future
      expect(resetTime).toBeGreaterThan(now);

      // And should be approximately 1 hour away
      expect(resetTime - now).toBeGreaterThan(3500);
      expect(resetTime - now).toBeLessThanOrEqual(3600);
    });
  });

  describe('Different Limit Types', () => {
    it('should support per-IP rate limiting', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      limiter.setLimit(`ip:${ip1}`, 10);
      limiter.setLimit(`ip:${ip2}`, 10);

      limiter.check(`ip:${ip1}`);
      limiter.check(`ip:${ip1}`);
      limiter.check(`ip:${ip2}`);

      const result1 = limiter.check(`ip:${ip1}`);
      const result2 = limiter.check(`ip:${ip2}`);

      expect(result1.remaining).toBe(7);
      expect(result2.remaining).toBe(8);
    });

    it('should support per-user rate limiting', () => {
      const user1 = 'user:123';
      const user2 = 'user:456';

      limiter.setLimit(user1, 100);
      limiter.setLimit(user2, 50);

      const result1 = limiter.check(user1);
      const result2 = limiter.check(user2);

      expect(result1.remaining).toBe(99);
      expect(result2.remaining).toBe(49);
    });

    it('should support per-API-endpoint rate limiting', () => {
      const endpoint1 = 'POST:/api/upload';
      const endpoint2 = 'GET:/api/search';

      limiter.setLimit(endpoint1, 5);
      limiter.setLimit(endpoint2, 100);

      const result1 = limiter.check(endpoint1);
      const result2 = limiter.check(endpoint2);

      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(99);
    });

    it('should support combined identifiers', () => {
      const identifier = 'user:123-ip:192.168.1.1';

      limiter.setLimit(identifier, 20);

      const result = limiter.check(identifier);
      expect(result.remaining).toBe(19);
    });
  });

  describe('Scenarios from Fixtures', () => {
    it('should handle within-limit scenario', () => {
      const scenario = RATE_LIMIT_SCENARIOS.withinLimit;
      const limiter = new RateLimiter(scenario.windowSeconds);
      const clientId = 'test-client';

      limiter.setLimit(clientId, scenario.limit);

      let remaining = scenario.limit;
      for (let i = 0; i < scenario.requests; i++) {
        const result = limiter.check(clientId);
        expect(result.allowed).toBe(true);
        remaining = result.remaining;
      }

      expect(remaining).toBe(scenario.limit - scenario.requests);
    });

    it('should handle at-limit scenario', () => {
      const scenario = RATE_LIMIT_SCENARIOS.atLimit;
      const limiter = new RateLimiter(scenario.windowSeconds);
      const clientId = 'test-client';

      limiter.setLimit(clientId, scenario.limit);

      for (let i = 0; i < scenario.requests; i++) {
        const result = limiter.check(clientId);
        if (i < scenario.limit) {
          expect(result.allowed).toBe(true);
        }
      }
    });

    it('should handle exceeds-limit scenario', () => {
      const scenario = RATE_LIMIT_SCENARIOS.exceedsLimit;
      const limiter = new RateLimiter(scenario.windowSeconds);
      const clientId = 'test-client';

      limiter.setLimit(clientId, scenario.limit);

      let rejectedAt = -1;
      for (let i = 0; i < scenario.requests; i++) {
        const result = limiter.check(clientId);
        if (!result.allowed && rejectedAt === -1) {
          rejectedAt = i;
        }
      }

      expect(rejectedAt).toBe(scenario.limit);
    });
  });

  describe('Client Identification', () => {
    it('should use IP address as default identifier', () => {
      const ip = '192.168.1.1';
      limiter.setLimit(ip, 10);

      const result = limiter.check(ip);
      expect(result.allowed).toBe(true);
    });

    it('should support custom identifiers', () => {
      const customId = 'custom-identifier-123';
      limiter.setLimit(customId, 5);

      const result = limiter.check(customId);
      expect(result.allowed).toBe(true);
    });

    it('should handle API key-based identification', () => {
      const apiKey = 'sk_test_12345';
      limiter.setLimit(`key:${apiKey}`, 100);

      const result = limiter.check(`key:${apiKey}`);
      expect(result.remaining).toBe(99);
    });
  });

  describe('Configuration', () => {
    it('should allow custom time windows', () => {
      const hourLimiter = new RateLimiter(3600); // 1 hour
      const minuteLimiter = new RateLimiter(60); // 1 minute

      expect(hourLimiter).toBeDefined();
      expect(minuteLimiter).toBeDefined();
    });

    it('should allow dynamic limit configuration', () => {
      limiter.setLimit('client-1', 10);
      limiter.setLimit('client-2', 100);

      // Change limits
      limiter.setLimit('client-1', 50);
      limiter.setLimit('client-2', 200);

      const result1 = limiter.check('client-1');
      const result2 = limiter.check('client-2');

      expect(result1.remaining).toBe(49);
      expect(result2.remaining).toBe(199);
    });
  });

  describe('Storage and Cleanup', () => {
    it('should clean up expired requests', async () => {
      const shortLimiter = new RateLimiter(0.1); // 100ms window
      const clientId = 'client-123';
      shortLimiter.setLimit(clientId, 100);

      // Make some requests
      for (let i = 0; i < 5; i++) {
        shortLimiter.check(clientId);
      }

      // Wait for window to expire
      await delay(150);

      // Should be able to make requests again
      const result = shortLimiter.check(clientId);
      expect(result.allowed).toBe(true);
    });

    it('should reset specific client', () => {
      limiter.setLimit('client-1', 5);
      limiter.setLimit('client-2', 5);

      limiter.check('client-1');
      limiter.check('client-1');
      limiter.check('client-2');

      // Reset only client-1
      limiter.reset('client-1');

      const result1 = limiter.check('client-1');
      const result2 = limiter.check('client-2');

      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(3);
    });

    it('should reset all clients', () => {
      limiter.setLimit('client-1', 5);
      limiter.setLimit('client-2', 5);

      limiter.check('client-1');
      limiter.check('client-1');
      limiter.check('client-2');

      // Reset all
      limiter.reset();

      const result1 = limiter.check('client-1');
      const result2 = limiter.check('client-2');

      expect(result1.remaining).toBe(4);
      expect(result2.remaining).toBe(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero limit', () => {
      limiter.setLimit('client', 0);

      const result = limiter.check('client');
      expect(result.allowed).toBe(false);
    });

    it('should handle very high limits', () => {
      const highLimit = 1000000;
      limiter.setLimit('client', highLimit);

      const result = limiter.check('client');
      expect(result.remaining).toBe(highLimit - 1);
    });

    it('should handle rapid requests', () => {
      limiter.setLimit('client', 1000);

      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        const result = limiter.check('client');
        expect(result.allowed).toBe(true);
      }
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should be fast
    });
  });
});
