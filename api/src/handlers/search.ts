/**
 * Search Handler - POST /api/v1/extensions/:sessionId/search
 *
 * Searches content within the extension files with advanced options.
 */

import type { AppContext, SearchRequest, SearchResultResponse } from '../types';
import { validateSessionId, searchRequestSchema, safeParseSchema } from '../utils/validation';
import {
  successResponse,
  notFoundResponse,
  badRequestResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '../utils/response';
import { getSession } from '../services/session.service';
import { getFile, generateCRXKey } from '../services/storage.service';
import { searchContent } from '../services/crx.service';
import { log } from '../utils/logger';

/**
 * Search content handler
 */
export async function searchHandler(c: AppContext): Promise<Response> {
  const startTime = Date.now();
  const sessionId = c.req.param('sessionId');

  try {
    // Validate session ID format
    if (!validateSessionId(sessionId)) {
      return badRequestResponse(c, 'Invalid session ID format (must be a valid UUID)');
    }

    // Parse and validate request body
    const body = await c.req.json<SearchRequest>();
    const validation = safeParseSchema(searchRequestSchema, body);

    if (!validation.success) {
      return validationErrorResponse(c, validation.errors);
    }

    const searchOptions = validation.data;

    log.info('Processing search request', {
      sessionId,
      query: searchOptions.query,
      caseSensitive: searchOptions.caseSensitive,
      useRegex: searchOptions.useRegex,
    });

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

    // Search content
    log.info('Searching content', { sessionId, query: searchOptions.query });
    const searchResults = await searchContent(crxData, searchOptions.query, searchOptions);

    // Paginate results
    const maxResults = searchOptions.maxResults || 100;
    const offset = 0; // TODO: Support pagination offset from query params

    const paginatedResults = searchResults.slice(offset, offset + maxResults);
    const hasMore = searchResults.length > offset + maxResults;
    const nextOffset = hasMore ? offset + maxResults : undefined;

    // Count total matches
    const totalMatches = searchResults.reduce((sum, r) => sum + r.matches.length, 0);
    const searchedFiles = searchResults.length;

    // Build response
    const response: SearchResultResponse = {
      results: paginatedResults.flatMap((fileResult) =>
        fileResult.matches.map((match) => ({
          file: fileResult.filePath,
          line: match.lineNumber,
          column: match.columnNumber,
          match: match.matchText,
          context: {
            before: match.contextBefore || [],
            after: match.contextAfter || [],
          },
        }))
      ),
      totalMatches,
      searchedFiles,
      hasMore,
      nextOffset,
    };

    log.info('Search completed', {
      sessionId,
      totalMatches,
      searchedFiles,
      duration: Date.now() - startTime,
    });

    return successResponse(c, response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Search failed', error, {
      sessionId,
      duration: Date.now() - startTime,
    });

    return internalErrorResponse(c, `Search failed: ${errorMessage}`);
  }
}
