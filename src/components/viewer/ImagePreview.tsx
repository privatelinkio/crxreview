/**
 * Image preview component
 *
 * Displays images inline with metadata and optimized rendering.
 */

import { useState } from 'react';

interface ImagePreviewProps {
  data: Uint8Array;
  fileName: string;
  filePath: string;
}

export function ImagePreview({
  data,
  fileName,
  filePath,
}: ImagePreviewProps) {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [imageError, setImageError] = useState(false);

  // Convert Uint8Array to blob URL
  const blobUrl = URL.createObjectURL(new Blob([new Uint8Array(data)]));

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  const fileSizeKB = (data.length / 1024).toFixed(2);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{fileName}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono">{filePath}</p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">File Size:</span>
            <p className="font-mono text-gray-900 dark:text-gray-100">{fileSizeKB} KB</p>
          </div>
          {imageSize && (
            <>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Dimensions:</span>
                <p className="font-mono text-gray-900 dark:text-gray-100">
                  {imageSize.width} × {imageSize.height}px
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Aspect Ratio:</span>
                <p className="font-mono text-gray-900 dark:text-gray-100">
                  {(imageSize.width / imageSize.height).toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 overflow-auto max-h-96 flex items-center justify-center">
        {imageError ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Failed to load image</p>
          </div>
        ) : (
          <img
            src={blobUrl}
            alt={fileName}
            onLoad={handleImageLoad}
            onError={() => setImageError(true)}
            className="max-w-full max-h-full"
          />
        )}
      </div>
    </div>
  );
}
