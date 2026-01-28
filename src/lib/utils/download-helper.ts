/**
 * Browser download API helper functions
 */

/**
 * Trigger a file download in the browser
 * @param data - Data to download (string or Uint8Array)
 * @param filename - Filename for the download
 * @param mimeType - MIME type of the file
 */
export function downloadFile(
  data: string | Uint8Array,
  filename: string,
  mimeType: string = 'application/octet-stream'
): void {
  try {
    let blob: Blob;

    if (typeof data === 'string') {
      blob = new Blob([data], { type: mimeType });
    } else {
      blob = new Blob([new Uint8Array(data)], { type: mimeType });
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to download file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Download text file
 * @param content - Text content to download
 * @param filename - Filename for the download
 */
export function downloadTextFile(content: string, filename: string): void {
  downloadFile(content, filename, 'text/plain;charset=utf-8');
}

/**
 * Download JSON file
 * @param data - Data to serialize as JSON
 * @param filename - Filename for the download
 */
export function downloadJsonFile(data: unknown, filename: string): void {
  const content = JSON.stringify(data, null, 2);
  downloadFile(content, filename, 'application/json');
}

/**
 * Download binary file
 * @param data - Binary data to download
 * @param filename - Filename for the download
 */
export function downloadBinaryFile(data: Uint8Array, filename: string): void {
  downloadFile(data, filename, 'application/octet-stream');
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copy is complete
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // Use modern Clipboard API if available
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);

      textArea.select();
      document.execCommand('copy');

      document.body.removeChild(textArea);
    }
  } catch (error) {
    throw new Error(`Failed to copy to clipboard: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate download filename with timestamp
 * @param baseName - Base filename without extension
 * @param extension - File extension (without dot)
 * @returns Filename with timestamp
 */
export function generateDownloadFilename(baseName: string, extension: string): string {
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${baseName}-${timestamp}.${extension}`;
}
