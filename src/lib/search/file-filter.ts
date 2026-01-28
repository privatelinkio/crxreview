/**
 * File filtering utilities for CRX Review
 *
 * Provides regex-based filename matching and file type category filtering
 */

import type { FileTreeNode } from '../zip/file-tree';

/**
 * File type categories
 */
export type FileTypeCategory = 'images' | 'code' | 'markup' | 'locales' | 'misc';

/**
 * Configuration for file type filtering
 */
export interface FileTypeConfig {
  category: FileTypeCategory;
  label: string;
  extensions: string[];
  patterns: RegExp[];
}

/**
 * File type category definitions
 */
export const FILE_TYPE_CATEGORIES: Record<FileTypeCategory, FileTypeConfig> = {
  images: {
    category: 'images',
    label: 'Images',
    extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'],
    patterns: [/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i],
  },
  code: {
    category: 'code',
    label: 'Code',
    extensions: ['js', 'ts', 'tsx', 'jsx', 'mjs', 'cjs'],
    patterns: [
      /\.(js|ts|tsx|jsx|mjs|cjs)$/i,
      /^(manifest|webpack|vite|rollup|tsconfig|package|babel|jest)\..*$/i,
    ],
  },
  markup: {
    category: 'markup',
    label: 'Markup & Styles',
    extensions: ['html', 'htm', 'css', 'scss', 'less', 'xml', 'json', 'yaml', 'yml'],
    patterns: [
      /\.(html|htm|css|scss|less|xml|json|ya?ml)$/i,
      /\.(manifest)\.json$/i,
    ],
  },
  locales: {
    category: 'locales',
    label: 'Locales',
    extensions: ['json', 'po', 'pot', 'xliff'],
    patterns: [
      /locales?.*\.(json|po|pot|xliff)$/i,
      /_locales\/.*\.json$/i,
    ],
  },
  misc: {
    category: 'misc',
    label: 'Other',
    extensions: [],
    patterns: [],
  },
};

/**
 * Filter configuration interface
 */
export interface FileFilterConfig {
  namePattern?: string;
  useRegex?: boolean;
  categories?: FileTypeCategory[];
  caseSensitive?: boolean;
}

/**
 * Create a regex pattern from a filter string
 *
 * @param pattern - Filter pattern (can be glob-like or regex)
 * @param useRegex - If true, treat pattern as regex; otherwise use glob-like matching
 * @param caseSensitive - Whether the pattern should be case-sensitive
 * @returns Compiled regex or null if invalid
 */
export function createFilterPattern(
  pattern: string,
  useRegex: boolean = false,
  caseSensitive: boolean = false
): RegExp | null {
  if (!pattern) return null;

  try {
    if (useRegex) {
      // User provided a regex pattern
      const flags = caseSensitive ? 'g' : 'gi';
      return new RegExp(pattern, flags);
    } else {
      // Convert glob-like pattern to regex
      // Support: *, ?, [abc], [!abc], **
      let regexPattern = pattern
        .replace(/\./g, '\\.') // Escape dots
        .replace(/\*\*/g, '(?:.*/)?') // ** matches any directory
        .replace(/\*/g, '[^/]*') // * matches anything except /
        .replace(/\?/g, '.'); // ? matches single character

      // Wrap with anchors
      regexPattern = `^.*${regexPattern}.*$`;

      const flags = caseSensitive ? 'g' : 'gi';
      return new RegExp(regexPattern, flags);
    }
  } catch (error) {
    return null;
  }
}

/**
 * Check if a filename matches a pattern
 *
 * @param filename - Filename to check
 * @param pattern - Regex pattern to match against
 * @returns true if filename matches pattern
 */
export function matchesPattern(filename: string, pattern: RegExp): boolean {
  return pattern.test(filename);
}

/**
 * Get file type category for a file
 *
 * @param filename - Filename to categorize
 * @returns File type category
 */
export function getFileTypeCategory(filename: string): FileTypeCategory {
  for (const [category, config] of Object.entries(FILE_TYPE_CATEGORIES)) {
    if (category === 'misc') continue;

    if (config.patterns.some(pattern => pattern.test(filename))) {
      return category as FileTypeCategory;
    }
  }
  return 'misc';
}

/**
 * Check if a file belongs to specified categories
 *
 * @param filename - Filename to check
 * @param categories - Categories to check against
 * @returns true if file belongs to any of the specified categories
 */
export function belongsToCategories(
  filename: string,
  categories: FileTypeCategory[]
): boolean {
  if (categories.length === 0) return true;
  const category = getFileTypeCategory(filename);
  return categories.includes(category);
}

/**
 * Filter a file tree based on criteria
 *
 * @param node - File tree node to filter
 * @param config - Filter configuration
 * @returns Filtered file tree node (preserves directory structure)
 */
export function filterFileTree(
  node: FileTreeNode,
  config: FileFilterConfig
): FileTreeNode {
  const pattern = config.namePattern
    ? createFilterPattern(
        config.namePattern,
        config.useRegex,
        config.caseSensitive
      )
    : null;

  const categories = config.categories || [];

  function shouldInclude(fileNode: FileTreeNode): boolean {
    if (fileNode.isDirectory) {
      // Directories are included if they have matching children
      return true;
    }

    // Check filename pattern
    if (pattern && !matchesPattern(fileNode.name, pattern)) {
      return false;
    }

    // Check file type category
    if (categories.length > 0 && !belongsToCategories(fileNode.name, categories)) {
      return false;
    }

    return true;
  }

  function filterNode(current: FileTreeNode): FileTreeNode | null {
    if (!current.isDirectory) {
      // For files, include or exclude based on filter
      return shouldInclude(current) ? current : null;
    }

    // For directories, filter children and check if any match
    const filteredChildren = current.children
      .map(child => filterNode(child))
      .filter((child): child is FileTreeNode => child !== null);

    // Include directory if it has children or no filters are applied
    if (filteredChildren.length > 0 || (pattern === null && categories.length === 0)) {
      return {
        ...current,
        children: filteredChildren,
      };
    }

    return null;
  }

  const filtered = filterNode(node);
  return filtered || node; // Return original if filter resulted in empty tree
}

/**
 * Get all files matching filter criteria
 *
 * @param node - File tree root node
 * @param config - Filter configuration
 * @returns Array of matching file paths
 */
export function getMatchingFiles(
  node: FileTreeNode,
  config: FileFilterConfig
): string[] {
  const pattern = config.namePattern
    ? createFilterPattern(
        config.namePattern,
        config.useRegex,
        config.caseSensitive
      )
    : null;

  const categories = config.categories || [];
  const matches: string[] = [];

  function traverse(current: FileTreeNode): void {
    if (!current.isDirectory) {
      // Check filename pattern
      if (pattern && !matchesPattern(current.name, pattern)) {
        return;
      }

      // Check file type category
      if (categories.length > 0 && !belongsToCategories(current.name, categories)) {
        return;
      }

      matches.push(current.path);
      return;
    }

    for (const child of current.children) {
      traverse(child);
    }
  }

  traverse(node);
  return matches;
}

/**
 * Validate a regex pattern string
 *
 * @param pattern - Pattern string to validate
 * @returns Error message or null if valid
 */
export function validateRegexPattern(pattern: string): string | null {
  if (!pattern) return null;

  try {
    new RegExp(pattern);
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid regex pattern';
    return message;
  }
}
