/**
 * Web Worker for background search processing
 *
 * Handles full-text search across files without blocking the UI
 */

import {
  createSearchPattern,
  searchContent,
  type SearchOptions,
  type FileSearchResult,
  type SearchProgress,
} from './content-search';

/**
 * Message types for communication with the worker
 */
export type WorkerMessageType =
  | 'search'
  | 'cancel'
  | 'progress'
  | 'complete'
  | 'error';

/**
 * Message sent to the worker
 */
export interface WorkerInMessage {
  type: 'search' | 'cancel';
  query?: string;
  options?: SearchOptions;
  files?: Array<{ fileId: string; filePath: string; content: string }>;
  searchId?: string;
}

/**
 * Message received from the worker
 */
export interface WorkerOutMessage {
  type: WorkerMessageType;
  searchId?: string;
  progress?: SearchProgress;
  results?: FileSearchResult[];
  error?: string;
}

/**
 * Global state for the worker
 */
interface WorkerState {
  currentSearchId: string | null;
  isCancelled: boolean;
}

const state: WorkerState = {
  currentSearchId: null,
  isCancelled: false,
};

/**
 * Handle incoming messages from main thread
 */
self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const { type, searchId, query, options, files } = event.data;

  if (type === 'cancel') {
    state.isCancelled = true;
    return;
  }

  if (type === 'search' && query && files) {
    state.currentSearchId = searchId || '';
    state.isCancelled = false;

    try {
      const results = performSearch(
        query,
        options || {},
        files,
        searchId || ''
      );

      self.postMessage({
        type: 'complete',
        searchId,
        results,
      } as WorkerOutMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      self.postMessage({
        type: 'error',
        searchId,
        error: message,
      } as WorkerOutMessage);
    }
  }
};

/**
 * Perform the actual search
 */
function performSearch(
  query: string,
  options: SearchOptions,
  files: Array<{ fileId: string; filePath: string; content: string }>,
  searchId: string
): FileSearchResult[] {
  const pattern = createSearchPattern(
    query,
    options.caseSensitive,
    options.wholeWord,
    options.useRegex
  );

  if (!pattern) {
    throw new Error('Invalid search pattern');
  }

  const results: FileSearchResult[] = [];
  const totalFiles = files.length;

  for (let i = 0; i < files.length; i++) {
    if (state.isCancelled) {
      break;
    }

    const file = files[i];

    // Send progress update
    self.postMessage({
      type: 'progress',
      searchId,
      progress: {
        currentFile: file.filePath,
        filesProcessed: i,
        totalFiles,
        matchesFound: results.reduce((sum, r) => sum + r.matchCount, 0),
      },
    } as WorkerOutMessage);

    // Search file content
    try {
      // Check if content is decodable text
      if (isTextContent(file.content)) {
        const matches = searchContent(file.content, pattern, options);

        if (matches.length > 0) {
          // Update file references in matches
          const updatedMatches = matches.map(match => ({
            ...match,
            fileId: file.fileId,
            filePath: file.filePath,
          }));

          results.push({
            filePath: file.filePath,
            fileId: file.fileId,
            matchCount: matches.length,
            matches: updatedMatches,
          });
        }
      }
    } catch (error) {
      // Skip files that can't be processed
      console.warn(`Failed to search ${file.filePath}:`, error);
    }
  }

  return results;
}

/**
 * Check if content appears to be text
 */
function isTextContent(content: string): boolean {
  // Check for common binary signatures or null bytes
  if (content.includes('\x00')) {
    return false;
  }

  // Check if majority of content is printable
  let printableCount = 0;
  const sampleSize = Math.min(1000, content.length);

  for (let i = 0; i < sampleSize; i++) {
    const charCode = content.charCodeAt(i);
    // Allow common whitespace, printable ASCII, and common unicode ranges
    if (
      charCode === 9 || // tab
      charCode === 10 || // newline
      charCode === 13 || // carriage return
      (charCode >= 32 && charCode <= 126) || // printable ASCII
      charCode >= 160 // extended ASCII and unicode
    ) {
      printableCount++;
    }
  }

  const printablePercentage = (printableCount / sampleSize) * 100;
  return printablePercentage > 75; // At least 75% should be printable
}
