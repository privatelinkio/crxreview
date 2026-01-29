/**
 * Download ZIP Handler - GET /api/v1/extensions/:sessionId/download/zip
 *
 * Downloads the extension as a ZIP file (strips CRX header).
 */

import type { AppContext } from '../types';
import { validateSessionId } from '../utils/validation';
import {
  notFoundResponse,
  badRequestResponse,
  internalErrorResponse,
  downloadResponse,
} from '../utils/response';
import { getSession } from '../services/session.service';
import { getFile, generateCRXKey } from '../services/storage.service';
import { crxToZip } from '../lib/crx/zip-converter';
import { log } from '../utils/logger';

/**
 * Download extension as ZIP handler
 */
export async function downloadZipHandler(c: AppContext): Promise<Response> {
  const startTime = Date.now();
  const sessionId = c.req.param('sessionId');

  try {
    // Validate session ID format
    if (!validateSessionId(sessionId)) {
      return badRequestResponse(c, 'Invalid session ID format (must be a valid UUID)');
    }

    log.info('Processing ZIP download request', { sessionId });

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

    // Convert CRX to ZIP (strip header)
    log.info('Converting CRX to ZIP', { sessionId });
    const conversionResult = crxToZip(crxData);

    if (!conversionResult.success) {
      return internalErrorResponse(c, `Failed to convert CRX to ZIP: ${conversionResult.error}`);
    }

    const zipData = conversionResult.zipData;

    // Generate filename
    const filename = `${session.extensionId || 'extension'}_${session.version || 'unknown'}.zip`;

    log.info('ZIP download ready', {
      sessionId,
      filename,
      size: zipData.byteLength,
      duration: Date.now() - startTime,
    });

    // Stream ZIP file
    return downloadResponse(zipData, 'application/zip', filename);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('ZIP download failed', error, {
      sessionId,
      duration: Date.now() - startTime,
    });

    return internalErrorResponse(c, `Failed to download ZIP: ${errorMessage}`);
  }
}
