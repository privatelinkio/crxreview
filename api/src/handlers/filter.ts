/**
 * Filter Handler - POST /api/v1/extensions/:sessionId/filter
 *
 * Filters files in the extension based on various criteria.
 */

import type { AppContext, FilterRequest, FilterResultResponse } from '../types';
import { validateSessionId, filterRequestSchema, safeParseSchema } from '../utils/validation';
import {
  successResponse,
  notFoundResponse,
  badRequestResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '../utils/response';
import { getSession } from '../services/session.service';
import { getFile, generateCRXKey } from '../services/storage.service';
import { filterFiles, extractFileTree } from '../services/crx.service';
import { log } from '../utils/logger';

/**
 * Filter files handler
 */
export async function filterHandler(c: AppContext): Promise<Response> {
  const startTime = Date.now();
  const sessionId = c.req.param('sessionId');

  try {
    // Validate session ID format
    if (!validateSessionId(sessionId)) {
      return badRequestResponse(c, 'Invalid session ID format (must be a valid UUID)');
    }

    // Parse and validate request body
    const body = await c.req.json<FilterRequest>();
    const validation = safeParseSchema(filterRequestSchema, body);

    if (!validation.success) {
      return validationErrorResponse(c, validation.errors);
    }

    const filterOptions = validation.data;

    log.info('Processing filter request', {
      sessionId,
      namePattern: filterOptions.namePattern,
      categories: filterOptions.categories,
    });

    // Check if session exists
    const session = await getSession(c.env.SESSIONS, sessionId);
    if (!session) {
      return notFoundResponse(c, `Session ${sessionId} not found`);
    }

    // Get file tree from session or extract it
    let fileTree = session.fileTree;

    if (!fileTree) {
      log.info('File tree not cached, extracting from CRX', { sessionId });

      const crxKey = generateCRXKey(sessionId);
      const crxData = await getFile(c.env.CRX_STORAGE, crxKey);

      if (!crxData) {
        return notFoundResponse(c, `CRX file not found for session ${sessionId}`);
      }

      fileTree = await extractFileTree(crxData);
    }

    // Filter files
    log.info('Filtering files', { sessionId, options: filterOptions });
    const filteredFiles = await filterFiles(fileTree, filterOptions.namePattern || '', filterOptions);

    // Build response
    const response: FilterResultResponse = {
      files: filteredFiles,
      totalMatched: filteredFiles.length,
    };

    log.info('Filter completed', {
      sessionId,
      totalMatched: filteredFiles.length,
      duration: Date.now() - startTime,
    });

    return successResponse(c, response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Filter failed', error, {
      sessionId,
      duration: Date.now() - startTime,
    });

    return internalErrorResponse(c, `Filter failed: ${errorMessage}`);
  }
}
