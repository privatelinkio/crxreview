/**
 * Content search UI component
 *
 * Provides a search modal with results list and navigation
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  X,
  Search,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { useContentSearch } from '@/hooks/useContentSearch';
import { getMatchPreview, validateSearchPattern } from '@/lib/search/content-search';
import type { FileSearchResult, SearchMatch } from '@/lib/search/content-search';

/**
 * Props for ContentSearch component
 */
export interface ContentSearchProps {
  isOpen: boolean;
  onClose: () => void;
  files: Array<{ fileId: string; filePath: string; content: string }>;
  onSelectMatch?: (fileId: string, filePath: string, match: SearchMatch) => void;
  className?: string;
}

/**
 * ContentSearch Component
 *
 * Provides:
 * - Search input with options
 * - Real-time search with progress
 * - Results list with navigation
 * - Match highlighting and preview
 */
export function ContentSearch({
  isOpen,
  onClose,
  files,
  onSelectMatch,
  className = '',
}: ContentSearchProps) {
  const search = useContentSearch();
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [patternError, setPatternError] = useState<string | null>(() => {
    return null;
  });

  // Validate pattern when it changes or options change
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (search.query && useRegex) {
      const validationError = validateSearchPattern(search.query);
      if (validationError) {
        setPatternError(validationError);
      } else {
        setPatternError(null);
      }
    } else {
      setPatternError(null);
    }
  }, [search.query, useRegex]);

  // Handle search when query or options change
  const handleSearch = useCallback(async () => {
    if (!search.query.trim()) {
      search.clearResults();
      return;
    }

    await search.search(files, {
      caseSensitive,
      wholeWord,
      useRegex,
      contextLines: 3,
    });

    // Reset result navigation
    setCurrentResultIndex(0);
    setCurrentMatchIndex(0);
  }, [search, files, caseSensitive, wholeWord, useRegex]);

  // Handle query change
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    search.setQuery(e.target.value);
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Navigate to next result
  const handleNextResult = () => {
    if (search.results.length === 0) return;
    const nextIndex = (currentResultIndex + 1) % search.results.length;
    setCurrentResultIndex(nextIndex);
    setCurrentMatchIndex(0);

    const result = search.results[nextIndex];
    if (result.matches.length > 0) {
      handleSelectMatch(result, result.matches[0]);
    }
  };

  // Navigate to previous result
  const handlePreviousResult = () => {
    if (search.results.length === 0) return;
    const prevIndex =
      currentResultIndex === 0 ? search.results.length - 1 : currentResultIndex - 1;
    setCurrentResultIndex(prevIndex);
    setCurrentMatchIndex(0);

    const result = search.results[prevIndex];
    if (result.matches.length > 0) {
      handleSelectMatch(result, result.matches[0]);
    }
  };

  // Navigate to next match within result
  const handleNextMatch = () => {
    const result = search.results[currentResultIndex];
    if (!result) return;

    const nextIndex = (currentMatchIndex + 1) % result.matches.length;
    setCurrentMatchIndex(nextIndex);
    handleSelectMatch(result, result.matches[nextIndex]);
  };

  // Navigate to previous match within result
  const handlePreviousMatch = () => {
    const result = search.results[currentResultIndex];
    if (!result) return;

    const prevIndex =
      currentMatchIndex === 0 ? result.matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    handleSelectMatch(result, result.matches[prevIndex]);
  };

  // Handle match selection
  const handleSelectMatch = (result: FileSearchResult, match: SearchMatch) => {
    onSelectMatch?.(result.fileId, result.filePath, match);
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentResult = search.results[currentResultIndex];
  const currentMatch = currentResult?.matches[currentMatchIndex];

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-4 ${className}`}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Search Content</h2>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-900 p-1"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="border-b border-gray-200 p-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={search.query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                placeholder={useRegex ? 'Enter regex pattern...' : 'Search files...'}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  patternError ? 'border-red-500' : 'border-gray-300'
                }`}
                autoFocus
              />
              {search.isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={search.isSearching || patternError !== null}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>

          {/* Pattern Error */}
          {patternError && (
            <div className="flex gap-2 items-start text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{patternError}</span>
            </div>
          )}

          {/* Search Options */}
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={e => setCaseSensitive(e.target.checked)}
                disabled={search.isSearching}
                className="rounded border-gray-300"
              />
              <span className="text-gray-700">Case Sensitive</span>
            </label>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={e => setWholeWord(e.target.checked)}
                disabled={search.isSearching || useRegex}
                className="rounded border-gray-300"
              />
              <span className="text-gray-700">Whole Word</span>
            </label>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={useRegex}
                onChange={e => setUseRegex(e.target.checked)}
                disabled={search.isSearching}
                className="rounded border-gray-300"
              />
              <span className="text-gray-700">Regex</span>
            </label>
          </div>
        </div>

        {/* Search Progress */}
        {search.progress && (
          <div className="bg-blue-50 border-b border-blue-200 p-3 text-sm text-blue-700">
            <div className="flex items-center justify-between">
              <span>
                Searching: {search.progress.currentFile}
              </span>
              <span>
                {search.progress.filesProcessed}/{search.progress.totalFiles} files (
                {search.progress.matchesFound} matches found)
              </span>
            </div>
            <div className="mt-2 w-full bg-blue-200 rounded-full h-1">
              <div
                className="bg-blue-600 h-1 rounded-full transition-all"
                style={{
                  width: `${(search.progress.filesProcessed / search.progress.totalFiles) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {search.error && (
          <div className="bg-red-50 border-b border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{search.error}</span>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {search.results.length === 0 && !search.isSearching && search.query && (
            <div className="flex-1 flex items-center justify-center text-gray-700 p-4">
              <div className="text-center">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No matches found</p>
              </div>
            </div>
          )}

          {search.results.length === 0 && !search.isSearching && !search.query && (
            <div className="flex-1 flex items-center justify-center text-gray-700 p-4">
              <div className="text-center">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Enter a search query to begin</p>
              </div>
            </div>
          )}

          {search.results.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              {search.results.map((result, resultIndex) => (
                <div
                  key={result.fileId}
                  className={`border-b border-gray-200 ${
                    resultIndex === currentResultIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* File Header */}
                  <div className="px-4 py-2 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100">
                    <div
                      className="flex-1"
                      onClick={() => {
                        setCurrentResultIndex(resultIndex);
                        setCurrentMatchIndex(0);
                        if (result.matches.length > 0) {
                          handleSelectMatch(result, result.matches[0]);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-sm text-gray-900">
                          {result.filePath}
                        </span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {result.matchCount} match{result.matchCount !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Matches */}
                  {resultIndex === currentResultIndex && (
                    <div className="p-3 space-y-2">
                      {result.matches.map((match, matchIndex) => (
                        <div
                          key={matchIndex}
                          onClick={() => {
                            setCurrentMatchIndex(matchIndex);
                            handleSelectMatch(result, match);
                          }}
                          className={`p-2 rounded cursor-pointer text-sm font-mono ${
                            matchIndex === currentMatchIndex
                              ? 'bg-yellow-100 border border-yellow-300'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          <div className="text-xs text-gray-600 mb-1">
                            Line {match.lineNumber}, Column {match.columnNumber}
                          </div>
                          <div className="text-gray-900 break-words">
                            {getMatchPreview(match)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {search.results.length > 0 && (
          <div className="border-t border-gray-200 p-4 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-700">
              {search.statistics && (
                <>
                  <span className="font-medium">{search.statistics.totalMatches}</span> matches in{' '}
                  <span className="font-medium">{search.statistics.filesWithMatches}</span> files
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentMatch && (
                <div className="text-xs text-gray-600 mr-4">
                  Match {currentMatchIndex + 1} of {currentResult?.matchCount || 0}
                  {search.results.length > 1 && ` | File ${currentResultIndex + 1} of ${search.results.length}`}
                </div>
              )}

              <button
                onClick={handlePreviousMatch}
                disabled={!currentMatch || (currentResult?.matches.length || 0) <= 1}
                className="p-2 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous match in file"
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextMatch}
                disabled={!currentMatch || (currentResult?.matches.length || 0) <= 1}
                className="p-2 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next match in file"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-gray-300" />

              <button
                onClick={handlePreviousResult}
                disabled={search.results.length <= 1}
                className="p-2 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous file"
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextResult}
                disabled={search.results.length <= 1}
                className="p-2 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next file"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {search.isSearching && (
                <button
                  onClick={() => search.cancel()}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentSearch;
