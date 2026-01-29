import type { Context } from 'hono';

/**
 * API Response wrapper type
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  path?: string;
  statusCode?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * CRX file metadata
 */
export interface CRXMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  permissions: string[];
  manifest_version: number;
  icons?: Record<string, string>;
  homepage_url?: string;
  update_url?: string;
  content_security_policy?: string;
  storage: {
    path: string;
    size: number;
    uploadedAt: string;
    expiresAt: string;
  };
}

/**
 * Session data
 */
export interface Session {
  id: string;
  userId?: string;
  email?: string;
  createdAt: number;
  expiresAt: number;
  data: Record<string, any>;
}

/**
 * Rate limit info
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Error response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  components: {
    kv: boolean;
    r2: boolean;
    database?: boolean;
  };
}

/**
 * CRX Upload request
 */
export interface CRXUploadRequest {
  crxData: ArrayBuffer;
  sessionId?: string;
}

/**
 * CRX Download response
 */
export interface CRXDownloadResponse {
  metadata: CRXMetadata;
  downloadUrl: string;
}

/**
 * Search filter
 */
export interface SearchFilter {
  query?: string;
  category?: string;
  rating?: number;
  sortBy?: 'relevance' | 'date' | 'popularity';
  page?: number;
  limit?: number;
}

/**
 * Search result
 */
export interface SearchResult {
  id: string;
  name: string;
  description: string;
  rating: number;
  downloads: number;
  lastUpdated: string;
  relevanceScore: number;
}

/**
 * Worker environment bindings
 */
export interface Env {
  SESSIONS: KVNamespace;
  CACHE: KVNamespace;
  CRX_STORAGE: R2Bucket;
  SESSION_TTL: string;
  MAX_FILE_SIZE: string;
  RATE_LIMIT_DOWNLOAD: string;
  API_VERSION: string;
  ENVIRONMENT?: string;
  ALLOWED_ORIGINS?: string;
  API_KEY?: string;
  API_KEY_1?: string;
  API_KEY_2?: string;
  API_KEY_3?: string;
  API_KEY_4?: string;
  API_KEY_5?: string;
  API_KEY_6?: string;
  API_KEY_7?: string;
  API_KEY_8?: string;
  API_KEY_9?: string;
  API_KEY_10?: string;
  [key: string]: any; // Allow additional environment variables
}

/**
 * Hono context with environment
 */
export type AppContext = Context<{
  Bindings: Env;
  Variables: {
    sessionId?: string;
    user?: any;
    requestId?: string;
  };
}>;

/**
 * Handler type
 */
export type Handler = (c: AppContext) => Promise<Response>;

/**
 * Middleware type
 */
export type Middleware = (
  c: AppContext,
  next: () => Promise<void>
) => Promise<void>;

/**
 * CRX Analysis result
 */
export interface CRXAnalysis {
  id: string;
  name: string;
  version: string;
  manifestVersion: number;
  permissions: {
    count: number;
    items: string[];
    risky: string[];
  };
  contentSecurityPolicy?: string;
  size: number;
  fileCount: number;
  analysisDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  issues: AnalysisIssue[];
}

/**
 * Analysis issue
 */
export interface AnalysisIssue {
  type: 'warning' | 'error' | 'info';
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  file?: string;
  line?: number;
}

/**
 * Storage object metadata
 */
export interface StorageObject {
  key: string;
  size: number;
  uploadedAt: string;
  contentType: string;
  etag: string;
  expirationTtl?: number;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
}

/**
 * File category types
 */
export type FileCategory =
  | 'code'
  | 'config'
  | 'resource'
  | 'documentation'
  | 'asset'
  | 'other';

/**
 * File node in tree structure
 */
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  category?: FileCategory;
  children?: FileNode[];
}

/**
 * File tree with metadata
 */
export interface FileTree {
  root: FileNode;
  totalFiles: number;
  totalSize: number;
}

/**
 * API Request Types
 */

/**
 * Upload request for CRX files
 */
export interface UploadRequest {
  file: File | ArrayBuffer;
}

/**
 * Download request - accepts extension ID or Chrome Web Store URL
 */
export interface DownloadRequest {
  input: string;
}

/**
 * Content search request with advanced options
 */
export interface SearchRequest {
  query: string;
  caseSensitive?: boolean;
  useRegex?: boolean;
  wholeWord?: boolean;
  contextLines?: number;
  filePattern?: string;
  maxResults?: number;
}

/**
 * File filtering request
 */
export interface FilterRequest {
  namePattern?: string;
  useRegex?: boolean;
  categories?: FileCategory[];
  caseSensitive?: boolean;
  minSize?: number;
  maxSize?: number;
}

/**
 * API Response Types
 */

/**
 * Extension session response
 */
export interface ExtensionSessionResponse {
  sessionId: string;
  extensionId: string;
  fileName: string;
  fileCount: number;
  size: number;
  createdAt: string;
  expiresAt: string;
  version?: string;
}

/**
 * Manifest extraction response
 */
export interface ManifestResponse {
  manifest: Record<string, any>;
  manifestVersion: number;
  permissions: string[];
  hostPermissions?: string[];
}

/**
 * File tree response
 */
export interface FileTreeResponse {
  type: 'tree' | 'flat';
  root: FileNode;
  totalFiles: number;
  totalSize: number;
}

/**
 * Single file extraction response
 */
export interface FileExtractionResponse {
  path: string;
  content: string;
  mimeType: string;
  size: number;
  encoding: 'utf-8' | 'base64';
}

/**
 * Search result match
 */
export interface SearchMatch {
  file: string;
  line: number;
  column: number;
  match: string;
  context: {
    before: string[];
    after: string[];
  };
}

/**
 * Search results response
 */
export interface SearchResultResponse {
  results: SearchMatch[];
  totalMatches: number;
  searchedFiles: number;
  hasMore: boolean;
  nextOffset?: number;
}

/**
 * Filter results response
 */
export interface FilterResultResponse {
  files: FileNode[];
  totalMatched: number;
}

/**
 * Health check response (enhanced)
 */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  services: {
    r2: 'ok' | 'error';
    kv: 'ok' | 'error';
  };
}
