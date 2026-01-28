/**
 * Chrome Web Store and CRX download functionality
 */

import { isValidExtensionId } from './url-patterns';

/**
 * CORS proxy URL for bypassing Chrome Web Store CORS restrictions
 * Deployed on Cloudflare Workers
 */
const CORS_PROXY_URL = 'https://crxreview-cors-proxy.visiquate-inc.workers.dev';

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

    const directUrl = buildCrxDownloadUrl(extensionId);

    // Route through CORS proxy to bypass Chrome Web Store CORS restrictions
    const proxyUrl = `${CORS_PROXY_URL}?url=${encodeURIComponent(directUrl)}`;

    const response = await fetch(proxyUrl, {
      method: 'GET',
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
