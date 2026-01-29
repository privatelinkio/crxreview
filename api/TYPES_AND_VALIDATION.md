# TypeScript Types and Validation Guide

This document provides comprehensive documentation for the CRX Review API's type system and validation utilities.

## Overview

The API is built with strong TypeScript type safety in mind. All request/response types are defined in `/src/types/index.ts`, and all validation logic is centralized in utility files under `/src/utils/`.

## Type Definitions

### File Categories

```typescript
type FileCategory = 'code' | 'config' | 'resource' | 'documentation' | 'asset' | 'other';
```

Used to categorize files in an extension based on their type and purpose.

### File Tree Structure

```typescript
interface FileNode {
  name: string;           // Filename or directory name
  path: string;           // Full path from root
  type: 'file' | 'directory';
  size?: number;          // File size in bytes
  category?: FileCategory;
  children?: FileNode[];  // For directories
}

interface FileTree {
  root: FileNode;
  totalFiles: number;
  totalSize: number;
}
```

Represents a hierarchical structure of files in an extension.

## Request Types

### Upload Request

```typescript
interface UploadRequest {
  file: File | ArrayBuffer;
}
```

For uploading CRX files. File must be `application/x-chrome-extension` type.

### Download Request

```typescript
interface DownloadRequest {
  input: string;  // Extension ID or Chrome Web Store URL
}
```

Accepts either:
- Extension ID: 32 lowercase letters (e.g., `abcdefghijklmnopqrstuvwxyz123456`)
- Chrome Web Store URL: `https://chromewebstore.google.com/detail/extension-name/EXTENSION_ID`
- Direct URL to extension

### Search Request

```typescript
interface SearchRequest {
  query: string;
  caseSensitive?: boolean;      // Default: false
  useRegex?: boolean;           // Default: false
  wholeWord?: boolean;          // Default: false
  contextLines?: number;        // Default: 2, max: 10
  filePattern?: string;         // Glob pattern (e.g., "*.js")
  maxResults?: number;          // Default: 100, max: 1000
}
```

For searching content within extension files. All query parameters are validated using Zod schemas.

Example:
```typescript
// Search for "console.log" in all JavaScript files
const request: SearchRequest = {
  query: 'console.log',
  filePattern: '*.js',
  contextLines: 3,
  maxResults: 50,
};
```

### Filter Request

```typescript
interface FilterRequest {
  namePattern?: string;           // Filename pattern
  useRegex?: boolean;             // Default: false
  categories?: FileCategory[];    // Filter by file category
  caseSensitive?: boolean;        // Default: false
  minSize?: number;               // Minimum file size in bytes
  maxSize?: number;               // Maximum file size in bytes
}
```

For filtering files by various criteria. `maxSize` must be >= `minSize`.

Example:
```typescript
// Find all TypeScript config files larger than 1KB
const request: FilterRequest = {
  namePattern: '*.config.ts',
  minSize: 1024,
  categories: ['config'],
};
```

## Response Types

### Extension Session Response

```typescript
interface ExtensionSessionResponse {
  sessionId: string;
  extensionId: string;
  fileName: string;
  fileCount: number;
  size: number;
  createdAt: string;          // ISO 8601 format
  expiresAt: string;          // ISO 8601 format
  version?: string;
}
```

Returned after successfully uploading or downloading an extension.

### Manifest Response

```typescript
interface ManifestResponse {
  manifest: Record<string, any>;
  manifestVersion: number;    // 2 or 3
  permissions: string[];
  hostPermissions?: string[];
}
```

Contains parsed manifest.json data.

### File Tree Response

```typescript
interface FileTreeResponse {
  type: 'tree' | 'flat';
  root: FileNode;
  totalFiles: number;
  totalSize: number;
}
```

Hierarchical or flat representation of extension files.

### File Extraction Response

```typescript
interface FileExtractionResponse {
  path: string;
  content: string;            // Base64 for binary, UTF-8 for text
  mimeType: string;
  size: number;
  encoding: 'utf-8' | 'base64';
}
```

Raw file content from an extension.

### Search Results Response

```typescript
interface SearchMatch {
  file: string;
  line: number;
  column: number;
  match: string;
  context: {
    before: string[];         // Lines before match
    after: string[];          // Lines after match
  };
}

interface SearchResultResponse {
  results: SearchMatch[];
  totalMatches: number;
  searchedFiles: number;
  hasMore: boolean;
  nextOffset?: number;
}
```

Contains all search matches with surrounding context.

## Validation

### Using Zod Schemas

All request validation uses Zod schemas defined in `/src/utils/validation.ts`:

```typescript
import {
  searchRequestSchema,
  filterRequestSchema,
  validateExtensionId
} from '@/utils/validation';

// Parse and validate
const searchRequest = searchRequestSchema.parse(data);

// Safe parsing with error handling
const result = searchRequestSchema.safeParse(data);
if (!result.success) {
  // Handle validation errors
  console.error(result.error.errors);
}
```

### Available Validation Functions

#### Extension ID Validation

```typescript
// Type guard
if (validateExtensionId(id)) {
  // id is guaranteed to be 32 lowercase letters
}

// Parse input (extension ID or URL)
const parsed = parseDownloadInput(input);
if (parsed?.type === 'extensionId') {
  console.log('Got extension ID:', parsed.value);
}
```

#### CRX File Validation

```typescript
import { validateCRXMagicBytes } from '@/utils/validation';

// Check if buffer is valid CRX file
if (validateCRXMagicBytes(buffer)) {
  console.log('Valid CRX file');
}
```

#### Permissions Validation

```typescript
import { validatePermissions, validateManifestVersion } from '@/utils/validation';

// Validate permissions array
if (validatePermissions(manifest.permissions)) {
  // All permissions are valid strings
}

// Validate manifest version
if (validateManifestVersion(manifest.manifest_version)) {
  // Version is 2 or 3
}
```

#### Type Guards

```typescript
import { isSearchRequest, isFilterRequest } from '@/utils/validation';

if (isSearchRequest(data)) {
  // data is definitely SearchRequest type
}
```

## Response Builders

Response builders in `/src/utils/response.ts` ensure consistent API responses:

```typescript
import { successResponse, errorResponse, paginatedResponse } from '@/utils/response';

// Success response
return successResponse(c, { id: '123', name: 'Example' });

// Error response
return errorResponse(c, 'NOT_FOUND', 'Extension not found', 404);

// Paginated response
return paginatedResponse(c, items, total, offset, limit);

// Specialized error responses
return notFoundResponse(c, 'Extension');
return validationErrorResponse(c, errors);
return rateLimitErrorResponse(c, 60); // Retry after 60 seconds
return unauthorizedResponse(c);
```

## MIME Type Detection

The `/src/utils/mime-types.ts` module provides MIME type detection and file categorization:

```typescript
import {
  getMimeType,
  isTextMimeType,
  isBinaryFile,
  isSourceCodeFile,
  isConfigFile,
  categorizeFile,
} from '@/utils/mime-types';

// Get MIME type
const mimeType = getMimeType('index.html'); // 'text/html'

// Check file type
if (isTextMimeType(mimeType)) {
  // Can be read as text
}

if (isSourceCodeFile('component.tsx')) {
  // Process as source code
}

// Categorize file
const category = categorizeFile('webpack.config.js'); // 'config'
```

### File Category Detection

Files are automatically categorized:

- **code**: JavaScript, TypeScript, Python, etc.
- **config**: webpack, tsconfig, package.json, .env, etc.
- **documentation**: README, CHANGELOG, LICENSE, *.md, etc.
- **asset**: Images, fonts, etc.
- **resource**: Archives, compressed files, etc.
- **other**: Uncategorized files

### MIME Type Database

The module includes comprehensive MIME type mappings for:

- Code files (JS, TS, Python, Ruby, Go, Rust, etc.)
- Markup & config (HTML, XML, JSON, YAML, TOML)
- Styling (CSS, SCSS, SASS, LESS)
- Images (PNG, JPG, GIF, SVG, WebP, etc.)
- Fonts (WOFF, TTF, OTF, etc.)
- Media (MP3, WAV, MP4, WebM, etc.)
- Documents (PDF, DOC, DOCX, XLS, XLSX, etc.)
- Archives (ZIP, RAR, 7Z, TAR, GZ, etc.)

## API Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "extensionId": "abcdefghijklmnopqrstuvwxyz123456",
    "fileName": "extension.crx",
    "fileCount": 42,
    "size": 2097152,
    "createdAt": "2024-01-28T10:30:00Z",
    "expiresAt": "2024-02-04T10:30:00Z"
  },
  "meta": {
    "timestamp": "2024-01-28T10:30:00Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440001",
    "version": "1.0.0",
    "path": "/api/upload"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Invalid CRX file format",
  "message": "VALIDATION_ERROR",
  "statusCode": 400,
  "timestamp": "2024-01-28T10:30:00Z",
  "path": "/api/upload",
  "details": {
    "errors": {
      "file": ["Invalid CRX file: must be application/x-chrome-extension"]
    }
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 150,
      "offset": 0,
      "limit": 50,
      "hasMore": true
    }
  },
  "meta": {...}
}
```

## Error Codes

Common API error codes:

| Code | Status | Description |
|------|--------|-------------|
| `BAD_REQUEST` | 400 | Invalid request parameters |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Request conflicts with existing state |
| `PAYLOAD_TOO_LARGE` | 413 | File exceeds maximum size |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## Best Practices

### Type Safety

1. Always use specific types instead of `any`:
```typescript
// Good
function handleSession(session: ExtensionSessionResponse): void { }

// Bad
function handleSession(session: any): void { }
```

2. Use type guards for runtime validation:
```typescript
// Good
if (isSearchRequest(data)) {
  performSearch(data);
}

// Bad
const data: SearchRequest = input as SearchRequest; // Unsafe cast
```

### Validation

1. Validate all external input:
```typescript
const result = searchRequestSchema.safeParse(req.body);
if (!result.success) {
  return validationErrorResponse(c, result.error.errors);
}
```

2. Use utility functions for common patterns:
```typescript
// Good
if (validateExtensionId(id)) { }

// Bad
if (/^[a-z]{32}$/.test(id)) { }
```

### Response Building

1. Always use response builders for consistency:
```typescript
// Good
return successResponse(c, data);

// Bad
return c.json({ success: true, data });
```

2. Add rate limit headers when applicable:
```typescript
const response = successResponse(c, data);
return addRateLimitHeaders(response, 100, 99, resetTime);
```

## Integration Examples

### Search Implementation

```typescript
import { searchRequestSchema, extractValidationErrors } from '@/utils/validation';
import { successResponse, validationErrorResponse } from '@/utils/response';

export const searchHandler = async (c: AppContext) => {
  const result = searchRequestSchema.safeParse(c.req.query());

  if (!result.success) {
    return validationErrorResponse(c, extractValidationErrors(result.error));
  }

  const matches = await performSearch(result.data);
  return successResponse(c, {
    results: matches,
    totalMatches: matches.length,
  });
};
```

### File Upload

```typescript
import { validateCRXMagicBytes } from '@/utils/validation';
import { getMimeType, isBinaryFile } from '@/utils/mime-types';

export const uploadHandler = async (c: AppContext) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File;

  const buffer = await file.arrayBuffer();

  if (!validateCRXMagicBytes(buffer)) {
    return errorResponse(c, 'INVALID_CRX', 'Invalid CRX file', 400);
  }

  // Process file...
  return successResponse(c, session);
};
```

## Module Exports

### Types

```typescript
import type {
  FileCategory,
  FileNode,
  FileTree,
  UploadRequest,
  DownloadRequest,
  SearchRequest,
  FilterRequest,
  ExtensionSessionResponse,
  ManifestResponse,
  // ... other types
} from '@/types';
```

### Utilities

```typescript
import {
  // Validation
  validation,
  // Responses
  responses,
  // MIME types
  mimeTypes,
  // Helpers
  helpers,
  // Errors
  ApiError,
  Errors,
} from '@/utils';
```

## Further Reading

- [Zod Documentation](https://zod.dev/)
- [Hono Documentation](https://hono.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
