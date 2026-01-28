/**
 * Integrated Search and Filter Panel
 *
 * Combines file filtering and content search functionality
 * This component demonstrates how to integrate all search features together
 */

import { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { FileFilter } from './FileFilter';
import { ContentSearch } from './ContentSearch';
import { useFileFilter } from '@/hooks/useFileFilter';
import { useViewerStore } from '@/store';
import { getAllFiles } from '@/lib/zip/file-tree';
import type { SearchMatch } from '@/lib/search/content-search';

/**
 * Props for SearchAndFilterPanel component
 */
export interface SearchAndFilterPanelProps {
  onSelectFile?: (filePath: string) => void;
  onSelectMatch?: (filePath: string, match: SearchMatch) => void;
  className?: string;
}

/**
 * SearchAndFilterPanel Component
 *
 * Provides integrated UI for:
 * - File filtering with patterns and categories
 * - Content search across files
 * - Navigation between search results
 */
export function SearchAndFilterPanel({
  onSelectFile,
  onSelectMatch,
  className = '',
}: SearchAndFilterPanelProps) {
  const crx = useViewerStore(state => state.crx);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const fileFilter = useFileFilter();

  // Get all files from the CRX tree
  const allFiles = useMemo(() => {
    if (!crx?.fileTree) return [];
    return getAllFiles(crx.fileTree);
  }, [crx?.fileTree]);

  // Create file content array for search
  const fileContents = useMemo(() => {
    return allFiles.map(file => ({
      fileId: file.path,
      filePath: file.path,
      content: '',
      // In a real implementation, this would load the actual file content
      // from the cache or extract it from the CRX
    }));
  }, [allFiles]);

  // Get filtered files
  const filteredFiles = useMemo(() => {
    if (!crx?.fileTree) return [];
    const filtered = fileFilter.getFilteredTree(crx.fileTree);
    return getAllFiles(filtered);
  }, [crx?.fileTree, fileFilter]);

  const handleSearchClose = () => {
    setIsSearchOpen(false);
  };

  const handleSelectMatch = (_fileId: string, filePath: string, match: SearchMatch) => {
    onSelectFile?.(filePath);
    onSelectMatch?.(filePath, match);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Toolbar */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Search className="w-4 h-4" />
          Search Content
        </button>

        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
            fileFilter.isActive
              ? 'bg-yellow-100 border border-yellow-300 text-yellow-800'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filter Files
          {fileFilter.isActive && (
            <span className="ml-1 px-2 py-0.5 bg-white rounded text-xs font-semibold">
              {fileFilter.selectedCategories.length > 0 ? fileFilter.selectedCategories.length : ''}
              {fileFilter.namePattern ? '✓' : ''}
            </span>
          )}
        </button>
      </div>

      {/* File Filter Panel */}
      {isFilterOpen && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <FileFilter
            onFilterChange={() => {
              // Trigger any side effects when filter changes
            }}
          />
          {fileFilter.isActive && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
              Showing {filteredFiles.length} of {allFiles.length} files
            </div>
          )}
        </div>
      )}

      {/* Content Search Modal */}
      <ContentSearch
        isOpen={isSearchOpen}
        onClose={handleSearchClose}
        files={fileContents}
        onSelectMatch={handleSelectMatch}
      />
    </div>
  );
}

export default SearchAndFilterPanel;
