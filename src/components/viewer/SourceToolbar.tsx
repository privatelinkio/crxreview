/**
 * Toolbar for code/source viewing
 *
 * Provides buttons for beautifying code, downloading files, calculating hashes,
 * and displaying file information.
 */

import { useState } from 'react';
import { downloadTextFile, copyToClipboard } from '@/lib/utils/download-helper';
import { calculateSHA256, formatFileSize } from '@/lib/utils/hash';
import { formatHashResult } from '@/lib/utils/hash';

interface SourceToolbarProps {
  fileName: string;
  filePath: string;
  fileData: Uint8Array;
  fileContent: string;
  isBeautified: boolean;
  onBeautifyToggle: () => void;
  onCopyContent: () => void;
}

export function SourceToolbar({
  fileName,
  filePath,
  fileData,
  fileContent,
  isBeautified,
  onBeautifyToggle,
  onCopyContent,
}: SourceToolbarProps) {
  const [showHash, setShowHash] = useState(false);
  const [hashValue, setHashValue] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculateHash = async () => {
    if (showHash && hashValue) {
      // Toggle off
      setShowHash(false);
      return;
    }

    setIsCalculating(true);
    try {
      const result = await calculateSHA256(fileData);
      setHashValue(formatHashResult(result));
      setShowHash(true);
    } catch (error) {
      console.error('Failed to calculate hash:', error);
      setHashValue('Failed to calculate hash');
      setShowHash(true);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleDownload = () => {
    downloadTextFile(fileContent, fileName);
  };

  const handleCopyHash = () => {
    if (hashValue) {
      copyToClipboard(hashValue);
    }
  };

  const fileSizeBytes = fileData.length;
  const fileSizeFormatted = formatFileSize(fileSizeBytes);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {fileSizeFormatted}
          </span>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <span className="text-xs text-gray-700 dark:text-gray-300 font-mono truncate max-w-96">
            {filePath}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBeautifyToggle}
            className="
              px-3 py-1.5 text-sm font-medium rounded
              bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
              hover:bg-gray-50 dark:hover:bg-gray-600
              text-gray-900 dark:text-gray-100
              transition-colors duration-150
            "
            title="Toggle code beautification"
          >
            {isBeautified ? 'Beautified' : 'Beautify'}
          </button>

          <button
            onClick={onCopyContent}
            className="
              px-3 py-1.5 text-sm font-medium rounded
              bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
              hover:bg-gray-50 dark:hover:bg-gray-600
              text-gray-900 dark:text-gray-100
              transition-colors duration-150
            "
            title="Copy content to clipboard"
          >
            Copy
          </button>

          <button
            onClick={handleDownload}
            className="
              px-3 py-1.5 text-sm font-medium rounded
              bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
              hover:bg-gray-50 dark:hover:bg-gray-600
              text-gray-900 dark:text-gray-100
              transition-colors duration-150
            "
            title="Download file"
          >
            Download
          </button>

          <button
            onClick={handleCalculateHash}
            disabled={isCalculating}
            className="
              px-3 py-1.5 text-sm font-medium rounded
              bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
              hover:bg-gray-50 dark:hover:bg-gray-600
              text-gray-900 dark:text-gray-100
              transition-colors duration-150 disabled:opacity-50
            "
            title="Calculate SHA-256 hash"
          >
            {isCalculating ? 'Calculating...' : 'Hash'}
          </button>
        </div>
      </div>

      {showHash && hashValue && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">SHA-256:</span>
            <code className="flex-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 font-mono overflow-auto max-w-2xl text-gray-900 dark:text-gray-100">
              {hashValue}
            </code>
            <button
              onClick={handleCopyHash}
              className="
                px-2 py-1 text-xs font-medium rounded
                bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
                hover:bg-gray-50 dark:hover:bg-gray-600
                text-gray-900 dark:text-gray-100
                transition-colors duration-150
              "
              title="Copy hash to clipboard"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
