/**
 * Hash calculation using Web Crypto API
 */

export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';

export interface HashResult {
  algorithm: HashAlgorithm;
  hash: string;
  bytes: number;
}

/**
 * Calculate SHA-256 hash of data
 * @param data - Uint8Array to hash
 * @returns Hash result with algorithm, hash, and size
 */
export async function calculateSHA256(data: Uint8Array): Promise<HashResult> {
  return calculateHash(data, 'SHA-256');
}

/**
 * Calculate SHA-384 hash of data
 * @param data - Uint8Array to hash
 * @returns Hash result with algorithm, hash, and size
 */
export async function calculateSHA384(data: Uint8Array): Promise<HashResult> {
  return calculateHash(data, 'SHA-384');
}

/**
 * Calculate SHA-512 hash of data
 * @param data - Uint8Array to hash
 * @returns Hash result with algorithm, hash, and size
 */
export async function calculateSHA512(data: Uint8Array): Promise<HashResult> {
  return calculateHash(data, 'SHA-512');
}

/**
 * Calculate hash using Web Crypto API
 * @param data - Uint8Array to hash
 * @param algorithm - Hash algorithm to use
 * @returns Hash result
 */
export async function calculateHash(
  data: Uint8Array,
  algorithm: HashAlgorithm = 'SHA-256'
): Promise<HashResult> {
  try {
    const hashBuffer = await crypto.subtle.digest(algorithm, new Uint8Array(data));
    const hash = bufferToHex(hashBuffer);

    return {
      algorithm,
      hash,
      bytes: data.length,
    };
  } catch (error) {
    throw new Error(`Failed to calculate ${algorithm} hash: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert ArrayBuffer to hex string
 * @param buffer - ArrayBuffer to convert
 * @returns Hex string representation
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Format hash result as string
 * @param result - Hash result
 * @returns Formatted string
 */
export function formatHashResult(result: HashResult): string {
  return `${result.algorithm}: ${result.hash}`;
}

/**
 * Calculate multiple hashes at once
 * @param data - Uint8Array to hash
 * @param algorithms - Algorithms to use
 * @returns Array of hash results
 */
export async function calculateMultipleHashes(
  data: Uint8Array,
  algorithms: HashAlgorithm[] = ['SHA-256', 'SHA-384', 'SHA-512']
): Promise<HashResult[]> {
  return Promise.all(algorithms.map((algo) => calculateHash(data, algo)));
}

/**
 * Format file size in human-readable format
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
