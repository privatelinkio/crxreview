const JSZip = require('jszip');
import { parseCrxHeader } from './header-parser';
import { getLogger } from '../../utils/logger';

/**
 * Manifest V2/V3 parsing
 */
export interface ManifestV3 {
  manifest_version: 3;
  name: string;
  version: string;
  description?: string;
  author?: string;
  permissions?: string[];
  host_permissions?: string[];
  optional_permissions?: string[];
  icons?: Record<string, string>;
  action?: Record<string, any>;
  background?: Record<string, any>;
  content_scripts?: Array<Record<string, any>>;
  web_accessible_resources?: Array<Record<string, any>>;
  [key: string]: any;
}

export interface ManifestV2 {
  manifest_version: 2;
  name: string;
  version: string;
  description?: string;
  author?: string;
  permissions?: string[];
  optional_permissions?: string[];
  icons?: Record<string, string>;
  browser_action?: Record<string, any>;
  page_action?: Record<string, any>;
  background?: Record<string, any>;
  content_scripts?: Array<Record<string, any>>;
  web_accessible_resources?: string[];
  [key: string]: any;
}

export type Manifest = ManifestV2 | ManifestV3;

/**
 * CRX metadata
 */
export interface CRXMetadataExtracted {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  permissions: string[];
  manifest_version: number;
  icons?: Record<string, string>;
  files: Array<{
    name: string;
    size: number;
  }>;
}

/**
 * CRX file parser
 */
export class CRXParser {
  private logger = getLogger();

  /**
   * Parse CRX file
   */
  async parse(buffer: ArrayBuffer): Promise<CRXMetadataExtracted> {
    try {
      // Extract ZIP data from CRX
      const zipBuffer = this.extractZipFromCRX(buffer);

      // Parse ZIP
      const zip = await JSZip.loadAsync(zipBuffer);

      // Find and parse manifest
      const manifestFile = zip.file('manifest.json');
      if (!manifestFile) {
        throw new Error('manifest.json not found');
      }

      const manifestContent = await manifestFile.async('string');
      const manifest = JSON.parse(manifestContent) as Manifest;

      // Extract files list
      const files: Array<{ name: string; size: number }> = [];
      for (const [name, file] of Object.entries(zip.files)) {
        const fileObj = file as unknown as { dir?: boolean; async?: (type: string) => Promise<Uint8Array> };
        if (!fileObj.dir && fileObj.async) {
          const data = await fileObj.async('uint8array');
          files.push({
            name,
            size: data.length,
          });
        }
      }

      // Extract metadata
      const metadata: CRXMetadataExtracted = {
        id: '', // Will be set by caller
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        permissions: this.extractPermissions(manifest),
        manifest_version: manifest.manifest_version,
        icons: manifest.icons,
        files,
      };

      this.logger.info('CRX parsed successfully', {
        name: metadata.name,
        version: metadata.version,
        files: files.length,
      });

      return metadata;
    } catch (error) {
      this.logger.error('Failed to parse CRX', error);
      throw error;
    }
  }

  /**
   * Extract ZIP data from CRX format (supports both CRX2 and CRX3)
   */
  private extractZipFromCRX(buffer: ArrayBuffer): ArrayBuffer {
    // Use the header parser which supports both CRX2 and CRX3
    const parseResult = parseCrxHeader(buffer);

    if (!parseResult.success) {
      const errorMsg = 'error' in parseResult ? (parseResult as any).error : 'Unknown error';
      throw new Error(errorMsg);
    }

    const { zipOffset } = parseResult.header;

    // Validate ZIP offset
    if (zipOffset >= buffer.byteLength) {
      throw new Error('ZIP offset exceeds buffer length');
    }

    if (zipOffset >= buffer.byteLength - 4) {
      throw new Error('No valid ZIP data found after CRX header');
    }

    // Extract and validate ZIP data
    const zipData = buffer.slice(zipOffset);
    const zipView = new Uint8Array(zipData);

    if (zipData.byteLength < 4 || zipView[0] !== 0x50 || zipView[1] !== 0x4b) {
      throw new Error('Invalid ZIP header: expected magic number 0x504B');
    }

    return zipData;
  }

  /**
   * Extract all permissions from manifest
   */
  private extractPermissions(manifest: Manifest): string[] {
    const permissions = new Set<string>();

    // V3 permissions
    if ('permissions' in manifest && manifest.permissions) {
      manifest.permissions.forEach((p: string) => permissions.add(p));
    }

    if ('host_permissions' in manifest && manifest.host_permissions) {
      manifest.host_permissions.forEach((p: string) => permissions.add(p));
    }

    if ('optional_permissions' in manifest && manifest.optional_permissions) {
      manifest.optional_permissions.forEach((p: string) => permissions.add(p));
    }

    // V2 optional permissions
    if ('optional_permissions' in manifest && manifest.optional_permissions) {
      manifest.optional_permissions.forEach((p: string) => permissions.add(p));
    }

    return Array.from(permissions);
  }

  /**
   * Get manifest from CRX
   */
  async getManifest(buffer: ArrayBuffer): Promise<Manifest> {
    try {
      const zipBuffer = this.extractZipFromCRX(buffer);
      const zip = await JSZip.loadAsync(zipBuffer);

      const manifestFile = zip.file('manifest.json');
      if (!manifestFile) {
        throw new Error('manifest.json not found');
      }

      const manifestContent = await manifestFile.async('string');
      return JSON.parse(manifestContent) as Manifest;
    } catch (error) {
      this.logger.error('Failed to get manifest', error);
      throw error;
    }
  }
}
