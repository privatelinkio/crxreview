/**
 * Zustand store for CRX Viewer application state
 */

import { create } from 'zustand';
import type { ViewerState, LoadedCrx } from '@/types/index';
import { downloadCrx } from '@/lib/crx/download';
import { crxToZip } from '@/lib/crx/zip-converter';
import { extractZipEntries } from '@/lib/zip/extractor';
import { buildFileTree } from '@/lib/zip/file-tree';
import { extractExtensionId } from '@/lib/crx/url-patterns';

/**
 * Create the viewer store with complete state management
 * 
 * Handles:
 * - Loading CRX files from data or by downloading from Chrome Web Store
 * - Managing file selection and filtering
 * - Error handling and state reset
 */
export const useViewerStore = create<ViewerState>((set) => ({
  loadingState: 'idle',
  error: null,
  crx: null,
  selectedFilePath: null,
  fileFilter: '',

  loadCrx: async (extensionId: string, crxData: ArrayBuffer) => {
    set({ loadingState: 'loading', error: null });

    try {
      // Convert CRX to ZIP
      const zipResult = crxToZip(crxData);
      if (!zipResult.success) {
        set({
          loadingState: 'error',
          error: zipResult.error,
        });
        return;
      }

      // Extract ZIP entries
      const entriesResult = await extractZipEntries(zipResult.zipData);
      if (!entriesResult.success) {
        set({
          loadingState: 'error',
          error: entriesResult.error,
        });
        return;
      }

      // Build file tree
      const fileTree = buildFileTree(entriesResult.files);

      // Create loaded CRX object
      const loadedCrx: LoadedCrx = {
        extensionId,
        fileName: `${extensionId}.crx`,
        loadedAt: new Date(),
        crxData,
        zipData: zipResult.zipData,
        fileTree,
        fileCache: new Map(),
      };

      set({
        loadingState: 'success',
        crx: loadedCrx,
        selectedFilePath: null,
        fileFilter: '',
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({
        loadingState: 'error',
        error: `Failed to load CRX: ${message}`,
      });
    }
  },

  loadCrxFromUrl: async (input: string) => {
    set({ loadingState: 'loading', error: null });

    try {
      // Extract extension ID from URL
      const idResult = extractExtensionId(input);
      if (!idResult.success) {
        set({
          loadingState: 'error',
          error: idResult.error,
        });
        return;
      }

      const { extensionId } = idResult;

      // Download CRX from Chrome Web Store
      const downloadResult = await downloadCrx(extensionId);
      if (!downloadResult.success) {
        set({
          loadingState: 'error',
          error: downloadResult.error,
        });
        return;
      }

      // Load the downloaded CRX
      const state = useViewerStore.getState();
      await state.loadCrx(extensionId, downloadResult.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({
        loadingState: 'error',
        error: `Failed to load CRX from URL: ${message}`,
      });
    }
  },

  selectFile: (path: string) => {
    set({ selectedFilePath: path });
  },

  setFileFilter: (filter: string) => {
    set({ fileFilter: filter });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      loadingState: 'idle',
      error: null,
      crx: null,
      selectedFilePath: null,
      fileFilter: '',
    });
  },
}));
