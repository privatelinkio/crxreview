/**
 * Main viewer page layout
 *
 * Combines TopBar, FileTree, CodeViewer with a resizable two-panel layout.
 * Manages state for panel widths and file loading.
 *
 * URL state sync: Uses useUrlState to load extensions from URL params
 * and sync viewer state back to the URL for deep linking
 */

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/viewer/TopBar';
import { FileTree } from '@/components/viewer/FileTree';
import { CodeViewer } from '@/components/viewer/CodeViewer';
import { PanelResizer } from '@/components/viewer/PanelResizer';
import { useViewerStore } from '@/store/viewerStore';
import { useUrlState } from '@/hooks/useUrlState';
import { loadZipFile } from '@/lib/zip/extractor';

const DEFAULT_LEFT_PANEL_WIDTH = 300;

export function ViewerPage() {
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_PANEL_WIDTH);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [currentFileData, setCurrentFileData] = useState<Uint8Array | null>(null);
  const [fileLoadError, setFileLoadError] = useState<string | null>(null);

  const crx = useViewerStore((state) => state.crx);
  const loadingState = useViewerStore((state) => state.loadingState);
  const selectedFilePath = useViewerStore((state) => state.selectedFilePath);

  // Initialize URL state sync
  useUrlState();

  // Load file content when selection changes
  useEffect(() => {
    if (!selectedFilePath || !crx) {
      setCurrentFileData(null);
      setFileLoadError(null);
      return;
    }

    // Check if it's a directory (shouldn't happen but safety check)
    const selectedNode = findNodeByPath(crx.fileTree, selectedFilePath);
    if (selectedNode?.isDirectory) {
      setCurrentFileData(null);
      setFileLoadError('Cannot view directory content');
      return;
    }

    // Check cache first
    if (crx.fileCache.has(selectedFilePath)) {
      const cached = crx.fileCache.get(selectedFilePath);
      if (cached) {
        setCurrentFileData(cached);
        setFileLoadError(null);
        return;
      }
    }

    // Load file from ZIP
    const loadFile = async () => {
      setIsLoadingFile(true);
      setFileLoadError(null);

      try {
        const result = await loadZipFile(crx.zipData, selectedFilePath);
        if (!result.success) {
          setFileLoadError(result.error);
          setCurrentFileData(null);
          return;
        }

        const file = result.files[0];
        if (!file || !file.data) {
          setFileLoadError('Failed to load file data');
          setCurrentFileData(null);
          return;
        }

        // Cache the file
        crx.fileCache.set(selectedFilePath, file.data);
        setCurrentFileData(file.data);
      } catch (error) {
        setFileLoadError(
          `Failed to load file: ${error instanceof Error ? error.message : String(error)}`
        );
        setCurrentFileData(null);
      } finally {
        setIsLoadingFile(false);
      }
    };

    loadFile();
  }, [selectedFilePath, crx]);

  const getSelectedFileName = (): string => {
    if (!selectedFilePath) return '';
    const parts = selectedFilePath.split('/');
    return parts[parts.length - 1];
  };

  // Render empty state
  if (!crx || loadingState === 'loading') {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {loadingState === 'loading' ? (
              <>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4" />
                <p className="text-gray-600">Loading extension...</p>
              </>
            ) : (
              <>
                <p className="text-gray-600 text-lg">No extension loaded</p>
                <p className="text-gray-500 text-sm mt-2">
                  Enter a Chrome Web Store URL or Extension ID above to get started
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (loadingState === 'error' && !crx) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">Failed to load extension</p>
            <p className="text-gray-600">Try entering a valid Chrome Web Store URL</p>
          </div>
        </div>
      </div>
    );
  }

  // Render main viewer
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopBar />

      <div className="flex-1 flex min-h-0">
        {/* File Tree Panel */}
        <div style={{ width: `${leftPanelWidth}px` }} className="flex flex-col">
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Files</h2>
          </div>
          <FileTree node={crx.fileTree} />
        </div>

        {/* Resizer */}
        <PanelResizer
          onResize={setLeftPanelWidth}
          minLeftWidth={200}
          minRightWidth={300}
        />

        {/* Code Viewer Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedFilePath ? (
            <>
              <div className="px-3 py-2 border-b border-gray-200 bg-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 truncate">
                  {getSelectedFileName()}
                </h2>
              </div>
              {fileLoadError ? (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <p className="text-red-600 font-semibold mb-2">Error loading file</p>
                    <p className="text-gray-600 text-sm">{fileLoadError}</p>
                  </div>
                </div>
              ) : currentFileData ? (
                <CodeViewer
                  fileName={getSelectedFileName()}
                  filePath={selectedFilePath}
                  fileData={currentFileData}
                  isLoading={isLoadingFile}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2" />
                    <p className="text-gray-600">Loading file...</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center">
                <p className="text-gray-600">Select a file to view its contents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Find a file tree node by path
 * @param node - Root node
 * @param path - Path to find
 * @returns Found node or undefined
 */
function findNodeByPath(node: any, path: string): any | undefined {
  if (node.path === path) {
    return node;
  }

  for (const child of node.children || []) {
    const found = findNodeByPath(child, path);
    if (found) {
      return found;
    }
  }

  return undefined;
}
