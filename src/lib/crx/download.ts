/**
 * Chrome Web Store and CRX download functionality
 */

import { isValidExtensionId } from './url-patterns';

interface DownloadSuccess {
  success: true;
  data: ArrayBuffer;
}

interface DownloadError {
  success: false;
  error: string;
}

type DownloadResult = DownloadSuccess | DownloadError;

/**
 * Build the CRX download URL for a given extension ID
 * 
 * Uses Google's official CRX update server endpoint:
 * https://clients2.google.com/service/update2/crx
 *
 * @param extensionId - 32-character Chrome extension ID
 * @returns Download URL string
 */
export function buildCrxDownloadUrl(extensionId: string): string {
  if (!isValidExtensionId(extensionId)) {
    throw new Error(`Invalid extension ID: ${extensionId}`);
  }

  return `https://clients2.google.com/service/update2/crx?response=redirect&os=linux&arch=x86-64&os_arch=x86_64&acceptformat=crx2,crx3&x=id%3D${extensionId}%26v%3D0`;
}

/**
 * Fetch CRX file from Chrome's update server
 * 
 * Downloads the CRX file for a given extension ID. Handles:
 * - Network errors with descriptive messages
 * - HTTP error responses
 * - Invalid extension IDs
 *
 * @param extensionId - 32-character Chrome extension ID
 * @returns Result object with success flag and either ArrayBuffer or error message
 */
export async function downloadCrx(extensionId: string): Promise<DownloadResult> {
  try {
    if (!isValidExtensionId(extensionId)) {
      return {
        success: false,
        error: `Invalid extension ID format: ${extensionId}`,
      };
    }

    const url = buildCrxDownloadUrl(extensionId);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      // Don't redirect automatically so we can handle the redirect URL
      redirect: 'follow',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to download CRX: HTTP ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.arrayBuffer();

    if (data.byteLength === 0) {
      return {
        success: false,
        error: 'Downloaded file is empty',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Network error downloading CRX: ${message}`,
    };
  }
}
