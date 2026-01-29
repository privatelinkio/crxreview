/**
 * Manifest Handler - GET /api/v1/extensions/:sessionId/manifest
 *
 * Extracts and returns the manifest.json from the extension.
 */

import type { AppContext, ManifestResponse } from '../types';
import { validateSessionId } from '../utils/validation';
import {
  successResponse,
  notFoundResponse,
  badRequestResponse,
  internalErrorResponse,
} from '../utils/response';
import { getSession } from '../services/session.service';
import { getFile, generateCRXKey } from '../services/storage.service';
import { extractManifest } from '../services/crx.service';
import { log } from '../utils/logger';

/**
 * Get extension manifest handler
 */
export async function manifestHandler(c: AppContext): Promise<Response> {
  const startTime = Date.now();
  const sessionId = c.req.param('sessionId');

  try {
    // Validate session ID format
    if (!validateSessionId(sessionId)) {
      return badRequestResponse(c, 'Invalid session ID format (must be a valid UUID)');
    }

    log.info('Retrieving manifest', { sessionId });

    // Check if session exists
    const session = await getSession(c.env.SESSIONS, sessionId);
    if (!session) {
      return notFoundResponse(c, `Session ${sessionId} not found`);
    }

    // Get CRX file from R2
    const crxKey = generateCRXKey(sessionId);
    const crxData = await getFile(c.env.CRX_STORAGE, crxKey);

    if (!crxData) {
      return notFoundResponse(c, `CRX file not found for session ${sessionId}`);
    }

    // Extract manifest from CRX
    log.info('Extracting manifest from CRX', { sessionId });
    const manifest = await extractManifest(crxData);

    // Extract permissions
    const permissions = manifest.permissions || [];
    const hostPermissions = manifest.host_permissions || [];
    const manifestVersion = manifest.manifest_version || 2;

    // Build response
    const response: ManifestResponse = {
      manifest,
      manifestVersion,
      permissions: Array.isArray(permissions) ? permissions : [],
      hostPermissions: Array.isArray(hostPermissions) ? hostPermissions : [],
    };

    log.info('Manifest extracted', {
      sessionId,
      manifestVersion,
      permissionsCount: permissions.length,
      duration: Date.now() - startTime,
    });

    return successResponse(c, response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Failed to extract manifest', error, {
      sessionId,
      duration: Date.now() - startTime,
    });

    return internalErrorResponse(c, `Failed to extract manifest: ${errorMessage}`);
  }
}
