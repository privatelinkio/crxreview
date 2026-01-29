/**
 * Files Handler - GET /api/v1/extensions/:sessionId/files
 *
 * Returns the file tree (hierarchical or flat) for an extension.
 */

import type { AppContext, FileTreeResponse } from '../types';
import { validateSessionId } from '../utils/validation';
import {
  successResponse,
  notFoundResponse,
  badRequestResponse,
  internalErrorResponse,
} from '../utils/response';
import { getSession } from '../services/session.service';
import { getFile, generateCRXKey } from '../services/storage.service';
import { extractFileTree } from '../services/crx.service';
import { log } from '../utils/logger';

/**
 * Flatten a file tree to a list of nodes
 */
function flattenFileTree(node: any, result: any[] = []): any[] {
  result.push({
    name: node.name,
    path: node.path,
    type: node.type,
    size: node.size,
    category: node.category,
  });

  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      flattenFileTree(child, result);
    }
  }

  return result;
}

/**
 * Get file tree handler
 */
export async function filesHandler(c: AppContext): Promise<Response> {
  const startTime = Date.now();
  const sessionId = c.req.param('sessionId');
  const type = c.req.query('type') || 'tree'; // 'tree' or 'flat'

  try {
    // Validate session ID format
    if (!validateSessionId(sessionId)) {
      return badRequestResponse(c, 'Invalid session ID format (must be a valid UUID)');
    }

    // Validate type parameter
    if (type !== 'tree' && type !== 'flat') {
      return badRequestResponse(c, 'Invalid type parameter (must be "tree" or "flat")');
    }

    log.info('Retrieving file tree', { sessionId, type });

    // Get session from KV
    const session = await getSession(c.env.SESSIONS, sessionId);
    if (!session) {
      return notFoundResponse(c, `Session ${sessionId} not found`);
    }

    let fileTree = session.fileTree;

    // If file tree is not cached, extract it from the CRX
    if (!fileTree) {
      log.info('File tree not cached, extracting from CRX', { sessionId });

      const crxKey = generateCRXKey(sessionId);
      const crxData = await getFile(c.env.CRX_STORAGE, crxKey);

      if (!crxData) {
        return notFoundResponse(c, `CRX file not found for session ${sessionId}`);
      }

      fileTree = await extractFileTree(crxData);
    }

    // Build response based on type
    let responseData: FileTreeResponse;

    if (type === 'flat') {
      const flatFiles = flattenFileTree(fileTree.root);
      responseData = {
        type: 'flat',
        root: { files: flatFiles } as any,
        totalFiles: fileTree.totalFiles,
        totalSize: fileTree.totalSize,
      };
    } else {
      responseData = {
        type: 'tree',
        root: fileTree.root,
        totalFiles: fileTree.totalFiles,
        totalSize: fileTree.totalSize,
      };
    }

    log.info('File tree retrieved', {
      sessionId,
      type,
      totalFiles: fileTree.totalFiles,
      duration: Date.now() - startTime,
    });

    return successResponse(c, responseData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('Failed to get file tree', error, {
      sessionId,
      duration: Date.now() - startTime,
    });

    return internalErrorResponse(c, `Failed to retrieve file tree: ${errorMessage}`);
  }
}
