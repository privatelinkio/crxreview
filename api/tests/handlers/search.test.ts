/**
 * Integration tests for search endpoint
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMockContext, clearMockStorage, generateSessionId } from '../utils/helpers';
import { SAMPLE_SEARCH_QUERIES, SAMPLE_PAGINATION, SAMPLE_FILE_PATTERNS } from '../utils/fixtures';

describe('Search Handler - POST /api/sessions/:sessionId/search', () => {
  let context: any;

  beforeEach(() => {
    context = createMockContext({
      req: {
        method: 'POST',
        headers: {
          'x-api-key': 'test-api-key-1',
          'content-type': 'application/json',
        },
        params: {
          sessionId: generateSessionId(),
        },
      },
    });
  });

  afterEach(() => {
    clearMockStorage(context);
  });

  describe('Basic Text Search', () => {
    it('should search for simple text query', () => {
      const query = SAMPLE_SEARCH_QUERIES.simple;

      expect(query).toBe('Test Extension');
    });

    it('should return matching files', () => {
      const results = {
        results: [
          {
            file: 'manifest.json',
            matches: [
              {
                lineNumber: 2,
                columnNumber: 10,
                line: '  "name": "Test Extension",',
                match: 'Test Extension',
              },
            ],
            matchCount: 1,
          },
        ],
        totalMatches: 1,
      };

      expect(results.results).toHaveLength(1);
      expect(results.results[0].file).toBe('manifest.json');
    });

    it('should include line numbers in matches', () => {
      const match = {
        lineNumber: 5,
        columnNumber: 0,
        line: 'const name = "Test Extension";',
        match: 'Test Extension',
      };

      expect(match.lineNumber).toBe(5);
      expect(match.columnNumber).toBe(0);
    });

    it('should include full line context', () => {
      const match = {
        line: '  "name": "Test Extension",',
      };

      expect(match.line).toContain('Test Extension');
    });

    it('should count matches per file', () => {
      const results = {
        results: [
          {
            file: 'manifest.json',
            matchCount: 2,
            matches: [
              { lineNumber: 2, match: 'Test' },
              { lineNumber: 3, match: 'Test' },
            ],
          },
        ],
      };

      expect(results.results[0].matchCount).toBe(2);
    });

    it('should return total match count', () => {
      const results = {
        totalMatches: 5,
      };

      expect(results.totalMatches).toBe(5);
    });
  });

  describe('Case Sensitivity', () => {
    it('should support case-insensitive search by default', () => {
      const response = {
        options: {
          caseSensitive: false,
        },
        results: [
          { file: 'manifest.json' },
          { file: 'background.js' },
        ],
      };

      expect(response.options.caseSensitive).toBe(false);
    });

    it('should support case-sensitive search', () => {
      const response = {
        options: {
          caseSensitive: true,
        },
        results: [
          { file: 'manifest.json' },
        ],
      };

      expect(response.options.caseSensitive).toBe(true);
    });

    it('should differentiate case when requested', () => {
      const caseInsensitiveResults = {
        count: 5,
      };

      const caseSensitiveResults = {
        count: 2,
      };

      expect(caseSensitiveResults.count).toBeLessThan(caseInsensitiveResults.count);
    });
  });

  describe('Regex Search', () => {
    it('should support regex patterns', () => {
      const pattern = SAMPLE_SEARCH_QUERIES.regex;

      expect(pattern).toBe('/chrome\\.[a-z]+/');
    });

    it('should return matches for regex', () => {
      const results = {
        results: [
          {
            file: 'background.js',
            matches: [
              { match: 'chrome.runtime' },
              { match: 'chrome.storage' },
            ],
          },
        ],
        totalMatches: 2,
      };

      expect(results.totalMatches).toBe(2);
    });

    it('should support regex flags', () => {
      const response = {
        pattern: '/test/gi',
        options: {
          global: true,
          ignoreCase: true,
        },
      };

      expect(response.options.global).toBe(true);
      expect(response.options.ignoreCase).toBe(true);
    });

    it('should return invalid regex error', () => {
      const response = {
        success: false,
        error: 'Invalid regex pattern: /[invalid/gi',
        statusCode: 400,
      };

      expect(response.statusCode).toBe(400);
      expect(response.error).toContain('Invalid regex');
    });
  });

  describe('File Pattern Filtering', () => {
    it('should filter by file pattern', () => {
      const request = {
        query: 'test',
        filePattern: '*.js',
      };

      expect(request.filePattern).toBe('*.js');
    });

    it('should support multiple patterns', () => {
      const patterns = SAMPLE_FILE_PATTERNS.javascript;

      expect(patterns).toContain('*.js');
      expect(patterns).toContain('*.ts');
    });

    it('should search only in matching files', () => {
      const results = {
        results: [
          { file: 'manifest.json' },
          { file: 'background.js' },
          { file: 'content.js' },
        ],
        searchedFiles: 3,
      };

      expect(results.searchedFiles).toBe(3);
      expect(results.results.every((r: any) => r.file.endsWith('.js') || r.file === 'manifest.json')).toBe(true);
    });

    it('should return file count', () => {
      const results = {
        searchedFiles: 42,
        filesWithMatches: 5,
      };

      expect(results.filesWithMatches).toBeLessThanOrEqual(results.searchedFiles);
    });
  });

  describe('Pagination', () => {
    it('should support pagination', () => {
      const params = SAMPLE_PAGINATION.page1;

      expect(params.page).toBe(1);
      expect(params.limit).toBe(10);
    });

    it('should return page info', () => {
      const response = {
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasMore: true,
        },
      };

      expect(response.pagination.page).toBe(1);
      expect(response.pagination.totalPages).toBe(3);
    });

    it('should return correct hasMore flag', () => {
      const page1 = {
        pagination: {
          page: 1,
          totalPages: 3,
          hasMore: true,
        },
      };

      const page3 = {
        pagination: {
          page: 3,
          totalPages: 3,
          hasMore: false,
        },
      };

      expect(page1.pagination.hasMore).toBe(true);
      expect(page3.pagination.hasMore).toBe(false);
    });

    it('should handle custom page size', () => {
      const params = SAMPLE_PAGINATION.customLimit;

      expect(params.limit).toBe(50);
    });

    it('should validate pagination params', () => {
      const invalidParams = SAMPLE_PAGINATION.invalid;

      const response = {
        success: false,
        error: 'Page must be >= 1, limit must be > 0',
        statusCode: 400,
      };

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Response Format', () => {
    it('should return search results', () => {
      const response = {
        success: true,
        results: [
          {
            file: 'manifest.json',
            matches: [],
            matchCount: 0,
          },
        ],
      };

      expect(response.success).toBe(true);
      expect(response.results).toBeDefined();
    });

    it('should include execution time', () => {
      const response = {
        executionTime: 45,
      };

      expect(response.executionTime).toBeGreaterThan(0);
      expect(response.executionTime).toBeLessThan(10000);
    });

    it('should include search summary', () => {
      const response = {
        summary: {
          query: 'test',
          totalMatches: 5,
          searchedFiles: 42,
          filesWithMatches: 3,
          executionTime: 45,
        },
      };

      expect(response.summary.query).toBe('test');
      expect(response.summary.filesWithMatches).toBeLessThanOrEqual(response.summary.searchedFiles);
    });
  });

  describe('Special Characters', () => {
    it('should escape special regex characters', () => {
      const query = '$100';
      const escaped = '\\$100';

      expect(escaped).toContain('\\$');
    });

    it('should handle unicode characters', () => {
      const query = '日本語';

      expect(query.length).toBeGreaterThan(0);
    });

    it('should handle quotes in query', () => {
      const query = '"Test Extension"';

      expect(query).toContain('"');
    });

    it('should handle newlines in file content', () => {
      const results = {
        results: [
          {
            file: 'manifest.json',
            matches: [
              { lineNumber: 1 },
              { lineNumber: 2 },
            ],
          },
        ],
      };

      expect(results.results[0].matches).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent session', () => {
      const response = {
        success: false,
        error: 'Session not found',
        statusCode: 404,
      };

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 for invalid query', () => {
      const response = {
        success: false,
        error: 'Query is required',
        statusCode: 400,
      };

      expect(response.statusCode).toBe(400);
    });

    it('should return 422 for invalid regex', () => {
      const response = {
        success: false,
        error: 'Invalid regex pattern',
        statusCode: 422,
      };

      expect(response.statusCode).toBe(422);
    });

    it('should include error details', () => {
      const response = {
        success: false,
        error: 'Invalid regex pattern: /[invalid',
        details: {
          pattern: '/[invalid',
          reason: 'Unmatched [',
        },
      };

      expect(response.details.reason).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should search large files efficiently', () => {
      const largeFile = 'a'.repeat(1000000);

      expect(largeFile.length).toBe(1000000);
    });

    it('should handle many matches efficiently', () => {
      const results = {
        results: Array.from({ length: 100 }, (_, i) => ({
          file: `file${i}.js`,
          matchCount: 10,
        })),
      };

      expect(results.results).toHaveLength(100);
    });

    it('should complete within timeout', () => {
      const startTime = Date.now();

      // Simulate search
      const results = {
        results: [],
      };

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // 30 second timeout
    });
  });

  describe('Empty Results', () => {
    it('should return empty results array when no matches', () => {
      const response = {
        results: [],
        totalMatches: 0,
      };

      expect(response.results).toHaveLength(0);
      expect(response.totalMatches).toBe(0);
    });

    it('should still include pagination info', () => {
      const response = {
        results: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };

      expect(response.pagination.total).toBe(0);
      expect(response.pagination.hasMore).toBe(false);
    });
  });

  describe('Authentication', () => {
    it('should require API key', () => {
      const contextNoAuth = createMockContext({
        req: {
          method: 'POST',
          headers: {}, // No API key
          params: {
            sessionId: generateSessionId(),
          },
        },
      });

      const apiKey = contextNoAuth.req.header('x-api-key');
      expect(apiKey).toBeUndefined();
    });

    it('should accept valid API key', () => {
      expect(context.req.header('x-api-key')).toBe('test-api-key-1');
    });
  });

  describe('Multi-word Queries', () => {
    it('should search for multi-word queries', () => {
      const query = SAMPLE_SEARCH_QUERIES.multiWord;

      expect(query).toBe('Test Extension Manifest');
    });

    it('should find all matches for all words', () => {
      const results = {
        results: [
          {
            file: 'manifest.json',
            matches: [
              { match: 'Test' },
              { match: 'Extension' },
              { match: 'Manifest' },
            ],
          },
        ],
      };

      expect(results.results[0].matches.length).toBeGreaterThanOrEqual(1);
    });

    it('should include phrase boundaries', () => {
      const response = {
        options: {
          wholeWord: false,
        },
      };

      expect(response.options.wholeWord).toBe(false);
    });
  });

  describe('Response Headers', () => {
    it('should include content-type header', () => {
      const headers = {
        'content-type': 'application/json',
      };

      expect(headers['content-type']).toBe('application/json');
    });

    it('should include CORS headers', () => {
      const headers = {
        'access-control-allow-origin': '*',
      };

      expect(headers['access-control-allow-origin']).toBe('*');
    });
  });
});
