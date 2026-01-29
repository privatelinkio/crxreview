/**
 * Top navigation bar component
 *
 * Provides URL input, load/download buttons, and filter toggles for the viewer.
 */

import { useState } from 'react';
import { useViewerStore } from '@/store/viewerStore';

export function TopBar() {
  const [urlInput, setUrlInput] = useState('');

  const loadingState = useViewerStore((state) => state.loadingState);
  const error = useViewerStore((state) => state.error);
  const crx = useViewerStore((state) => state.crx);
  const loadCrxFromUrl = useViewerStore((state) => state.loadCrxFromUrl);
  const clearError = useViewerStore((state) => state.clearError);

  const handleLoadFromUrl = async () => {
    if (!urlInput.trim()) {
      return;
    }

    try {
      await loadCrxFromUrl(urlInput.trim());
      setUrlInput('');
    } catch (error) {
      console.error('Failed to load extension:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLoadFromUrl();
    }
  };

  const handleDownloadCrx = () => {
    if (!crx) return;

    const blob = new Blob([crx.crxData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = crx.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = () => {
    if (!crx) return;

    // Use the already-converted ZIP data from the store
    const blob = new Blob([crx.zipData], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Change extension from .crx to .zip
    const zipFileName = crx.fileName.replace(/\.crx$/, '.zip');
    link.download = zipFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isLoading = loadingState === 'loading';

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm relative z-10">
      {/* Main toolbar */}
      <div className="px-4 py-4">
        <div className="flex flex-col gap-3">
          {/* URL Input Section */}
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter Chrome Web Store URL or Extension ID..."
              className="
                flex-1 px-3 py-2 border border-gray-300 rounded
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                text-sm relative z-10 text-gray-900 bg-white
              "
              disabled={isLoading}
              style={{ pointerEvents: 'auto' }}
            />
            <button
              onClick={handleLoadFromUrl}
              disabled={isLoading || !urlInput.trim()}
              className="
                px-4 py-2 bg-blue-600 text-white rounded
                hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
                transition-colors duration-150 text-sm font-medium
              "
            >
              {isLoading ? 'Loading...' : 'Load'}
            </button>
          </div>

          {/* Extension Info & Action Buttons */}
          {crx && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 rounded border border-gray-200">
              <div className="text-sm">
                <span className="text-gray-700 font-medium">Loaded:</span>
                <span className="ml-2 font-mono text-gray-900">{crx.extensionId}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadZip}
                  className="
                    px-3 py-1 bg-blue-600 text-white rounded text-sm
                    hover:bg-blue-700 transition-colors duration-150
                  "
                  title="Download as ZIP file"
                >
                  Download ZIP
                </button>
                <button
                  onClick={handleDownloadCrx}
                  className="
                    px-3 py-1 bg-green-600 text-white rounded text-sm
                    hover:bg-green-700 transition-colors duration-150
                  "
                  title="Download CRX file"
                >
                  Download CRX
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-semibold">Error:</span>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="
              ml-2 text-red-600 hover:text-red-800 font-medium text-sm
              transition-colors duration-150
            "
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
