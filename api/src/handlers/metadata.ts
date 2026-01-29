/**
 * Metadata Handler - GET /api/v1/extensions/:sessionId
 *
 * Retrieves session metadata for a given session ID.
 */

import type { AppContext, ExtensionSessionResponse } from '../types';
import { validateSessionId } from '../utils/validation';
import { successResponse, notFoundResponse, badRequestResponse, internalErrorResponse } from '../utils/response';
import { getSession } from '../services/session.service';
import { log } from '../utils/logger';

/**
 * Get extension metadata handler
 */
export async function metadataHandler(c: AppContext): Promise<Response> {
  const startTime = Date.now();
  const sessionId = c.req.param('sessionId');

  try {
    // Validate session ID format
    if (!validateSessionId(sessionId)) {
      return badRequestResponse(c, 'Invalid session ID format (must be a valid UUID)');
    }

    log.info('Retrieving session metadata', { sessionId });

    // Get session from KV
    const session = await getSession(c.env.SESSIONS, sessionId);

    if (!session) {
      return notFoundResponse(c, `Session ${sessionId} not found`);
    }

    // Build response
    const response: ExtensionSessionResponse = {
      sessionId: session.sessionId,
      extensionId: session.extensionId,
      fileName: session.fileName,
      fileCount: session.fileCount,
      size: session.size,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      version: session.version,
    };

    log.info('Session metadata retrieved', {
      sessionId,
      duration: Date.now() - startTime,
    });

    return successResponse(c, response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Failed to get session metadata', error, {
      sessionId,
      duration: Date.now() - startTime,
    });

    return internalErrorResponse(c, `Failed to retrieve session: ${errorMessage}`);
  }
}
