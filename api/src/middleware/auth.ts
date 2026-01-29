import type { AppContext } from '../types/index';
import { Errors } from '../utils/errors';
import { getLogger } from '../utils/logger';

/**
 * API Key Authentication Middleware
 *
 * Validates API keys from X-API-Key header against environment variables or KV store.
 * Supports multiple API keys (API_KEY_1, API_KEY_2, etc.)
 * Attaches user context to request for downstream middleware (rate limiting, logging)
 */

interface AuthContext {
  apiKey: string;
  keyId?: string;
  userId?: string;
}

/**
 * Extract API key from request headers
 */
function extractApiKey(c: AppContext): string | null {
  // Check X-API-Key header (primary)
  const apiKey = c.req.header('X-API-Key');
  if (apiKey) {
    return apiKey;
  }

  // Check Authorization header as fallback (Bearer token)
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Validate API key against environment variables
 * Supports multiple keys: API_KEY_1, API_KEY_2, etc.
 */
function validateApiKey(apiKey: string, env: any): AuthContext | null {
  // Check for numbered API keys (API_KEY_1, API_KEY_2, etc.)
  for (let i = 1; i <= 10; i++) {
    const envKey = `API_KEY_${i}`;
    const envValue = env[envKey];

    if (envValue && envValue === apiKey) {
      return {
        apiKey,
        keyId: envKey,
        userId: `api_key_${i}`,
      };
    }
  }

  // Check for single API_KEY
  if (env.API_KEY && env.API_KEY === apiKey) {
    return {
      apiKey,
      keyId: 'API_KEY',
      userId: 'api_key_default',
    };
  }

  return null;
}

/**
 * Check API key against KV store
 * KV key format: api_key:{hashedKey}
 * KV value: JSON with metadata (userId, permissions, createdAt, etc.)
 */
async function validateApiKeyFromKV(
  apiKey: string,
  kv: KVNamespace
): Promise<AuthContext | null> {
  try {
    // Hash the API key to use as KV key
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const kvKey = `api_key:${hashHex}`;
    const value = await kv.get(kvKey, 'json');

    if (value) {
      const metadata = value as {
        userId: string;
        keyId: string;
        permissions?: string[];
        createdAt?: string;
        expiresAt?: string;
        disabled?: boolean;
      };

      // Check if key is expired
      if (metadata.expiresAt && new Date(metadata.expiresAt) < new Date()) {
        return null;
      }

      // Check if key is disabled
      if (metadata.disabled) {
        return null;
      }

      return {
        apiKey,
        keyId: metadata.keyId,
        userId: metadata.userId,
      };
    }

    return null;
  } catch (error) {
    // If KV lookup fails, return null (fail closed)
    return null;
  }
}

/**
 * Authentication middleware factory
 *
 * @param options - Configuration options
 * @param options.useKV - If true, check KV store in addition to environment variables
 * @param options.required - If false, allows requests without API keys (default: true)
 *
 * @example
 * ```typescript
 * app.use('/api/*', authMiddleware({ useKV: true }));
 * ```
 */
export function authMiddleware(options: {
  useKV?: boolean;
  required?: boolean;
} = {}) {
  const { useKV = false, required = true } = options;

  return async (c: AppContext, next: () => Promise<void>) => {
    const logger = getLogger({ requestId: c.get('requestId') });
    const apiKey = extractApiKey(c);

    // If no API key provided
    if (!apiKey) {
      if (!required) {
        // Allow request to proceed without authentication
        logger.debug('No API key provided, proceeding without authentication');
        await next();
        return;
      }

      logger.warn('Authentication failed: Missing API key', {
        path: c.req.path,
        method: c.req.method,
      });

      throw Errors.unauthorized('API key required. Provide X-API-Key header.');
    }

    // Validate API key against environment variables
    let authContext = validateApiKey(apiKey, c.env);

    // If not found in env and KV is enabled, check KV store
    if (!authContext && useKV && c.env.SESSIONS) {
      authContext = await validateApiKeyFromKV(apiKey, c.env.SESSIONS);
    }

    // If API key is invalid
    if (!authContext) {
      logger.warn('Authentication failed: Invalid API key', {
        path: c.req.path,
        method: c.req.method,
        apiKeyPrefix: apiKey.substring(0, 8) + '...',
      });

      throw Errors.unauthorized('Invalid API key');
    }

    // Attach user context to request
    c.set('user', {
      userId: authContext.userId,
      keyId: authContext.keyId,
    });

    logger.info('Authentication successful', {
      userId: authContext.userId,
      keyId: authContext.keyId,
      path: c.req.path,
      method: c.req.method,
    });

    await next();
  };
}

/**
 * Optional authentication middleware
 * Allows requests to proceed without API key, but validates if present
 *
 * @example
 * ```typescript
 * app.use('/api/public/*', optionalAuthMiddleware());
 * ```
 */
export function optionalAuthMiddleware(options: { useKV?: boolean } = {}) {
  return authMiddleware({ ...options, required: false });
}
