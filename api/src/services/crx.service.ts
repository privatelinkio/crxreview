/**
 * CRX Parsing Orchestration Service
 *
 * Orchestrates CRX parsing, ZIP extraction, file tree generation, content search,
 * and file filtering operations. Acts as the main coordinator for all CRX analysis.
 */

import { parseCrxHeader } from '../lib/crx/header-parser';
import { extractZipEntries, loadZipFile } from '../lib/zip/extractor';
import { buildFileTree, FileTreeNode } from '../lib/zip/file-tree';
import {
  createSearchPattern,
  searchContent,
  SearchMatch,
  SearchOptions,
} from '../lib/search/content-search';
import {
  filterFileTree,
  getMatchingFiles,
  FileFilterConfig,
} from '../lib/search/file-filter';
import { getLogger } from '../utils/logger';

const JSZip = require('jszip');

const logger = getLogger({ service: 'crx' });

/**
 * CRX parsing timeout in milliseconds
 */
const PARSE_TIMEOUT = 60000; // 60 seconds

/**
 * Parsed CRX result interface
 */
export interface ParsedCRX {
  extensionId: string;
  version: string;
  publicKey: string;
  zipData: ArrayBuffer;
}

/**
 * File tree type alias
 */
export type FileTree = FileTreeNode;

/**
 * Search result interface
 */
export interface SearchResult {
  filePath: string;
  matches: SearchMatch[];
  matchCount: number;
}

/**
 * Filter options interface
 */
export interface FilterOptions {
  namePattern?: string;
  useRegex?: boolean;
  categories?: string[];
  caseSensitive?: boolean;
}

/**
 * File extraction result
 */
export interface ExtractedFile {
  content: ArrayBuffer;
  mimeType: string;
}

/**
 * Custom error types for CRX operations
 */
export class CRXError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'CRXError';
  }
}

export class CRXParseError extends CRXError {
  constructor(message: string, details?: any) {
    super(message, 'PARSE_FAILED', details);
    this.name = 'CRXParseError';
  }
}

export class CRXExtractionError extends CRXError {
  constructor(message: string, details?: any) {
    super(message, 'EXTRACTION_FAILED', details);
    this.name = 'CRXExtractionError';
  }
}

/**
 * Parse CRX file and extract ZIP data
 *
 * Extracts the extension ID from the public key, parses the CRX header,
 * and returns the ZIP data along with metadata.
 *
 * @param data - CRX file data as ArrayBuffer
 * @returns Parsed CRX information including extension ID and ZIP data
 * @throws {CRXParseError} If parsing fails
 */
export async function parseCRX(data: ArrayBuffer): Promise<ParsedCRX> {
  try {
    logger.info('Parsing CRX file', { size: data.byteLength });

    // Parse CRX header to get ZIP offset
    const headerResult = parseCrxHeader(data);

    if (!headerResult.success) {
      throw new CRXParseError(
        `Invalid CRX header: ${headerResult.error}`,
        { error: headerResult.error }
      );
    }

    const { zipOffset } = headerResult.header;

    logger.debug('CRX header parsed', {
      version: headerResult.header.version,
      zipOffset,
    });

    // Extract ZIP data
    const zipData = data.slice(zipOffset);

    // Validate ZIP data
    const zipView = new Uint8Array(zipData);
    if (zipData.byteLength < 4 || zipView[0] !== 0x50 || zipView[1] !== 0x4b) {
      throw new CRXParseError('Invalid ZIP data in CRX file');
    }

    // Extract manifest to get extension ID and version
    const manifest = await extractManifest(zipData);

    // Generate extension ID from manifest key or name
    // In a real implementation, this would be derived from the public key
    // For now, we'll use a hash of the manifest name
    const extensionId = await generateExtensionId(manifest.name);

    logger.info('CRX parsed successfully', {
      extensionId,
      version: manifest.version,
      manifestVersion: manifest.manifest_version,
    });

    return {
      extensionId,
      version: manifest.version,
      publicKey: '', // Public key extraction would require protobuf parsing for CRX3
      zipData,
    };
  } catch (error) {
    if (error instanceof CRXParseError) {
      throw error;
    }

    logger.error('Failed to parse CRX', error);
    throw new CRXParseError(
      `Failed to parse CRX: ${error instanceof Error ? error.message : String(error)}`,
      { error }
    );
  }
}

/**
 * Extract file tree from ZIP data
 *
 * Generates a hierarchical file tree structure from ZIP entries.
 *
 * @param zipData - ZIP file data as ArrayBuffer
 * @returns File tree root node
 * @throws {CRXExtractionError} If extraction fails
 */
export async function extractFileTree(zipData: ArrayBuffer): Promise<FileTree> {
  try {
    logger.info('Extracting file tree from ZIP', { size: zipData.byteLength });

    const result = await extractZipEntries(zipData);

    if (!result.success) {
      throw new CRXExtractionError(
        `Failed to extract ZIP entries: ${result.error}`,
        { error: result.error }
      );
    }

    const fileTree = buildFileTree(result.files);

    logger.info('File tree extracted successfully', {
      fileCount: result.files.length,
    });

    return fileTree;
  } catch (error) {
    if (error instanceof CRXExtractionError) {
      throw error;
    }

    logger.error('Failed to extract file tree', error);
    throw new CRXExtractionError(
      `Failed to extract file tree: ${error instanceof Error ? error.message : String(error)}`,
      { error }
    );
  }
}

/**
 * Extract and parse manifest.json from ZIP data
 *
 * @param zipData - ZIP file data as ArrayBuffer
 * @returns Parsed manifest object
 * @throws {CRXExtractionError} If manifest extraction or parsing fails
 */
export async function extractManifest(zipData: ArrayBuffer): Promise<any> {
  try {
    logger.debug('Extracting manifest.json');

    const result = await loadZipFile(zipData, 'manifest.json');

    if (!result.success) {
      throw new CRXExtractionError(
        `Failed to load manifest.json: ${result.error}`,
        { error: result.error }
      );
    }

    const fileData = result.files[0];
    if (!fileData || !fileData.data) {
      throw new CRXExtractionError('manifest.json not found in ZIP');
    }

    // Convert ArrayBuffer to string
    const decoder = new TextDecoder('utf-8');
    const manifestText = decoder.decode(fileData.data);

    // Parse JSON
    const manifest = JSON.parse(manifestText);

    logger.debug('Manifest extracted successfully', {
      name: manifest.name,
      version: manifest.version,
    });

    return manifest;
  } catch (error) {
    if (error instanceof CRXExtractionError) {
      throw error;
    }

    logger.error('Failed to extract manifest', error);
    throw new CRXExtractionError(
      `Failed to extract manifest: ${error instanceof Error ? error.message : String(error)}`,
      { error }
    );
  }
}

/**
 * Extract a specific file from ZIP data
 *
 * @param zipData - ZIP file data as ArrayBuffer
 * @param filePath - Path to the file within the ZIP
 * @returns Extracted file content and MIME type
 * @throws {CRXExtractionError} If extraction fails
 */
export async function extractFile(
  zipData: ArrayBuffer,
  filePath: string
): Promise<ExtractedFile> {
  try {
    logger.debug('Extracting file from ZIP', { filePath });

    const result = await loadZipFile(zipData, filePath);

    if (!result.success) {
      throw new CRXExtractionError(
        `Failed to load file: ${result.error}`,
        { filePath, error: result.error }
      );
    }

    const fileData = result.files[0];
    if (!fileData || !fileData.data) {
      throw new CRXExtractionError(`File not found: ${filePath}`, { filePath });
    }

    const mimeType = detectMimeType(filePath);

    logger.debug('File extracted successfully', {
      filePath,
      size: fileData.data.byteLength,
      mimeType,
    });

    return {
      content: fileData.data.buffer,
      mimeType,
    };
  } catch (error) {
    if (error instanceof CRXExtractionError) {
      throw error;
    }

    logger.error('Failed to extract file', error, { filePath });
    throw new CRXExtractionError(
      `Failed to extract file: ${error instanceof Error ? error.message : String(error)}`,
      { filePath, error }
    );
  }
}

/**
 * Search content across all files in ZIP
 *
 * @param zipData - ZIP file data as ArrayBuffer
 * @param query - Search query string
 * @param options - Search options
 * @returns Array of search results grouped by file
 * @throws {CRXError} If search fails
 */
export async function searchContent(
  zipData: ArrayBuffer,
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  try {
    logger.info('Searching content', { query, options });

    if (!query) {
      return [];
    }

    // Create search pattern
    const pattern = createSearchPattern(
      query,
      options.caseSensitive,
      options.wholeWord,
      options.useRegex
    );

    if (!pattern) {
      throw new CRXError('Invalid search pattern', 'INVALID_PATTERN', { query });
    }

    // Extract all entries
    const entriesResult = await extractZipEntries(zipData);
    if (!entriesResult.success) {
      throw new CRXError(
        `Failed to extract ZIP entries: ${entriesResult.error}`,
        'EXTRACTION_FAILED'
      );
    }

    const results: SearchResult[] = [];
    const zip = await JSZip.loadAsync(zipData);

    // Search each text file
    for (const entry of entriesResult.files) {
      if (entry.dir || !isTextFile(entry.name)) {
        continue;
      }

      try {
        const file = zip.file(entry.name);
        if (!file) continue;

        const content = await file.async('text');
        const matches = searchContent(content, pattern, options);

        if (matches.length > 0) {
          // Update file path in matches
          matches.forEach(match => {
            match.filePath = entry.name;
          });

          results.push({
            filePath: entry.name,
            matches,
            matchCount: matches.length,
          });
        }
      } catch (error) {
        logger.warn('Failed to search file', { file: entry.name, error });
        // Continue with other files
      }
    }

    logger.info('Content search complete', {
      query,
      filesWithMatches: results.length,
      totalMatches: results.reduce((sum, r) => sum + r.matchCount, 0),
    });

    return results;
  } catch (error) {
    if (error instanceof CRXError) {
      throw error;
    }

    logger.error('Failed to search content', error, { query });
    throw new CRXError(
      `Failed to search content: ${error instanceof Error ? error.message : String(error)}`,
      'SEARCH_FAILED',
      { query, error }
    );
  }
}

/**
 * Filter files in file tree based on criteria
 *
 * @param fileTree - File tree to filter
 * @param pattern - Filter pattern (glob or regex)
 * @param options - Filter options
 * @returns Array of matching file nodes
 * @throws {CRXError} If filtering fails
 */
export async function filterFiles(
  fileTree: FileTree,
  pattern: string,
  options: FilterOptions = {}
): Promise<FileTreeNode[]> {
  try {
    logger.debug('Filtering files', { pattern, options });

    const config: FileFilterConfig = {
      namePattern: pattern,
      useRegex: options.useRegex,
      caseSensitive: options.caseSensitive,
      categories: options.categories as any,
    };

    const matchingPaths = getMatchingFiles(fileTree, config);

    // Find nodes by path
    const nodes: FileTreeNode[] = [];
    for (const path of matchingPaths) {
      const node = findNodeByPath(fileTree, path);
      if (node) {
        nodes.push(node);
      }
    }

    logger.debug('Files filtered', {
      pattern,
      matchCount: nodes.length,
    });

    return nodes;
  } catch (error) {
    logger.error('Failed to filter files', error, { pattern });
    throw new CRXError(
      `Failed to filter files: ${error instanceof Error ? error.message : String(error)}`,
      'FILTER_FAILED',
      { pattern, error }
    );
  }
}

/**
 * Find a node by path in file tree
 */
function findNodeByPath(node: FileTreeNode, path: string): FileTreeNode | undefined {
  if (node.path === path) {
    return node;
  }

  for (const child of node.children) {
    const found = findNodeByPath(child, path);
    if (found) {
      return found;
    }
  }

  return undefined;
}

/**
 * Detect MIME type from file extension
 */
function detectMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    js: 'application/javascript',
    json: 'application/json',
    html: 'text/html',
    htm: 'text/html',
    css: 'text/css',
    xml: 'application/xml',
    txt: 'text/plain',
    md: 'text/markdown',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    ico: 'image/x-icon',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    eot: 'application/vnd.ms-fontobject',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Check if file is a text file based on extension
 */
function isTextFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase();

  const textExtensions = [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'html',
    'htm',
    'css',
    'scss',
    'less',
    'xml',
    'txt',
    'md',
    'yaml',
    'yml',
    'svg',
    'csv',
  ];

  return textExtensions.includes(ext || '');
}

/**
 * Generate extension ID from manifest name
 * In production, this should be derived from the public key
 */
async function generateExtensionId(name: string): Promise<string> {
  // Simple hash-based ID generation
  // In production, use the actual public key to generate the ID
  const encoder = new TextEncoder();
  const data = encoder.encode(name);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Take first 32 characters and convert to lowercase letters only
  return hashHex
    .substring(0, 32)
    .split('')
    .map(c => String.fromCharCode(97 + (parseInt(c, 16) % 26)))
    .join('');
}
