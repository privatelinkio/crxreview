/**
 * Content search and file filtering utilities
 * Exported for use throughout the API
 */

export {
  createSearchPattern,
  searchContent,
  highlightMatches,
  getMatchPreview,
  escapeHtml,
  validateSearchPattern,
  sortSearchResults,
  getSearchStatistics,
  type SearchMatch,
  type FileSearchResult,
  type SearchProgress,
  type SearchOptions,
} from './content-search';

export {
  createFilterPattern,
  matchesPattern,
  getFileTypeCategory,
  belongsToCategories,
  filterFileTree,
  getMatchingFiles,
  validateRegexPattern,
  FILE_TYPE_CATEGORIES,
  type FileTypeCategory,
  type FileTypeConfig,
  type FileFilterConfig,
} from './file-filter';
