/**
 * Upload Handler - POST /api/v1/extensions/upload
 *
 * Accepts multipart/form-data with CRX file, validates, parses, stores,
 * and creates a session for the uploaded extension.
 */

import type { AppContext, ExtensionSessionResponse } from '../types';
import { validateCRXMagicBytes } from '../utils/validation';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
  internalErrorResponse,
} from '../utils/response';
import { parseCRX, extractFileTree } from '../services/crx.service';
import { putFile, generateCRXKey } from '../services/storage.service';
import { createSession } from '../services/session.service';
import { log } from '../utils/logger';

/**
 * Upload CRX file handler
 */
export async function uploadHandler(c: AppContext): Promise<Response> {
  const startTime = Date.now();
  const requestId = c.get('requestId') || crypto.randomUUID();

  try {
    log.info('Processing CRX upload', { requestId });

    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return badRequestResponse(c, 'Missing or invalid file in request');
    }

    // Validate file size (150 MB default)
    const maxFileSize = parseInt(c.env.MAX_FILE_SIZE || '157286400', 10);
    if (file.size > maxFileSize) {
      return badRequestResponse(c, `File size exceeds maximum allowed (${maxFileSize} bytes / ${(maxFileSize / 1024 / 1024).toFixed(0)} MB)`, {
        maxSize: maxFileSize,
        actualSize: file.size,
      });
    }

    // Read file data
    const fileData = await file.arrayBuffer();

    // Validate CRX magic bytes
    if (!validateCRXMagicBytes(fileData)) {
      return badRequestResponse(c, 'Invalid CRX file format (missing Cr24 magic bytes)');
    }

    // Generate session ID
    const sessionId = crypto.randomUUID();

    log.info('Parsing CRX file', { sessionId, size: fileData.byteLength });

    // Parse CRX
    const parsed = await parseCRX(fileData);

    // Extract file tree
    log.info('Extracting file tree', { sessionId, extensionId: parsed.extensionId });
    const fileTree = await extractFileTree(parsed.zipData);

    // Store original CRX in R2
    const crxKey = generateCRXKey(sessionId);
    await putFile(c.env.CRX_STORAGE, crxKey, fileData, {
      contentType: 'application/x-chrome-extension',
      customMetadata: {
        sessionId,
        extensionId: parsed.extensionId,
        version: parsed.version,
        fileName: file.name,
      },
    });

    log.info('CRX file stored in R2', { sessionId, key: crxKey });

    // Create session in KV with metadata
    const sessionTTL = parseInt(c.env.SESSION_TTL || '86400', 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + sessionTTL * 1000);

    await createSession(
      c.env.SESSIONS,
      sessionId,
      {
        sessionId,
        extensionId: parsed.extensionId,
        fileName: file.name,
        fileCount: fileTree.totalFiles,
        size: fileData.byteLength,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        fileTree,
        version: parsed.version,
      },
      sessionTTL
    );

    log.info('Session created', {
      sessionId,
      extensionId: parsed.extensionId,
      duration: Date.now() - startTime,
    });

    // Build response
    const response: ExtensionSessionResponse = {
      sessionId,
      extensionId: parsed.extensionId,
      fileName: file.name,
      fileCount: fileTree.totalFiles,
      size: fileData.byteLength,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      version: parsed.version,
    };

    return successResponse(c, response, 201);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Upload failed', error, {
      requestId,
      duration: Date.now() - startTime,
    });

    return internalErrorResponse(c, `Failed to upload CRX: ${errorMessage}`);
  }
}
