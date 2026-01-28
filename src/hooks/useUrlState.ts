/**
 * Hook for syncing viewer state with URL query parameters
 *
 * Parses URL on load and syncs state changes back to URL
 * Enables deep linking to specific files and searches
 *
 * URL format: /#/app?url=chrome://webstore/detail/...&file=manifest.json&search=permissions
 */

import { useEffect, useCallback } from 'react';
import { useViewerStore } from '@/store/viewerStore';
import { useSearchStore } from '@/store/searchStore';

interface UrlStateParams {
  url?: string;
  file?: string;
  search?: string;
}

/**
 * Parse URL query parameters
 */
function parseUrlParams(): UrlStateParams {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  return {
    url: params.get('url') || undefined,
    file: params.get('file') || undefined,
    search: params.get('search') || undefined,
  };
}

/**
 * Update URL with current state
 */
function updateUrl(params: UrlStateParams) {
  const searchParams = new URLSearchParams();

  if (params.url) {
    searchParams.set('url', params.url);
  }
  if (params.file) {
    searchParams.set('file', params.file);
  }
  if (params.search) {
    searchParams.set('search', params.search);
  }

  const queryString = searchParams.toString();
  const newHash = queryString ? `#/app?${queryString}` : '#/app';
  window.history.replaceState(null, '', newHash);
}

/**
 * Hook to sync viewer state with URL
 *
 * On mount:
 * - Parses URL parameters
 * - Loads extension from URL if provided
 * - Selects initial file if provided
 * - Sets initial search term if provided
 *
 * On state change:
 * - Updates URL to reflect current state
 * - Enables deep linking and sharing
 */
export function useUrlState() {
  const crx = useViewerStore((state) => state.crx);
  const selectedFilePath = useViewerStore((state) => state.selectedFilePath);
  const loadCrxFromUrl = useViewerStore((state) => state.loadCrxFromUrl);
  const selectFile = useViewerStore((state) => state.selectFile);
  const contentSearchQuery = useSearchStore((state) => state.contentSearchQuery);
  const setContentSearchQuery = useSearchStore((state) => state.setContentSearchQuery);

  // Load extension from URL on mount
  useEffect(() => {
    const params = parseUrlParams();

    if (params.url) {
      loadCrxFromUrl(params.url);
    }
  }, [loadCrxFromUrl]);

  // Select file when URL params change or CRX loads
  useEffect(() => {
    const params = parseUrlParams();

    if (params.file && crx) {
      selectFile(params.file);
    }
  }, [crx, selectFile]);

  // Set search query when URL params change
  useEffect(() => {
    const params = parseUrlParams();

    if (params.search) {
      setContentSearchQuery(params.search);
    }
  }, [setContentSearchQuery]);

  // Update URL when viewer state changes
  const updateViewerUrl = useCallback(() => {
    const params: UrlStateParams = {};

    // Note: We don't include the CRX URL in the state since it's already loaded
    // This avoids redundant reloads. Users can re-share the current URL.

    if (selectedFilePath) {
      params.file = selectedFilePath;
    }

    if (contentSearchQuery) {
      params.search = contentSearchQuery;
    }

    updateUrl(params);
  }, [selectedFilePath, contentSearchQuery]);

  // Update URL when selected file changes
  useEffect(() => {
    updateViewerUrl();
  }, [selectedFilePath, updateViewerUrl]);

  return {
    urlParams: parseUrlParams(),
  };
}
