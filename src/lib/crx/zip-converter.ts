/**
 * Convert CRX file to ZIP data
 * 
 * CRX files are essentially ZIP files with a header prepended.
 * This module strips the CRX header and extracts the raw ZIP data.
 */

import { parseCrxHeader } from './parser';

interface ConversionSuccess {
  success: true;
  zipData: ArrayBuffer;
}

interface ConversionError {
  success: false;
  error: string;
}

type ConversionResult = ConversionSuccess | ConversionError;

/**
 * Convert CRX file to ZIP data by stripping the CRX header
 * 
 * Parses the CRX header to find the ZIP data offset, then extracts
 * the raw ZIP bytes from the CRX buffer.
 *
 * @param crxBuffer - ArrayBuffer containing CRX file data
 * @returns Result object with success flag and either zipData or error message
 */
export function crxToZip(crxBuffer: ArrayBuffer): ConversionResult {
  try {
    // Parse the CRX header to get the ZIP offset
    const parseResult = parseCrxHeader(crxBuffer);

    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error,
      };
    }

    const { zipOffset } = parseResult.header;

    // Check that ZIP offset is valid
    if (zipOffset >= crxBuffer.byteLength) {
      return {
        success: false,
        error: 'ZIP offset exceeds buffer length',
      };
    }

    // Check that there's meaningful ZIP data
    if (zipOffset >= crxBuffer.byteLength - 4) {
      return {
        success: false,
        error: 'No valid ZIP data found after CRX header',
      };
    }

    // Extract ZIP data by creating a new buffer starting at zipOffset
    const zipData = crxBuffer.slice(zipOffset);

    // Validate that we have what looks like a ZIP file (magic number 0x504B)
    const zipView = new Uint8Array(zipData);
    if (zipData.byteLength < 4 || zipView[0] !== 0x50 || zipView[1] !== 0x4b) {
      return {
        success: false,
        error: 'Invalid ZIP header: expected magic number 0x504B',
      };
    }

    return {
      success: true,
      zipData,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to convert CRX to ZIP: ${message}`,
    };
  }
}
