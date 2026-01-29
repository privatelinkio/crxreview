/**
 * Services Index
 *
 * Central export point for all service modules
 */

// Storage Service
export {
  putFile,
  getFile,
  deleteFile,
  listFiles,
  fileExists,
  getFileMetadata,
  generateCRXKey,
  generateZIPKey,
  deleteSessionFiles,
  StorageError,
  StorageTimeoutError,
  StorageNotFoundError,
  type FileMetadata,
} from './storage.service';

// Session Service
export {
  createSession,
  getSession,
  updateSession,
  deleteSession,
  listSessions,
  extendSessionTTL,
  getSessionExpiry,
  sessionExists,
  DEFAULT_SESSION_TTL,
  SessionError,
  SessionTimeoutError,
  SessionNotFoundError,
  type SessionMetadata,
} from './session.service';

// CRX Service
export {
  parseCRX,
  extractFileTree,
  extractManifest,
  extractFile,
  searchContent,
  filterFiles,
  CRXError,
  CRXParseError,
  CRXExtractionError,
  type ParsedCRX,
  type FileTree,
  type SearchResult,
  type FilterOptions,
  type ExtractedFile,
} from './crx.service';

// Cleanup Service
export {
  cleanupExpiredSessions,
  cleanupSession,
  cleanupOrphanedFiles,
  getCleanupRecommendations,
  CleanupError,
  type CleanupStats,
} from './cleanup.service';
