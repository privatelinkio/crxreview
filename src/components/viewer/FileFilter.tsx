/**
 * File filter UI component
 *
 * Provides filename filtering with regex toggle and file type category selection
 */

import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useFileFilter } from '@/hooks/useFileFilter';
import { FILE_TYPE_CATEGORIES, type FileTypeCategory } from '@/lib/search/file-filter';

/**
 * Props for FileFilter component
 */
export interface FileFilterProps {
  onFilterChange?: () => void;
  className?: string;
}

/**
 * FileFilter Component
 *
 * Provides UI for:
 * - Filename pattern input with regex toggle
 * - Case sensitivity toggle
 * - File type category selection
 * - Clear filters button
 */
export function FileFilter({ onFilterChange, className = '' }: FileFilterProps) {
  const filter = useFileFilter();

  const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    filter.setNamePattern(e.target.value);
    onFilterChange?.();
  };

  const handleRegexToggle = () => {
    filter.setUseRegex(!filter.useRegex);
    onFilterChange?.();
  };

  const handleCaseSensitiveToggle = () => {
    filter.setCaseSensitive(!filter.caseSensitive);
    onFilterChange?.();
  };

  const handleCategoryToggle = (category: FileTypeCategory) => {
    filter.toggleCategory(category);
    onFilterChange?.();
  };

  const handleClearFilters = () => {
    filter.clearFilters();
    onFilterChange?.();
  };

  const categoryOptions = Object.entries(FILE_TYPE_CATEGORIES).filter(
    ([key]) => key !== 'misc'
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filename Pattern Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Filter Files
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={filter.namePattern}
              onChange={handlePatternChange}
              placeholder={filter.useRegex ? 'Enter regex pattern...' : 'Enter filename pattern...'}
              className={`w-full px-3 py-2 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                filter.patternError
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
            />
            {filter.namePattern && (
              <button
                onClick={() => {
                  filter.setNamePattern('');
                  onFilterChange?.();
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label="Clear pattern"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Pattern Error Message */}
        {filter.patternError && (
          <div className="flex gap-2 items-start text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{filter.patternError}</span>
          </div>
        )}

        {/* Help Text */}
        <p className="text-xs text-gray-500">
          {filter.useRegex
            ? 'Use regular expressions (e.g., ".*\\.js$" for JavaScript files)'
            : 'Use wildcards: * (any chars), ? (single char), ** (any directory)'}
        </p>
      </div>

      {/* Pattern Options */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filter.useRegex}
            onChange={handleRegexToggle}
            className="rounded border-gray-300"
          />
          <span className="text-gray-700">Regex Mode</span>
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filter.caseSensitive}
            onChange={handleCaseSensitiveToggle}
            disabled={!filter.namePattern}
            className="rounded border-gray-300 disabled:opacity-50"
          />
          <span className="text-gray-700">Case Sensitive</span>
        </label>
      </div>

      {/* File Type Categories */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            File Types
          </label>
          {filter.selectedCategories.length > 0 && (
            <button
              onClick={() => {
                filter.setSelectedCategories([]);
                onFilterChange?.();
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {categoryOptions.map(([key, config]) => (
            <label
              key={key}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filter.selectedCategories.includes(key as FileTypeCategory)}
                onChange={() => handleCategoryToggle(key as FileTypeCategory)}
                className="rounded border-gray-300"
              />
              <span className="text-gray-700">{config.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Filter Status */}
      {filter.isActive && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
          <span className="text-sm text-blue-700">
            Filters active
            {filter.namePattern && ` (pattern: "${filter.namePattern}")`}
            {filter.selectedCategories.length > 0 && ` (types: ${filter.selectedCategories.length})`}
          </span>
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

export default FileFilter;
