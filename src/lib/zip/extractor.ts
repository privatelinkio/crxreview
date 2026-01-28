/**
 * ZIP file extraction wrapper using JSZip
 */

import JSZip from 'jszip';

export interface ZipFileEntry {
  name: string;
  dir: boolean;
  size: number;
  compressedSize: number;
  date: Date;
  data?: Uint8Array;
}

interface ExtractionSuccess {
  success: true;
  files: ZipFileEntry[];
}

interface ExtractionError {
  success: false;
  error: string;
}

type ExtractionResult = ExtractionSuccess | ExtractionError;

/**
 * Extract file entries from ZIP data
 * 
 * Loads ZIP data using JSZip and returns an array of file entries
 * with metadata. Does not load file contents by default for performance.
 *
 * @param zipData - ArrayBuffer containing ZIP file data
 * @returns Result object with success flag and either files array or error message
 */
export async function extractZipEntries(zipData: ArrayBuffer): Promise<ExtractionResult> {
  try {
    const zip = new JSZip();
    await zip.loadAsync(zipData);

    const files: ZipFileEntry[] = [];

    zip.forEach((relativePath, file) => {
      // Access public API properties instead of private _data
      const fileObj = file as unknown as { dir: boolean; date: Date; _data?: { uncompressedSize?: number; compressedSize?: number } };
      files.push({
        name: relativePath,
        dir: fileObj.dir,
        size: (fileObj._data?.uncompressedSize as number) ?? 0,
        compressedSize: (fileObj._data?.compressedSize as number) ?? 0,
        date: fileObj.date ?? new Date(),
      });
    });

    return {
      success: true,
      files,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to extract ZIP entries: ${message}`,
    };
  }
}

/**
 * Load a specific file from ZIP data
 * 
 * @param zipData - ArrayBuffer containing ZIP file data
 * @param filePath - Relative path of the file within the ZIP
 * @returns Result object with success flag and either file data or error message
 */
export async function loadZipFile(zipData: ArrayBuffer, filePath: string): Promise<ExtractionResult> {
  try {
    const zip = new JSZip();
    await zip.loadAsync(zipData);

    const file = zip.file(filePath);
    if (!file) {
      return {
        success: false,
        error: `File not found in ZIP: ${filePath}`,
      };
    }

    const data = await file.async('uint8array');

    return {
      success: true,
      files: [
        {
          name: filePath,
          dir: false,
          size: data.length,
          compressedSize: 0,
          date: new Date(),
          data,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to load file from ZIP: ${message}`,
    };
  }
}
