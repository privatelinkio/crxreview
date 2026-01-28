/**
 * Tests for file filter functionality
 */

import {
  createFilterPattern,
  matchesPattern,
  getFileTypeCategory,
  belongsToCategories,
  filterFileTree,
  getMatchingFiles,
  validateRegexPattern,
} from '../file-filter';
import type { FileTreeNode } from '../../zip/file-tree';

// Mock file tree for testing
const createMockFileTree = (): FileTreeNode => ({
  name: 'root',
  path: '',
  isDirectory: true,
  size: 0,
  compressedSize: 0,
  date: new Date(),
  children: [
    {
      name: 'src',
      path: 'src',
      isDirectory: true,
      size: 0,
      compressedSize: 0,
      date: new Date(),
      children: [
        {
          name: 'index.ts',
          path: 'src/index.ts',
          isDirectory: false,
          size: 100,
          compressedSize: 50,
          date: new Date(),
          children: [],
        },
        {
          name: 'style.css',
          path: 'src/style.css',
          isDirectory: false,
          size: 200,
          compressedSize: 100,
          date: new Date(),
          children: [],
        },
      ],
    },
    {
      name: 'assets',
      path: 'assets',
      isDirectory: true,
      size: 0,
      compressedSize: 0,
      date: new Date(),
      children: [
        {
          name: 'logo.png',
          path: 'assets/logo.png',
          isDirectory: false,
          size: 5000,
          compressedSize: 3000,
          date: new Date(),
          children: [],
        },
      ],
    },
  ],
});

describe('file-filter', () => {
  describe('createFilterPattern', () => {
    it('should create pattern from glob-like string', () => {
      const pattern = createFilterPattern('*.js');
      expect(pattern).toBeDefined();
      expect(pattern?.test('index.js')).toBe(true);
      expect(pattern?.test('style.css')).toBe(false);
    });

    it('should create pattern from regex string', () => {
      const pattern = createFilterPattern('^src/.*\\.js$', true);
      expect(pattern).toBeDefined();
      expect(pattern?.test('src/index.js')).toBe(true);
      expect(pattern?.test('src/style.css')).toBe(false);
    });

    it('should handle case sensitivity', () => {
      const caseSensitive = createFilterPattern('*.JS', false, true);
      const caseInsensitive = createFilterPattern('*.JS', false, false);

      expect(caseSensitive?.test('index.js')).toBe(false);
      expect(caseInsensitive?.test('index.js')).toBe(true);
    });

    it('should return null for invalid regex', () => {
      const pattern = createFilterPattern('[invalid(regex', true);
      expect(pattern).toBeNull();
    });

    it('should return null for empty pattern', () => {
      const pattern = createFilterPattern('');
      expect(pattern).toBeNull();
    });
  });

  describe('matchesPattern', () => {
    it('should match filenames correctly', () => {
      const pattern = createFilterPattern('*.ts')!;
      expect(matchesPattern('index.ts', pattern)).toBe(true);
      expect(matchesPattern('style.css', pattern)).toBe(false);
    });
  });

  describe('getFileTypeCategory', () => {
    it('should categorize code files', () => {
      expect(getFileTypeCategory('index.js')).toBe('code');
      expect(getFileTypeCategory('script.ts')).toBe('code');
    });

    it('should categorize image files', () => {
      expect(getFileTypeCategory('logo.png')).toBe('images');
      expect(getFileTypeCategory('icon.svg')).toBe('images');
    });

    it('should categorize markup files', () => {
      expect(getFileTypeCategory('index.html')).toBe('markup');
      expect(getFileTypeCategory('style.css')).toBe('markup');
      expect(getFileTypeCategory('config.json')).toBe('markup');
    });

    it('should categorize locale files', () => {
      expect(getFileTypeCategory('_locales/en/messages.json')).toBe('locales');
    });

    it('should return misc for unknown files', () => {
      expect(getFileTypeCategory('README.md')).toBe('misc');
      expect(getFileTypeCategory('LICENSE')).toBe('misc');
    });
  });

  describe('belongsToCategories', () => {
    it('should return true if file is in specified categories', () => {
      expect(belongsToCategories('index.ts', ['code'])).toBe(true);
      expect(belongsToCategories('logo.png', ['images'])).toBe(true);
    });

    it('should return false if file is not in specified categories', () => {
      expect(belongsToCategories('index.ts', ['images'])).toBe(false);
      expect(belongsToCategories('logo.png', ['code'])).toBe(false);
    });

    it('should return true if any category matches', () => {
      expect(belongsToCategories('index.ts', ['code', 'images'])).toBe(true);
    });

    it('should return true if no categories specified', () => {
      expect(belongsToCategories('index.ts', [])).toBe(true);
    });
  });

  describe('filterFileTree', () => {
    it('should filter files by pattern', () => {
      const tree = createMockFileTree();
      const filtered = filterFileTree(tree, {
        namePattern: '*.ts',
      });

      const files = getAllFilesFromTree(filtered);
      expect(files.some(f => f.name === 'index.ts')).toBe(true);
      expect(files.some(f => f.name === 'style.css')).toBe(false);
    });

    it('should filter files by category', () => {
      const tree = createMockFileTree();
      const filtered = filterFileTree(tree, {
        categories: ['images'],
      });

      const files = getAllFilesFromTree(filtered);
      expect(files.some(f => f.name === 'logo.png')).toBe(true);
      expect(files.some(f => f.name === 'index.ts')).toBe(false);
    });

    it('should preserve directory structure', () => {
      const tree = createMockFileTree();
      const filtered = filterFileTree(tree, {
        namePattern: '*.ts',
      });

      expect(filtered.children.some(c => c.name === 'src')).toBe(true);
    });
  });

  describe('getMatchingFiles', () => {
    it('should return matching file paths', () => {
      const tree = createMockFileTree();
      const matches = getMatchingFiles(tree, {
        namePattern: '*.ts',
      });

      expect(matches).toContain('src/index.ts');
      expect(matches).not.toContain('src/style.css');
    });

    it('should handle multiple criteria', () => {
      const tree = createMockFileTree();
      const matches = getMatchingFiles(tree, {
        namePattern: '*',
        categories: ['code'],
      });

      expect(matches).toContain('src/index.ts');
      expect(matches).not.toContain('assets/logo.png');
    });
  });

  describe('validateRegexPattern', () => {
    it('should return null for valid patterns', () => {
      expect(validateRegexPattern('^src/.*\\.js$')).toBeNull();
      expect(validateRegexPattern('[a-z]+')).toBeNull();
    });

    it('should return error message for invalid patterns', () => {
      const error = validateRegexPattern('[invalid(regex');
      expect(error).not.toBeNull();
      expect(typeof error).toBe('string');
    });

    it('should return null for empty pattern', () => {
      expect(validateRegexPattern('')).toBeNull();
    });
  });
});

// Helper function
function getAllFilesFromTree(node: FileTreeNode): FileTreeNode[] {
  const files: FileTreeNode[] = [];

  function traverse(current: FileTreeNode): void {
    if (!current.isDirectory) {
      files.push(current);
    }
    for (const child of current.children) {
      traverse(child);
    }
  }

  traverse(node);
  return files;
}
