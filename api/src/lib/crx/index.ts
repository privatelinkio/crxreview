/**
 * CRX parsing and download libraries
 * Exported for use throughout the API
 */

export { CRXParser, type Manifest, type ManifestV2, type ManifestV3, type CRXMetadataExtracted } from './parser';
export { downloadCrx, buildCrxDownloadUrl } from './download';
export { crxToZip, type ConversionResult } from './zip-converter';
export { extractExtensionId, isValidExtensionId, type ExtensionIdResult } from './url-patterns';
export { parseCrxHeader, type ParsedCrxHeader } from './header-parser';
