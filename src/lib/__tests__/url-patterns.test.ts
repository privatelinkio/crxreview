/**
 * Tests for URL pattern matching
 */

import { extractExtensionId, isValidExtensionId } from '../crx/url-patterns';

describe('URL Pattern Matching', () => {
  describe('extractExtensionId', () => {
    it('should extract ID from standard Chrome Web Store URL', () => {
      const input = 'https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcpwyalccd4h';
      const result = extractExtensionId(input);

      if (!result.success) {
        throw new Error(result.error);
      }

      expect(result.extensionId).toBe('cjpalhdlnbpafiamejdnhcpwyalccd4h');
    });

    it('should extract ID from URL without label', () => {
      const input = 'https://chrome.google.com/webstore/detail/cjpalhdlnbpafiamejdnhcpwyalccd4h';
      const result = extractExtensionId(input);

      if (!result.success) {
        throw new Error(result.error);
      }

      expect(result.extensionId).toBe('cjpalhdlnbpafiamejdnhcpwyalccd4h');
    });

    it('should extract ID from raw extension ID', () => {
      const input = 'cjpalhdlnbpafiamejdnhcpwyalccd4h';
      const result = extractExtensionId(input);

      if (!result.success) {
        throw new Error(result.error);
      }

      expect(result.extensionId).toBe('cjpalhdlnbpafiamejdnhcpwyalccd4h');
    });

    it('should reject invalid extension IDs', () => {
      const input = 'invalid-id';
      const result = extractExtensionId(input);

      expect(result.success).toBe(false);
    });

    it('should reject empty input', () => {
      const result = extractExtensionId('');
      expect(result.success).toBe(false);
    });
  });

  describe('isValidExtensionId', () => {
    it('should validate correct extension ID format', () => {
      const id = 'cjpalhdlnbpafiamejdnhcpwyalccd4h';
      expect(isValidExtensionId(id)).toBe(true);
    });

    it('should reject ID with uppercase letters', () => {
      const id = 'CJPALHDLNBPAFIAMEJDNHCPWYALCCD4H';
      expect(isValidExtensionId(id)).toBe(false);
    });

    it('should reject non-string input', () => {
      expect(isValidExtensionId(123)).toBe(false);
      expect(isValidExtensionId(null)).toBe(false);
      expect(isValidExtensionId(undefined)).toBe(false);
    });

    it('should reject ID with wrong length', () => {
      const id = 'toolong' + 'cjpalhdlnbpafiamejdnhcpwyalccd4h';
      expect(isValidExtensionId(id)).toBe(false);
    });
  });
});
