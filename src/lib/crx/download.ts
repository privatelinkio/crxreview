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

  // Remove response=redirect to get the CRX file directly instead of a redirect
  return `https://clients2.google.com/service/update2/crx?os=linux&arch=x86-64&os_arch=x86_64&acceptformat=crx2,crx3&prodversion=119.0&x=id%3D${extensionId}%26installsource%3Dondemand%26uc`;
}

/**
 * Parse Chrome update XML response to extract download URL
 *
 * @param xmlText - XML response from Chrome update server
 * @returns Download URL or null if not found
 */
function extractDownloadUrl(xmlText: string): string | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Check for XML parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML parsing error:', parserError.textContent);
      return null;
    }

    // Extract codebase URL from updatecheck element
    const updatecheck = xmlDoc.querySelector('updatecheck');
    if (!updatecheck) {
      console.error('No updatecheck element found in XML');
      return null;
    }

    const codebase = updatecheck.getAttribute('codebase');
    return codebase;
  } catch (error) {
    console.error('Error parsing XML:', error);
    return null;
  }
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

    // Step 1: Get the update metadata XML which contains the actual download URL
    const metadataUrl = buildCrxDownloadUrl(extensionId);
    const proxyMetadataUrl = `${CORS_PROXY_URL}?url=${encodeURIComponent(metadataUrl)}`;

    const metadataResponse = await fetch(proxyMetadataUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!metadataResponse.ok) {
      return {
        success: false,
        error: `Failed to fetch extension metadata: HTTP ${metadataResponse.status} ${metadataResponse.statusText}`,
      };
    }

    const xmlText = await metadataResponse.text();

    // Step 2: Parse XML to extract the actual download URL
    const downloadUrl = extractDownloadUrl(xmlText);

    if (!downloadUrl) {
      return {
        success: false,
        error: 'Could not find download URL in update metadata',
      };
    }

    // Step 3: Download the actual CRX file
    const proxyDownloadUrl = `${CORS_PROXY_URL}?url=${encodeURIComponent(downloadUrl)}`;

    const crxResponse = await fetch(proxyDownloadUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!crxResponse.ok) {
      return {
        success: false,
        error: `Failed to download CRX: HTTP ${crxResponse.status} ${crxResponse.statusText}`,
      };
    }

    const data = await crxResponse.arrayBuffer();

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
