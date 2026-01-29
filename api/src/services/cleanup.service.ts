/**
 * Cleanup Service
 *
 * Handles scheduled cleanup of expired sessions from both KV storage
 * and R2 bucket. Designed to be called by a Cloudflare Worker cron trigger.
 */

import type { Env } from '../types';
import { getLogger } from '../utils/logger';
import { getSession, deleteSession, listSessions } from './session.service';
import { deleteSessionFiles } from './storage.service';

const logger = getLogger({ service: 'cleanup' });

/**
 * Cleanup operation timeout in milliseconds
 */
const CLEANUP_TIMEOUT = 300000; // 5 minutes

/**
 * Batch size for processing sessions
 */
const BATCH_SIZE = 10;

/**
 * Cleanup statistics interface
 */
export interface CleanupStats {
  deleted: number;
  failed: number;
  errors: Array<{
    sessionId: string;
    error: string;
  }>;
}

/**
 * Custom error types for cleanup operations
 */
export class CleanupError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'CleanupError';
  }
}

/**
 * Clean up expired sessions from KV and R2
 *
 * This function queries all sessions from KV, checks their expiration times,
 * and removes expired sessions along with their associated R2 files.
 *
 * @param env - Worker environment bindings
 * @returns Cleanup statistics
 * @throws {CleanupError} If cleanup fails catastrophically
 */
export async function cleanupExpiredSessions(env: Env): Promise<CleanupStats> {
  const startTime = Date.now();
  const stats: CleanupStats = {
    deleted: 0,
    failed: 0,
    errors: [],
  };

  try {
    logger.info('Starting expired sessions cleanup');

    // Set up timeout
    const timeoutId = setTimeout(() => {
      logger.warn('Cleanup operation approaching timeout', {
        elapsed: Date.now() - startTime,
      });
    }, CLEANUP_TIMEOUT - 30000); // Warn 30s before timeout

    try {
      // Get all session IDs
      const sessionIds = await listSessions(env.SESSIONS);

      logger.info('Sessions to check', { count: sessionIds.length });

      // Process sessions in batches to avoid overwhelming the system
      for (let i = 0; i < sessionIds.length; i += BATCH_SIZE) {
        const batch = sessionIds.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async sessionId => {
            try {
              await cleanupSessionIfExpired(env, sessionId, stats);
            } catch (error) {
              logger.error('Failed to cleanup session', error, { sessionId });
              stats.failed++;
              stats.errors.push({
                sessionId,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          })
        );

        // Check if we're approaching timeout
        if (Date.now() - startTime > CLEANUP_TIMEOUT - 60000) {
          logger.warn('Cleanup timeout approaching, stopping early', {
            processed: i + batch.length,
            total: sessionIds.length,
          });
          break;
        }
      }

      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }

    const duration = Date.now() - startTime;
    logger.info('Cleanup complete', {
      deleted: stats.deleted,
      failed: stats.failed,
      duration: `${duration}ms`,
    });

    return stats;
  } catch (error) {
    logger.error('Cleanup operation failed', error);
    throw new CleanupError(
      `Cleanup operation failed: ${error instanceof Error ? error.message : String(error)}`,
      'CLEANUP_FAILED',
      { error, stats }
    );
  }
}

/**
 * Check if a session is expired and clean it up if so
 *
 * @param env - Worker environment bindings
 * @param sessionId - Session identifier
 * @param stats - Cleanup statistics to update
 */
async function cleanupSessionIfExpired(
  env: Env,
  sessionId: string,
  stats: CleanupStats
): Promise<void> {
  try {
    // Get session metadata
    const session = await getSession(env.SESSIONS, sessionId);

    if (!session) {
      // Session doesn't exist or already expired in KV
      logger.debug('Session not found, may have already expired', { sessionId });
      return;
    }

    // Check if expired
    const expiresAt = new Date(session.expiresAt);
    const now = new Date();

    if (expiresAt > now) {
      // Session is still valid
      logger.debug('Session still valid', {
        sessionId,
        expiresAt: expiresAt.toISOString(),
      });
      return;
    }

    // Session is expired, clean it up
    logger.info('Cleaning up expired session', {
      sessionId,
      expiresAt: expiresAt.toISOString(),
      expiredFor: `${Math.floor((now.getTime() - expiresAt.getTime()) / 1000)}s`,
    });

    await cleanupSession(env, sessionId);
    stats.deleted++;
  } catch (error) {
    logger.error('Failed to check/cleanup session', error, { sessionId });
    throw error;
  }
}

/**
 * Clean up a specific session
 *
 * Deletes all R2 files associated with the session and removes the
 * session metadata from KV. Handles errors gracefully to avoid failing
 * the entire cleanup operation.
 *
 * @param env - Worker environment bindings
 * @param sessionId - Session identifier
 * @throws {CleanupError} If cleanup fails
 */
export async function cleanupSession(env: Env, sessionId: string): Promise<void> {
  const errors: string[] = [];

  try {
    logger.info('Cleaning up session', { sessionId });

    // Delete R2 files first
    try {
      const deletedCount = await deleteSessionFiles(env.CRX_STORAGE, sessionId);
      logger.info('R2 files deleted', { sessionId, count: deletedCount });
    } catch (error) {
      const errorMsg = `Failed to delete R2 files: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg, error, { sessionId });
      errors.push(errorMsg);
      // Continue to delete KV entry even if R2 deletion fails
    }

    // Delete KV metadata
    try {
      await deleteSession(env.SESSIONS, sessionId);
      logger.info('KV metadata deleted', { sessionId });
    } catch (error) {
      const errorMsg = `Failed to delete KV metadata: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg, error, { sessionId });
      errors.push(errorMsg);
    }

    if (errors.length > 0) {
      throw new CleanupError(
        `Partial cleanup failure: ${errors.join('; ')}`,
        'PARTIAL_CLEANUP_FAILED',
        { sessionId, errors }
      );
    }

    logger.info('Session cleaned up successfully', { sessionId });
  } catch (error) {
    if (error instanceof CleanupError) {
      throw error;
    }

    logger.error('Failed to cleanup session', error, { sessionId });
    throw new CleanupError(
      `Failed to cleanup session: ${error instanceof Error ? error.message : String(error)}`,
      'SESSION_CLEANUP_FAILED',
      { sessionId, error }
    );
  }
}

/**
 * Clean up orphaned R2 files
 *
 * Finds R2 files that don't have corresponding KV sessions and removes them.
 * This handles cases where KV entries expire but R2 files remain.
 *
 * @param env - Worker environment bindings
 * @param maxAge - Maximum age in seconds for orphaned files (default: 48 hours)
 * @returns Number of orphaned files deleted
 */
export async function cleanupOrphanedFiles(
  env: Env,
  maxAge: number = 172800 // 48 hours
): Promise<number> {
  try {
    logger.info('Cleaning up orphaned R2 files', { maxAge });

    // This would require listing all R2 files and checking against KV
    // For now, this is a placeholder for future implementation
    logger.warn('Orphaned file cleanup not yet implemented');

    return 0;
  } catch (error) {
    logger.error('Failed to cleanup orphaned files', error);
    throw new CleanupError(
      `Failed to cleanup orphaned files: ${error instanceof Error ? error.message : String(error)}`,
      'ORPHANED_CLEANUP_FAILED',
      { error }
    );
  }
}

/**
 * Get cleanup recommendations
 *
 * Analyzes current storage usage and provides recommendations
 * for cleanup operations.
 *
 * @param env - Worker environment bindings
 * @returns Cleanup recommendations
 */
export async function getCleanupRecommendations(env: Env): Promise<{
  expiredSessions: number;
  nearExpirySessions: number;
  totalSessions: number;
  estimatedStorageToFree: number;
}> {
  try {
    logger.info('Analyzing storage for cleanup recommendations');

    const sessionIds = await listSessions(env.SESSIONS);
    const now = new Date();
    const nearExpiryThreshold = 3600000; // 1 hour in milliseconds

    let expiredCount = 0;
    let nearExpiryCount = 0;
    let estimatedStorage = 0;

    for (const sessionId of sessionIds) {
      try {
        const session = await getSession(env.SESSIONS, sessionId);
        if (!session) continue;

        const expiresAt = new Date(session.expiresAt);
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();

        if (timeUntilExpiry <= 0) {
          expiredCount++;
          estimatedStorage += session.size || 0;
        } else if (timeUntilExpiry <= nearExpiryThreshold) {
          nearExpiryCount++;
        }
      } catch (error) {
        logger.warn('Failed to analyze session', { sessionId, error });
      }
    }

    const recommendations = {
      expiredSessions: expiredCount,
      nearExpirySessions: nearExpiryCount,
      totalSessions: sessionIds.length,
      estimatedStorageToFree: estimatedStorage,
    };

    logger.info('Cleanup recommendations generated', recommendations);

    return recommendations;
  } catch (error) {
    logger.error('Failed to get cleanup recommendations', error);
    throw new CleanupError(
      `Failed to get cleanup recommendations: ${error instanceof Error ? error.message : String(error)}`,
      'RECOMMENDATIONS_FAILED',
      { error }
    );
  }
}
