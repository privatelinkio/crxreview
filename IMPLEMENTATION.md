# CRX Review - Core Implementation

This document describes the core CRX parsing and download functionality implemented for the CRX Review project.

## Architecture Overview

The implementation is organized into modular layers:

```
src/
├── lib/
│   ├── crx/              # CRX file handling
│   │   ├── url-patterns.ts
│   │   ├── download.ts
│   │   ├── parser.ts
│   │   ├── zip-converter.ts
│   │   └── index.ts
│   ├── zip/              # ZIP file handling
│   │   ├── extractor.ts
│   │   ├── file-tree.ts
│   │   └── index.ts
│   └── __tests__/        # Core library tests
├── store/
│   ├── viewerStore.ts    # Zustand state management
│   └── index.ts
├── types/
│   └── index.ts          # TypeScript type definitions
└── utils/
    ├── file-helpers.ts   # File utility functions
    └── index.ts
```

## Module Descriptions

### CRX Module (`src/lib/crx/`)

#### url-patterns.ts
Handles parsing and validation of Chrome Web Store URLs.

**Exports:**
- `extractExtensionId(input: string)` - Extracts extension ID from various URL formats
- `isValidExtensionId(id: unknown)` - Validates extension ID format

**Supported URL Formats:**
- `https://chrome.google.com/webstore/detail/[name]/[id]` - Standard format with label
- `https://chrome.google.com/webstore/detail/[id]` - Format without label
- `https://clients2.google.com/service/update2/crx?id=[id]` - Direct CRX download URL
- Raw 32-character extension ID

#### download.ts
Manages downloading CRX files from Chrome's update server.

**Exports:**
- `buildCrxDownloadUrl(extensionId: string)` - Constructs download URL
- `downloadCrx(extensionId: string)` - Downloads CRX file from Google's servers

**Details:**
- Uses the official Google CRX update server
- Sets proper User-Agent headers for compatibility
- Validates extension IDs before making requests
- Returns NetworkError result objects on failure

#### parser.ts
Parses CRX file format headers (both CRX2 and CRX3).

**Exports:**
- `parseCrxHeader(buffer: ArrayBuffer)` - Parses CRX header and locates ZIP data

**CRX Format Support:**
- **CRX2:** Magic "Cr24" + version + public key length + signature length + key + signature + ZIP
- **CRX3:** Magic "Cr24" + version + header length + header (protobuf) + ZIP

**Implementation Details:**
- Validates magic number (0x43 0x72 0x32 0x34 = "Cr24")
- Handles both little-endian integer formats
- Validates length fields for security
- Returns precise byte offset for ZIP data extraction

#### zip-converter.ts
Converts CRX files to ZIP format by stripping headers.

**Exports:**
- `crxToZip(crxBuffer: ArrayBuffer)` - Extracts ZIP data from CRX

**Process:**
1. Parse CRX header to find ZIP offset
2. Validate ZIP magic number (0x504B)
3. Extract ZIP data to new ArrayBuffer
4. Return result with ZIP data or error

### ZIP Module (`src/lib/zip/`)

#### extractor.ts
Wrapper around JSZip library for ZIP file extraction.

**Exports:**
- `extractZipEntries(zipData: ArrayBuffer)` - Get all entries in ZIP file
- `loadZipFile(zipData: ArrayBuffer, filePath: string)` - Load specific file from ZIP

**Features:**
- Async ZIP loading
- File metadata extraction (size, date, compression)
- Lazy loading for performance
- Full error handling

#### file-tree.ts
Builds hierarchical file tree from flat ZIP entry list.

**Exports:**
- `buildFileTree(entries: ZipFileEntry[])` - Create directory structure
- `getAllFiles(node: FileTreeNode)` - Get flat list of all files
- `findNodeByPath(node: FileTreeNode, path: string)` - Locate node in tree

**Features:**
- Recursive directory structure
- Alphabetical sorting (directories before files)
- Path-based navigation
- Tree traversal utilities

### Store Module (`src/store/`)

#### viewerStore.ts
Zustand store managing application state.

**State Interface:**
```typescript
interface ViewerState {
  loadingState: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
  crx: LoadedCrx | null
  selectedFilePath: string | null
  fileFilter: string

  loadCrx(extensionId: string, crxData: ArrayBuffer): Promise<void>
  loadCrxFromUrl(input: string): Promise<void>
  selectFile(path: string): void
  setFileFilter(filter: string): void
  clearError(): void
  reset(): void
}
```

**Actions:**
- `loadCrx` - Load CRX data that has already been fetched
- `loadCrxFromUrl` - Download and load CRX from URL or extension ID
- `selectFile` - Change currently selected file
- `setFileFilter` - Update file search filter
- `clearError` - Clear error message
- `reset` - Reset store to initial state

### Type Definitions (`src/types/`)

Core TypeScript interfaces:

- `LoadedCrx` - Represents loaded CRX with all metadata
- `LoadingState` - Type-safe loading state enum
- `ViewerState` - Complete application state interface

### Utilities (`src/utils/`)

Helper functions for file operations:

- `getFileExtension(filePath: string)` - Extract file extension
- `getFileName(filePath: string)` - Get filename from path
- `getDirectoryPath(filePath: string)` - Get directory portion of path
- `formatFileSize(bytes: number)` - Human-readable file size
- `isTextFile(fileName: string)` - Detect text-based files
- `isManifestFile(fileName: string)` - Identify manifest files
- `filterFiles(files: string[], filter: string)` - Search files

## Error Handling

All operations use result objects instead of throwing exceptions:

```typescript
interface Success {
  success: true
  data: T
}

interface Error {
  success: false
  error: string
}

type Result = Success | Error
```

This approach provides:
- Type-safe error handling
- Graceful degradation
- Clear error messages
- No unexpected exceptions

## TypeScript Configuration

Strict mode is enabled with:
- `strict: true` - All strict type checks
- `noUnusedLocals: true` - Unused variable detection
- `noUnusedParameters: true` - Unused parameter detection
- `noImplicitReturns: true` - All code paths must return
- `noFallthroughCasesInSwitch: true` - Switch fall-through prevention

## Testing

Test files are located in `src/lib/__tests__/`:
- `url-patterns.test.ts` - URL extraction and validation tests
- `parser.test.ts` - CRX header parsing tests

Tests verify:
- URL format recognition
- Extension ID validation
- CRX2 and CRX3 format handling
- Error handling and validation
- Edge cases and invalid inputs

## Integration Example

```typescript
import { useViewerStore } from '@/store'
import { extractExtensionId } from '@/lib/crx'

async function loadExtension(input: string) {
  const store = useViewerStore()

  // Option 1: Download from URL or extension ID
  await store.loadCrxFromUrl(input)

  // Option 2: Load pre-downloaded CRX data
  const idResult = extractExtensionId(input)
  if (idResult.success) {
    const crxData = await fetch(...).then(r => r.arrayBuffer())
    await store.loadCrx(idResult.extensionId, crxData)
  }
}
```

## Security Considerations

1. **URL Validation:** All inputs are validated before processing
2. **Format Validation:** CRX magic numbers and versions are verified
3. **Buffer Bounds:** All buffer access is bounds-checked
4. **Header Validation:** Length fields are validated against actual buffer size
5. **No Execution:** ZIP contents are never automatically executed
6. **Isolation:** Each CRX is loaded independently with no cross-contamination

## Performance Optimizations

1. **Lazy Loading:** File contents not loaded until requested
2. **Result Objects:** Avoid exception overhead
3. **Efficient Parsing:** Single-pass header parsing
4. **Tree Building:** Optimized directory structure creation
5. **Memory Management:** Proper ArrayBuffer slicing for ZIP extraction

## Future Enhancements

- Cache parsed CRX data in IndexedDB
- Streaming download for large CRX files
- Parallel file extraction
- Code analysis and security scanning
- Extension manifest parsing
- Dependency graph generation
- Malware detection integration
