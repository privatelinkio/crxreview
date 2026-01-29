/**
 * Extract Handler - GET /api/v1/extensions/:sessionId/files/*path
 *
 * Extracts a specific file from the extension with optional encoding.
 */

import type { AppContext, FileExtractionResponse } from '../types';
import { validateSessionId } from '../utils/validation';
import {
  successResponse,
  notFoundResponse,
  badRequestResponse,
  internalErrorResponse,
  downloadResponse,
} from '../utils/response';
import { getSession } from '../services/session.service';
import { getFile, generateCRXKey } from '../services/storage.service';
import { extractFile } from '../services/crx.service';
import { getMimeType, isBinaryFile } from '../utils/mime-types';
import { log } from '../utils/logger';

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert ArrayBuffer to UTF-8 string
 */
function arrayBufferToUtf8(buffer: ArrayBuffer): string {
  return new TextDecoder('utf-8').decode(buffer);
}

/**
 * Extract specific file from extension handler
 */
export async function extractHandler(c: AppContext): Promise<Response> {
  const startTime = Date.now();
  const sessionId = c.req.param('sessionId');
  const filePath = c.req.param('*'); // Wildcard path
  const encoding = c.req.query('encoding'); // 'utf-8' or 'base64'
  const stream = c.req.query('stream') === 'true'; // Stream large files

  try {
    // Validate session ID format
    if (!validateSessionId(sessionId)) {
      return badRequestResponse(c, 'Invalid session ID format (must be a valid UUID)');
    }

    if (!filePath) {
      return badRequestResponse(c, 'File path is required');
    }

    // Normalize file path (remove leading slash)
    const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

    log.info('Extracting file', { sessionId, filePath: normalizedPath });

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

    // Extract specific file
    log.info('Extracting file from CRX', { sessionId, filePath: normalizedPath });
    const extracted = await extractFile(crxData, normalizedPath);

    if (!extracted || !extracted.content) {
      return notFoundResponse(c, `File not found: ${normalizedPath}`);
    }

    const fileContent = extracted.content;

    // Detect MIME type
    const mimeType = extracted.mimeType || getMimeType(normalizedPath);
    const isBinary = isBinaryFile(normalizedPath);

    // If streaming is requested, return as download
    if (stream) {
      log.info('Streaming file', { sessionId, filePath: normalizedPath, size: fileContent.byteLength });
      return downloadResponse(fileContent, mimeType, normalizedPath.split('/').pop());
    }

    // Determine encoding
    let finalEncoding: 'utf-8' | 'base64';
    let content: string;

    if (encoding === 'base64' || (encoding !== 'utf-8' && isBinary)) {
      // Use base64 for binary files or when explicitly requested
      finalEncoding = 'base64';
      content = arrayBufferToBase64(fileContent);
    } else {
      // Use UTF-8 for text files
      finalEncoding = 'utf-8';
      content = arrayBufferToUtf8(fileContent);
    }

    // Build response
    const response: FileExtractionResponse = {
      path: normalizedPath,
      content,
      mimeType,
      size: fileContent.byteLength,
      encoding: finalEncoding,
    };

    log.info('File extracted', {
      sessionId,
      filePath: normalizedPath,
      size: fileContent.byteLength,
      encoding: finalEncoding,
      duration: Date.now() - startTime,
    });

    return successResponse(c, response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Failed to extract file', error, {
      sessionId,
      filePath,
      duration: Date.now() - startTime,
    });

    return internalErrorResponse(c, `Failed to extract file: ${errorMessage}`);
  }
}
