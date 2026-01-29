/**
 * Session Management Service
 *
 * Handles KV-based session storage with TTL management, metadata tracking,
 * and comprehensive error handling.
 */

import { getLogger } from '../utils/logger';

const logger = getLogger({ service: 'session' });

/**
 * Session operation timeout in milliseconds
 */
const SESSION_TIMEOUT = 10000; // 10 seconds

/**
 * Default session TTL (24 hours)
 */
export const DEFAULT_SESSION_TTL = 86400; // 24 hours in seconds

/**
 * Session metadata interface
 */
export interface SessionMetadata {
  sessionId: string;
  extensionId: string;
  fileName: string;
  fileCount: number;
  size: number;
  createdAt: string;
  expiresAt: string;
  fileTree?: any;
  manifestVersion?: number;
  version?: string;
  customMetadata?: Record<string, any>;
}

/**
 * Custom error types for session operations
 */
export class SessionError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'SessionError';
  }
}

export class SessionTimeoutError extends SessionError {
  constructor(operation: string) {
    super(`Session operation timed out: ${operation}`, 'SESSION_TIMEOUT');
    this.name = 'SessionTimeoutError';
  }
}

export class SessionNotFoundError extends SessionError {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`, 'NOT_FOUND', { sessionId });
    this.name = 'SessionNotFoundError';
  }
}

/**
 * Timeout wrapper for async operations
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new SessionTimeoutError(operation)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Create a new session in KV storage
 *
 * @param kv - KV namespace instance
 * @param sessionId - Unique session identifier
 * @param metadata - Session metadata
 * @param ttl - Time-to-live in seconds (default: 24 hours)
 * @throws {SessionError} If creation fails
 */
export async function createSession(
  kv: KVNamespace,
  sessionId: string,
  metadata: SessionMetadata,
  ttl: number = DEFAULT_SESSION_TTL
): Promise<void> {
  try {
    logger.info('Creating session', { sessionId, ttl });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    const sessionData: SessionMetadata = {
      ...metadata,
      sessionId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const putPromise = kv.put(
      `session:${sessionId}`,
      JSON.stringify(sessionData),
      {
        expirationTtl: ttl,
      }
    );

    await withTimeout(putPromise, SESSION_TIMEOUT, `createSession(${sessionId})`);

    logger.info('Session created successfully', {
      sessionId,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof SessionTimeoutError) {
      logger.error('Session creation timeout', error, { sessionId });
      throw error;
    }

    logger.error('Failed to create session', error, { sessionId });
    throw new SessionError(
      `Failed to create session: ${error instanceof Error ? error.message : String(error)}`,
      'CREATION_FAILED',
      { sessionId, error }
    );
  }
}

/**
 * Retrieve a session from KV storage
 *
 * @param kv - KV namespace instance
 * @param sessionId - Session identifier
 * @returns Session metadata or null if not found
 * @throws {SessionError} If retrieval fails
 */
export async function getSession(
  kv: KVNamespace,
  sessionId: string
): Promise<SessionMetadata | null> {
  try {
    logger.debug('Retrieving session', { sessionId });

    const getPromise = kv.get(`session:${sessionId}`, 'text');
    const data = await withTimeout(
      getPromise,
      SESSION_TIMEOUT,
      `getSession(${sessionId})`
    );

    if (!data) {
      logger.debug('Session not found', { sessionId });
      return null;
    }

    const metadata = JSON.parse(data) as SessionMetadata;
    logger.debug('Session retrieved successfully', { sessionId });

    return metadata;
  } catch (error) {
    if (error instanceof SessionTimeoutError) {
      logger.error('Session retrieval timeout', error, { sessionId });
      throw error;
    }

    logger.error('Failed to retrieve session', error, { sessionId });
    throw new SessionError(
      `Failed to retrieve session: ${error instanceof Error ? error.message : String(error)}`,
      'RETRIEVAL_FAILED',
      { sessionId, error }
    );
  }
}

/**
 * Update an existing session in KV storage
 *
 * @param kv - KV namespace instance
 * @param sessionId - Session identifier
 * @param updates - Partial metadata updates
 * @throws {SessionError} If update fails or session not found
 */
export async function updateSession(
  kv: KVNamespace,
  sessionId: string,
  updates: Partial<SessionMetadata>
): Promise<void> {
  try {
    logger.info('Updating session', { sessionId, updates: Object.keys(updates) });

    // Get existing session
    const existing = await getSession(kv, sessionId);
    if (!existing) {
      throw new SessionNotFoundError(sessionId);
    }

    // Merge updates
    const updated: SessionMetadata = {
      ...existing,
      ...updates,
      sessionId, // Ensure sessionId cannot be changed
    };

    // Calculate remaining TTL
    const expiresAt = new Date(existing.expiresAt);
    const now = new Date();
    const remainingTtl = Math.max(
      0,
      Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
    );

    if (remainingTtl <= 0) {
      throw new SessionError(
        'Session has expired',
        'SESSION_EXPIRED',
        { sessionId, expiresAt: existing.expiresAt }
      );
    }

    const putPromise = kv.put(
      `session:${sessionId}`,
      JSON.stringify(updated),
      {
        expirationTtl: remainingTtl,
      }
    );

    await withTimeout(putPromise, SESSION_TIMEOUT, `updateSession(${sessionId})`);

    logger.info('Session updated successfully', { sessionId });
  } catch (error) {
    if (error instanceof SessionTimeoutError || error instanceof SessionNotFoundError) {
      throw error;
    }

    logger.error('Failed to update session', error, { sessionId });
    throw new SessionError(
      `Failed to update session: ${error instanceof Error ? error.message : String(error)}`,
      'UPDATE_FAILED',
      { sessionId, error }
    );
  }
}

/**
 * Delete a session from KV storage
 *
 * @param kv - KV namespace instance
 * @param sessionId - Session identifier
 * @throws {SessionError} If deletion fails
 */
export async function deleteSession(
  kv: KVNamespace,
  sessionId: string
): Promise<void> {
  try {
    logger.info('Deleting session', { sessionId });

    const deletePromise = kv.delete(`session:${sessionId}`);
    await withTimeout(deletePromise, SESSION_TIMEOUT, `deleteSession(${sessionId})`);

    logger.info('Session deleted successfully', { sessionId });
  } catch (error) {
    if (error instanceof SessionTimeoutError) {
      logger.error('Session deletion timeout', error, { sessionId });
      throw error;
    }

    logger.error('Failed to delete session', error, { sessionId });
    throw new SessionError(
      `Failed to delete session: ${error instanceof Error ? error.message : String(error)}`,
      'DELETION_FAILED',
      { sessionId, error }
    );
  }
}

/**
 * List all session IDs in KV storage
 *
 * @param kv - KV namespace instance
 * @param options - Optional listing options (limit, cursor)
 * @returns Array of session IDs
 * @throws {SessionError} If listing fails
 */
export async function listSessions(
  kv: KVNamespace,
  options?: {
    limit?: number;
    cursor?: string;
  }
): Promise<string[]> {
  try {
    logger.debug('Listing sessions', { limit: options?.limit });

    const listPromise = kv.list({
      prefix: 'session:',
      limit: options?.limit || 1000,
      cursor: options?.cursor,
    });

    const result = await withTimeout(
      listPromise,
      SESSION_TIMEOUT,
      'listSessions()'
    );

    const sessionIds = result.keys.map(key => key.name.replace('session:', ''));
    logger.debug('Sessions listed successfully', { count: sessionIds.length });

    return sessionIds;
  } catch (error) {
    if (error instanceof SessionTimeoutError) {
      logger.error('Session listing timeout', error);
      throw error;
    }

    logger.error('Failed to list sessions', error);
    throw new SessionError(
      `Failed to list sessions: ${error instanceof Error ? error.message : String(error)}`,
      'LIST_FAILED',
      { error }
    );
  }
}

/**
 * Extend session TTL
 *
 * @param kv - KV namespace instance
 * @param sessionId - Session identifier
 * @param ttl - New TTL in seconds
 * @throws {SessionError} If extension fails or session not found
 */
export async function extendSessionTTL(
  kv: KVNamespace,
  sessionId: string,
  ttl: number
): Promise<void> {
  try {
    logger.info('Extending session TTL', { sessionId, ttl });

    const existing = await getSession(kv, sessionId);
    if (!existing) {
      throw new SessionNotFoundError(sessionId);
    }

    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + ttl * 1000);

    const updated: SessionMetadata = {
      ...existing,
      expiresAt: newExpiresAt.toISOString(),
    };

    const putPromise = kv.put(
      `session:${sessionId}`,
      JSON.stringify(updated),
      {
        expirationTtl: ttl,
      }
    );

    await withTimeout(putPromise, SESSION_TIMEOUT, `extendSessionTTL(${sessionId})`);

    logger.info('Session TTL extended successfully', {
      sessionId,
      newExpiresAt: newExpiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof SessionTimeoutError || error instanceof SessionNotFoundError) {
      throw error;
    }

    logger.error('Failed to extend session TTL', error, { sessionId });
    throw new SessionError(
      `Failed to extend session TTL: ${error instanceof Error ? error.message : String(error)}`,
      'TTL_EXTENSION_FAILED',
      { sessionId, error }
    );
  }
}

/**
 * Get session expiry timestamp
 *
 * @param kv - KV namespace instance
 * @param sessionId - Session identifier
 * @returns Expiry timestamp in milliseconds or null if not found
 * @throws {SessionError} If retrieval fails
 */
export async function getSessionExpiry(
  kv: KVNamespace,
  sessionId: string
): Promise<number | null> {
  try {
    logger.debug('Getting session expiry', { sessionId });

    const metadata = await getSession(kv, sessionId);
    if (!metadata) {
      return null;
    }

    const expiryTimestamp = new Date(metadata.expiresAt).getTime();
    logger.debug('Session expiry retrieved', { sessionId, expiresAt: metadata.expiresAt });

    return expiryTimestamp;
  } catch (error) {
    logger.error('Failed to get session expiry', error, { sessionId });
    throw new SessionError(
      `Failed to get session expiry: ${error instanceof Error ? error.message : String(error)}`,
      'EXPIRY_RETRIEVAL_FAILED',
      { sessionId, error }
    );
  }
}

/**
 * Check if a session exists
 *
 * @param kv - KV namespace instance
 * @param sessionId - Session identifier
 * @returns true if session exists, false otherwise
 * @throws {SessionError} If check fails
 */
export async function sessionExists(
  kv: KVNamespace,
  sessionId: string
): Promise<boolean> {
  try {
    logger.debug('Checking session existence', { sessionId });

    const metadata = await getSession(kv, sessionId);
    const exists = metadata !== null;

    logger.debug('Session existence check complete', { sessionId, exists });

    return exists;
  } catch (error) {
    logger.error('Failed to check session existence', error, { sessionId });
    throw new SessionError(
      `Failed to check session existence: ${error instanceof Error ? error.message : String(error)}`,
      'EXISTENCE_CHECK_FAILED',
      { sessionId, error }
    );
  }
}
