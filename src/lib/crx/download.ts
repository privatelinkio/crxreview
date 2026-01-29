/**
 * Chrome Web Store and CRX download functionality
 */

import { isValidExtensionId } from './url-patterns';

/**
 * CORS proxy URL for bypassing Chrome Web Store CORS restrictions
 * Deployed on Cloudflare Workers
 */
const CORS_PROXY_URL = 'https://crxreview-cors-proxy.brentley.workers.dev';

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
 * @param os - Operating system (defaults to 'linux', can be 'windows', 'mac')
 * @param arch - Architecture (defaults to 'x86-64')
 * @returns Download URL string
 */
export function buildCrxDownloadUrl(
  extensionId: string,
  os: string = 'linux',
  arch: string = 'x86-64'
): string {
  if (!isValidExtensionId(extensionId)) {
    throw new Error(`Invalid extension ID: ${extensionId}`);
  }

  // Use maximum prodversion (2147483647) to avoid noupdate responses
  // Research shows values <88 return 204/noupdate, max value gives best results
  // See: https://gist.github.com/paulirish/78d6c1406c901be02c2d
  return `https://clients2.google.com/service/update2/crx?os=${os}&arch=${arch}&os_arch=${arch}&acceptformat=crx2,crx3&prodversion=2147483647&x=id%3D${extensionId}%26installsource%3Dondemand%26uc`;
}

/**
 * Parse Chrome update XML response to extract download URL
 *
 * @param xmlText - XML response from Chrome update server
 * @returns Download URL or null if not found, or 'noupdate' if status is noupdate
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

    // Check if status is noupdate (extension not available for download)
    const status = updatecheck.getAttribute('status');
    if (status === 'noupdate') {
      console.error('Extension returned status=noupdate');
      return 'noupdate';
    }

    const codebase = updatecheck.getAttribute('codebase');
    return codebase;
  } catch (error) {
    console.error('Error parsing XML:', error);
    return null;
  }
}

/**
 * Try downloading CRX with specific OS/arch parameters
 *
 * @param extensionId - Extension ID
 * @param os - Operating system parameter
 * @param arch - Architecture parameter
 * @returns Download result or null if should try next fallback
 */
async function tryDownloadWithParams(
  extensionId: string,
  os: string,
  arch: string
): Promise<DownloadResult | null> {
  try {
    // Step 1: Get the update metadata XML which contains the actual download URL
    const metadataUrl = buildCrxDownloadUrl(extensionId, os, arch);
    const proxyMetadataUrl = `${CORS_PROXY_URL}?url=${encodeURIComponent(metadataUrl)}`;

    const metadataResponse = await fetch(proxyMetadataUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!metadataResponse.ok) {
      return null; // Try next fallback
    }

    // Check if response is binary CRX (some extensions return CRX directly)
    const contentType = metadataResponse.headers.get('content-type') || '';
    if (
      contentType.includes('application/x-chrome-extension') ||
      contentType.includes('application/octet-stream')
    ) {
      const data = await metadataResponse.arrayBuffer();
      if (data.byteLength > 0) {
        return {
          success: true,
          data,
        };
      }
      return null; // Empty binary, try next fallback
    }

    // Parse XML response
    const xmlText = await metadataResponse.text();

    // Step 2: Parse XML to extract the actual download URL
    const downloadUrl = extractDownloadUrl(xmlText);

    if (downloadUrl === 'noupdate') {
      return null; // Try next fallback
    }

    if (!downloadUrl) {
      return null; // Try next fallback
    }

    // Step 3: Download the actual CRX file
    const proxyDownloadUrl = `${CORS_PROXY_URL}?url=${encodeURIComponent(downloadUrl)}`;

    const crxResponse = await fetch(proxyDownloadUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!crxResponse.ok) {
      return null; // Try next fallback
    }

    const data = await crxResponse.arrayBuffer();

    if (data.byteLength === 0) {
      return null; // Try next fallback
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return null; // Try next fallback
  }
}

/**
 * Fetch CRX file from Chrome's update server
 *
 * Downloads the CRX file for a given extension ID. Handles:
 * - Network errors with descriptive messages
 * - HTTP error responses
 * - Invalid extension IDs
 * - Binary CRX responses (some extensions return CRX directly instead of XML)
 * - Multiple fallback strategies with different OS/arch combinations
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

    // Try multiple OS/arch combinations as fallbacks
    // Research shows different combinations may work for different extensions
    const strategies = [
      { os: 'linux', arch: 'x86-64' },
      { os: 'mac', arch: 'x86-64' },
      { os: 'windows', arch: 'x86-64' },
      { os: 'linux', arch: 'arm' },
    ];

    for (const strategy of strategies) {
      const result = await tryDownloadWithParams(extensionId, strategy.os, strategy.arch);
      if (result) {
        return result;
      }
    }

    // All strategies failed
    return {
      success: false,
      error:
        'Extension not available for download. This may be due to: (1) Google restricting programmatic downloads for this extension, (2) extension removed from Chrome Web Store, or (3) regional restrictions. The extension may still be installable through your browser.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Network error downloading CRX: ${message}`,
    };
  }
}
