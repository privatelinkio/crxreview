/**
 * R2 Storage Service
 *
 * Handles all R2 bucket operations for CRX file storage with comprehensive
 * error handling and timeout management.
 */

import { getLogger } from '../utils/logger';

const logger = getLogger({ service: 'storage' });

/**
 * Storage operation timeout in milliseconds
 */
const STORAGE_TIMEOUT = 30000; // 30 seconds

/**
 * Custom error types for storage operations
 */
export class StorageError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageTimeoutError extends StorageError {
  constructor(operation: string) {
    super(`Storage operation timed out: ${operation}`, 'STORAGE_TIMEOUT');
    this.name = 'StorageTimeoutError';
  }
}

export class StorageNotFoundError extends StorageError {
  constructor(key: string) {
    super(`File not found: ${key}`, 'NOT_FOUND', { key });
    this.name = 'StorageNotFoundError';
  }
}

/**
 * File metadata interface
 */
export interface FileMetadata {
  size: number;
  uploaded: Date;
  etag?: string;
  contentType?: string;
}

/**
 * Timeout wrapper for async operations
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new StorageTimeoutError(operation)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Upload a file to R2 bucket
 *
 * @param bucket - R2 bucket instance
 * @param key - Object key (path) in the bucket
 * @param data - File data as ArrayBuffer
 * @param options - Optional metadata (contentType, customMetadata)
 * @throws {StorageError} If upload fails
 */
export async function putFile(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer,
  options?: {
    contentType?: string;
    customMetadata?: Record<string, string>;
  }
): Promise<void> {
  try {
    logger.info('Uploading file to R2', { key, size: data.byteLength });

    const uploadPromise = bucket.put(key, data, {
      httpMetadata: options?.contentType
        ? { contentType: options.contentType }
        : undefined,
      customMetadata: options?.customMetadata,
    });

    await withTimeout(uploadPromise, STORAGE_TIMEOUT, `putFile(${key})`);

    logger.info('File uploaded successfully', { key, size: data.byteLength });
  } catch (error) {
    if (error instanceof StorageTimeoutError) {
      logger.error('Upload timeout', error, { key });
      throw error;
    }

    logger.error('Failed to upload file', error, { key });
    throw new StorageError(
      `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
      'UPLOAD_FAILED',
      { key, error }
    );
  }
}

/**
 * Retrieve a file from R2 bucket
 *
 * @param bucket - R2 bucket instance
 * @param key - Object key (path) in the bucket
 * @returns File data as ArrayBuffer or null if not found
 * @throws {StorageError} If retrieval fails
 */
export async function getFile(
  bucket: R2Bucket,
  key: string
): Promise<ArrayBuffer | null> {
  try {
    logger.debug('Retrieving file from R2', { key });

    const getPromise = bucket.get(key);
    const object = await withTimeout(getPromise, STORAGE_TIMEOUT, `getFile(${key})`);

    if (!object) {
      logger.debug('File not found', { key });
      return null;
    }

    const arrayBuffer = await object.arrayBuffer();
    logger.debug('File retrieved successfully', { key, size: arrayBuffer.byteLength });

    return arrayBuffer;
  } catch (error) {
    if (error instanceof StorageTimeoutError) {
      logger.error('Retrieval timeout', error, { key });
      throw error;
    }

    logger.error('Failed to retrieve file', error, { key });
    throw new StorageError(
      `Failed to retrieve file: ${error instanceof Error ? error.message : String(error)}`,
      'RETRIEVAL_FAILED',
      { key, error }
    );
  }
}

/**
 * Delete a file from R2 bucket
 *
 * @param bucket - R2 bucket instance
 * @param key - Object key (path) in the bucket
 * @throws {StorageError} If deletion fails
 */
export async function deleteFile(
  bucket: R2Bucket,
  key: string
): Promise<void> {
  try {
    logger.info('Deleting file from R2', { key });

    const deletePromise = bucket.delete(key);
    await withTimeout(deletePromise, STORAGE_TIMEOUT, `deleteFile(${key})`);

    logger.info('File deleted successfully', { key });
  } catch (error) {
    if (error instanceof StorageTimeoutError) {
      logger.error('Deletion timeout', error, { key });
      throw error;
    }

    logger.error('Failed to delete file', error, { key });
    throw new StorageError(
      `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`,
      'DELETION_FAILED',
      { key, error }
    );
  }
}

/**
 * List files in R2 bucket with optional prefix
 *
 * @param bucket - R2 bucket instance
 * @param prefix - Optional prefix to filter files
 * @param options - Optional listing options (limit, cursor)
 * @returns Array of object keys
 * @throws {StorageError} If listing fails
 */
export async function listFiles(
  bucket: R2Bucket,
  prefix: string = '',
  options?: {
    limit?: number;
    cursor?: string;
  }
): Promise<string[]> {
  try {
    logger.debug('Listing files in R2', { prefix, limit: options?.limit });

    const listPromise = bucket.list({
      prefix,
      limit: options?.limit,
      cursor: options?.cursor,
    });

    const result = await withTimeout(
      listPromise,
      STORAGE_TIMEOUT,
      `listFiles(${prefix})`
    );

    const keys = result.objects.map(obj => obj.key);
    logger.debug('Files listed successfully', { prefix, count: keys.length });

    return keys;
  } catch (error) {
    if (error instanceof StorageTimeoutError) {
      logger.error('Listing timeout', error, { prefix });
      throw error;
    }

    logger.error('Failed to list files', error, { prefix });
    throw new StorageError(
      `Failed to list files: ${error instanceof Error ? error.message : String(error)}`,
      'LIST_FAILED',
      { prefix, error }
    );
  }
}

/**
 * Check if a file exists in R2 bucket
 *
 * @param bucket - R2 bucket instance
 * @param key - Object key (path) in the bucket
 * @returns true if file exists, false otherwise
 * @throws {StorageError} If check fails
 */
export async function fileExists(
  bucket: R2Bucket,
  key: string
): Promise<boolean> {
  try {
    logger.debug('Checking file existence', { key });

    const headPromise = bucket.head(key);
    const object = await withTimeout(headPromise, STORAGE_TIMEOUT, `fileExists(${key})`);

    const exists = object !== null;
    logger.debug('File existence check complete', { key, exists });

    return exists;
  } catch (error) {
    if (error instanceof StorageTimeoutError) {
      logger.error('Existence check timeout', error, { key });
      throw error;
    }

    logger.error('Failed to check file existence', error, { key });
    throw new StorageError(
      `Failed to check file existence: ${error instanceof Error ? error.message : String(error)}`,
      'EXISTENCE_CHECK_FAILED',
      { key, error }
    );
  }
}

/**
 * Get file metadata from R2 bucket
 *
 * @param bucket - R2 bucket instance
 * @param key - Object key (path) in the bucket
 * @returns File metadata or null if not found
 * @throws {StorageError} If metadata retrieval fails
 */
export async function getFileMetadata(
  bucket: R2Bucket,
  key: string
): Promise<FileMetadata | null> {
  try {
    logger.debug('Retrieving file metadata', { key });

    const headPromise = bucket.head(key);
    const object = await withTimeout(
      headPromise,
      STORAGE_TIMEOUT,
      `getFileMetadata(${key})`
    );

    if (!object) {
      logger.debug('File metadata not found', { key });
      return null;
    }

    const metadata: FileMetadata = {
      size: object.size,
      uploaded: object.uploaded,
      etag: object.etag,
      contentType: object.httpMetadata?.contentType,
    };

    logger.debug('File metadata retrieved successfully', { key, size: metadata.size });

    return metadata;
  } catch (error) {
    if (error instanceof StorageTimeoutError) {
      logger.error('Metadata retrieval timeout', error, { key });
      throw error;
    }

    logger.error('Failed to retrieve file metadata', error, { key });
    throw new StorageError(
      `Failed to retrieve file metadata: ${error instanceof Error ? error.message : String(error)}`,
      'METADATA_RETRIEVAL_FAILED',
      { key, error }
    );
  }
}

/**
 * Generate storage key for CRX file
 *
 * @param sessionId - Session identifier
 * @param filename - Optional filename (defaults to 'original.crx')
 * @returns Storage key in format: crx/{sessionId}/{filename}
 */
export function generateCRXKey(sessionId: string, filename: string = 'original.crx'): string {
  return `crx/${sessionId}/${filename}`;
}

/**
 * Generate storage key for extracted ZIP file
 *
 * @param sessionId - Session identifier
 * @returns Storage key in format: crx/{sessionId}/extracted.zip
 */
export function generateZIPKey(sessionId: string): string {
  return `crx/${sessionId}/extracted.zip`;
}

/**
 * Delete all files for a session
 *
 * @param bucket - R2 bucket instance
 * @param sessionId - Session identifier
 * @returns Number of files deleted
 * @throws {StorageError} If deletion fails
 */
export async function deleteSessionFiles(
  bucket: R2Bucket,
  sessionId: string
): Promise<number> {
  try {
    const prefix = `crx/${sessionId}/`;
    logger.info('Deleting session files', { sessionId, prefix });

    const files = await listFiles(bucket, prefix);

    let deletedCount = 0;
    for (const key of files) {
      try {
        await deleteFile(bucket, key);
        deletedCount++;
      } catch (error) {
        logger.warn('Failed to delete file during session cleanup', { key, error });
        // Continue deleting other files
      }
    }

    logger.info('Session files deleted', { sessionId, count: deletedCount });
    return deletedCount;
  } catch (error) {
    logger.error('Failed to delete session files', error, { sessionId });
    throw new StorageError(
      `Failed to delete session files: ${error instanceof Error ? error.message : String(error)}`,
      'SESSION_DELETION_FAILED',
      { sessionId, error }
    );
  }
}
