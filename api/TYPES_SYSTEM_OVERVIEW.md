# CRX Review API - Type System Overview

## Quick Start

### Basic Usage

```typescript
// Validation
import { searchRequestSchema } from '@/utils/validation';
const search = searchRequestSchema.parse(userInput);

// Response building
import { successResponse, validationErrorResponse } from '@/utils/response';
return successResponse(c, { id: '123' });

// MIME types
import { getMimeType, categorizeFile } from '@/utils/mime-types';
const category = categorizeFile('index.js'); // 'code'
```

### Import Patterns

```typescript
// All validation utilities
import {
  searchRequestSchema,
  filterRequestSchema,
  downloadRequestSchema,
  validateExtensionId,
  isSearchRequest,
  safeParseSchema,
} from '@/utils/validation';

// All response builders
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  notFoundResponse,
  validationErrorResponse,
  addRateLimitHeaders,
} from '@/utils/response';

// All MIME utilities
import {
  getMimeType,
  isSourceCodeFile,
  isConfigFile,
  categorizeFile,
  isCompressible,
} from '@/utils/mime-types';

// All types
import type {
  SearchRequest,
  FilterRequest,
  ExtensionSessionResponse,
  FileCategory,
  FileNode,
  AppContext,
} from '@/types';
```

## Architecture

### Module Organization

```
api/src/
├── types/
│   └── index.ts              # Core API types (350+ lines)
├── utils/
│   ├── index.ts              # Barrel export
│   ├── validation.ts         # Zod schemas & validators (400+ lines)
│   ├── response.ts           # Response builders (400+ lines)
│   ├── mime-types.ts         # MIME type detection (300+ lines)
│   ├── errors.ts             # Error handling (existing)
│   ├── helpers.ts            # Helper functions (existing)
│   ├── logger.ts             # Logging (existing)
│   ├── validators.ts         # Legacy validators (existing)
│   └── __tests__/
│       ├── validation.example.ts
│       ├── response.example.ts
│       └── mime-types.example.ts
```

### Type Flow

```
User Input
    ↓
Zod Schema Validation
    ↓
Type Guard / Safe Parse
    ↓
Handler Processing
    ↓
Response Builder
    ↓
HTTP Response with Metadata
```

## Feature Highlights

### 1. Comprehensive Validation

Every API request type has validation:

```typescript
// Search: query validation, regex support, result limits
const search = searchRequestSchema.parse({
  query: 'console.log',
  useRegex: false,
  maxResults: 100,
  contextLines: 3,
});

// Filter: size ranges, categories, patterns
const filter = filterRequestSchema.parse({
  namePattern: '*.js',
  categories: ['code'],
  minSize: 1024,
  maxSize: 1024000,
});

// Download: accepts ID or URL
const download = downloadRequestSchema.parse({
  input: 'abcdefghijklmnopqrstuvwxyz123456', // or URL
});
```

### 2. Type-Safe Responses

All responses follow consistent format with metadata:

```typescript
// Success response (automatic timestamp, requestId, version)
return successResponse(c, {
  sessionId: '...',
  extensionId: '...',
  fileCount: 42,
});

// Error response (structured with error code and details)
return errorResponse(c, 'VALIDATION_ERROR', 'Invalid query', 400, {
  errors: { query: ['Must be at least 1 character'] },
});

// Pagination (with hasMore flag)
return paginatedResponse(c, items, total, offset, limit);
```

### 3. Intelligent File Detection

Automatically detect and categorize files:

```typescript
getMimeType('index.html')          // 'text/html'
isSourceCodeFile('main.ts')        // true
isConfigFile('webpack.config.js')  // true
isDocumentationFile('README.md')   // true
categorizeFile('style.css')        // 'code'
isCompressible('application/json') // true
```

### 4. Error Handling

Structured error extraction and type-safe error responses:

```typescript
const result = searchRequestSchema.safeParse(input);
if (!result.success) {
  const errors = extractValidationErrors(result.error);
  // { 'query': ['Must be at least 1 character'], ... }
  return validationErrorResponse(c, errors);
}

// Specialized error responses
return notFoundResponse(c, 'Extension');
return rateLimitErrorResponse(c, 60); // Retry after 60s
return unauthorizedResponse(c);
```

### 5. Header Management

Easy response header management:

```typescript
let response = successResponse(c, data);
response = addRateLimitHeaders(response, 100, 99, resetTime);
response = addCacheHeaders(response, 3600);
response = addCorsHeaders(response, 'https://example.com');
return response;
```

## Data Types

### Request Types

| Type | Purpose | Key Fields |
|------|---------|-----------|
| `SearchRequest` | Content search | query, useRegex, contextLines, maxResults |
| `FilterRequest` | File filtering | namePattern, categories, minSize, maxSize |
| `DownloadRequest` | CRX download | input (ID or URL) |
| `UploadRequest` | CRX upload | file (File or ArrayBuffer) |

### Response Types

| Type | Purpose | Key Fields |
|------|---------|-----------|
| `ExtensionSessionResponse` | Upload/download result | sessionId, extensionId, fileCount, size |
| `ManifestResponse` | Manifest data | manifest, manifestVersion, permissions |
| `FileTreeResponse` | File hierarchy | root, totalFiles, totalSize |
| `SearchResultResponse` | Search results | results[], totalMatches, hasMore |
| `FilterResultResponse` | Filter results | files[], totalMatched |

### Core Types

| Type | Purpose | Values |
|------|---------|--------|
| `FileCategory` | File classification | 'code', 'config', 'documentation', 'asset', 'resource', 'other' |
| `FileNode` | Tree node | name, path, type, size, category, children |
| `SearchMatch` | Single match | file, line, column, match, context |
| `AppContext` | Hono context | Bindings: Env, Variables: { sessionId, user, requestId } |

## Validation Rules

### Search Request
- query: 1-500 characters, required
- caseSensitive: boolean, default false
- useRegex: boolean, default false
- wholeWord: boolean, default false
- contextLines: 0-10, default 2
- filePattern: glob pattern, optional
- maxResults: 1-1000, default 100

### Filter Request
- namePattern: string, optional
- useRegex: boolean, default false
- categories: array of FileCategory, optional
- caseSensitive: boolean, default false
- minSize: non-negative integer, optional
- maxSize: must be >= minSize, optional

### Download Request
- input: string, 1-1000 characters
  - Can be: extension ID (32 lowercase letters)
  - Can be: Chrome Web Store URL
  - Can be: Direct extension URL

### CRX File
- Must be application/x-chrome-extension
- Must start with 'Cr24' magic bytes
- Maximum 50MB (52428800 bytes)

## Error Codes

| Code | Status | Description | Usage |
|------|--------|-------------|-------|
| BAD_REQUEST | 400 | Invalid parameters | badRequestResponse |
| VALIDATION_ERROR | 400 | Validation failed | validationErrorResponse |
| UNAUTHORIZED | 401 | Missing auth | unauthorizedResponse |
| FORBIDDEN | 403 | Access denied | forbiddenResponse |
| NOT_FOUND | 404 | Resource not found | notFoundResponse |
| CONFLICT | 409 | State conflict | conflictResponse |
| PAYLOAD_TOO_LARGE | 413 | File too large | errorResponse with 413 |
| RATE_LIMITED | 429 | Too many requests | rateLimitErrorResponse |
| INTERNAL_ERROR | 500 | Server error | internalErrorResponse |
| SERVICE_UNAVAILABLE | 503 | Service down | serviceUnavailableResponse |

## Integration Patterns

### Handler Pattern

```typescript
import { searchRequestSchema, extractValidationErrors } from '@/utils/validation';
import { successResponse, validationErrorResponse } from '@/utils/response';
import type { AppContext } from '@/types';

export const search = async (c: AppContext): Promise<Response> => {
  // Validate
  const result = searchRequestSchema.safeParse(c.req.query());
  if (!result.success) {
    return validationErrorResponse(c, extractValidationErrors(result.error));
  }

  try {
    // Process
    const matches = await performSearch(result.data);

    // Respond
    return successResponse(c, {
      results: matches,
      totalMatches: matches.length,
    });
  } catch (error) {
    return internalErrorResponse(c);
  }
};
```

### Middleware Pattern

```typescript
import { addRateLimitHeaders } from '@/utils/response';

export const rateLimitMiddleware = (c: AppContext, next: () => Promise<void>) => {
  // Check rate limit
  const { limit, remaining, reset } = checkRateLimit(c);

  if (remaining < 0) {
    return rateLimitErrorResponse(c, reset);
  }

  // Call handler
  const response = await next();

  // Add headers
  return addRateLimitHeaders(response, limit, remaining, reset);
};
```

### File Processing Pattern

```typescript
import { getMimeType, categorizeFile } from '@/utils/mime-types';

for (const file of files) {
  const mimeType = getMimeType(file.name);
  const category = categorizeFile(file.name);

  if (isSourceCodeFile(file.name)) {
    // Apply syntax highlighting
  } else if (isImageFile(file.name)) {
    // Generate thumbnail
  }
}
```

## Performance Notes

1. **Validation**: Zod schemas are singleton objects, no overhead
2. **Type Guards**: Pure functions, no side effects
3. **MIME Types**: Embedded database, no network calls
4. **Headers**: Direct manipulation, minimal overhead
5. **Type Inference**: Compile-time only, no runtime cost

## Testing

Example test files demonstrate:
- Validating all request types
- Type guard usage
- Error handling
- Response building
- Header management
- File categorization
- Batch operations

See:
- `validation.example.ts`: Validation patterns
- `response.example.ts`: Response patterns
- `mime-types.example.ts`: File detection patterns

## Documentation

1. **TYPES_AND_VALIDATION.md** (300+ lines)
   - Complete type reference
   - Validation patterns
   - Integration examples
   - Best practices

2. **TYPES_QUICK_REFERENCE.md** (200+ lines)
   - Quick lookup table
   - Common patterns
   - Import cheat sheet
   - Constants reference

3. **IMPLEMENTATION_SUMMARY.md**
   - Implementation details
   - File organization
   - Quality metrics

## Versioning

- API Version: 1.0.0 (in responses)
- Validation: v1
- Type Definitions: v1

All types are backward-compatible within major version.

## What's Next

The type system is production-ready for:
1. Handler implementation (Task #6)
2. Router setup (Task #7)
3. OpenAPI spec generation (Task #8)
4. Testing infrastructure (Task #10)

Use these types and validators in all handlers for maximum type safety and consistency.
