/**
 * Download Handler - POST /api/v1/extensions/download
 *
 * Downloads a CRX from Chrome Web Store using extension ID or URL,
 * parses, stores, and creates a session.
 */

import type { AppContext, DownloadRequest, ExtensionSessionResponse } from '../types';
import {
  downloadRequestSchema,
  parseDownloadInput,
  validateCRXMagicBytes,
  safeParseSchema,
} from '../utils/validation';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
  internalErrorResponse,
  validationErrorResponse,
} from '../utils/response';
import { downloadCrx } from '../lib/crx/download';
import { parseCRX, extractFileTree } from '../services/crx.service';
import { putFile, generateCRXKey } from '../services/storage.service';
import { createSession } from '../services/session.service';
import { log } from '../utils/logger';

/**
 * Download CRX from Chrome Web Store handler
 */
export async function downloadHandler(c: AppContext): Promise<Response> {
  const startTime = Date.now();
  const requestId = c.get('requestId') || crypto.randomUUID();

  try {
    // Parse and validate request body
    const body = await c.req.json<DownloadRequest>();
    const validation = safeParseSchema(downloadRequestSchema, body);

    if (!validation.success) {
      return validationErrorResponse(c, validation.errors);
    }

    const { input } = validation.data;

    log.info('Processing download request', { requestId, input });

    // Parse and validate input
    const parsed = parseDownloadInput(input);

    if (!parsed) {
      return badRequestResponse(
        c,
        'Invalid input: must be a valid extension ID (32 lowercase letters) or Chrome Web Store URL'
      );
    }

    // Extract extension ID
    let extensionId: string;

    if (parsed.type === 'extensionId') {
      extensionId = parsed.value;
    } else {
      // Extract from URL - simple extraction from path
      const urlMatch = parsed.value.match(/\/([a-z]{32})(?:\/|$|\?)/);
      if (!urlMatch) {
        return badRequestResponse(c, 'Could not extract extension ID from URL');
      }
      extensionId = urlMatch[1];
    }

    log.info('Downloading CRX from Chrome Web Store', { requestId, extensionId });

    // Download CRX
    const downloadResult = await downloadCrx(extensionId);

    if (!downloadResult.success) {
      return errorResponse(c, 'DOWNLOAD_FAILED', downloadResult.error, 500);
    }

    const crxData = downloadResult.data;

    // Validate max file size
    const maxFileSize = parseInt(c.env.MAX_FILE_SIZE || '52428800', 10);
    if (crxData.byteLength > maxFileSize) {
      return badRequestResponse(
        c,
        `Downloaded file size exceeds maximum allowed (${maxFileSize} bytes)`,
        {
          maxSize: maxFileSize,
          actualSize: crxData.byteLength,
        }
      );
    }

    // Validate CRX magic bytes
    if (!validateCRXMagicBytes(crxData)) {
      return badRequestResponse(c, 'Downloaded file is not a valid CRX (missing Cr24 magic bytes)');
    }

    // Generate session ID
    const sessionId = crypto.randomUUID();

    log.info('Parsing downloaded CRX', { sessionId, extensionId, size: crxData.byteLength });

    // Parse CRX
    const parsedCrx = await parseCRX(crxData);

    // Extract file tree
    log.info('Extracting file tree', { sessionId, extensionId: parsedCrx.extensionId });
    const fileTree = await extractFileTree(parsedCrx.zipData);

    // Store CRX in R2
    const crxKey = generateCRXKey(sessionId);
    await putFile(c.env.CRX_STORAGE, crxKey, crxData, {
      contentType: 'application/x-chrome-extension',
      customMetadata: {
        sessionId,
        extensionId: parsedCrx.extensionId,
        version: parsedCrx.version,
        source: 'chrome-web-store',
      },
    });

    log.info('CRX stored in R2', { sessionId, key: crxKey });

    // Create session in KV
    const sessionTTL = parseInt(c.env.SESSION_TTL || '86400', 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + sessionTTL * 1000);

    await createSession(
      c.env.SESSIONS,
      sessionId,
      {
        sessionId,
        extensionId: parsedCrx.extensionId,
        fileName: `${extensionId}.crx`,
        fileCount: fileTree.totalFiles,
        size: crxData.byteLength,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        fileTree,
        version: parsedCrx.version,
        customMetadata: {
          source: 'chrome-web-store',
          downloadedFrom: input,
        },
      },
      sessionTTL
    );

    log.info('Session created', {
      sessionId,
      extensionId: parsedCrx.extensionId,
      duration: Date.now() - startTime,
    });

    // Build response
    const response: ExtensionSessionResponse = {
      sessionId,
      extensionId: parsedCrx.extensionId,
      fileName: `${extensionId}.crx`,
      fileCount: fileTree.totalFiles,
      size: crxData.byteLength,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      version: parsedCrx.version,
    };

    return successResponse(c, response, 201);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Download failed', error, {
      requestId,
      duration: Date.now() - startTime,
    });

    return internalErrorResponse(c, `Failed to download CRX: ${errorMessage}`);
  }
}
