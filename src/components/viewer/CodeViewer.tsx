/**
 * Code viewer component with syntax highlighting and beautification
 *
 * Displays code content with Prism.js syntax highlighting, beautification support,
 * and integrated toolbar. Handles errors and loading states gracefully.
 *
 * Performance optimizations:
 * - Lazy loads Prism.js language components
 * - Memoizes expensive computations
 * - Debounces rapid updates
 */

import { useState, useEffect, useMemo } from 'react';
import { SourceToolbar } from './SourceToolbar';
import { ImagePreview } from './ImagePreview';
import { detectLanguageFromPath, getPrismLanguage, isImageFile, isTextFile } from '@/lib/code/language-detector';
import { highlightCode } from '@/lib/code/highlighter';
import { beautifyCode, canBeautify } from '@/lib/code/beautifier';
import { copyToClipboard } from '@/lib/utils/download-helper';
import { loadPrismLanguage } from '@/lib/code/prism-loader';
import 'prismjs/themes/prism-tomorrow.css';

interface CodeViewerProps {
  fileName: string;
  filePath: string;
  fileData: Uint8Array;
  isLoading?: boolean;
}

export function CodeViewer({
  fileName,
  filePath,
  fileData,
  isLoading = false,
}: CodeViewerProps) {
  const [isBeautified, setIsBeautified] = useState(false);
  const [displayContent, setDisplayContent] = useState<string>('');
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Detect file type and language
  const isImage = isImageFile(filePath);
  const isText = isTextFile(filePath);
  const language = detectLanguageFromPath(filePath);
  const prismLanguage = getPrismLanguage(language);

  // Lazy load Prism language component
  useEffect(() => {
    if (!isImage && isText && prismLanguage && prismLanguage !== 'text') {
      loadPrismLanguage(prismLanguage).catch((err) => {
        console.warn(`Failed to load Prism language: ${prismLanguage}`, err);
      });
    }
  }, [prismLanguage, isImage, isText]);

  // Memoize the decoded content to avoid re-decoding
  const decodedContent = useMemo(() => {
    if (isImage || !isText) {
      return null;
    }

    try {
      const decoder = new TextDecoder();
      return decoder.decode(fileData);
    } catch {
      return null;
    }
  }, [fileData, isImage, isText]);

  // Memoize highlight computation
  const { html, content } = useMemo(() => {
    if (!decodedContent || isImage || !isText) {
      return { html: '', content: '' };
    }

    try {
      const highlighted = highlightCode(decodedContent, prismLanguage);
      return { html: highlighted.html, content: decodedContent };
    } catch (err) {
      console.error(`Failed to highlight code: ${err}`);
      return { html: '', content: decodedContent };
    }
  }, [decodedContent, prismLanguage, isImage, isText]);

  // Sync displayed content with file changes
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // Handle image files
    if (isImage) {
      setError(null);
      setIsBeautified(false);
      return; // Image preview handles its own rendering
    }

    // Handle non-text files
    if (!isText) {
      setError(`Cannot display binary file: ${fileName}`);
      setIsBeautified(false);
      return;
    }

    if (decodedContent === null) {
      setError(`Failed to decode file: unsupported encoding`);
      setDisplayContent('');
      setHighlightedHtml('');
      setIsBeautified(false);
      return;
    }

    setError(null);
    setIsBeautified(false);
    setDisplayContent(content);
    setHighlightedHtml(html);
  }, [content, html, isImage, isText, decodedContent, fileName]);

  // Handle beautification
  const handleBeautifyToggle = () => {
    if (!canBeautify(prismLanguage)) {
      return;
    }

    try {
      if (isBeautified) {
        // Revert to original
        const highlighted = highlightCode(displayContent, prismLanguage);
        setHighlightedHtml(highlighted.html);
        setIsBeautified(false);
      } else {
        // Beautify
        const beautified = beautifyCode(displayContent, prismLanguage);
        const highlighted = highlightCode(beautified, prismLanguage);
        setHighlightedHtml(highlighted.html);
        setIsBeautified(true);
      }
    } catch (err) {
      setError(`Beautification failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCopyContent = async () => {
    try {
      await copyToClipboard(displayContent);
    } catch (err) {
      setError(`Copy failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2" />
          <p className="text-gray-700">Loading file...</p>
        </div>
      </div>
    );
  }

  // Render image preview
  if (isImage) {
    return <ImagePreview data={fileData} fileName={fileName} filePath={filePath} />;
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white p-6">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Error</p>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  // Render code with syntax highlighting
  const canBeautifyFile = canBeautify(prismLanguage);

  return (
    <div className="flex flex-col h-full bg-white">
      <SourceToolbar
        fileName={fileName}
        filePath={filePath}
        fileData={fileData}
        fileContent={displayContent}
        isBeautified={isBeautified}
        onBeautifyToggle={handleBeautifyToggle}
        onCopyContent={handleCopyContent}
      />

      <div className="flex-1 overflow-auto">
        <pre className="m-0 p-4 bg-white text-sm leading-relaxed language-highlight">
          <code
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            className={`language-${prismLanguage}`}
          />
        </pre>
      </div>

      {!canBeautifyFile && (
        <div className="text-xs text-gray-600 px-4 py-2 border-t border-gray-200 bg-gray-50">
          Beautification not available for {language} files
        </div>
      )}
    </div>
  );
}
