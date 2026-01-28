/**
 * Hook for managing file selection state
 *
 * Handles:
 * - Selecting files by path
 * - Deselecting files
 * - Checking if a file is selected
 */

import { useCallback } from 'react';
import { useViewerStore } from '@/store/viewerStore';

/**
 * Hook to manage file selection
 *
 * Usage:
 * ```tsx
 * const { selectFile, selectedFilePath, isSelected, deselectFile } = useFileSelection();
 *
 * // Select a file
 * selectFile('manifest.json');
 *
 * // Check if file is selected
 * if (isSelected('background.js')) {
 *   console.log('background.js is selected');
 * }
 * ```
 */
export function useFileSelection() {
  const selectedFilePath = useViewerStore((state) => state.selectedFilePath);
  const selectFile = useViewerStore((state) => state.selectFile);

  /**
   * Select a file by path
   */
  const handleSelectFile = useCallback(
    (path: string): void => {
      selectFile(path);
    },
    [selectFile]
  );

  /**
   * Deselect the current file
   */
  const deselectFile = useCallback((): void => {
    selectFile('');
  }, [selectFile]);

  /**
   * Check if a specific file is selected
   */
  const isSelected = useCallback(
    (path: string): boolean => {
      return selectedFilePath === path;
    },
    [selectedFilePath]
  );

  /**
   * Get the selected file name (last part of path)
   */
  const getSelectedFileName = useCallback((): string => {
    if (!selectedFilePath) return '';
    const parts = selectedFilePath.split('/');
    return parts[parts.length - 1];
  }, [selectedFilePath]);

  return {
    selectedFilePath,
    selectFile: handleSelectFile,
    deselectFile,
    isSelected,
    getSelectedFileName,
    hasSelection: !!selectedFilePath,
  };
}
