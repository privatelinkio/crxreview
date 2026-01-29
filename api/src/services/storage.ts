import type { Env, StorageObject } from '../types/index';
import { getLogger } from '../utils/logger';

/**
 * Storage service for R2 bucket operations
 */
export class StorageService {
  constructor(private r2: R2Bucket, private logger = getLogger()) {}

  /**
   * Upload file to R2
   */
  async uploadFile(
    key: string,
    data: ArrayBuffer,
    contentType: string,
    expirationTtl?: number
  ): Promise<StorageObject> {
    try {
      this.logger.info('Uploading file to R2', { key, size: data.byteLength });

      await this.r2.put(key, data, {
        httpMetadata: {
          contentType,
        },
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          ...(expirationTtl && { expirationTtl: expirationTtl.toString() }),
        },
      });

      return {
        key,
        size: data.byteLength,
        uploadedAt: new Date().toISOString(),
        contentType,
        etag: key,
      };
    } catch (error) {
      this.logger.error('Failed to upload file', error, { key });
      throw error;
    }
  }

  /**
   * Download file from R2
   */
  async downloadFile(key: string): Promise<ArrayBuffer | null> {
    try {
      this.logger.info('Downloading file from R2', { key });

      const object = await this.r2.get(key);

      if (!object) {
        this.logger.warn('File not found', { key });
        return null;
      }

      return await object.arrayBuffer();
    } catch (error) {
      this.logger.error('Failed to download file', error, { key });
      throw error;
    }
  }

  /**
   * Delete file from R2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      this.logger.info('Deleting file from R2', { key });

      await this.r2.delete(key);
    } catch (error) {
      this.logger.error('Failed to delete file', error, { key });
      throw error;
    }
  }

  /**
   * Get file metadata from R2
   */
  async getFileMetadata(key: string): Promise<StorageObject | null> {
    try {
      this.logger.info('Getting file metadata', { key });

      const object = await this.r2.head(key);

      if (!object) {
        return null;
      }

      return {
        key,
        size: object.size,
        uploadedAt: object.uploaded.toISOString(),
        contentType: object.httpMetadata?.contentType || 'application/octet-stream',
        etag: object.etag,
        expirationTtl: object.customMetadata?.expirationTtl
          ? parseInt(object.customMetadata.expirationTtl as string, 10)
          : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to get file metadata', error, { key });
      throw error;
    }
  }

  /**
   * List files in R2
   */
  async listFiles(
    prefix?: string,
    limit: number = 100
  ): Promise<Array<{ key: string; size: number; uploaded: Date }>> {
    try {
      this.logger.info('Listing files in R2', { prefix, limit });

      const list = await this.r2.list({
        prefix,
        limit,
      });

      return list.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
      }));
    } catch (error) {
      this.logger.error('Failed to list files', error, { prefix });
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const metadata = await this.getFileMetadata(key);
      return metadata !== null;
    } catch {
      return false;
    }
  }
}
