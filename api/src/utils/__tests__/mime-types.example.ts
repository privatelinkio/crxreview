/**
 * Examples demonstrating MIME type utilities usage
 */

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
} from '../mime-types';

/**
 * MIME Type Detection Examples
 */

// Get MIME types
console.log(getMimeType('index.html')); // 'text/html'
console.log(getMimeType('style.css')); // 'text/css'
console.log(getMimeType('script.js')); // 'application/javascript'
console.log(getMimeType('data.json')); // 'application/json'
console.log(getMimeType('image.png')); // 'image/png'
console.log(getMimeType('font.woff2')); // 'font/woff2'
console.log(getMimeType('archive.zip')); // 'application/zip'
console.log(getMimeType('unknown.xyz')); // 'application/octet-stream'

/**
 * MIME Type Classification Examples
 */

// Check if text or binary
function processFile(filename: string, content: string | ArrayBuffer): void {
  const mimeType = getMimeType(filename);

  if (isTextMimeType(mimeType)) {
    // Process as text
    console.log('Text content:', content as string);
  } else if (isBinaryMimeType(mimeType)) {
    // Process as binary
    console.log('Binary content:', (content as ArrayBuffer).byteLength, 'bytes');
  }
}

// Using convenience functions
if (isBinaryFile('image.png')) {
  console.log('This is a binary file');
}

if (!isBinaryFile('script.js')) {
  console.log('This is a text file');
}

/**
 * File Type Detection Examples
 */

// Detect source code files
const codeFiles = [
  'index.ts',
  'component.tsx',
  'utils.js',
  'main.py',
  'main.go',
];

codeFiles.forEach((file) => {
  if (isSourceCodeFile(file)) {
    console.log(`${file} is source code`);
  }
});

// Detect configuration files
const configFiles = [
  'package.json',
  '.eslintrc',
  'webpack.config.js',
  'tsconfig.json',
  '.env',
  'Dockerfile',
];

configFiles.forEach((file) => {
  if (isConfigFile(file)) {
    console.log(`${file} is a config file`);
  }
});

// Detect documentation files
const docFiles = [
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'CONTRIBUTING.md',
];

docFiles.forEach((file) => {
  if (isDocumentationFile(file)) {
    console.log(`${file} is documentation`);
  }
});

// Detect media files
if (isImageFile('logo.svg')) {
  console.log('This is an image');
}

if (isFontFile('Roboto.woff2')) {
  console.log('This is a font');
}

if (isArchiveFile('backup.zip')) {
  console.log('This is an archive');
}

/**
 * File Categorization Examples
 */

const files = [
  'main.js',
  'webpack.config.js',
  'README.md',
  'logo.png',
  'style.css',
  'package.json',
  'archive.zip',
];

const categorized = files.map((file) => ({
  file,
  category: categorizeFile(file),
}));

console.log('Categorized files:', categorized);
// Output:
// [
//   { file: 'main.js', category: 'code' },
//   { file: 'webpack.config.js', category: 'config' },
//   { file: 'README.md', category: 'documentation' },
//   { file: 'logo.png', category: 'asset' },
//   { file: 'style.css', category: 'code' },
//   { file: 'package.json', category: 'config' },
//   { file: 'archive.zip', category: 'resource' },
// ]

/**
 * Filename Utilities Examples
 */

// Get extension
console.log(getFileExtension('document.pdf')); // 'pdf'
console.log(getFileExtension('archive.tar.gz')); // 'gz'
console.log(getFileExtension('README')); // ''

// Get base name
console.log(getFileBaseName('document.pdf')); // 'document'
console.log(getFileBaseName('archive.tar.gz')); // 'archive.tar'
console.log(getFileBaseName('README')); // 'README'

/**
 * Compression Detection Examples
 */

// Check if compressible
function shouldCompress(filename: string): boolean {
  const mimeType = getMimeType(filename);
  return isCompressible(mimeType);
}

console.log(shouldCompress('script.js')); // true
console.log(shouldCompress('image.png')); // false
console.log(shouldCompress('archive.zip')); // false
console.log(shouldCompress('document.txt')); // true

/**
 * File Processing Pipeline Example
 */

interface FileInfo {
  filename: string;
  content: string | ArrayBuffer;
  size: number;
}

async function processFileInPipeline(file: FileInfo): Promise<void> {
  const extension = getFileExtension(file.filename);
  const category = categorizeFile(file.filename);
  const mimeType = getMimeType(file.filename);
  const isText = isTextMimeType(mimeType);

  console.log({
    filename: file.filename,
    extension,
    category,
    mimeType,
    isText,
    size: file.size,
  });

  // Process based on type
  if (isSourceCodeFile(file.filename)) {
    // Apply syntax highlighting
    console.log('Applying syntax highlighting');
  } else if (isImageFile(file.filename)) {
    // Generate thumbnail
    console.log('Generating thumbnail');
  } else if (isConfigFile(file.filename)) {
    // Parse as JSON/YAML/TOML
    console.log('Parsing config');
  }
}

/**
 * Bulk File Analysis Example
 */

function analyzeFileCollection(files: FileInfo[]): {
  byCategory: Record<string, FileInfo[]>;
  byType: Record<string, FileInfo[]>;
  totalSize: number;
  compressionOpportunities: string[];
} {
  const byCategory: Record<string, FileInfo[]> = {};
  const byType: Record<string, FileInfo[]> = {};
  let totalSize = 0;
  const compressionOpportunities: string[] = [];

  files.forEach((file) => {
    const category = categorizeFile(file.filename);
    const mimeType = getMimeType(file.filename);

    // Group by category
    if (!byCategory[category]) {
      byCategory[category] = [];
    }
    byCategory[category].push(file);

    // Group by type
    if (!byType[mimeType]) {
      byType[mimeType] = [];
    }
    byType[mimeType].push(file);

    // Track total size
    totalSize += file.size;

    // Find compression opportunities
    if (isCompressible(mimeType) && file.size > 1000) {
      compressionOpportunities.push(file.filename);
    }
  });

  return {
    byCategory,
    byType,
    totalSize,
    compressionOpportunities,
  };
}

/**
 * Content Handling Strategy Example
 */

type ContentHandler = (content: string | ArrayBuffer) => Promise<void>;

const contentHandlers: Record<string, ContentHandler> = {
  'text/plain': async (content) => {
    console.log('Handling plain text:', (content as string).slice(0, 100));
  },
  'application/json': async (content) => {
    const json = JSON.parse(content as string);
    console.log('Handling JSON with', Object.keys(json).length, 'keys');
  },
  'image/png': async (content) => {
    console.log('Handling PNG image with', (content as ArrayBuffer).byteLength, 'bytes');
  },
  'application/pdf': async (content) => {
    console.log('Handling PDF document');
  },
};

async function handleFileContent(
  filename: string,
  content: string | ArrayBuffer
): Promise<void> {
  const mimeType = getMimeType(filename);
  const handler = contentHandlers[mimeType];

  if (handler) {
    await handler(content);
  } else {
    console.log('No handler for', mimeType);
  }
}

/**
 * File Statistics Example
 */

interface FileStats {
  totalFiles: number;
  totalSize: number;
  byCategory: Record<string, number>;
  byMimeType: Record<string, number>;
  largestFiles: Array<{ filename: string; size: number }>;
}

function generateFileStatistics(files: FileInfo[]): FileStats {
  const byCategory: Record<string, number> = {};
  const byMimeType: Record<string, number> = {};
  const largestFiles: Array<{ filename: string; size: number }> = [];

  let totalSize = 0;

  files.forEach((file) => {
    const category = categorizeFile(file.filename);
    const mimeType = getMimeType(file.filename);

    // Count by category
    byCategory[category] = (byCategory[category] || 0) + 1;

    // Count by MIME type
    byMimeType[mimeType] = (byMimeType[mimeType] || 0) + 1;

    // Track size
    totalSize += file.size;

    // Track largest files
    largestFiles.push({ filename: file.filename, size: file.size });
  });

  // Sort and limit largest files
  largestFiles.sort((a, b) => b.size - a.size).splice(10);

  return {
    totalFiles: files.length,
    totalSize,
    byCategory,
    byMimeType,
    largestFiles,
  };
}

export {
  processFile,
  processFileInPipeline,
  analyzeFileCollection,
  handleFileContent,
  generateFileStatistics,
  shouldCompress,
};
