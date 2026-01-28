/**
 * Core type definitions for CRX Review
 */

import type { FileTreeNode } from '@/lib/zip/file-tree';

/**
 * Represents the state of a loaded CRX file
 */
export interface LoadedCrx {
  extensionId: string;
  fileName: string;
  loadedAt: Date;
  crxData: ArrayBuffer;
  zipData: ArrayBuffer;
  fileTree: FileTreeNode;
  fileCache: Map<string, Uint8Array>;
}

/**
 * Current loading state
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Viewer application state
 */
export interface ViewerState {
  // Loading and data
  loadingState: LoadingState;
  error: string | null;
  crx: LoadedCrx | null;

  // UI state
  selectedFilePath: string | null;
  fileFilter: string;

  // Actions
  loadCrx: (extensionId: string, crxData: ArrayBuffer) => Promise<void>;
  loadCrxFromUrl: (input: string) => Promise<void>;
  selectFile: (path: string) => void;
  setFileFilter: (filter: string) => void;
  clearError: () => void;
  reset: () => void;
}
