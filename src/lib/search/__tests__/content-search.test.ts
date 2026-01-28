/**
 * Tests for content search functionality
 */

import {
  createSearchPattern,
  searchContent,
  highlightMatches,
  getMatchPreview,
  escapeHtml,
  validateSearchPattern,
  sortSearchResults,
  getSearchStatistics,
} from '../content-search';
import type { FileSearchResult } from '../content-search';

describe('content-search', () => {
  describe('createSearchPattern', () => {
    it('should create case-insensitive pattern', () => {
      const pattern = createSearchPattern('TODO', false);
      expect(pattern).toBeDefined();
      expect(pattern?.test('todo')).toBe(true);
      expect(pattern?.test('TODO')).toBe(true);
    });

    it('should create case-sensitive pattern', () => {
      const pattern = createSearchPattern('TODO', true);
      expect(pattern).toBeDefined();
      expect(pattern?.test('todo')).toBe(false);
      expect(pattern?.test('TODO')).toBe(true);
    });

    it('should create whole word pattern', () => {
      const pattern = createSearchPattern('test', false, true);
      expect(pattern?.test('test')).toBe(true);
      expect(pattern?.test('testing')).toBe(false);
    });

    it('should handle regex patterns', () => {
      const pattern = createSearchPattern('^TODO.*$', false, false, true);
      expect(pattern?.test('TODO: fix this')).toBe(true);
      expect(pattern?.test('FIXME: todo')).toBe(false);
    });

    it('should escape special characters in non-regex mode', () => {
      const pattern = createSearchPattern('$100', false, false, false);
      expect(pattern?.test('price is $100')).toBe(true);
    });

    it('should return null for invalid regex', () => {
      const pattern = createSearchPattern('[invalid(regex', false, false, true);
      expect(pattern).toBeNull();
    });

    it('should return null for empty query', () => {
      const pattern = createSearchPattern('');
      expect(pattern).toBeNull();
    });
  });

  describe('searchContent', () => {
    const testContent = `line 1
line 2 with TODO
line 3 TODO another
line 4
line 5 testing`;

    it('should find matches in content', () => {
      const pattern = createSearchPattern('TODO', false)!;
      const matches = searchContent(testContent, pattern);

      expect(matches.length).toBe(2);
      expect(matches[0].lineNumber).toBe(2);
      expect(matches[1].lineNumber).toBe(3);
    });

    it('should include context lines', () => {
      const pattern = createSearchPattern('TODO', false)!;
      const matches = searchContent(testContent, pattern, { contextLines: 1 });

      expect(matches[0].contextBefore.length).toBe(1);
      expect(matches[0].contextAfter.length).toBe(1);
    });

    it('should calculate line and column numbers correctly', () => {
      const pattern = createSearchPattern('TODO', false)!;
      const matches = searchContent(testContent, pattern);

      const firstMatch = matches[0];
      expect(firstMatch.lineNumber).toBe(2);
      expect(firstMatch.columnNumber).toBeGreaterThan(0);
    });

    it('should handle matches at line start', () => {
      const pattern = createSearchPattern('^line', false, false, true)!;
      const matches = searchContent(testContent, pattern);

      expect(matches.length).toBeGreaterThan(0);
    });

    it('should include line content', () => {
      const pattern = createSearchPattern('TODO', false)!;
      const matches = searchContent(testContent, pattern);

      expect(matches[0].lineContent).toContain('TODO');
    });
  });

  describe('highlightMatches', () => {
    it('should wrap matches in mark tags', () => {
      const pattern = createSearchPattern('test', false)!;
      const text = 'this is a test string';
      const highlighted = highlightMatches(text, pattern);

      expect(highlighted).toContain('<mark>test</mark>');
    });

    it('should handle multiple matches', () => {
      const pattern = createSearchPattern('a', false)!;
      const text = 'aaa bbb aaa';
      const highlighted = highlightMatches(text, pattern);

      const markCount = (highlighted.match(/<mark>/g) || []).length;
      expect(markCount).toBeGreaterThan(1);
    });

    it('should escape HTML in matched text', () => {
      const pattern = createSearchPattern('<script>', false)!;
      const text = '<script>alert("xss")</script>';
      const highlighted = highlightMatches(text, pattern);

      expect(highlighted).not.toContain('<script>');
      expect(highlighted).toContain('&lt;script&gt;');
    });
  });

  describe('getMatchPreview', () => {
    it('should return preview of match', () => {
      const match = {
        fileId: 'test',
        filePath: 'test.js',
        lineNumber: 1,
        columnNumber: 10,
        matchStart: 0,
        matchEnd: 5,
        lineContent: 'this is a test string that is quite long',
        contextBefore: [],
        contextAfter: [],
      };

      const preview = getMatchPreview(match);
      expect(preview).toContain('test');
      expect(preview.length).toBeLessThanOrEqual(100);
    });

    it('should add ellipsis for truncated preview', () => {
      const match = {
        fileId: 'test',
        filePath: 'test.js',
        lineNumber: 1,
        columnNumber: 5,
        matchStart: 0,
        matchEnd: 5,
        lineContent: 'a'.repeat(200),
        contextBefore: [],
        contextAfter: [],
      };

      const preview = getMatchPreview(match, 50);
      expect(preview.length).toBeLessThanOrEqual(50);
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('hello & goodbye')).toBe('hello &amp; goodbye');
      expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    });

    it('should handle multiple special characters', () => {
      const escaped = escapeHtml('<div class="test"> & content</div>');
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
    });
  });

  describe('validateSearchPattern', () => {
    it('should return null for valid patterns', () => {
      expect(validateSearchPattern('^test$')).toBeNull();
      expect(validateSearchPattern('[a-z]+')).toBeNull();
    });

    it('should return error for invalid regex', () => {
      const error = validateSearchPattern('[invalid(');
      expect(error).not.toBeNull();
      expect(typeof error).toBe('string');
    });

    it('should return null for empty pattern', () => {
      expect(validateSearchPattern('')).toBeNull();
    });
  });

  describe('sortSearchResults', () => {
    it('should sort by match count descending', () => {
      const results: FileSearchResult[] = [
        {
          filePath: 'a.js',
          fileId: 'a',
          matchCount: 1,
          matches: [],
        },
        {
          filePath: 'b.js',
          fileId: 'b',
          matchCount: 5,
          matches: [],
        },
        {
          filePath: 'c.js',
          fileId: 'c',
          matchCount: 3,
          matches: [],
        },
      ];

      const sorted = sortSearchResults(results);
      expect(sorted[0].matchCount).toBe(5);
      expect(sorted[1].matchCount).toBe(3);
      expect(sorted[2].matchCount).toBe(1);
    });

    it('should sort by file path when match counts are equal', () => {
      const results: FileSearchResult[] = [
        {
          filePath: 'z.js',
          fileId: 'z',
          matchCount: 2,
          matches: [],
        },
        {
          filePath: 'a.js',
          fileId: 'a',
          matchCount: 2,
          matches: [],
        },
      ];

      const sorted = sortSearchResults(results);
      expect(sorted[0].filePath).toBe('a.js');
      expect(sorted[1].filePath).toBe('z.js');
    });
  });

  describe('getSearchStatistics', () => {
    it('should calculate statistics correctly', () => {
      const results: FileSearchResult[] = [
        {
          filePath: 'a.js',
          fileId: 'a',
          matchCount: 5,
          matches: [],
        },
        {
          filePath: 'b.js',
          fileId: 'b',
          matchCount: 3,
          matches: [],
        },
      ];

      const stats = getSearchStatistics(results);
      expect(stats.totalMatches).toBe(8);
      expect(stats.filesWithMatches).toBe(2);
      expect(stats.averageMatchesPerFile).toBe(4);
    });

    it('should handle empty results', () => {
      const stats = getSearchStatistics([]);
      expect(stats.totalMatches).toBe(0);
      expect(stats.filesWithMatches).toBe(0);
      expect(stats.averageMatchesPerFile).toBe(0);
    });
  });
});
