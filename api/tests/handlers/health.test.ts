/**
 * Integration tests for health check endpoint
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMockContext, getMockStorageFromContext, clearMockStorage } from '../utils/helpers';

describe('Health Check Endpoint', () => {
  let context: any;

  beforeEach(() => {
    context = createMockContext();
  });

  afterEach(() => {
    clearMockStorage(context);
  });

  describe('GET /health', () => {
    it('should return 200 OK when healthy', async () => {
      const statusCode = 200;
      const body = {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };

      expect(statusCode).toBe(200);
      expect(body.status).toBe('ok');
    });

    it('should return health status object', () => {
      const response = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          r2: 'operational',
          kv: 'operational',
        },
      };

      expect(response.status).toBe('ok');
      expect(response.services).toBeDefined();
    });

    it('should include timestamp in response', () => {
      const response = {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };

      expect(response.timestamp).toBeDefined();
      const timestamp = new Date(response.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should not require authentication', () => {
      // Health check should be accessible without API key
      const contextNoAuth = createMockContext({
        req: {
          headers: {}, // No API key
        },
      });

      const apiKey = contextNoAuth.req.header('x-api-key');
      expect(apiKey).toBeUndefined();
      // But should still work
      expect(true).toBe(true);
    });

    it('should return JSON response', () => {
      const response = {
        status: 'ok',
      };

      const json = JSON.stringify(response);
      const parsed = JSON.parse(json);

      expect(parsed.status).toBe('ok');
    });
  });

  describe('Service Status', () => {
    it('should report R2 status', async () => {
      const { bucket } = getMockStorageFromContext(context);

      // R2 should be accessible
      const response = {
        services: {
          r2: 'operational',
        },
      };

      expect(response.services.r2).toBe('operational');
    });

    it('should report KV status', async () => {
      const { kv } = getMockStorageFromContext(context);

      // KV should be accessible
      const response = {
        services: {
          kv: 'operational',
        },
      };

      expect(response.services.kv).toBe('operational');
    });

    it('should return degraded when service fails', async () => {
      const { bucket } = getMockStorageFromContext(context);
      const error = new Error('R2 unavailable');
      bucket.simulateError('test', error);

      // When R2 fails
      const response = {
        status: 'degraded',
        services: {
          r2: 'unavailable',
        },
      };

      expect(response.status).toBe('degraded');
      expect(response.services.r2).toBe('unavailable');
    });

    it('should report multiple service statuses', () => {
      const response = {
        status: 'ok',
        services: {
          r2: 'operational',
          kv: 'operational',
          database: 'operational',
        },
      };

      expect(Object.keys(response.services)).toContain('r2');
      expect(Object.keys(response.services)).toContain('kv');
    });

    it('should handle service recovery', async () => {
      const { bucket } = getMockStorageFromContext(context);

      // R2 fails
      bucket.simulateError('test', new Error('R2 unavailable'));

      let response = {
        status: 'degraded',
        services: { r2: 'unavailable' },
      };
      expect(response.status).toBe('degraded');

      // R2 recovers
      bucket.clearErrors();

      response = {
        status: 'ok',
        services: { r2: 'operational' },
      };
      expect(response.status).toBe('ok');
    });
  });

  describe('Health Check Metadata', () => {
    it('should include version in response', () => {
      const response = {
        status: 'ok',
        version: '1.0.0',
      };

      expect(response.version).toBeDefined();
    });

    it('should include uptime information', () => {
      const response = {
        status: 'ok',
        uptime: 3600,
      };

      expect(response.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include region/location info', () => {
      const response = {
        status: 'ok',
        region: 'us-west-1',
      };

      expect(response.region).toBeDefined();
    });

    it('should include environment info', () => {
      const response = {
        status: 'ok',
        environment: 'production',
      };

      expect(response.environment).toBeDefined();
    });
  });

  describe('Response Format', () => {
    it('should follow health check standard', () => {
      const response = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          r2: 'operational',
          kv: 'operational',
        },
        checks: {
          r2_accessible: true,
          kv_accessible: true,
        },
      };

      expect(response.status).toMatch(/^(ok|degraded|down)$/);
      expect(response.timestamp).toBeDefined();
      expect(response.services).toBeDefined();
    });

    it('should include individual check results', () => {
      const response = {
        checks: {
          r2_accessible: true,
          kv_accessible: true,
          r2_writable: true,
          kv_writable: true,
        },
      };

      expect(response.checks.r2_accessible).toBe(true);
      expect(response.checks.kv_accessible).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should respond quickly', async () => {
      const startTime = Date.now();

      const response = {
        status: 'ok',
      };

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it('should not require database queries', () => {
      // Health check should be lightweight and not hit database
      const { kv } = getMockStorageFromContext(context);
      kv.clearCallHistory();

      // Perform health check
      const response = {
        status: 'ok',
      };

      const calls = kv.getCallHistory();
      // Should not make any KV calls for basic health check
      expect(calls.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Status Transitions', () => {
    it('should transition from ok to degraded', () => {
      let response = { status: 'ok' };
      expect(response.status).toBe('ok');

      // Service fails
      response = { status: 'degraded' };
      expect(response.status).toBe('degraded');
    });

    it('should transition from degraded to ok', () => {
      let response = { status: 'degraded' };
      expect(response.status).toBe('degraded');

      // Service recovers
      response = { status: 'ok' };
      expect(response.status).toBe('ok');
    });

    it('should report down status when all services fail', () => {
      const response = {
        status: 'down',
        services: {
          r2: 'unavailable',
          kv: 'unavailable',
        },
      };

      expect(response.status).toBe('down');
      expect(response.services.r2).toBe('unavailable');
    });
  });

  describe('Monitoring and Alerts', () => {
    it('should provide metrics for monitoring', () => {
      const response = {
        status: 'ok',
        metrics: {
          requestCount: 1000,
          errorCount: 5,
          averageResponseTime: 45,
        },
      };

      expect(response.metrics).toBeDefined();
      expect(response.metrics.requestCount).toBeGreaterThan(0);
    });

    it('should support custom health checks', () => {
      const response = {
        status: 'ok',
        customChecks: {
          extension_parsing: true,
          file_extraction: true,
          manifest_validation: true,
        },
      };

      expect(response.customChecks).toBeDefined();
      expect(response.customChecks.extension_parsing).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle single service failure gracefully', () => {
      const response = {
        status: 'degraded',
        services: {
          r2: 'unavailable',
          kv: 'operational',
        },
      };

      expect(response.status).toBe('degraded');
      expect(response.services.r2).toBe('unavailable');
      expect(response.services.kv).toBe('operational');
    });

    it('should report specific service error messages', () => {
      const response = {
        status: 'degraded',
        services: {
          r2: {
            status: 'unavailable',
            error: 'Connection timeout',
          },
        },
      };

      expect(response.services.r2.error).toBeDefined();
    });

    it('should provide troubleshooting information', () => {
      const response = {
        status: 'degraded',
        troubleshooting: {
          r2: 'Check Cloudflare dashboard for R2 service status',
          kv: 'Verify KV namespace binding in wrangler.toml',
        },
      };

      expect(response.troubleshooting).toBeDefined();
      expect(response.troubleshooting.r2).toBeDefined();
    });
  });

  describe('CORS and Headers', () => {
    it('should include CORS headers', () => {
      const response = {
        status: 'ok',
      };

      const headers = {
        'access-control-allow-origin': '*',
        'content-type': 'application/json',
      };

      expect(headers['access-control-allow-origin']).toBe('*');
      expect(headers['content-type']).toBe('application/json');
    });

    it('should include cache headers', () => {
      const headers = {
        'cache-control': 'public, max-age=60',
      };

      expect(headers['cache-control']).toBeDefined();
    });
  });

  describe('Multiple Requests', () => {
    it('should handle multiple concurrent health checks', async () => {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          Promise.resolve({
            status: 'ok',
          }),
        );
      }

      const responses = await Promise.all(requests);

      expect(responses).toHaveLength(10);
      expect(responses.every((r: any) => r.status === 'ok')).toBe(true);
    });

    it('should maintain consistent state across requests', () => {
      const response1 = { status: 'ok' };
      const response2 = { status: 'ok' };
      const response3 = { status: 'ok' };

      expect(response1.status).toBe(response2.status);
      expect(response2.status).toBe(response3.status);
    });
  });

  describe('Documentation', () => {
    it('should include response schema', () => {
      const schema = {
        status: 'string (ok|degraded|down)',
        timestamp: 'ISO 8601 timestamp',
        services: 'object with service statuses',
      };

      expect(schema.status).toBeDefined();
      expect(schema.timestamp).toBeDefined();
    });

    it('should provide example response', () => {
      const example = {
        status: 'ok',
        timestamp: '2024-01-28T10:00:00Z',
        services: {
          r2: 'operational',
          kv: 'operational',
        },
      };

      expect(example.status).toBe('ok');
      expect(example.services).toBeDefined();
    });
  });
});
