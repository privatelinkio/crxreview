# Types and Validation Quick Reference

## Validation Schemas

```typescript
// Search validation
import { searchRequestSchema } from '@/utils/validation';
const data = searchRequestSchema.parse(input);

// Filter validation
import { filterRequestSchema } from '@/utils/validation';
const data = filterRequestSchema.parse(input);

// Download validation
import { downloadRequestSchema } from '@/utils/validation';
const data = downloadRequestSchema.parse(input);

// With error handling
import { safeParseSchema } from '@/utils/validation';
const result = safeParseSchema(searchRequestSchema, input);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.errors);
}
```

## Type Guards

```typescript
import {
  validateExtensionId,
  validateSessionId,
  validateCRXMagicBytes,
  validateManifestVersion,
  validatePermissions,
  isSearchRequest,
  isFilterRequest,
  isDownloadRequest,
} from '@/utils/validation';

// Extension ID (32 lowercase letters)
if (validateExtensionId('abcdefghijklmnopqrstuvwxyz123456')) { }

// Session ID (UUID)
if (validateSessionId('550e8400-e29b-41d4-a716-446655440000')) { }

// CRX file validation
if (validateCRXMagicBytes(buffer)) { }

// Manifest version (2 or 3)
if (validateManifestVersion(3)) { }

// Permissions array
if (validatePermissions(manifest.permissions)) { }

// Request type guards
if (isSearchRequest(data)) { }
if (isFilterRequest(data)) { }
if (isDownloadRequest(data)) { }
```

## Response Builders

```typescript
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  notFoundResponse,
  validationErrorResponse,
  rateLimitErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  conflictResponse,
  internalErrorResponse,
  serviceUnavailableResponse,
  addRateLimitHeaders,
  addCacheHeaders,
  addCorsHeaders,
} from '@/utils/response';

// Success
return successResponse(c, { id: '123' });

// Errors
return errorResponse(c, 'CODE', 'Message', 400);
return notFoundResponse(c, 'Extension');
return validationErrorResponse(c, errors);
return rateLimitErrorResponse(c, 60);
return unauthorizedResponse(c);

// Pagination
return paginatedResponse(c, items, total, offset, limit);

// Headers
let response = successResponse(c, data);
response = addRateLimitHeaders(response, 100, 99, resetTime);
response = addCacheHeaders(response, 3600);
response = addCorsHeaders(response, 'https://example.com');
return response;
```

## MIME Types

```typescript
import {
  getMimeType,
  isTextMimeType,
  isBinaryMimeType,
  isBinaryFile,
  isSourceCodeFile,
  isConfigFile,
  isDocumentationFile,
  isImageFile,
  isFontFile,
  isArchiveFile,
  categorizeFile,
  getFileExtension,
  getFileBaseName,
  isCompressible,
} from '@/utils/mime-types';

// Get MIME type
getMimeType('index.html'); // 'text/html'

// Check type
isTextMimeType('text/html'); // true
isBinaryFile('image.png'); // true

// File classification
isSourceCodeFile('main.ts'); // true
isConfigFile('webpack.config.js'); // true
isDocumentationFile('README.md'); // true

// Categorization
categorizeFile('style.css'); // 'code'

// Utilities
getFileExtension('document.pdf'); // 'pdf'
getFileBaseName('document.pdf'); // 'document'
isCompressible('text/plain'); // true
```

## Parse Download Input

```typescript
import { parseDownloadInput } from '@/utils/validation';

const input = parseDownloadInput(userInput);
if (input?.type === 'extensionId') {
  console.log('Extension ID:', input.value);
} else if (input?.type === 'url') {
  console.log('URL:', input.value);
} else {
  console.log('Invalid input');
}
```

## Extract Validation Errors

```typescript
import { extractValidationErrors } from '@/utils/validation';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const result = schema.safeParse(data);
if (!result.success) {
  const errors = extractValidationErrors(result.error);
  // errors: { 'name': ['String must contain at least 1 character(s)'], ... }
}
```

## Core Types

```typescript
import type {
  // File types
  FileCategory,
  FileNode,
  FileTree,

  // Requests
  UploadRequest,
  DownloadRequest,
  SearchRequest,
  FilterRequest,

  // Responses
  ExtensionSessionResponse,
  ManifestResponse,
  FileTreeResponse,
  FileExtractionResponse,
  SearchMatch,
  SearchResultResponse,
  FilterResultResponse,
  HealthResponse,

  // Core API types
  ApiResponse,
  CRXMetadata,
  CRXAnalysis,
  AnalysisIssue,
  AppContext,
  Handler,
} from '@/types';
```

## Error Handling Pattern

```typescript
import { Errors } from '@/utils/errors';
import { validationErrorResponse, errorResponse } from '@/utils/response';

// Create and throw errors
throw Errors.badRequest('Invalid input');
throw Errors.notFound('Extension');
throw Errors.unauthorized();
throw Errors.rateLimited(60);

// Or use response builders directly
return errorResponse(c, 'CODE', 'Message', statusCode, details);
```

## Complete Handler Example

```typescript
import { searchRequestSchema, extractValidationErrors } from '@/utils/validation';
import { successResponse, validationErrorResponse, internalErrorResponse } from '@/utils/response';
import type { AppContext } from '@/types';

export const searchHandler = async (c: AppContext): Promise<Response> => {
  try {
    // Parse and validate
    const result = searchRequestSchema.safeParse(c.req.query());
    if (!result.success) {
      return validationErrorResponse(c, extractValidationErrors(result.error));
    }

    // Process
    const matches = await performSearch(result.data);

    // Respond
    return successResponse(c, {
      results: matches,
      totalMatches: matches.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return internalErrorResponse(c);
  }
};
```

## File Import Patterns

```typescript
// Validation module
import {
  searchRequestSchema,
  filterRequestSchema,
  downloadRequestSchema,
  validateExtensionId,
  validateSessionId,
  validateCRXMagicBytes,
  validateManifestVersion,
  validatePermissions,
  parseDownloadInput,
  isSearchRequest,
  isFilterRequest,
  isDownloadRequest,
  extractValidationErrors,
  safeParseSchema,
} from '@/utils/validation';

// Response module
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  downloadResponse,
  streamResponse,
  redirectResponse,
  notFoundResponse,
  validationErrorResponse,
  rateLimitErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  conflictResponse,
  internalErrorResponse,
  serviceUnavailableResponse,
  addRateLimitHeaders,
  addCacheHeaders,
  addCorsHeaders,
} from '@/utils/response';

// MIME types module
import {
  getMimeType,
  isTextMimeType,
  isBinaryMimeType,
  isBinaryFile,
  isSourceCodeFile,
  isConfigFile,
  isDocumentationFile,
  isImageFile,
  isFontFile,
  isArchiveFile,
  categorizeFile,
  getFileExtension,
  getFileBaseName,
  isCompressible,
} from '@/utils/mime-types';

// Error handling
import { ApiError, Errors } from '@/utils/errors';

// Helpers
import * as helpers from '@/utils/helpers';
```

## Constants Reference

### File Categories
- `'code'` - Source code files
- `'config'` - Configuration files
- `'resource'` - Resources and archives
- `'documentation'` - Documentation files
- `'asset'` - Images, fonts, media
- `'other'` - Uncategorized

### Manifest Versions
- `2` - Manifest V2 (deprecated)
- `3` - Manifest V3 (current)

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `413` - Payload Too Large
- `429` - Too Many Requests
- `500` - Internal Error
- `503` - Service Unavailable

### Search Options
- `caseSensitive?: boolean` (default: false)
- `useRegex?: boolean` (default: false)
- `wholeWord?: boolean` (default: false)
- `contextLines?: number` (default: 2, max: 10)
- `maxResults?: number` (default: 100, max: 1000)

### File Size Limits
- CRX file max: 50MB (52428800 bytes)
- Context lines max: 10
- Search results max: 1000
- Pagination limit max: 1000
