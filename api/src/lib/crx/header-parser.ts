/**
 * CRX file format parser
 *
 * CRX (Chrome Extension) file format:
 * - CRX2: Magic number "Cr24" + version (4 bytes) + key length (4 bytes) + signature length (4 bytes) + public key + signature + ZIP
 * - CRX3: Magic number "Cr24" + version (4 bytes) + header length (4 bytes) + header + ZIP
 */

const CRX2_VERSION = 2;
const CRX3_VERSION = 3;

export interface ParsedCrxHeader {
  version: number;
  zipOffset: number;
}

export interface ParseError {
  success: false;
  error: string;
}

export interface ParseSuccess {
  success: true;
  header: ParsedCrxHeader;
}

export type ParseResult = ParseSuccess | ParseError;

/**
 * Parse CRX file header and calculate ZIP data offset
 *
 * Validates the magic number "Cr24" and handles both CRX2 and CRX3 formats.
 * Returns the byte offset where the ZIP data begins.
 *
 * @param buffer - ArrayBuffer containing CRX file data
 * @returns Result object with success flag and either header info or error message
 * @throws Never throws; all errors are returned in result object
 */
export function parseCrxHeader(buffer: ArrayBuffer): ParseResult {
  try {
    // Check minimum buffer size (4 bytes magic + 4 bytes version)
    if (buffer.byteLength < 8) {
      return {
        success: false,
        error: 'Buffer too small: minimum 8 bytes required',
      };
    }

    const view = new DataView(buffer);
    const data = new Uint8Array(buffer);

    // Check magic number "Cr24"
    if (data[0] !== 0x43 || data[1] !== 0x72 || data[2] !== 0x32 || data[3] !== 0x34) {
      return {
        success: false,
        error: 'Invalid magic number: expected "Cr24"',
      };
    }

    // Read version (little-endian)
    const version = view.getUint32(4, true);

    if (version === CRX2_VERSION) {
      return parseCrx2Header(view);
    } else if (version === CRX3_VERSION) {
      return parseCrx3Header(view);
    } else {
      return {
        success: false,
        error: `Unsupported CRX version: ${version}`,
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to parse CRX header: ${message}`,
    };
  }
}

/**
 * Parse CRX2 header format
 *
 * CRX2 structure:
 * Offset 0-3:   Magic number "Cr24"
 * Offset 4-7:   Version (2)
 * Offset 8-11:  Public key length (little-endian)
 * Offset 12-15: Signature length (little-endian)
 * Offset 16+:   Public key + Signature + ZIP data
 */
function parseCrx2Header(view: DataView): ParseResult {
  try {
    // Check minimum size for CRX2
    if (view.byteLength < 16) {
      return {
        success: false,
        error: 'CRX2: Buffer too small, minimum 16 bytes required',
      };
    }

    const publicKeyLength = view.getUint32(8, true);
    const signatureLength = view.getUint32(12, true);

    // Validate lengths are reasonable
    if (publicKeyLength === 0 || publicKeyLength > 16384) {
      return {
        success: false,
        error: `CRX2: Invalid public key length: ${publicKeyLength}`,
      };
    }

    if (signatureLength === 0 || signatureLength > 16384) {
      return {
        success: false,
        error: `CRX2: Invalid signature length: ${signatureLength}`,
      };
    }

    // ZIP data starts after the header, public key, and signature
    const zipOffset = 16 + publicKeyLength + signatureLength;

    if (zipOffset >= view.byteLength) {
      return {
        success: false,
        error: 'CRX2: Invalid lengths, ZIP data not found',
      };
    }

    return {
      success: true,
      header: {
        version: CRX2_VERSION,
        zipOffset,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `CRX2 parse error: ${message}`,
    };
  }
}

/**
 * Parse CRX3 header format
 *
 * CRX3 structure:
 * Offset 0-3:   Magic number "Cr24"
 * Offset 4-7:   Version (3)
 * Offset 8-11:  Header length (little-endian)
 * Offset 12+:   Header (protobuf format) + ZIP data
 */
function parseCrx3Header(view: DataView): ParseResult {
  try {
    // Check minimum size for CRX3
    if (view.byteLength < 12) {
      return {
        success: false,
        error: 'CRX3: Buffer too small, minimum 12 bytes required',
      };
    }

    const headerLength = view.getUint32(8, true);

    // Validate header length is reasonable
    if (headerLength === 0 || headerLength > 1048576) {
      return {
        success: false,
        error: `CRX3: Invalid header length: ${headerLength}`,
      };
    }

    // ZIP data starts after the header length field and the header itself
    const zipOffset = 12 + headerLength;

    if (zipOffset >= view.byteLength) {
      return {
        success: false,
        error: 'CRX3: Invalid header length, ZIP data not found',
      };
    }

    return {
      success: true,
      header: {
        version: CRX3_VERSION,
        zipOffset,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `CRX3 parse error: ${message}`,
    };
  }
}
