import { z } from 'zod';
import type { SearchRequest, FilterRequest, DownloadRequest } from '../types/index';

/**
 * Common validation patterns
 */
const patterns = {
  extensionId: /^[a-z]{32}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  chromeWebStoreUrl: /^https:\/\/(chrome|chromewebstore)\.google\.com\/webstore\/detail\//,
  url: /^https?:\/\/.+/,
};

/**
 * Extension ID validation schema (32 lowercase letters)
 */
export const extensionIdSchema = z
  .string()
  .length(32)
  .regex(/^[a-z]{32}$/, 'Extension ID must be 32 lowercase letters');

/**
 * UUID validation schema
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * Session ID validation schema
 */
export const sessionIdSchema = z
  .string()
  .uuid('Invalid session ID format');

/**
 * File pattern (glob) validation schema
 */
export const filePatternSchema = z
  .string()
  .min(1, 'File pattern cannot be empty')
  .max(500, 'File pattern too long')
  .optional();

/**
 * Search request validation schema
 */
export const searchRequestSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query required')
    .max(500, 'Search query too long'),
  caseSensitive: z.boolean().default(false),
  useRegex: z.boolean().default(false),
  wholeWord: z.boolean().default(false),
  contextLines: z
    .number()
    .int('Context lines must be an integer')
    .min(0, 'Context lines must be >= 0')
    .max(10, 'Context lines must be <= 10')
    .default(2),
  filePattern: filePatternSchema,
  maxResults: z
    .number()
    .int('Max results must be an integer')
    .min(1, 'Max results must be >= 1')
    .max(1000, 'Max results must be <= 1000')
    .default(100),
}) as z.ZodSchema<SearchRequest>;

/**
 * Filter request validation schema
 */
export const filterRequestSchema = z
  .object({
    namePattern: z
      .string()
      .min(1, 'Name pattern cannot be empty')
      .max(500, 'Name pattern too long')
      .optional(),
    useRegex: z.boolean().default(false),
    categories: z
      .array(
        z.enum([
          'code',
          'config',
          'resource',
          'documentation',
          'asset',
          'other',
        ])
      )
      .optional(),
    caseSensitive: z.boolean().default(false),
    minSize: z
      .number()
      .int('Min size must be an integer')
      .min(0, 'Min size must be >= 0')
      .optional(),
    maxSize: z
      .number()
      .int('Max size must be an integer')
      .min(0, 'Max size must be >= 0')
      .optional(),
  })
  .refine(
    (data) => !data.maxSize || !data.minSize || data.maxSize >= data.minSize,
    {
      message: 'maxSize must be greater than or equal to minSize',
      path: ['maxSize'],
    }
  ) as z.ZodSchema<FilterRequest>;

/**
 * Download request validation schema
 */
export const downloadRequestSchema = z.object({
  input: z
    .string()
    .min(1, 'Input required')
    .max(1000, 'Input too long'),
}) as z.ZodSchema<DownloadRequest>;

/**
 * Upload request validation schema
 */
export const uploadRequestSchema = z.object({
  file: z
    .union([
      z.instanceof(File),
      z.instanceof(ArrayBuffer),
    ])
    .refine(
      (file) => {
        if (file instanceof File) {
          return (
            file.type === 'application/x-chrome-extension' &&
            file.size <= 52428800
          ); // 50MB
        }
        if (file instanceof ArrayBuffer) {
          return file.byteLength <= 52428800; // 50MB
        }
        return false;
      },
      {
        message:
          'Invalid CRX file: must be application/x-chrome-extension and <= 50MB',
      }
    ),
});

/**
 * Pagination query parameters schema
 */
export const paginationSchema = z.object({
  offset: z
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset must be >= 0')
    .default(0),
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be >= 1')
    .max(1000, 'Limit must be <= 1000')
    .default(100),
});

/**
 * Utility validator functions
 */

/**
 * Validate extension ID format
 */
export function validateExtensionId(id: string): id is string {
  return patterns.extensionId.test(id);
}

/**
 * Validate session ID format
 */
export function validateSessionId(id: string): id is string {
  return patterns.uuid.test(id);
}

/**
 * Validate Chrome Web Store URL
 */
export function validateChromeWebStoreUrl(url: string): boolean {
  return patterns.chromeWebStoreUrl.test(url);
}

/**
 * Parse and validate extension ID or Chrome Web Store URL
 */
export function parseDownloadInput(input: string): {
  type: 'extensionId' | 'url';
  value: string;
} | null {
  // Try extension ID first
  if (validateExtensionId(input)) {
    return { type: 'extensionId', value: input };
  }

  // Try Chrome Web Store URL
  if (validateChromeWebStoreUrl(input)) {
    return { type: 'url', value: input };
  }

  // Try generic URL
  if (patterns.url.test(input)) {
    return { type: 'url', value: input };
  }

  return null;
}

/**
 * Validate CRX magic bytes
 */
export function validateCRXMagicBytes(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) {
    return false;
  }

  const view = new Uint8Array(buffer);
  const magicBytes = view.slice(0, 4);
  const magicString = Array.from(magicBytes)
    .map((b) => String.fromCharCode(b))
    .join('');

  return magicString === 'Cr24';
}

/**
 * Validate manifest version
 */
export function validateManifestVersion(
  version: number | string
): version is number {
  const v = typeof version === 'string' ? parseInt(version, 10) : version;
  return v === 2 || v === 3;
}

/**
 * Validate and filter permissions array
 */
export function validatePermissions(
  permissions: unknown
): permissions is string[] {
  if (!Array.isArray(permissions)) {
    return false;
  }

  return permissions.every(
    (p) => typeof p === 'string' && p.length > 0 && p.length <= 500
  );
}

/**
 * Type guards for parsed validation results
 */

/**
 * Type guard for search request
 */
export function isSearchRequest(data: unknown): data is SearchRequest {
  try {
    searchRequestSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard for filter request
 */
export function isFilterRequest(data: unknown): data is FilterRequest {
  try {
    filterRequestSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard for download request
 */
export function isDownloadRequest(data: unknown): data is DownloadRequest {
  try {
    downloadRequestSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract validation error messages from Zod errors
 */
export function extractValidationErrors(
  error: z.ZodError
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });

  return errors;
}

/**
 * Safe schema parsing with error extraction
 */
export function safeParseSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: extractValidationErrors(result.error),
  };
}
