# CRX Review - Architecture Documentation

## System Overview

CRX Review is a web-based Chrome Extension (CRX) file analyzer built with React, TypeScript, and Vite. The application provides a responsive, client-side interface for parsing, exploring, and analyzing the contents of CRX files without requiring external services or network requests.

### Core Design Principles

1. **Privacy First**: All processing happens in the browser; no data is sent to external servers
2. **Zero Dependencies**: Complex functionality is implemented using native APIs and established libraries only
3. **Performance**: Lazy loading, code splitting, and worker threads for heavy operations
4. **Maintainability**: Clear separation of concerns with modular architecture

## Component Hierarchy

```
App (Root)
├── Router Setup
│   ├── LandingPage
│   │   └── File Upload Interface
│   └── ViewerPage
│       ├── TopBar
│       │   ├── File Info Display
│       │   └── Download Controls
│       ├── FileTree (Sidebar)
│       │   ├── File Hierarchy Navigation
│       │   └── Folder Expansion
│       ├── SearchAndFilterPanel
│       │   ├── ContentSearch
│       │   └── FileFilter
│       ├── CodeViewer (Main Content)
│       │   ├── Code Display
│       │   ├── SourceToolbar
│       │   ├── Syntax Highlighting
│       │   └── Image Preview
│       └── PanelResizer
│           └── Dynamic Layout Control
├── ErrorBoundary
│   └── Error Recovery UI
└── Store Providers (Zustand)
    ├── ViewerStore
    └── SearchStore
```

## Data Flow Architecture

### Loading Flow

```
User Upload CRX File
    ↓
HTML5 FileInput Element
    ↓
useCrxLoader Hook
    ↓
CRX Parser (crx/parser.ts)
    │
    ├→ Extract Header (16 bytes)
    ├→ Validate Signature
    ├→ Parse Public Key & Signature
    └→ Extract ZIP Content
    ↓
ZIP Converter (crx/zip-converter.ts)
    ├→ Convert CRX to Standard ZIP
    └→ Pass to JSZip
    ↓
JSZip Processing
    ├→ Extract File Tree
    ├→ Build File Hierarchy
    └→ Cache Binary Content
    ↓
ViewerStore Update
    ├→ Save LoadedCrx State
    ├→ Set Extension ID
    └→ Populate File Cache
    ↓
UI Render
    └→ Display File Tree & Content
```

### File Selection & Preview Flow

```
User Clicks File in Tree
    ↓
FileTree Component
    ↓
selectFile Action (ViewerStore)
    ↓
CodeViewer Component
    ├→ Retrieve File from Cache
    ├→ Detect File Type
    │   ├→ Binary Files → ImagePreview
    │   ├→ Code Files → Syntax Highlight
    │   └→ Unknown → Raw Display
    └→ Render Content
```

### Search & Filter Flow

```
User Enters Search Query
    ↓
ContentSearch Component
    ↓
useContentSearch Hook
    ├→ Debounce Input (300ms)
    └→ Trigger Search
    ↓
Search Worker (search.worker.ts)
    ├→ Parse Query
    ├→ Build Regex Pattern
    ├→ Search File Contents
    ├→ Match File Names
    ├→ Highlight Results
    └→ Return Results
    ↓
SearchStore Update
    └→ Cache Results
    ↓
FileTree Re-render
    └→ Display Filtered Results
```

## Module Organization

### `/src/lib` - Core Libraries

**Purpose**: Reusable, framework-independent utilities

```
lib/
├── crx/                    # CRX File Handling
│   ├── parser.ts          # CRX format parsing and validation
│   ├── zip-converter.ts   # Convert CRX to standard ZIP
│   ├── url-patterns.ts    # URL parsing and validation
│   ├── download.ts        # File download utilities
│   └── index.ts           # Public exports
│
├── zip/                    # ZIP Archive Processing
│   ├── extractor.ts       # Extract files from ZIP
│   ├── file-tree.ts       # Build file hierarchy
│   └── index.ts           # Public exports
│
├── search/                 # Content Search Engine
│   ├── content-search.ts  # Search implementation
│   ├── file-filter.ts     # File filtering logic
│   ├── search.worker.ts   # Web Worker for search
│   └── index.ts           # Public exports
│
├── code/                   # Code Processing
│   ├── language-detector.ts # Detect file language
│   ├── highlighter.ts     # Syntax highlighting
│   ├── beautifier.ts      # Code formatting
│   └── index.ts           # Public exports
│
├── utils/                  # Utilities
│   ├── hash.ts            # Hash generation
│   ├── download-helper.ts # Download functionality
│   └── index.ts           # Public exports
│
└── __tests__/             # Unit Tests
    ├── parser.test.ts
    ├── url-patterns.test.ts
    └── jest.d.ts
```

### `/src/components` - React Components

**Purpose**: UI rendering and user interaction

```
components/
├── viewer/                 # Viewer Components
│   ├── TopBar.tsx         # Header with file info
│   ├── FileTree.tsx       # File tree navigation
│   ├── CodeViewer.tsx     # Main content display
│   ├── SourceToolbar.tsx  # Code action buttons
│   ├── SearchAndFilterPanel.tsx  # Search UI
│   ├── ContentSearch.tsx  # Search input
│   ├── FileFilter.tsx     # Filter controls
│   ├── ImagePreview.tsx   # Image display
│   ├── PanelResizer.tsx   # Resizable panels
│   └── index.ts           # Public exports
│
└── ErrorBoundary.tsx      # Error handling component
```

**Component Responsibilities**:
- Handle user input and events
- Manage local component state
- Subscribe to global Zustand stores
- Render UI with Tailwind CSS
- Delegate complex logic to hooks and libraries

### `/src/hooks` - Custom Hooks

**Purpose**: Logic composition and state management bridges

```
hooks/
├── useCrxLoader.ts        # CRX loading orchestration
├── useFileSelection.ts    # File selection logic
├── useFileFilter.ts       # File filtering with debounce
├── useContentSearch.ts    # Content search with debounce
└── useUrlState.ts         # URL parameter synchronization
```

**Hook Patterns**:
- Manage side effects with useEffect
- Bridge between components and stores
- Handle async operations and loading states
- Provide debouncing for expensive operations

### `/src/store` - State Management

**Purpose**: Global application state using Zustand

```
store/
├── viewerStore.ts         # Main viewer state
│   ├── CRX loading state
│   ├── Selected file path
│   ├── File tree data
│   └── Error handling
│
├── searchStore.ts         # Search results state
│   ├── Search query
│   ├── Search results
│   ├── Filter criteria
│   └── Search history
│
└── index.ts              # Store exports
```

**Store Design**:
- Shallow updates for performance
- Immutable patterns
- Clear action naming
- Optional persistence to localStorage

### `/src/pages` - Page Components

**Purpose**: Route-level components

```
pages/
├── LandingPage.tsx        # Home/upload page
├── ViewerPage.tsx         # Main viewer page
└── NotFoundPage.tsx       # 404 page
```

### `/src/types` - Type Definitions

**Purpose**: TypeScript interfaces and type exports

```
types/
└── index.ts              # Core type definitions
    ├── LoadedCrx
    ├── LoadingState
    ├── ViewerState
    ├── FileTreeNode
    └── SearchResult
```

## State Management Pattern

### Zustand Store Structure

```typescript
// Store Definition
const useViewerStore = create<ViewerState>((set, get) => ({
  // State
  crx: null,
  loadingState: 'idle',
  selectedFilePath: null,

  // Actions
  loadCrx: async (extensionId, crxData) => {
    set({ loadingState: 'loading' });
    // ... processing
    set({ crx, loadingState: 'success' });
  },

  selectFile: (path) => {
    set({ selectedFilePath: path });
  },
}));
```

### Store Subscription Pattern

Components use Zustand hooks to subscribe to store slices:

```typescript
// Component
const { crx, loadingState } = useViewerStore(
  (state) => ({
    crx: state.crx,
    loadingState: state.loadingState,
  })
);
```

## Key Libraries & Their Roles

| Library | Purpose | Size |
|---------|---------|------|
| **React** | UI rendering and hooks | 450 KB |
| **Zustand** | Lightweight state management | 5 KB |
| **JSZip** | ZIP file extraction and manipulation | 30 KB |
| **js-beautify** | Code formatting | 50 KB |
| **Prism.js** | Syntax highlighting | 140 KB |
| **Tailwind CSS** | Utility-first styling | Dynamic |
| **React Router** | Client-side routing | 60 KB |
| **Lucide React** | Icon library | 100 KB |

## Performance Optimization Strategies

### Code Splitting

Vite automatically splits code into semantic chunks:

```
vendor.js    → React ecosystem (loaded first)
syntax.js    → Prism.js (lazy loaded when needed)
zip.js       → JSZip (lazy loaded)
utils.js     → Zustand, js-beautify (lazy loaded)
index.js     → Application code
```

### Lazy Loading

- Prism language modules loaded on-demand
- Web Worker for search operations (non-blocking UI)
- Component lazy loading with React.lazy()

### Memory Management

- File cache limits for large archives
- Efficient binary data handling
- Cleanup of temporary buffers

### Search Optimization

- Web Worker processes search in background thread
- Debounced input (300ms) prevents excessive processing
- Indexed file content for faster searches
- Result caching

## Error Handling Strategy

### Layer 1: Component Level
- Try-catch blocks in event handlers
- Input validation before processing
- Graceful error messages to users

### Layer 2: Store Level
- Error state in Zustand store
- Error action for clearing errors
- Error persistence for debugging

### Layer 3: Error Boundary
- React ErrorBoundary catches render errors
- Fallback UI for error states
- Error logging capability

## Data Structures

### FileTreeNode

```typescript
interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: Map<string, FileTreeNode>;
  size?: number;
  binary?: boolean;
}
```

### LoadedCrx

```typescript
interface LoadedCrx {
  extensionId: string;
  fileName: string;
  loadedAt: Date;
  crxData: ArrayBuffer;      // Original CRX binary
  zipData: ArrayBuffer;      // Extracted ZIP data
  fileTree: FileTreeNode;    // Parsed file structure
  fileCache: Map<string, Uint8Array>;  // File contents
}
```

### SearchResult

```typescript
interface SearchResult {
  filePath: string;
  fileName: string;
  matches: {
    line: number;
    column: number;
    text: string;
  }[];
  contentMatches: number;
}
```

## Extension Manifest Analysis

The application extracts and displays `manifest.json` with:
- Version information
- Permissions
- Content scripts
- Background scripts
- Icons and branding
- Web-accessible resources

## Browser APIs Used

- **FileReader API**: Read uploaded CRX files
- **Blob/ArrayBuffer**: Binary data handling
- **Web Workers**: Background search processing
- **localStorage**: State persistence
- **URL API**: Parameter parsing and generation

## Security Considerations

1. **No External Requests**: All processing is local
2. **No Data Transmission**: Files never leave the browser
3. **Input Validation**: CRX format validation before processing
4. **Safe Rendering**: JSX escaping prevents XSS
5. **Error Boundaries**: Prevent app crashes from breaking UI

## Build Output Structure

```
dist/
├── index.html              # Entry point
├── assets/
│   ├── vendor-[hash].js   # React, Router, React-DOM
│   ├── syntax-[hash].js   # Prism.js
│   ├── zip-[hash].js      # JSZip
│   ├── utils-[hash].js    # Zustand, js-beautify, Icons
│   ├── index-[hash].js    # App code (multiple chunks)
│   └── [hash].css         # Compiled Tailwind CSS
└── [static files]         # Public assets
```

Total: ~200 KB gzipped (optimized for fast loading)

## Testing Architecture

- **Unit Tests**: Jest for library functions
- **Integration Tests**: Test hooks with mock stores
- **Component Tests**: React Testing Library (ready for expansion)
- **E2E Tests**: Manual testing workflow documented

## Future Architecture Enhancements

1. **Service Worker**: Offline capability
2. **IndexedDB**: Persistent caching of parsed CRX files
3. **Multi-file Support**: Compare multiple extensions
4. **Plugin System**: Custom file type handlers
5. **API Mode**: RESTful interface for programmatic access
