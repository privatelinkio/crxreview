/**
 * Zustand store for search state
 *
 * Manages search and filtering state across the application
 */

import { create } from 'zustand';
import type { FileTypeCategory } from '@/lib/search/file-filter';
import type { FileSearchResult, SearchMatch } from '@/lib/search/content-search';

/**
 * Search store state interface
 */
export interface SearchState {
  // File filtering
  fileFilterPattern: string;
  fileFilterUseRegex: boolean;
  fileFilterCaseSensitive: boolean;
  fileFilterCategories: FileTypeCategory[];

  // Content search
  contentSearchQuery: string;
  contentSearchResults: FileSearchResult[];
  contentSearchIsActive: boolean;
  selectedSearchMatch: SearchMatch | null;
  selectedSearchFile: string | null;

  // UI state
  isSearchPanelOpen: boolean;
  isFilterPanelOpen: boolean;

  // Actions - File Filter
  setFileFilterPattern: (pattern: string) => void;
  setFileFilterUseRegex: (useRegex: boolean) => void;
  setFileFilterCaseSensitive: (caseSensitive: boolean) => void;
  setFileFilterCategories: (categories: FileTypeCategory[]) => void;
  toggleFileFilterCategory: (category: FileTypeCategory) => void;
  clearFileFilter: () => void;

  // Actions - Content Search
  setContentSearchQuery: (query: string) => void;
  setContentSearchResults: (results: FileSearchResult[]) => void;
  setContentSearchIsActive: (isActive: boolean) => void;
  setSelectedSearchMatch: (match: SearchMatch | null, filePath?: string) => void;
  clearContentSearch: () => void;

  // Actions - UI
  setSearchPanelOpen: (isOpen: boolean) => void;
  setFilterPanelOpen: (isOpen: boolean) => void;

  // Global actions
  reset: () => void;
}

/**
 * Create the search store
 */
export const useSearchStore = create<SearchState>((set) => ({
  // Initial file filter state
  fileFilterPattern: '',
  fileFilterUseRegex: false,
  fileFilterCaseSensitive: false,
  fileFilterCategories: [],

  // Initial content search state
  contentSearchQuery: '',
  contentSearchResults: [],
  contentSearchIsActive: false,
  selectedSearchMatch: null,
  selectedSearchFile: null,

  // Initial UI state
  isSearchPanelOpen: false,
  isFilterPanelOpen: false,

  // File filter actions
  setFileFilterPattern: (pattern: string) => {
    set({ fileFilterPattern: pattern });
  },

  setFileFilterUseRegex: (useRegex: boolean) => {
    set({ fileFilterUseRegex: useRegex });
  },

  setFileFilterCaseSensitive: (caseSensitive: boolean) => {
    set({ fileFilterCaseSensitive: caseSensitive });
  },

  setFileFilterCategories: (categories: FileTypeCategory[]) => {
    set({ fileFilterCategories: categories });
  },

  toggleFileFilterCategory: (category: FileTypeCategory) => {
    set((state) => ({
      fileFilterCategories: state.fileFilterCategories.includes(category)
        ? state.fileFilterCategories.filter((c) => c !== category)
        : [...state.fileFilterCategories, category],
    }));
  },

  clearFileFilter: () => {
    set({
      fileFilterPattern: '',
      fileFilterUseRegex: false,
      fileFilterCaseSensitive: false,
      fileFilterCategories: [],
    });
  },

  // Content search actions
  setContentSearchQuery: (query: string) => {
    set({ contentSearchQuery: query });
  },

  setContentSearchResults: (results: FileSearchResult[]) => {
    set({
      contentSearchResults: results,
      contentSearchIsActive: results.length > 0,
    });
  },

  setContentSearchIsActive: (isActive: boolean) => {
    set({ contentSearchIsActive: isActive });
  },

  setSelectedSearchMatch: (match: SearchMatch | null, filePath?: string) => {
    set({
      selectedSearchMatch: match,
      selectedSearchFile: filePath || null,
    });
  },

  clearContentSearch: () => {
    set({
      contentSearchQuery: '',
      contentSearchResults: [],
      contentSearchIsActive: false,
      selectedSearchMatch: null,
      selectedSearchFile: null,
    });
  },

  // UI actions
  setSearchPanelOpen: (isOpen: boolean) => {
    set({ isSearchPanelOpen: isOpen });
  },

  setFilterPanelOpen: (isOpen: boolean) => {
    set({ isFilterPanelOpen: isOpen });
  },

  // Global reset
  reset: () => {
    set({
      fileFilterPattern: '',
      fileFilterUseRegex: false,
      fileFilterCaseSensitive: false,
      fileFilterCategories: [],
      contentSearchQuery: '',
      contentSearchResults: [],
      contentSearchIsActive: false,
      selectedSearchMatch: null,
      selectedSearchFile: null,
      isSearchPanelOpen: false,
      isFilterPanelOpen: false,
    });
  },
}));
