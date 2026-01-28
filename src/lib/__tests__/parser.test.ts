/**
 * Tests for CRX header parsing
 */

import { parseCrxHeader } from '../crx/parser';

describe('CRX Parser', () => {
  describe('parseCrxHeader', () => {
    it('should reject buffer without magic number', () => {
      const buffer = new ArrayBuffer(8);
      const result = parseCrxHeader(buffer);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('magic number');
      }
    });

    it('should reject buffer that is too small', () => {
      const buffer = new ArrayBuffer(4);
      const result = parseCrxHeader(buffer);

      expect(result.success).toBe(false);
    });

    it('should create valid CRX2 header', () => {
      // Create a minimal valid CRX2 file
      const buffer = new ArrayBuffer(100);
      const view = new DataView(buffer);
      const data = new Uint8Array(buffer);

      // Magic number "Cr24"
      data[0] = 0x43;
      data[1] = 0x72;
      data[2] = 0x32;
      data[3] = 0x34;

      // Version 2 (little-endian)
      view.setUint32(4, 2, true);

      // Public key length (32 bytes)
      view.setUint32(8, 32, true);

      // Signature length (128 bytes)
      view.setUint32(12, 128, true);

      const result = parseCrxHeader(buffer);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.header.version).toBe(2);
        expect(result.header.zipOffset).toBe(16 + 32 + 128);
      }
    });

    it('should create valid CRX3 header', () => {
      // Create a minimal valid CRX3 file
      const buffer = new ArrayBuffer(100);
      const view = new DataView(buffer);
      const data = new Uint8Array(buffer);

      // Magic number "Cr24"
      data[0] = 0x43;
      data[1] = 0x72;
      data[2] = 0x32;
      data[3] = 0x34;

      // Version 3 (little-endian)
      view.setUint32(4, 3, true);

      // Header length (50 bytes)
      view.setUint32(8, 50, true);

      const result = parseCrxHeader(buffer);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.header.version).toBe(3);
        expect(result.header.zipOffset).toBe(12 + 50);
      }
    });

    it('should reject invalid version', () => {
      const buffer = new ArrayBuffer(20);
      const view = new DataView(buffer);
      const data = new Uint8Array(buffer);

      // Magic number "Cr24"
      data[0] = 0x43;
      data[1] = 0x72;
      data[2] = 0x32;
      data[3] = 0x34;

      // Version 99 (invalid)
      view.setUint32(4, 99, true);

      const result = parseCrxHeader(buffer);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('version');
      }
    });

    it('should reject CRX2 with invalid public key length', () => {
      const buffer = new ArrayBuffer(20);
      const view = new DataView(buffer);
      const data = new Uint8Array(buffer);

      // Magic number
      data[0] = 0x43;
      data[1] = 0x72;
      data[2] = 0x32;
      data[3] = 0x34;

      // Version 2
      view.setUint32(4, 2, true);

      // Public key length (invalid - 0)
      view.setUint32(8, 0, true);

      const result = parseCrxHeader(buffer);

      expect(result.success).toBe(false);
    });

    it('should reject CRX3 with invalid header length', () => {
      const buffer = new ArrayBuffer(20);
      const view = new DataView(buffer);
      const data = new Uint8Array(buffer);

      // Magic number
      data[0] = 0x43;
      data[1] = 0x72;
      data[2] = 0x32;
      data[3] = 0x34;

      // Version 3
      view.setUint32(4, 3, true);

      // Header length (invalid - exceeds buffer)
      view.setUint32(8, 1000, true);

      const result = parseCrxHeader(buffer);

      expect(result.success).toBe(false);
    });
  });
});
