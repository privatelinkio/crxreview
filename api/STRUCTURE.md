# API Project Structure

Complete Cloudflare Workers REST API structure for CRX Review

## Directory Tree

```
api/
├── src/
│   ├── handlers/                    # Route handlers (to be implemented)
│   ├── services/
│   │   ├── storage.ts              # R2 storage service
│   │   ├── session.ts              # KV session management
│   │   └── cache.ts                # KV cache service
│   ├── middleware/
│   │   ├── cors.ts                 # CORS configuration
│   │   ├── errorHandler.ts         # Error handling
│   │   └── rateLimiter.ts          # Rate limiting
│   ├── lib/
│   │   ├── crx/
│   │   │   └── parser.ts           # CRX file parsing
│   │   ├── zip/                    # ZIP extraction (to be implemented)
│   │   └── search/                 # Search implementation (to be implemented)
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   ├── utils/
│   │   ├── errors.ts               # Error handling utilities
│   │   ├── helpers.ts              # General helpers
│   │   ├── logger.ts               # Logging utility
│   │   └── validators.ts           # Input validation
│   └── index.ts                    # Main Worker entry point
├── openapi/
│   └── openapi.yaml                # OpenAPI 3.0 specification
├── package.json                    # Dependencies
├── wrangler.toml                   # Cloudflare Workers config
├── tsconfig.json                   # TypeScript config
├── vitest.config.ts                # Vitest configuration
├── .eslintrc.json                  # ESLint configuration
├── .prettierrc.json                # Prettier configuration
├── .gitignore                      # Git ignore rules
├── README.md                       # Project documentation
└── STRUCTURE.md                    # This file
```

## File Descriptions

### Configuration Files

#### `package.json`
- Project metadata and scripts
- Dependencies: hono, jszip, zod, fast-xml-parser
- Dev dependencies: TypeScript, Wrangler, Vitest, ESLint
- Scripts: dev, deploy, test, build, lint, format, type-check

#### `wrangler.toml`
- Cloudflare Workers configuration
- KV namespace bindings (SESSIONS, CACHE)
- R2 bucket binding (CRX_STORAGE)
- Environment variables (SESSION_TTL, MAX_FILE_SIZE, RATE_LIMIT_DOWNLOAD)
- Production and preview environments
- Build configuration and triggers

#### `tsconfig.json`
- TypeScript strict mode enabled
- ES2022 target
- Node.js and Cloudflare Workers types
- Module resolution: bundler

#### `vitest.config.ts`
- Test framework configuration
- Coverage settings (80% target)
- Node environment

#### `.eslintrc.json`
- TypeScript ESLint rules
- Recommended + strict settings
- Custom rules for type safety

#### `.prettierrc.json`
- Code formatting configuration
- Single quotes, 100 char width, 2 space tabs

#### `.gitignore`
- Node modules, build output, environment files
- IDE and OS files
- Cache and temporary files

### Source Code

#### `src/index.ts`
Main Worker entry point
- Hono app initialization
- Middleware setup (CORS, logger, JSON parsing)
- Error handling and 404 handler
- Health check endpoint
- Root path documentation

#### `src/types/index.ts`
TypeScript type definitions
- ApiResponse, PaginatedResponse
- CRXMetadata, CRXAnalysis
- Session, RateLimitInfo
- SearchResult, SearchFilter
- Worker environment (Env) bindings
- Error response types
- Handler and Middleware types

#### `src/utils/errors.ts`
Error handling utilities
- ApiError class with status codes
- Error factory functions (badRequest, unauthorized, etc.)
- Standardized error response format
- Validation error creation

#### `src/utils/helpers.ts`
General utility functions
- Response creation helpers (successResponse, paginatedResponse)
- ID generators (requestId, sessionId)
- Query parameter parsing
- Pagination utilities
- File size formatting
- Rate limit header creation
- Retry logic with exponential backoff
- Filename sanitization

#### `src/utils/logger.ts`
Logging utility
- Logger class with levels (DEBUG, INFO, WARN, ERROR)
- Context tracking
- Formatted log output
- Global logger instance
- Convenience functions

#### `src/utils/validators.ts`
Input validation using Zod
- Validation schemas (email, UUID, pagination, etc.)
- Safe JSON parsing
- Form data validation
- Query parameter validation
- CRX file validation
- Extension ID and manifest version validation
- Permission validation

#### `src/services/storage.ts`
R2 storage service
- File upload/download operations
- File deletion
- Metadata retrieval
- File listing with prefix
- File existence checks

#### `src/services/session.ts`
KV session management
- Session creation with TTL
- Session retrieval and validation
- Session data updates
- Session deletion
- Session value get/set operations
- Session expiration extension
- Session cleanup (admin operation)

#### `src/services/cache.ts`
KV cache service
- Cache get/set operations
- Cache deletion
- Get-or-set pattern
- Cache existence checks
- Bulk cache invalidation
- Cache clearing
- Default TTL configuration

#### `src/middleware/cors.ts`
CORS configuration
- Origin whitelist for dev/prod
- Allowed methods and headers
- Exposed headers for rate limiting
- Security headers middleware
- CSP, X-Frame-Options, HSTS, etc.

#### `src/middleware/errorHandler.ts`
Error handling middleware
- ApiError handling
- Zod validation error handling
- TypeError handling
- RangeError handling (payload too large)
- Generic error handler
- Not found handler

#### `src/middleware/rateLimiter.ts`
Rate limiting middleware
- Configurable rate limit windows
- Per-endpoint configurations (download, upload, search)
- IP-based rate limiting
- Rate limit header generation
- Admin reset operations
- Status querying

#### `src/lib/crx/parser.ts`
CRX file parsing
- CRX format extraction
- ZIP content parsing
- Manifest extraction (V2/V3)
- Permission extraction
- Metadata generation
- File listing from archive
- Format validation

### Documentation

#### `README.md`
Complete API documentation
- Project overview and features
- Installation and setup
- Development workflow
- API endpoints reference
- Configuration guide
- Error handling information
- Rate limiting details
- Logging and monitoring
- Testing instructions
- Troubleshooting section

#### `STRUCTURE.md` (this file)
Project structure documentation
- Directory tree
- File descriptions
- Component responsibilities
- Implementation status

### OpenAPI Specification

#### `openapi/openapi.yaml`
Complete OpenAPI 3.0 specification
- All API endpoints documented
- Request/response schemas
- Error responses
- Rate limiting headers
- CRX upload/download operations
- Search functionality
- Session management
- Cache invalidation

## Implementation Status

### Completed
- Project structure and directories
- Configuration files (package.json, wrangler.toml, tsconfig.json)
- TypeScript type definitions
- Utility modules (errors, helpers, validators, logger)
- Service classes (storage, session, cache)
- Middleware (CORS, error handling, rate limiting)
- CRX parser library
- Main Worker entry point (index.ts)
- OpenAPI specification
- Documentation

### To Be Implemented
- Handlers for all 11 API endpoints
- ZIP extraction library
- Search implementation
- Router setup with all routes
- Integration testing
- E2E tests
- Example .env configuration

## Key Technologies

- **Hono**: Fast web framework
- **Zod**: TypeScript-first validation
- **JSZip**: ZIP file handling
- **fast-xml-parser**: XML parsing
- **Wrangler**: Cloudflare Workers CLI
- **Vitest**: Unit testing
- **TypeScript**: Type safety

## Next Steps

1. **Implement Handlers** (src/handlers/)
   - uploadCRX
   - getCRXMetadata
   - downloadCRX
   - getCRXAnalysis
   - searchCRX
   - createSession
   - getSession
   - deleteSession
   - invalidateCache

2. **Set Up Router** (src/router.ts or update index.ts)
   - Mount all handlers
   - Apply route-specific middleware

3. **Implement Search** (src/lib/search/)
   - Full-text search logic
   - Filtering and sorting

4. **Add Tests** (src/**/*.test.ts)
   - Unit tests for services
   - Handler tests
   - Integration tests

5. **Deploy**
   - Configure Cloudflare credentials
   - Set up KV namespaces
   - Set up R2 bucket
   - Deploy with `npm run deploy`

## Development Workflow

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Check types
npm run type-check

# Format code
npm run format

# Lint code
npm run lint

# Build for production
npm run build

# Deploy to Cloudflare Workers
npm run deploy
```

## Environment Setup

Create `.env.local` with:

```
SESSION_TTL=1800
MAX_FILE_SIZE=52428800
RATE_LIMIT_DOWNLOAD=10
ENVIRONMENT=development
```

## Additional Notes

- All TypeScript files use strict mode
- ESLint enforces code quality
- Prettier enforces code formatting
- Vitest for unit and integration testing
- OpenAPI spec for API documentation
- Rate limiting per IP address
- KV-based session and cache storage
- R2-based file storage
