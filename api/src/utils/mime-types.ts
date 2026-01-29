/**
 * MIME type detection and utilities
 */

/**
 * Comprehensive MIME type mapping
 */
const MIME_TYPES: Record<string, string> = {
  // Code files
  js: 'application/javascript',
  jsx: 'text/jsx',
  ts: 'application/typescript',
  tsx: 'text/tsx',
  mjs: 'application/javascript',
  cjs: 'application/javascript',

  // Markup & Config
  html: 'text/html',
  htm: 'text/html',
  xml: 'application/xml',
  json: 'application/json',
  jsonld: 'application/ld+json',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  toml: 'application/toml',

  // Styling
  css: 'text/css',
  scss: 'text/x-scss',
  sass: 'text/x-sass',
  less: 'text/x-less',

  // Images
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  tif: 'image/tiff',

  // Fonts
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',

  // Media
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',

  // Documents
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Archives
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  bz2: 'application/x-bzip2',
  xz: 'application/x-xz',

  // Extensions & packages
  crx: 'application/x-chrome-extension',
  crx3: 'application/x-chrome-extension',
  xpi: 'application/x-xpinstall',
  apk: 'application/vnd.android.package-archive',
  dmg: 'application/x-apple-diskimage',

  // Data formats
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  sql: 'text/x-sql',
  geojson: 'application/geo+json',
  wasm: 'application/wasm',

  // Other text formats
  log: 'text/plain',
  conf: 'text/plain',
  config: 'text/plain',
  sh: 'text/x-shellscript',
  bash: 'text/x-shellscript',
  zsh: 'text/x-shellscript',
  fish: 'text/x-shellscript',
  py: 'text/x-python',
  rb: 'text/x-ruby',
  java: 'text/x-java',
  go: 'text/x-go',
  rs: 'text/x-rust',
  c: 'text/x-csrc',
  cpp: 'text/x-c++src',
  h: 'text/x-c',
  hpp: 'text/x-c++hdr',
  swift: 'text/x-swift',
  kt: 'text/x-kotlin',
};

/**
 * Get MIME type for a file based on its extension
 *
 * @param filename - The filename to get MIME type for
 * @returns MIME type string
 *
 * @example
 * ```typescript
 * getMimeType('index.html') // 'text/html'
 * getMimeType('style.css') // 'text/css'
 * getMimeType('unknown.xyz') // 'application/octet-stream'
 * ```
 */
export function getMimeType(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'application/octet-stream';
  }

  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (!ext) {
    return 'application/octet-stream';
  }

  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Check if a file is a text-based file by MIME type
 *
 * @param mimeType - MIME type to check
 * @returns true if the MIME type represents a text file
 */
export function isTextMimeType(mimeType: string): boolean {
  return (
    mimeType.startsWith('text/') ||
    mimeType.includes('javascript') ||
    mimeType.includes('json') ||
    mimeType.includes('xml') ||
    mimeType === 'application/toml' ||
    mimeType === 'application/wasm'
  );
}

/**
 * Check if a file is a binary file by MIME type
 *
 * @param mimeType - MIME type to check
 * @returns true if the MIME type represents a binary file
 */
export function isBinaryMimeType(mimeType: string): boolean {
  return !isTextMimeType(mimeType);
}

/**
 * Check if a file is a binary file by filename
 *
 * @param filename - The filename to check
 * @returns true if the file is likely binary
 */
export function isBinaryFile(filename: string): boolean {
  const mimeType = getMimeType(filename);
  return isBinaryMimeType(mimeType);
}

/**
 * Check if a file is a source code file
 *
 * @param filename - The filename to check
 * @returns true if the file appears to be source code
 */
export function isSourceCodeFile(filename: string): boolean {
  const codeExtensions = [
    'js',
    'jsx',
    'ts',
    'tsx',
    'py',
    'rb',
    'java',
    'go',
    'rs',
    'c',
    'cpp',
    'h',
    'hpp',
    'swift',
    'kt',
    'sh',
    'bash',
    'sql',
  ];

  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return codeExtensions.includes(ext);
}

/**
 * Check if a file is a configuration file
 *
 * @param filename - The filename to check
 * @returns true if the file appears to be a configuration file
 */
export function isConfigFile(filename: string): boolean {
  const configPatterns = [
    /^\.?.*rc(\.json|\.js)?$/,
    /^.*\.config\.(js|ts|json)$/,
    /^(package|tsconfig|webpack|babel|eslint)\.json$/,
    /^(Dockerfile|Makefile|\.env.*)$/,
    /^(.*\.yml|.*\.yaml)$/,
    /^(.*\.toml)$/,
    /^(.*\.conf|.*\.cfg)$/,
  ];

  return configPatterns.some((pattern) => pattern.test(filename));
}

/**
 * Check if a file is documentation
 *
 * @param filename - The filename to check
 * @returns true if the file appears to be documentation
 */
export function isDocumentationFile(filename: string): boolean {
  const docPatterns = [
    /^README(\.md)?$/i,
    /^CHANGELOG(\.md)?$/i,
    /^LICENSE(\.txt|\.md)?$/i,
    /^CONTRIBUTING(\.md)?$/i,
    /^.*\.md$/,
    /^.*\.txt$/,
    /^.*\.rst$/,
  ];

  return docPatterns.some((pattern) => pattern.test(filename));
}

/**
 * Check if a file is an image file
 *
 * @param filename - The filename to check
 * @returns true if the file is an image
 */
export function isImageFile(filename: string): boolean {
  const mimeType = getMimeType(filename);
  return mimeType.startsWith('image/');
}

/**
 * Check if a file is a font file
 *
 * @param filename - The filename to check
 * @returns true if the file is a font
 */
export function isFontFile(filename: string): boolean {
  const mimeType = getMimeType(filename);
  return mimeType.startsWith('font/');
}

/**
 * Check if a file is an archive file
 *
 * @param filename - The filename to check
 * @returns true if the file is an archive
 */
export function isArchiveFile(filename: string): boolean {
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return archiveExtensions.includes(ext);
}

/**
 * Categorize a file by its name and type
 *
 * @param filename - The filename to categorize
 * @returns File category
 */
export function categorizeFile(
  filename: string
): 'code' | 'config' | 'resource' | 'documentation' | 'asset' | 'other' {
  if (isSourceCodeFile(filename)) {
    return 'code';
  }

  if (isConfigFile(filename)) {
    return 'config';
  }

  if (isDocumentationFile(filename)) {
    return 'documentation';
  }

  if (isImageFile(filename) || isFontFile(filename)) {
    return 'asset';
  }

  if (isArchiveFile(filename)) {
    return 'resource';
  }

  return 'other';
}

/**
 * Get file extension from filename
 *
 * @param filename - The filename
 * @returns File extension (without dot), or empty string if none
 */
export function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop();
  return ext === filename ? '' : (ext || '');
}

/**
 * Get filename without extension
 *
 * @param filename - The filename
 * @returns Filename without extension
 */
export function getFileBaseName(filename: string): string {
  const ext = getFileExtension(filename);
  return ext ? filename.slice(0, -(ext.length + 1)) : filename;
}

/**
 * Check if MIME type is compressible for gzip encoding
 *
 * @param mimeType - MIME type to check
 * @returns true if the MIME type is typically compressible
 */
export function isCompressible(mimeType: string): boolean {
  const incompressibleTypes = [
    'image/',
    'video/',
    'audio/',
    'application/zip',
    'application/gzip',
    'application/x-7z-compressed',
  ];

  return !incompressibleTypes.some((type) => mimeType.startsWith(type));
}
