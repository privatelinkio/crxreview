/**
 * Hook for managing content search operations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createSearchPattern,
  sortSearchResults,
  type SearchOptions,
  type FileSearchResult,
  type SearchProgress,
} from '@/lib/search/content-search';

/**
 * Content search hook state
 */
export interface ContentSearchState {
  query: string;
  isSearching: boolean;
  results: FileSearchResult[];
  progress: SearchProgress | null;
  error: string | null;
  statistics: ReturnType<typeof getSearchStatistics> | null;
  totalMatches: number;
}

/**
 * Content search hook interface
 */
export interface UseContentSearchReturn extends ContentSearchState {
  setQuery: (query: string) => void;
  search: (
    files: Array<{ fileId: string; filePath: string; content: string }>,
    options?: SearchOptions
  ) => Promise<void>;
  cancel: () => void;
  clearResults: () => void;
  getNextMatch: (currentIndex: number) => FileSearchResult | null;
  getPreviousMatch: (currentIndex: number) => FileSearchResult | null;
}

/**
 * Hook for managing content search state and operations
 *
 * @returns Content search state and actions
 */
export function useContentSearch(): UseContentSearchReturn {
  const [query, setQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [results, setResults] = useState<FileSearchResult[]>([]);
  const [progress, setProgress] = useState<SearchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const currentSearchIdRef = useRef<string>('');

  // Initialize worker
  useEffect(() => {
    // Check if Worker is supported
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(
          new URL('@/lib/search/search.worker.ts', import.meta.url),
          { type: 'module' }
        );

        workerRef.current.onmessage = handleWorkerMessage;
        workerRef.current.onerror = handleWorkerError;
      } catch (error) {
        console.warn('Failed to initialize search worker, falling back to main thread', error);
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  /**
   * Handle messages from worker
   */
  const handleWorkerMessage = (event: MessageEvent) => {
    const { type, searchId, progress: progressData, results: workerResults, error: workerError } = event.data;

    // Ignore messages from old searches
    if (searchId !== currentSearchIdRef.current) {
      return;
    }

    if (type === 'progress' && progressData) {
      setProgress(progressData);
    } else if (type === 'complete' && workerResults) {
      const sortedResults = sortSearchResults(workerResults);
      setResults(sortedResults);
      setIsSearching(false);
      setProgress(null);
      setError(null);
    } else if (type === 'error' && workerError) {
      setError(workerError);
      setIsSearching(false);
      setProgress(null);
    }
  };

  /**
   * Handle worker errors
   */
  const handleWorkerError = (event: ErrorEvent) => {
    const message = event.message || 'Search worker error';
    setError(message);
    setIsSearching(false);
    setProgress(null);
  };

  /**
   * Perform search using worker or fallback
   */
  const search = useCallback(
    async (
      files: Array<{ fileId: string; filePath: string; content: string }>,
      options?: Omit<SearchOptions, 'query'>
    ) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);
      setProgress(null);

      const searchId = `${Date.now()}-${Math.random()}`;
      currentSearchIdRef.current = searchId;

      const opts = options || {};

      try {
        // Validate search pattern
        const pattern = createSearchPattern(
          query,
          opts.caseSensitive,
          opts.wholeWord,
          opts.useRegex
        );

        if (!pattern) {
          throw new Error('Invalid search pattern');
        }

        // Use worker if available, otherwise fall back to main thread
        if (workerRef.current) {
          workerRef.current.postMessage({
            type: 'search',
            searchId,
            query,
            options: opts,
            files,
          });
        } else {
          // Fallback: perform search on main thread
          const results = await searchOnMainThread(query, opts, files);
          setResults(results);
          setIsSearching(false);
          setProgress(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed';
        setError(message);
        setIsSearching(false);
        setProgress(null);
      }
    },
    [query]
  );

  /**
   * Cancel ongoing search
   */
  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'cancel' });
    }
    setIsSearching(false);
    setProgress(null);
  }, []);

  /**
   * Clear search results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setProgress(null);
    setError(null);
    setQuery('');
  }, []);

  /**
   * Get next search result
   */
  const getNextMatch = useCallback((currentIndex: number) => {
    if (results.length === 0) return null;
    const nextIndex = (currentIndex + 1) % results.length;
    return results[nextIndex] || null;
  }, [results]);

  /**
   * Get previous search result
   */
  const getPreviousMatch = useCallback((currentIndex: number) => {
    if (results.length === 0) return null;
    const prevIndex = currentIndex === 0 ? results.length - 1 : currentIndex - 1;
    return results[prevIndex] || null;
  }, [results]);

  // Calculate statistics
  const statistics = results.length > 0 ? getSearchStatistics(results) : null;
  const totalMatches = results.reduce((sum, r) => sum + r.matchCount, 0);

  return {
    query,
    isSearching,
    results,
    progress,
    error,
    statistics,
    totalMatches,
    setQuery,
    search,
    cancel,
    clearResults,
    getNextMatch,
    getPreviousMatch,
  };
}

/**
 * Fallback search implementation for main thread
 */
async function searchOnMainThread(
  query: string,
  options: Omit<SearchOptions, 'query'>,
  files: Array<{ fileId: string; filePath: string; content: string }>
): Promise<FileSearchResult[]> {
  const { searchContent } = await import('@/lib/search/content-search');

  const pattern = createSearchPattern(
    query,
    options?.caseSensitive,
    options?.wholeWord,
    options?.useRegex
  );

  if (!pattern) {
    throw new Error('Invalid search pattern');
  }

  const results: FileSearchResult[] = [];

  for (const file of files) {
    try {
      if (isTextContent(file.content)) {
        const matches = searchContent(file.content, pattern, options || {});

        if (matches.length > 0) {
          results.push({
            filePath: file.filePath,
            fileId: file.fileId,
            matchCount: matches.length,
            matches: matches.map(match => ({
              ...match,
              fileId: file.fileId,
              filePath: file.filePath,
            })),
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to search ${file.filePath}:`, error);
    }
  }

  return sortSearchResults(results);
}

/**
 * Check if content appears to be text
 */
function isTextContent(content: string): boolean {
  if (content.includes('\x00')) {
    return false;
  }

  let printableCount = 0;
  const sampleSize = Math.min(1000, content.length);

  for (let i = 0; i < sampleSize; i++) {
    const charCode = content.charCodeAt(i);
    if (
      charCode === 9 ||
      charCode === 10 ||
      charCode === 13 ||
      (charCode >= 32 && charCode <= 126) ||
      charCode >= 160
    ) {
      printableCount++;
    }
  }

  const printablePercentage = (printableCount / sampleSize) * 100;
  return printablePercentage > 75;
}

/**
 * Helper to get search statistics
 */
function getSearchStatistics(results: FileSearchResult[]) {
  const totalMatches = results.reduce((sum, r) => sum + r.matchCount, 0);
  const filesWithMatches = results.length;

  return {
    totalMatches,
    filesWithMatches,
    averageMatchesPerFile: filesWithMatches > 0 ? totalMatches / filesWithMatches : 0,
  };
}
