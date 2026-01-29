/**
 * Delete Session Handler - DELETE /api/v1/extensions/:sessionId
 *
 * Deletes a session and its associated files from storage.
 */

import type { AppContext } from '../types';
import { validateSessionId } from '../utils/validation';
import {
  successResponse,
  notFoundResponse,
  badRequestResponse,
  internalErrorResponse,
} from '../utils/response';
import { getSession, deleteSession } from '../services/session.service';
import { deleteSessionFiles } from '../services/storage.service';
import { log } from '../utils/logger';

/**
 * Delete session handler
 */
export async function deleteSessionHandler(c: AppContext): Promise<Response> {
  const startTime = Date.now();
  const sessionId = c.req.param('sessionId');

  try {
    // Validate session ID format
    if (!validateSessionId(sessionId)) {
      return badRequestResponse(c, 'Invalid session ID format (must be a valid UUID)');
    }

    log.info('Processing session deletion', { sessionId });

    // Check if session exists
    const session = await getSession(c.env.SESSIONS, sessionId);
    if (!session) {
      return notFoundResponse(c, `Session ${sessionId} not found`);
    }

    // Delete session from KV
    await deleteSession(c.env.SESSIONS, sessionId);

    // Delete files from R2
    await deleteSessionFiles(c.env.CRX_STORAGE, sessionId);

    log.info('Session deleted', {
      sessionId,
      duration: Date.now() - startTime,
    });

    // Return success response
    return successResponse(c, {
      message: 'Session deleted successfully',
      sessionId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Session deletion failed', error, {
      sessionId,
      duration: Date.now() - startTime,
    });

    return internalErrorResponse(c, `Failed to delete session: ${errorMessage}`);
  }
}
