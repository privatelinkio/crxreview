/**
 * Detect programming language from file extension
 */

export type SupportedLanguage =
  | 'javascript' | 'typescript' | 'jsx' | 'tsx'
  | 'html' | 'css' | 'scss' | 'less'
  | 'json' | 'yaml' | 'xml'
  | 'python' | 'ruby' | 'php' | 'go' | 'rust'
  | 'shell' | 'bash'
  | 'markdown' | 'text'
  | 'unknown';

const LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  // JavaScript/TypeScript
  '.js': 'javascript',
  '.jsx': 'jsx',
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.mjs': 'javascript',
  '.cjs': 'javascript',

  // HTML/CSS
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'scss',
  '.less': 'less',

  // Data formats
  '.json': 'json',
  '.jsonc': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.xml': 'xml',

  // Other languages
  '.py': 'python',
  '.rb': 'ruby',
  '.php': 'php',
  '.go': 'go',
  '.rs': 'rust',
  '.sh': 'shell',
  '.bash': 'bash',

  // Markup
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.txt': 'text',
};

const MIME_TYPE_MAP: Record<string, SupportedLanguage> = {
  'text/javascript': 'javascript',
  'text/typescript': 'typescript',
  'text/html': 'html',
  'text/css': 'css',
  'application/json': 'json',
  'text/yaml': 'yaml',
  'application/xml': 'xml',
  'text/x-python': 'python',
  'text/x-ruby': 'ruby',
  'text/x-php': 'php',
  'text/x-go': 'go',
  'text/x-rust': 'rust',
  'text/x-shellscript': 'shell',
  'text/markdown': 'markdown',
  'text/plain': 'text',
};

/**
 * Detect language from file extension
 * @param filePath - File path with extension
 * @returns Detected language
 */
export function detectLanguageFromPath(filePath: string): SupportedLanguage {
  const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
  return LANGUAGE_MAP[extension] || 'unknown';
}

/**
 * Detect language from MIME type
 * @param mimeType - MIME type string
 * @returns Detected language
 */
export function detectLanguageFromMime(mimeType: string): SupportedLanguage {
  return MIME_TYPE_MAP[mimeType.toLowerCase()] || 'unknown';
}

/**
 * Get Prism.js language identifier
 * @param language - Detected language
 * @returns Prism language ID
 */
export function getPrismLanguage(language: SupportedLanguage): string {
  const prismMap: Record<SupportedLanguage, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    yaml: 'yaml',
    xml: 'xml',
    python: 'python',
    ruby: 'ruby',
    php: 'php',
    go: 'go',
    rust: 'rust',
    shell: 'bash',
    bash: 'bash',
    markdown: 'markdown',
    text: 'text',
    unknown: 'text',
  };

  return prismMap[language];
}

/**
 * Check if language supports syntax highlighting
 * @param language - Detected language
 * @returns True if highlighting is supported
 */
export function isHighlightable(language: SupportedLanguage): boolean {
  return language !== 'unknown';
}

/**
 * Check if file is likely text-based
 * @param filePath - File path
 * @returns True if file is text-based
 */
export function isTextFile(filePath: string): boolean {
  // Binary file extensions
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
    '.zip', '.tar', '.gz', '.rar', '.7z',
    '.exe', '.dll', '.so', '.dylib',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  ];

  const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
  return !binaryExtensions.includes(extension);
}

/**
 * Check if file is an image
 * @param filePath - File path
 * @returns True if file is an image
 */
export function isImageFile(filePath: string): boolean {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg', '.bmp'];
  const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
  return imageExtensions.includes(extension);
}

/**
 * Get file category
 * @param filePath - File path
 * @returns Category of the file
 */
export function getFileCategory(filePath: string): 'code' | 'image' | 'data' | 'markup' | 'document' | 'unknown' {
  const language = detectLanguageFromPath(filePath);

  if (isImageFile(filePath)) return 'image';

  switch (language) {
    case 'javascript':
    case 'typescript':
    case 'jsx':
    case 'tsx':
    case 'python':
    case 'ruby':
    case 'php':
    case 'go':
    case 'rust':
    case 'shell':
    case 'bash':
      return 'code';

    case 'html':
      return 'markup';

    case 'css':
    case 'scss':
    case 'less':
      return 'code';

    case 'json':
    case 'yaml':
    case 'xml':
      return 'data';

    case 'markdown':
    case 'text':
      return 'document';

    default:
      return 'unknown';
  }
}
