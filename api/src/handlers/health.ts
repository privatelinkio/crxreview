/**
 * Health Check Handler - GET /health
 *
 * Checks the health of API services (R2, KV) and returns status.
 */

import type { AppContext, HealthResponse } from '../types';
import { successResponse, serviceUnavailableResponse } from '../utils/response';
import { log } from '../utils/logger';

/**
 * Health check handler
 */
export async function healthHandler(c: AppContext): Promise<Response> {
  const startTime = Date.now();

  try {
    log.info('Performing health check');

    const checks = {
      r2: false,
      kv: false,
    };

    // Check R2 connection
    try {
      // Attempt to list files (limit 1 to minimize overhead)
      await c.env.CRX_STORAGE.list({ limit: 1 });
      checks.r2 = true;
    } catch (error) {
      log.error('R2 health check failed', error);
      checks.r2 = false;
    }

    // Check KV connection
    try {
      // Attempt to get a non-existent key (should return null, but proves connection works)
      await c.env.SESSIONS.get('health_check_key');
      checks.kv = true;
    } catch (error) {
      log.error('KV health check failed', error);
      checks.kv = false;
    }

    // Determine overall status
    const allHealthy = checks.r2 && checks.kv;
    const someHealthy = checks.r2 || checks.kv;

    const status: 'ok' | 'degraded' | 'error' = allHealthy
      ? 'ok'
      : someHealthy
      ? 'degraded'
      : 'error';

    // Build response
    const response: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      version: c.env.API_VERSION || '1.0.0',
      services: {
        r2: checks.r2 ? 'ok' : 'error',
        kv: checks.kv ? 'ok' : 'error',
      },
    };

    log.info('Health check completed', {
      status,
      r2: checks.r2,
      kv: checks.kv,
      duration: Date.now() - startTime,
    });

    // Return 200 for ok/degraded, 503 for error
    if (status === 'error') {
      return serviceUnavailableResponse(c, 'One or more services are unavailable');
    }

    return successResponse(c, response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Health check failed', error, {
      duration: Date.now() - startTime,
    });

    const response: HealthResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      version: c.env.API_VERSION || '1.0.0',
      services: {
        r2: 'error',
        kv: 'error',
      },
    };

    return serviceUnavailableResponse(c, `Health check failed: ${errorMessage}`);
  }
}
