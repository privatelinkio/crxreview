import { z } from 'zod';
import { Errors, createValidationError, ApiError } from './errors';

/**
 * Validation schemas
 */
export const schemas = {
  /**
   * UUID v4 schema
   */
  uuid: z.string().uuid('Invalid UUID format'),

  /**
   * Email schema
   */
  email: z.string().email('Invalid email address'),

  /**
   * File size schema (in bytes)
   */
  fileSize: z.number().positive('File size must be positive'),

  /**
   * Pagination schema
   */
  pagination: z.object({
    page: z.number().int().positive('Page must be a positive integer').optional().default(1),
    limit: z
      .number()
      .int()
      .positive('Limit must be a positive integer')
      .max(100, 'Limit cannot exceed 100')
      .optional()
      .default(10),
  }),

  /**
   * Search query schema
   */
  searchQuery: z.object({
    q: z.string().min(1, 'Search query required').max(500, 'Query too long').optional(),
    category: z.string().max(50).optional(),
    rating: z.number().min(0).max(5).optional(),
    sortBy: z
      .enum(['relevance', 'date', 'popularity'])
      .optional()
      .default('relevance'),
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(10),
  }),

  /**
   * Session data schema
   */
  sessionData: z.record(z.unknown()),

  /**
   * CRX file schema
   */
  crxFile: z.object({
    filename: z.string().min(1),
    contentType: z.string().includes('application/x-chrome-extension'),
    size: z.number().positive(),
  }),
};

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(
  json: string,
  fallback?: T
): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback || null;
  }
}

/**
 * Validate and parse JSON body
 */
export async function parseJsonBody<T>(
  request: Request,
  schema?: z.ZodSchema
): Promise<T> {
  try {
    const text = await request.text();
    const data = JSON.parse(text);

    if (schema) {
      return schema.parse(data) as T;
    }

    return data as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      throw createValidationError(errors);
    }

    throw Errors.badRequest('Invalid JSON body');
  }
}

/**
 * Validate FormData
 */
export async function parseFormData(
  request: Request
): Promise<FormData> {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      throw Errors.badRequest('Content-Type must be multipart/form-data');
    }

    return await request.formData();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw Errors.badRequest('Invalid form data');
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T extends z.ZodRawShape>(
  url: string,
  schema: z.ZodSchema<T>
): T {
  try {
    const params: Record<string, string | string[]> = {};
    const searchParams = new URL(url).searchParams;

    for (const [key, value] of searchParams) {
      if (params[key]) {
        if (Array.isArray(params[key])) {
          (params[key] as string[]).push(value);
        } else {
          params[key] = [params[key] as string, value];
        }
      } else {
        params[key] = value;
      }
    }

    return schema.parse(params) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      throw createValidationError(errors);
    }

    throw Errors.badRequest('Invalid query parameters');
  }
}

/**
 * Validate CRX file
 */
export function validateCRXFile(
  buffer: ArrayBuffer,
  maxSize: number = 52428800 // 50MB
): { valid: boolean; error?: string } {
  // CRX format starts with "Cr24" magic bytes
  const view = new Uint8Array(buffer);
  const magicBytes = view.slice(0, 4);
  const magicString = Array.from(magicBytes)
    .map((b) => String.fromCharCode(b))
    .join('');

  if (magicString !== 'Cr24') {
    return { valid: false, error: 'Invalid CRX file format' };
  }

  if (buffer.byteLength > maxSize) {
    return { valid: false, error: 'CRX file exceeds maximum size' };
  }

  return { valid: true };
}

/**
 * Validate extension ID format
 */
export function validateExtensionId(id: string): boolean {
  return /^[a-z]{32}$/.test(id);
}

/**
 * Validate manifest version
 */
export function validateManifestVersion(version: number | string): boolean {
  const v = typeof version === 'string' ? parseInt(version, 10) : version;
  return v === 2 || v === 3;
}

/**
 * Sanitize and validate permission string
 */
export function validatePermissions(
  permissions: unknown
): { valid: boolean; permissions?: string[] } {
  if (!Array.isArray(permissions)) {
    return { valid: false };
  }

  const validPermissions = permissions.filter(
    (p) => typeof p === 'string' && p.length > 0 && p.length <= 500
  );

  if (validPermissions.length === 0) {
    return { valid: false };
  }

  return { valid: true, permissions: validPermissions as string[] };
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
