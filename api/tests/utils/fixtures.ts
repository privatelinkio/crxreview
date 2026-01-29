/**
 * Test fixtures and sample data for CRX Review API testing
 */

/**
 * Sample CRX2 file header (4 bytes magic + 4 bytes version)
 */
export const CRX2_MAGIC = Buffer.from([0x43, 0x72, 0x32, 0x34]); // "Cr24"
export const CRX2_VERSION = Buffer.from([0x02, 0x00, 0x00, 0x00]); // Version 2

/**
 * Sample CRX3 file header
 */
export const CRX3_MAGIC = Buffer.from([0x43, 0x72, 0x33, 0x34]); // "Cr34"
export const CRX3_VERSION = Buffer.from([0x03, 0x00, 0x00, 0x00]); // Version 3

/**
 * Create a minimal valid CRX2 header
 */
export function createCRX2Header(): Buffer {
  const header = Buffer.alloc(12);
  CRX2_MAGIC.copy(header, 0);
  CRX2_VERSION.copy(header, 4);
  // Public key length (4 bytes, little-endian) - minimal 1024 bytes
  header.writeUInt32LE(1024, 8);
  return header;
}

/**
 * Create a minimal valid CRX3 header
 */
export function createCRX3Header(): Buffer {
  const header = Buffer.alloc(12);
  CRX3_MAGIC.copy(header, 0);
  CRX3_VERSION.copy(header, 4);
  // Header size (4 bytes, little-endian) - minimal 24 bytes
  header.writeUInt32LE(24, 8);
  return header;
}

/**
 * Sample manifest.json for Manifest V2
 */
export const SAMPLE_MANIFEST_V2 = {
  manifest_version: 2,
  name: 'Test Extension',
  version: '1.0.0',
  description: 'A test extension for CRX Review',
  author: 'Test Author',
  permissions: ['activeTab', 'scripting', '<all_urls>'],
  background: {
    scripts: ['background.js'],
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['content.js'],
    },
  ],
  icons: {
    '16': 'images/icon-16.png',
    '48': 'images/icon-48.png',
    '128': 'images/icon-128.png',
  },
  homepage_url: 'https://example.com',
};

/**
 * Sample manifest.json for Manifest V3
 */
export const SAMPLE_MANIFEST_V3 = {
  manifest_version: 3,
  name: 'Test Extension V3',
  version: '1.0.0',
  description: 'A test extension for CRX Review with Manifest V3',
  author: 'Test Author',
  permissions: ['activeTab', 'scripting'],
  host_permissions: ['<all_urls>'],
  action: {
    default_title: 'Test Action',
    default_icon: 'images/icon-128.png',
  },
  background: {
    service_worker: 'background.js',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['content.js'],
    },
  ],
  icons: {
    '16': 'images/icon-16.png',
    '48': 'images/icon-48.png',
    '128': 'images/icon-128.png',
  },
  homepage_url: 'https://example.com',
};

/**
 * Sample file tree structure
 */
export const SAMPLE_FILE_TREE = {
  name: 'root',
  type: 'directory' as const,
  children: [
    {
      name: 'manifest.json',
      type: 'file' as const,
      size: 512,
      mimeType: 'application/json',
    },
    {
      name: 'background.js',
      type: 'file' as const,
      size: 2048,
      mimeType: 'text/javascript',
    },
    {
      name: 'content.js',
      type: 'file' as const,
      size: 1024,
      mimeType: 'text/javascript',
    },
    {
      name: 'images',
      type: 'directory' as const,
      children: [
        {
          name: 'icon-16.png',
          type: 'file' as const,
          size: 1024,
          mimeType: 'image/png',
        },
        {
          name: 'icon-48.png',
          type: 'file' as const,
          size: 2048,
          mimeType: 'image/png',
        },
        {
          name: 'icon-128.png',
          type: 'file' as const,
          size: 4096,
          mimeType: 'image/png',
        },
      ],
    },
  ],
};

/**
 * Sample CRX metadata
 */
export const SAMPLE_CRX_METADATA = {
  id: 'abcdefghijklmnopqrstuvwxyzabcdef',
  name: 'Test Extension',
  version: '1.0.0',
  description: 'A test extension for CRX Review',
  author: 'Test Author',
  permissions: ['activeTab', 'scripting', '<all_urls>'],
  manifest_version: 2,
  icons: {
    '16': 'images/icon-16.png',
    '48': 'images/icon-48.png',
    '128': 'images/icon-128.png',
  },
  homepage_url: 'https://example.com',
  storage: {
    path: 'extensions/abcdefghijklmnopqrstuvwxyzabcdef/extension.crx',
    size: 51200,
    uploadedAt: '2024-01-28T10:00:00Z',
    expiresAt: '2024-02-27T10:00:00Z',
  },
};

/**
 * Sample session data
 */
export const SAMPLE_SESSION = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  createdAt: Math.floor(Date.now() / 1000),
  expiresAt: Math.floor(Date.now() / 1000) + 1800,
  data: {
    uploadedAt: new Date().toISOString(),
    fileSize: 51200,
    fileName: 'extension.crx',
    metadata: SAMPLE_CRX_METADATA,
    fileTree: SAMPLE_FILE_TREE,
  },
};

/**
 * Sample search results
 */
export const SAMPLE_SEARCH_RESULTS = {
  results: [
    {
      file: 'manifest.json',
      matches: [
        {
          lineNumber: 1,
          columnNumber: 0,
          line: '  "name": "Test Extension",',
          match: 'Test Extension',
        },
      ],
      matchCount: 1,
    },
    {
      file: 'background.js',
      matches: [
        {
          lineNumber: 5,
          columnNumber: 10,
          line: '  const name = "Test Extension";',
          match: 'Test Extension',
        },
      ],
      matchCount: 1,
    },
  ],
  totalMatches: 2,
  searchedFiles: 3,
  executionTime: 12,
};

/**
 * Sample invalid CRX data
 */
export function createInvalidCRXData(): Buffer {
  // Invalid magic bytes
  const header = Buffer.alloc(12);
  header.write('XXXX', 0, 4, 'utf8');
  header.writeUInt32LE(999, 4);
  header.writeUInt32LE(1024, 8);
  return header;
}

/**
 * Sample extension ID (Chrome Web Store format)
 */
export const SAMPLE_EXTENSION_ID = 'abcdefghijklmnopqrstuvwxyzabcdef';

/**
 * Sample Chrome Web Store URL
 */
export const SAMPLE_CHROME_WEB_STORE_URL = `https://chromewebstore.google.com/detail/test-extension/${SAMPLE_EXTENSION_ID}`;

/**
 * Sample download URL
 */
export const SAMPLE_DOWNLOAD_URL = `https://example.com/extensions/${SAMPLE_EXTENSION_ID}/extension.crx`;

/**
 * Sample API keys
 */
export const SAMPLE_API_KEYS = {
  valid1: 'test-api-key-1',
  valid2: 'test-api-key-2',
  invalid: 'invalid-api-key-12345',
};

/**
 * Sample authorization headers
 */
export const SAMPLE_AUTH_HEADERS = {
  apiKey: {
    'X-API-Key': SAMPLE_API_KEYS.valid1,
  },
  bearer: {
    'Authorization': `Bearer ${SAMPLE_API_KEYS.valid1}`,
  },
  invalid: {
    'X-API-Key': SAMPLE_API_KEYS.invalid,
  },
};

/**
 * Sample file content for searching
 */
export const SAMPLE_FILE_CONTENT = {
  manifest: JSON.stringify(SAMPLE_MANIFEST_V2, null, 2),
  background: `
    // Background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'greet') {
        sendResponse({ farewell: 'goodbye' });
      }
    });
  `,
  content: `
    // Content script
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Content script loaded');
    });
  `,
};

/**
 * Sample malicious patterns for security testing
 */
export const MALICIOUS_PATTERNS = {
  xss: '<script>alert("XSS")</script>',
  sqlInjection: "'; DROP TABLE users; --",
  pathTraversal: '../../../etc/passwd',
  commandInjection: '; rm -rf /',
};

/**
 * Sample valid file patterns
 */
export const VALID_FILE_PATTERNS = {
  javascript: ['*.js', '*.jsx', '*.ts', '*.tsx'],
  manifest: ['manifest.json'],
  images: ['*.png', '*.jpg', '*.gif', '*.svg'],
  styles: ['*.css', '*.scss', '*.less'],
};

/**
 * Sample search queries
 */
export const SAMPLE_SEARCH_QUERIES = {
  simple: 'Test Extension',
  regex: '/chrome\\.[a-z]+/',
  caseSensitive: 'testExtension',
  multiWord: 'Test Extension Manifest',
};

/**
 * Sample pagination params
 */
export const SAMPLE_PAGINATION = {
  page1: { page: 1, limit: 10 },
  page2: { page: 2, limit: 10 },
  customLimit: { page: 1, limit: 50 },
  invalid: { page: -1, limit: 0 },
};

/**
 * Sample filter criteria
 */
export const SAMPLE_FILTERS = {
  byType: { fileType: 'javascript' },
  byPattern: { pattern: '*.js' },
  bySizeRange: { minSize: 0, maxSize: 10000 },
  combined: { fileType: 'javascript', minSize: 0, maxSize: 10000 },
};

/**
 * Sample rate limiting scenarios
 */
export const RATE_LIMIT_SCENARIOS = {
  withinLimit: {
    requests: 5,
    limit: 10,
    windowSeconds: 3600,
  },
  atLimit: {
    requests: 10,
    limit: 10,
    windowSeconds: 3600,
  },
  exceedsLimit: {
    requests: 15,
    limit: 10,
    windowSeconds: 3600,
  },
};

/**
 * Sample HTTP headers
 */
export const SAMPLE_HEADERS = {
  json: { 'content-type': 'application/json' },
  binary: { 'content-type': 'application/octet-stream' },
  cors: {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization',
  },
  security: {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'x-xss-protection': '1; mode=block',
  },
};

/**
 * Sample error messages
 */
export const SAMPLE_ERRORS = {
  unauthorized: 'Unauthorized: Invalid or missing API key',
  notFound: 'Not Found: Resource does not exist',
  badRequest: 'Bad Request: Invalid request parameters',
  unprocessable: 'Unprocessable Entity: Invalid CRX file',
  rateLimited: 'Too Many Requests: Rate limit exceeded',
  internal: 'Internal Server Error: An unexpected error occurred',
};

/**
 * Sample timeout values
 */
export const TIMEOUT_VALUES = {
  short: 100,
  normal: 1000,
  long: 5000,
  veryLong: 10000,
};
