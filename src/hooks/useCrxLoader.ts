/**
 * Hook for loading CRX files from URLs or file uploads
 *
 * Handles:
 * - Loading CRX from Chrome Web Store URLs
 * - Loading CRX from extension IDs
 * - Loading CRX from file uploads
 * - Progress tracking and error handling
 */

import { useCallback } from 'react';
import { useViewerStore } from '@/store/viewerStore';

/**
 * Hook to manage CRX file loading
 *
 * Usage:
 * ```tsx
 * const { loadFromUrl, loadFromFile } = useCrxLoader();
 *
 * // Load from URL
 * await loadFromUrl('https://chrome.google.com/webstore/detail/...');
 *
 * // Load from file
 * const file = event.target.files[0];
 * await loadFromFile(file);
 * ```
 */
export function useCrxLoader() {
  const loadCrxFromUrl = useViewerStore((state) => state.loadCrxFromUrl);
  const loadCrx = useViewerStore((state) => state.loadCrx);
  const loadingState = useViewerStore((state) => state.loadingState);
  const error = useViewerStore((state) => state.error);
  const crx = useViewerStore((state) => state.crx);

  /**
   * Load CRX from URL or extension ID
   */
  const loadFromUrl = useCallback(
    async (input: string): Promise<void> => {
      if (!input.trim()) {
        return;
      }

      await loadCrxFromUrl(input);
    },
    [loadCrxFromUrl]
  );

  /**
   * Load CRX from file upload
   */
  const loadFromFile = useCallback(
    async (file: File): Promise<void> => {
      if (!file) {
        return;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();

        // Extract extension ID from filename if possible
        // CRX files are typically named: extension-id.crx
        const extensionId = file.name
          .replace(/\.crx$/i, '')
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 32);

        await loadCrx(extensionId || 'uploaded', arrayBuffer);
      } catch (err) {
        console.error('Failed to load CRX file:', err);
      }
    },
    [loadCrx]
  );

  return {
    loadFromUrl,
    loadFromFile,
    isLoading: loadingState === 'loading',
    error,
    crx,
  };
}
