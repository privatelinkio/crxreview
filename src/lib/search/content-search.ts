/**
 * Content search utilities for CRX Review
 *
 * Provides full-text search across files with context and highlighting
 */

/**
 * Represents a single search result match
 */
export interface SearchMatch {
  fileId: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  matchStart: number;
  matchEnd: number;
  lineContent: string;
  contextBefore: string[];
  contextAfter: string[];
}

/**
 * Represents all results for a file
 */
export interface FileSearchResult {
  filePath: string;
  fileId: string;
  matchCount: number;
  matches: SearchMatch[];
}

/**
 * Search progress information
 */
export interface SearchProgress {
  currentFile: string;
  filesProcessed: number;
  totalFiles: number;
  matchesFound: number;
}

/**
 * Search options
 */
export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
  contextLines?: number;
}

/**
 * Create a regex pattern from search query
 *
 * @param query - Search query string
 * @param caseSensitive - Whether search is case-sensitive
 * @param wholeWord - Whether to match whole words only
 * @param useRegex - Whether to treat query as regex
 * @returns Compiled regex pattern
 */
export function createSearchPattern(
  query: string,
  caseSensitive: boolean = false,
  wholeWord: boolean = false,
  useRegex: boolean = false
): RegExp | null {
  if (!query) return null;

  try {
    let pattern = query;

    if (!useRegex) {
      // Escape special regex characters
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Add word boundaries if whole word search
      if (wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
    } else if (wholeWord) {
      // For regex, user is responsible for word boundaries
      // but we can suggest it
      pattern = query;
    }

    const flags = caseSensitive ? 'gm' : 'gmi';
    return new RegExp(pattern, flags);
  } catch (error) {
    return null;
  }
}

/**
 * Search for matches in text content
 *
 * @param content - Text content to search
 * @param pattern - Regex pattern to search for
 * @param options - Search options
 * @returns Array of search matches
 */
export function searchContent(
  content: string,
  pattern: RegExp,
  options: SearchOptions = {}
): SearchMatch[] {
  const { contextLines = 2 } = options;
  const matches: SearchMatch[] = [];

  // Split content into lines
  const lines = content.split('\n');

  // Find all matches
  let match;
  let charIndex = 0;

  // Create a map of character positions to line numbers
  const linePositions: number[] = [0];
  for (const line of lines) {
    charIndex += line.length + 1; // +1 for newline character
    linePositions.push(charIndex);
  }

  // Reset regex
  pattern.lastIndex = 0;

  while ((match = pattern.exec(content)) !== null) {
    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;

    // Find which line this match is on
    let currentLineNumber = 0;
    for (let i = 0; i < linePositions.length - 1; i++) {
      if (matchStart >= linePositions[i] && matchStart < linePositions[i + 1]) {
        currentLineNumber = i;
        break;
      }
    }

    // Calculate column number within the line
    const columnNumber = matchStart - linePositions[currentLineNumber];

    // Get context lines
    const contextStart = Math.max(0, currentLineNumber - contextLines);
    const contextEnd = Math.min(lines.length, currentLineNumber + contextLines + 1);

    const contextBefore = lines.slice(contextStart, currentLineNumber);
    const contextAfter = lines.slice(currentLineNumber + 1, contextEnd);

    matches.push({
      fileId: '', // Will be set by caller
      filePath: '', // Will be set by caller
      lineNumber: currentLineNumber + 1, // 1-indexed
      columnNumber: columnNumber + 1, // 1-indexed
      matchStart,
      matchEnd,
      lineContent: lines[currentLineNumber] || '',
      contextBefore,
      contextAfter,
    });
  }

  return matches;
}

/**
 * Highlight search terms in text
 *
 * @param text - Text to highlight
 * @param pattern - Regex pattern to highlight
 * @returns Text with matches wrapped in <mark> tags
 */
export function highlightMatches(text: string, pattern: RegExp): string {
  if (!pattern) return text;

  return text.replace(pattern, match => `<mark>${escapeHtml(match)}</mark>`);
}

/**
 * Get a preview of matching text with context
 *
 * @param match - Search match
 * @param maxLength - Maximum length of preview
 * @returns Preview string
 */
export function getMatchPreview(match: SearchMatch, maxLength: number = 100): string {
  const line = match.lineContent;
  const start = Math.max(0, match.columnNumber - 20);
  const end = Math.min(line.length, match.columnNumber + 80);

  let preview = line.substring(start, end);

  if (start > 0) {
    preview = `...${preview}`;
  }
  if (end < line.length) {
    preview = `${preview}...`;
  }

  return preview.substring(0, maxLength);
}

/**
 * Escape HTML special characters
 *
 * @param text - Text to escape
 * @returns Escaped text
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Validate a regex pattern string
 *
 * @param pattern - Pattern string to validate
 * @returns Error message or null if valid
 */
export function validateSearchPattern(pattern: string): string | null {
  if (!pattern) return null;

  try {
    new RegExp(pattern);
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid regex pattern';
    return message;
  }
}

/**
 * Sort search results by relevance and file path
 *
 * @param results - Array of file search results
 * @returns Sorted results
 */
export function sortSearchResults(results: FileSearchResult[]): FileSearchResult[] {
  return results.sort((a, b) => {
    // First sort by number of matches (descending)
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount;
    }
    // Then by file path (ascending)
    return a.filePath.localeCompare(b.filePath);
  });
}

/**
 * Get statistics about search results
 *
 * @param results - Array of file search results
 * @returns Statistics object
 */
export function getSearchStatistics(results: FileSearchResult[]) {
  const totalMatches = results.reduce((sum, r) => sum + r.matchCount, 0);
  const filesWithMatches = results.length;

  return {
    totalMatches,
    filesWithMatches,
    averageMatchesPerFile: filesWithMatches > 0 ? totalMatches / filesWithMatches : 0,
  };
}
