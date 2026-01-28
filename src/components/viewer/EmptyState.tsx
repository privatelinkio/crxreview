/**
 * Empty state components for various scenarios
 *
 * Provides consistent, helpful messaging when there's no content to display.
 */

import { ReactNode } from 'react';

/**
 * Props for EmptyState component
 */
export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Generic empty state component
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon="📁"
 *   title="No files found"
 *   description="The file tree is empty"
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{title}</h3>
      {description && <p className="text-gray-600 text-center text-sm mb-4 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Empty file tree state
 *
 * Shown when no files are available in the extension
 */
export function EmptyFileTree() {
  return (
    <EmptyState
      icon="📁"
      title="No files found"
      description="The extension doesn't contain any files, or they failed to load."
    />
  );
}

/**
 * No file selected state
 *
 * Shown in the code viewer when no file is selected
 */
export function NoFileSelected() {
  return (
    <EmptyState
      icon="📄"
      title="No file selected"
      description="Select a file from the tree to view its contents. Press Ctrl+F (or Cmd+F) to search."
    />
  );
}

/**
 * Search results empty state
 *
 * Shown when search returns no results
 */
export function NoSearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={`No matches for "${query}". Try a different search term.`}
    />
  );
}

/**
 * Filter results empty state
 *
 * Shown when applied filters result in no files
 */
export function NoFilteredResults() {
  return (
    <EmptyState
      icon="🔎"
      title="No files match your filters"
      description="Try adjusting your filter criteria to find files."
    />
  );
}

/**
 * Error state
 *
 * Shown when an error occurs while loading content
 */
export function ErrorState({
  title = 'An error occurred',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon="⚠️"
      title={title}
      description={message}
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Retry
          </button>
        )
      }
    />
  );
}

/**
 * Loading state with spinner
 *
 * Shown while content is loading
 */
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4" />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
}
