/**
 * URL pattern matching for Chrome Web Store URLs
 */

interface ExtensionIdMatch {
  success: true;
  extensionId: string;
}

interface ExtensionIdNoMatch {
  success: false;
  error: string;
}

type ExtensionIdResult = ExtensionIdMatch | ExtensionIdNoMatch;

/**
 * Patterns for matching Chrome Web Store URLs
 */
const URL_PATTERNS = {
  // New Chrome Web Store URL format (2024+)
  newStandard: /^https?:\/\/chromewebstore\.google\.com\/detail\/[^/]+\/([a-z]{32})/,
  newStandardNoLabel: /^https?:\/\/chromewebstore\.google\.com\/detail\/([a-z]{32})/,
  // Legacy Chrome Web Store URL
  standard: /^https?:\/\/chrome\.google\.com\/webstore\/detail\/[^/]+\/([a-z]{32})/,
  // Without label (just ID)
  standardNoLabel: /^https?:\/\/chrome\.google\.com\/webstore\/detail\/([a-z]{32})/,
  // CRX download URL pattern
  directCrx: /^https?:\/\/clients2\.google\.com\/service\/update2\/crx\?id=([a-z]{32})/,
  // Just extension ID (32 lowercase letters)
  rawId: /^([a-z]{32})$/,
} as const;

/**
 * Extract extension ID from various Chrome Web Store URL formats
 * 
 * Supported formats:
 * - https://chrome.google.com/webstore/detail/extension-name/abcdef...
 * - https://chrome.google.com/webstore/detail/abcdef...
 * - https://clients2.google.com/service/update2/crx?id=abcdef...
 * - Raw 32-character extension ID
 *
 * @param input - URL or extension ID string
 * @returns Result object with success flag and either extensionId or error message
 */
export function extractExtensionId(input: string): ExtensionIdResult {
  if (!input || typeof input !== 'string') {
    return {
      success: false,
      error: 'Input must be a non-empty string',
    };
  }

  const trimmedInput = input.trim();

  // Try new Chrome Web Store URL with label
  const newStandardMatch = trimmedInput.match(URL_PATTERNS.newStandard);
  if (newStandardMatch) {
    return {
      success: true,
      extensionId: newStandardMatch[1],
    };
  }

  // Try new Chrome Web Store URL without label
  const newStandardNoLabelMatch = trimmedInput.match(URL_PATTERNS.newStandardNoLabel);
  if (newStandardNoLabelMatch) {
    return {
      success: true,
      extensionId: newStandardNoLabelMatch[1],
    };
  }

  // Try legacy standard URL with label
  const standardMatch = trimmedInput.match(URL_PATTERNS.standard);
  if (standardMatch) {
    return {
      success: true,
      extensionId: standardMatch[1],
    };
  }

  // Try legacy standard URL without label
  const standardNoLabelMatch = trimmedInput.match(URL_PATTERNS.standardNoLabel);
  if (standardNoLabelMatch) {
    return {
      success: true,
      extensionId: standardNoLabelMatch[1],
    };
  }

  // Try direct CRX download URL
  const directCrxMatch = trimmedInput.match(URL_PATTERNS.directCrx);
  if (directCrxMatch) {
    return {
      success: true,
      extensionId: directCrxMatch[1],
    };
  }

  // Try raw ID
  const rawIdMatch = trimmedInput.match(URL_PATTERNS.rawId);
  if (rawIdMatch) {
    return {
      success: true,
      extensionId: rawIdMatch[1],
    };
  }

  return {
    success: false,
    error: `Invalid extension ID or URL format: ${trimmedInput}`,
  };
}

/**
 * Validate that a string is a valid extension ID
 * 
 * @param id - String to validate
 * @returns True if valid extension ID format
 */
export function isValidExtensionId(id: unknown): id is string {
  if (typeof id !== 'string') {
    return false;
  }
  return /^[a-z]{32}$/.test(id);
}
