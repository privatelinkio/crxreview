/**
 * Hook for managing file filtering state
 */

import { useState, useCallback, useMemo } from 'react';
import {
  filterFileTree,
  getMatchingFiles,
  validateRegexPattern,
  type FileTypeCategory,
  type FileFilterConfig,
} from '@/lib/search/file-filter';
import type { FileTreeNode } from '@/lib/zip/file-tree';

/**
 * File filter hook state
 */
export interface FileFilterState {
  namePattern: string;
  useRegex: boolean;
  caseSensitive: boolean;
  selectedCategories: FileTypeCategory[];
  patternError: string | null;
}

/**
 * File filter hook interface
 */
export interface UseFileFilterReturn extends FileFilterState {
  setNamePattern: (pattern: string) => void;
  setUseRegex: (useRegex: boolean) => void;
  setCaseSensitive: (caseSensitive: boolean) => void;
  toggleCategory: (category: FileTypeCategory) => void;
  setSelectedCategories: (categories: FileTypeCategory[]) => void;
  clearFilters: () => void;
  getFilteredTree: (tree: FileTreeNode) => FileTreeNode;
  getMatchingFilePaths: (tree: FileTreeNode) => string[];
  isActive: boolean;
}

/**
 * Hook for managing file filter state
 *
 * @returns File filter state and actions
 */
export function useFileFilter(): UseFileFilterReturn {
  const [namePattern, setNamePattern] = useState<string>('');
  const [useRegex, setUseRegex] = useState<boolean>(false);
  const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
  const [selectedCategories, setSelectedCategories] = useState<FileTypeCategory[]>([]);
  const [patternError, setPatternError] = useState<string | null>(null);

  // Validate pattern when it changes
  const handleSetNamePattern = useCallback((pattern: string) => {
    setNamePattern(pattern);

    if (pattern && useRegex) {
      const error = validateRegexPattern(pattern);
      setPatternError(error);
    } else {
      setPatternError(null);
    }
  }, [useRegex]);

  // Handle regex toggle
  const handleSetUseRegex = useCallback((regex: boolean) => {
    setUseRegex(regex);

    if (regex && namePattern) {
      const error = validateRegexPattern(namePattern);
      setPatternError(error);
    } else {
      setPatternError(null);
    }
  }, [namePattern]);

  // Handle category toggle
  const handleToggleCategory = useCallback((category: FileTypeCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setNamePattern('');
    setUseRegex(false);
    setCaseSensitive(false);
    setSelectedCategories([]);
    setPatternError(null);
  }, []);

  // Create filter config
  const filterConfig: FileFilterConfig = useMemo(
    () => ({
      namePattern,
      useRegex,
      caseSensitive,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    }),
    [namePattern, useRegex, caseSensitive, selectedCategories]
  );

  // Get filtered tree
  const getFilteredTree = useCallback(
    (tree: FileTreeNode) => filterFileTree(tree, filterConfig),
    [filterConfig]
  );

  // Get matching file paths
  const getMatchingFilePaths = useCallback(
    (tree: FileTreeNode) => getMatchingFiles(tree, filterConfig),
    [filterConfig]
  );

  // Check if any filters are active
  const isActive = useMemo(
    () => namePattern.length > 0 || selectedCategories.length > 0,
    [namePattern, selectedCategories]
  );

  return {
    namePattern,
    useRegex,
    caseSensitive,
    selectedCategories,
    patternError,
    setNamePattern: handleSetNamePattern,
    setUseRegex: handleSetUseRegex,
    setCaseSensitive,
    toggleCategory: handleToggleCategory,
    setSelectedCategories,
    clearFilters: handleClearFilters,
    getFilteredTree,
    getMatchingFilePaths,
    isActive,
  };
}
