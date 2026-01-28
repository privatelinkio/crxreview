/**
 * File and path utility functions
 */

/**
 * Get the file extension from a path
 *
 * @param filePath - Full file path
 * @returns File extension (e.g., "js", "json") or empty string if no extension
 */
export function getFileExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filePath.length - 1) {
    return '';
  }
  return filePath.substring(lastDot + 1).toLowerCase();
}

/**
 * Get the file name from a path
 *
 * @param filePath - Full file path
 * @returns Just the file name without directory path
 */
export function getFileName(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/');
  if (lastSlash === -1) {
    return filePath;
  }
  return filePath.substring(lastSlash + 1);
}

/**
 * Get the directory path from a file path
 *
 * @param filePath - Full file path
 * @returns Directory path (e.g., "src/components" for "src/components/Button.tsx")
 */
export function getDirectoryPath(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/');
  if (lastSlash === -1) {
    return '';
  }
  return filePath.substring(0, lastSlash);
}

/**
 * Format file size for display
 *
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., "1.5 MB", "256 B")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  if (i === 0) {
    return `${bytes} ${sizes[i]}`;
  }

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Check if a file is likely text content
 *
 * @param fileName - File name or path
 * @returns True if the file appears to be text-based
 */
export function isTextFile(fileName: string): boolean {
  const textExtensions = [
    'js', 'ts', 'jsx', 'tsx',
    'json', 'xml', 'html', 'css', 'scss',
    'txt', 'md', 'markdown',
    'yaml', 'yml', 'toml', 'ini', 'conf',
    'py', 'sh', 'bash',
    'java', 'cpp', 'c', 'h', 'cs',
    'rb', 'go', 'rs',
  ];

  const ext = getFileExtension(fileName);
  return textExtensions.includes(ext);
}

/**
 * Check if a file is a common extension manifest file
 *
 * @param fileName - File name
 * @returns True if file is a manifest file
 */
export function isManifestFile(fileName: string): boolean {
  return fileName.includes('manifest');
}

/**
 * Filter files based on search term
 *
 * @param files - Array of file paths
 * @param filter - Search term (case-insensitive)
 * @returns Filtered array of matching file paths
 */
export function filterFiles(files: string[], filter: string): string[] {
  if (!filter || filter.trim() === '') {
    return files;
  }

  const lowerFilter = filter.toLowerCase();
  return files.filter((file) => file.toLowerCase().includes(lowerFilter));
}
