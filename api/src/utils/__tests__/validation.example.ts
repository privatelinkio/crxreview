/**
 * Examples demonstrating validation utilities usage
 * These are not actual tests but usage examples
 */

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
  extractValidationErrors,
  safeParseSchema,
} from '../validation';

/**
 * Validation Schema Examples
 */

// Search request validation
const validSearch = {
  query: 'console.log',
  caseSensitive: false,
  useRegex: false,
  contextLines: 3,
  filePattern: '*.js',
  maxResults: 50,
};

try {
  const searchRequest = searchRequestSchema.parse(validSearch);
  console.log('Valid search request:', searchRequest);
} catch (error) {
  console.error('Invalid search request:', error);
}

// Filter request validation
const validFilter = {
  namePattern: '*.config.ts',
  useRegex: false,
  categories: ['config'],
  minSize: 1024,
  maxSize: 1024000,
};

try {
  const filterRequest = filterRequestSchema.parse(validFilter);
  console.log('Valid filter request:', filterRequest);
} catch (error) {
  console.error('Invalid filter request:', error);
}

// Download request validation
const validDownload = {
  input: 'abcdefghijklmnopqrstuvwxyz123456',
};

try {
  const downloadRequest = downloadRequestSchema.parse(validDownload);
  console.log('Valid download request:', downloadRequest);
} catch (error) {
  console.error('Invalid download request:', error);
}

/**
 * Type Guard Examples
 */

// Validate extension ID
const extensionId = 'abcdefghijklmnopqrstuvwxyz123456';
if (validateExtensionId(extensionId)) {
  console.log('Valid extension ID');
}

// Validate session ID
const sessionId = '550e8400-e29b-41d4-a716-446655440000';
if (validateSessionId(sessionId)) {
  console.log('Valid session ID');
}

// Validate CRX magic bytes
const crxBuffer = new ArrayBuffer(4);
const view = new Uint8Array(crxBuffer);
view.set([0x43, 0x72, 0x32, 0x34]); // 'Cr24' magic bytes

if (validateCRXMagicBytes(crxBuffer)) {
  console.log('Valid CRX file');
}

// Validate manifest version
if (validateManifestVersion(3)) {
  console.log('Valid manifest version');
}

// Validate permissions
const permissions = ['storage', 'tabs', '<all_urls>'];
if (validatePermissions(permissions)) {
  console.log('Valid permissions');
}

/**
 * Parse Download Input Examples
 */

// Parse extension ID
const idInput = 'abcdefghijklmnopqrstuvwxyz123456';
const parsed1 = parseDownloadInput(idInput);
if (parsed1?.type === 'extensionId') {
  console.log('Extension ID:', parsed1.value);
}

// Parse Chrome Web Store URL
const urlInput = 'https://chromewebstore.google.com/detail/example/abcdefghijklmnopqrstuvwxyz123456';
const parsed2 = parseDownloadInput(urlInput);
if (parsed2?.type === 'url') {
  console.log('URL:', parsed2.value);
}

/**
 * Type Guard Examples
 */

// Type guards for request objects
const unknownData: unknown = {
  query: 'test',
  caseSensitive: false,
};

if (isSearchRequest(unknownData)) {
  console.log('This is a search request');
}

/**
 * Error Extraction Examples
 */

// Extract errors from Zod validation
const invalidData = {
  query: '', // Empty query (invalid)
  contextLines: 15, // Exceeds max of 10
};

const result = searchRequestSchema.safeParse(invalidData);
if (!result.success) {
  const errors = extractValidationErrors(result.error);
  console.log('Validation errors:', errors);
  // Output: {
  //   'query': ['String must contain at least 1 character(s)'],
  //   'contextLines': ['Number must be less than or equal to 10']
  // }
}

/**
 * Safe Parse Schema Examples
 */

// Using safeParseSchema for cleaner error handling
const safeResult = safeParseSchema(searchRequestSchema, validSearch);

if (safeResult.success) {
  console.log('Parsed data:', safeResult.data);
} else {
  console.log('Errors:', safeResult.errors);
}

/**
 * Integration Example: Request Handler
 */

interface ParsedRequest {
  search?: typeof searchRequestSchema._type;
  filter?: typeof filterRequestSchema._type;
  download?: typeof downloadRequestSchema._type;
}

async function handleRequest(
  type: 'search' | 'filter' | 'download',
  data: unknown
): Promise<ParsedRequest> {
  try {
    switch (type) {
      case 'search':
        return { search: searchRequestSchema.parse(data) };
      case 'filter':
        return { filter: filterRequestSchema.parse(data) };
      case 'download':
        return { download: downloadRequestSchema.parse(data) };
      default:
        throw new Error('Unknown request type');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Request parsing failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Batch Validation Example
 */

async function validateBatch(
  items: Array<{ type: string; data: unknown }>
): Promise<Array<{ success: boolean; data?: unknown; error?: string }>> {
  return Promise.all(
    items.map(async (item) => {
      try {
        const result = await handleRequest(
          item.type as 'search' | 'filter' | 'download',
          item.data
        );
        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );
}

/**
 * Conditional Validation Example
 */

function validateRequestWithDefaults(
  requestType: string,
  data: Record<string, unknown>
): unknown {
  // Add defaults before validation
  const withDefaults = {
    ...data,
    caseSensitive: data.caseSensitive ?? false,
    useRegex: data.useRegex ?? false,
    maxResults: data.maxResults ?? 100,
  };

  switch (requestType) {
    case 'search':
      return searchRequestSchema.parse(withDefaults);
    case 'filter':
      return filterRequestSchema.parse(withDefaults);
    default:
      throw new Error('Unknown request type');
  }
}

export {
  handleRequest,
  validateBatch,
  validateRequestWithDefaults,
};
