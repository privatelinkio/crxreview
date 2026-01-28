# UI Components and Code Display System - Implementation Guide

This document describes the complete implementation of the viewer UI system for CRX Review, including all React components, utility functions, and styling.

## Overview

The implementation provides a professional Chrome extension viewer with:
- Two-panel responsive layout (File Tree + Code Viewer)
- Syntax highlighting for 15+ programming languages
- Code beautification with js-beautify
- Cryptographic hashing (SHA256/384/512)
- Image preview support
- Content search and file filtering
- Drag-to-resize panels

## Architecture

### Project Structure

```
src/
├── pages/
│   └── ViewerPage.tsx              # Main layout component
├── components/
│   └── viewer/
│       ├── TopBar.tsx              # URL input, load/download controls
│       ├── FileTree.tsx            # Hierarchical file navigator
│       ├── CodeViewer.tsx          # Main code display area
│       ├── SourceToolbar.tsx       # File tools: beautify, download, hash
│       ├── PanelResizer.tsx        # Draggable divider
│       ├── ImagePreview.tsx        # Image display component
│       ├── ContentSearch.tsx       # Full-text search UI
│       ├── FileFilter.tsx          # File filtering UI
│       ├── SearchAndFilterPanel.tsx # Combined search/filter
│       └── index.ts                # Barrel export
├── lib/
│   ├── code/                       # Code processing
│   │   ├── language-detector.ts    # Language from extension
│   │   ├── beautifier.ts           # Code formatting
│   │   ├── highlighter.ts          # Syntax highlighting
│   │   └── index.ts                # Exports
│   ├── utils/                      # Browser APIs
│   │   ├── hash.ts                 # Crypto hashing
│   │   ├── download-helper.ts      # File downloads, clipboard
│   │   └── index.ts                # Exports
│   ├── search/                     # Content search
│   │   ├── content-search.ts
│   │   ├── file-filter.ts
│   │   ├── search.worker.ts        # Web Worker
│   │   └── index.ts
│   └── zip/                        # ZIP handling
│       ├── extractor.ts
│       └── file-tree.ts
├── store/
│   ├── viewerStore.ts              # Zustand store (existing)
│   ├── searchStore.ts              # Search state
│   └── index.ts                    # Barrel export
├── types/
│   └── index.ts                    # Type definitions
└── App.tsx                         # Root component
```

## Core Components

### 1. ViewerPage (`src/pages/ViewerPage.tsx`)

Main container component that orchestrates the entire viewer interface.

**Features:**
- Two-panel layout with resizable divider
- File loading from ZIP cache
- Error and loading states
- Responsive design

**Key Props:**
- None - uses Zustand store for state

**Usage:**
```tsx
import { ViewerPage } from '@/pages/ViewerPage';

function App() {
  return <ViewerPage />;
}
```

### 2. TopBar (`src/components/viewer/TopBar.tsx`)

Navigation and control bar at the top of the viewer.

**Features:**
- Chrome Web Store URL input
- Extension loading with feedback
- Error display and dismissal
- Download CRX button when extension is loaded

**Key Props:**
```typescript
interface TopBarProps {
  // No props - uses Zustand store
}
```

**Usage:**
```tsx
<TopBar />
```

### 3. FileTree (`src/components/viewer/FileTree.tsx`)

Hierarchical file browser with expand/collapse folders.

**Features:**
- Recursive tree rendering
- Folder expand/collapse with visual indicators
- File type icons (code, image, data, etc.)
- Selection highlighting
- Click to select files

**Key Props:**
```typescript
interface FileTreeProps {
  node: FileTreeNode;        // Root node from file tree
  level?: number;            // Nesting level (default 0)
}
```

**Usage:**
```tsx
import { FileTree } from '@/components/viewer/FileTree';
import { useViewerStore } from '@/store/viewerStore';

function MyComponent() {
  const crx = useViewerStore((state) => state.crx);
  return crx ? <FileTree node={crx.fileTree} /> : null;
}
```

### 4. CodeViewer (`src/components/viewer/CodeViewer.tsx`)

Main code display area with syntax highlighting and tools.

**Features:**
- Syntax highlighting for 15+ languages
- Code beautification toggle
- Handles text and binary files
- Image preview support
- Error handling with user feedback
- Loading state

**Key Props:**
```typescript
interface CodeViewerProps {
  fileName: string;          // Display name
  filePath: string;          // Full path for language detection
  fileData: Uint8Array;      // File binary data
  isLoading?: boolean;       // Loading indicator
}
```

**Usage:**
```tsx
<CodeViewer
  fileName="main.js"
  filePath="src/main.js"
  fileData={uint8Array}
  isLoading={false}
/>
```

### 5. SourceToolbar (`src/components/viewer/SourceToolbar.tsx`)

Toolbar with file operations and metadata.

**Features:**
- File size display
- Beautify toggle button
- Copy to clipboard
- Download file
- SHA256 hash calculation
- File path display

**Key Props:**
```typescript
interface SourceToolbarProps {
  fileName: string;
  filePath: string;
  fileData: Uint8Array;
  fileContent: string;
  isBeautified: boolean;
  onBeautifyToggle: () => void;
  onCopyContent: () => void;
}
```

### 6. PanelResizer (`src/components/viewer/PanelResizer.tsx`)

Draggable divider between panels.

**Features:**
- Mouse drag handling
- Visual feedback on hover
- Respects minimum/maximum widths
- Smooth transitions

**Key Props:**
```typescript
interface PanelResizerProps {
  onResize?: (leftWidth: number) => void;
  minLeftWidth?: number;        // Default 200px
  minRightWidth?: number;       // Default 300px
}
```

### 7. ImagePreview (`src/components/viewer/ImagePreview.tsx`)

Displays images with metadata.

**Features:**
- Inline image display
- Image dimensions and aspect ratio
- File size information
- Error handling

**Key Props:**
```typescript
interface ImagePreviewProps {
  data: Uint8Array;
  fileName: string;
  filePath: string;
}
```

## Code Processing Utilities

### Language Detector (`src/lib/code/language-detector.ts`)

Detects programming language from file extension.

**Key Functions:**
- `detectLanguageFromPath(filePath)` - Returns SupportedLanguage
- `detectLanguageFromMime(mimeType)` - Alternative MIME-based detection
- `getPrismLanguage(language)` - Converts to Prism.js identifier
- `isHighlightable(language)` - Checks if highlighting is supported
- `isTextFile(filePath)` - Checks if file is text-based
- `isImageFile(filePath)` - Checks if file is an image
- `getFileCategory(filePath)` - Returns category: code/image/data/markup/document

**Supported Languages:**
- JavaScript, TypeScript, JSX, TSX
- HTML, CSS, SCSS, Less
- JSON, YAML, XML
- Python, Ruby, PHP, Go, Rust
- Bash, Shell
- Markdown

**Usage:**
```typescript
import { detectLanguageFromPath, getPrismLanguage } from '@/lib/code';

const language = detectLanguageFromPath('src/main.ts');    // 'typescript'
const prism = getPrismLanguage(language);                 // 'typescript'
const isText = isTextFile('image.png');                   // false
```

### Beautifier (`src/lib/code/beautifier.ts`)

Code formatting using js-beautify.

**Key Functions:**
- `canBeautify(language)` - Checks if language supports beautification
- `beautifyCode(code, language, options)` - Formats code
- `minifyCode(code)` - Removes unnecessary whitespace

**Supported Languages:**
- JavaScript, TypeScript, JSX, TSX
- HTML
- CSS, SCSS, Less
- JSON

**Usage:**
```typescript
import { beautifyCode, canBeautify } from '@/lib/code';

if (canBeautify('javascript')) {
  const beautiful = beautifyCode(code, 'javascript', {
    indent_size: 2,
    preserve_newlines: true
  });
}
```

**Beautify Options:**
```typescript
interface BeautifyOptions {
  indent_size?: number;           // Default 2
  indent_char?: string;           // Default ' '
  preserve_newlines?: boolean;    // Default true
  max_preserve_newlines?: number; // Default 2
  wrap_line_length?: number;
}
```

### Highlighter (`src/lib/code/highlighter.ts`)

Syntax highlighting using Prism.js.

**Key Functions:**
- `highlightCode(code, language)` - Returns HTML with highlighting
- `getSupportedLanguages()` - Lists all supported languages
- `isLanguageSupported(language)` - Checks support

**Returns:**
```typescript
interface HighlightResult {
  html: string;      // HTML with syntax highlighting
  language: string;  // Actual language used
}
```

**Usage:**
```typescript
import { highlightCode } from '@/lib/code';

const result = highlightCode('const x = 1;', 'javascript');
// result.html contains: '<span class="token keyword">const</span> ...'
```

## Utility Functions

### Hash Calculator (`src/lib/utils/hash.ts`)

Cryptographic hashing using Web Crypto API.

**Key Functions:**
- `calculateSHA256(data)` - SHA-256 hash
- `calculateSHA384(data)` - SHA-384 hash
- `calculateSHA512(data)` - SHA-512 hash
- `calculateHash(data, algorithm)` - Generic hash function
- `calculateMultipleHashes(data, algorithms)` - Calculate multiple at once
- `formatHashResult(result)` - Format for display
- `formatFileSize(bytes)` - Human-readable file size

**Returns:**
```typescript
interface HashResult {
  algorithm: HashAlgorithm;  // 'SHA-256', 'SHA-384', 'SHA-512'
  hash: string;              // Hex string
  bytes: number;             // Size of input
}
```

**Usage:**
```typescript
import { calculateSHA256, formatHashResult, formatFileSize } from '@/lib/utils';

async function getHash(data: Uint8Array) {
  const result = await calculateSHA256(data);
  console.log(formatHashResult(result));  // "SHA-256: 3a7bd..."
  console.log(formatFileSize(result.bytes)); // "1.2 MB"
}
```

### Download Helper (`src/lib/utils/download-helper.ts`)

Browser download and clipboard utilities.

**Key Functions:**
- `downloadFile(data, filename, mimeType)` - Generic download
- `downloadTextFile(content, filename)` - Download text
- `downloadJsonFile(data, filename)` - Download JSON
- `downloadBinaryFile(data, filename)` - Download binary
- `copyToClipboard(text)` - Copy to clipboard
- `generateDownloadFilename(baseName, extension)` - Generate timestamped name

**Usage:**
```typescript
import { downloadTextFile, copyToClipboard } from '@/lib/utils';

// Download file
downloadTextFile('console.log("Hello");', 'script.js');

// Copy to clipboard
await copyToClipboard('Text to copy');
```

## State Management (Zustand Store)

### ViewerStore (`src/store/viewerStore.ts`)

Manages loading state and file data.

**State:**
```typescript
interface ViewerState {
  loadingState: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  crx: LoadedCrx | null;
  selectedFilePath: string | null;
  fileFilter: string;

  loadCrx(extensionId: string, crxData: ArrayBuffer): Promise<void>;
  loadCrxFromUrl(input: string): Promise<void>;
  selectFile(path: string): void;
  setFileFilter(filter: string): void;
  clearError(): void;
  reset(): void;
}
```

**Usage:**
```typescript
import { useViewerStore } from '@/store/viewerStore';

function MyComponent() {
  const { crx, selectedFilePath, selectFile } = useViewerStore();

  return (
    <div onClick={() => selectFile('src/main.ts')}>
      {selectedFilePath}
    </div>
  );
}
```

## Styling with Tailwind CSS

All components use Tailwind CSS v4 for styling.

### Key Classes Used:
- **Layout:** `flex`, `flex-col`, `gap-*`, `p-*`, `m-*`
- **Colors:** `bg-white`, `bg-gray-50`, `text-gray-900`, `text-blue-500`
- **Borders:** `border-*`, `border-gray-200`, `border-b`, `rounded`
- **States:** `hover:`, `disabled:`, `focus:`, `transition-*`
- **Responsive:** `flex-1`, `min-w-0`, `overflow-*`, `max-h-*`

### Responsive Design:
- Mobile-first approach
- Responsive panels with minimum widths
- Touch-friendly buttons and inputs
- Overflow handling for long content

## Error Handling

Components handle errors gracefully:

1. **TopBar** - Display error messages with dismiss button
2. **FileTree** - Silent handling, visual feedback
3. **CodeViewer** - Display error message to user
4. **SourceToolbar** - Graceful hash calculation failures
5. **ViewerPage** - Error states and empty states

## Performance Optimizations

1. **File Caching** - Files cached in memory after first load
2. **Worker Thread** - Search runs in background worker
3. **Lazy Loading** - Components render only when needed
4. **Memoization** - React hooks optimize re-renders
5. **Efficient Tree Rendering** - Only visible nodes rendered

## Testing

Run type checking:
```bash
npm run type-check
```

Run linting:
```bash
npm run lint
```

Build for production:
```bash
npm run build
```

Development server:
```bash
npm run dev
```

## Dependencies

### Core Dependencies:
- `react@19.2.4` - UI framework
- `zustand@5.0.10` - State management
- `tailwindcss@4.1.18` - Styling
- `js-beautify@1.15.4` - Code formatting
- `prismjs@1.30.0` - Syntax highlighting
- `jszip@3.10.1` - ZIP extraction

### Dev Dependencies:
- `typescript@5.9.3` - Type safety
- `@vitejs/plugin-react@5.1.2` - React in Vite
- `@types/js-beautify@1.14.3` - Type definitions
- `@types/prismjs@1.26.5` - Prism types

### Recently Added:
- `@tailwindcss/postcss@4.1.18` - PostCSS integration
- `lucide-react@1.x` - Icon library

## File Size Reference

Production build sizes (gzip):
- CSS: ~5.2 KB
- JavaScript: ~143 KB
- HTML: ~0.3 KB

## Future Enhancements

Potential improvements:
1. Virtual scrolling for very large files
2. Diff view for comparing versions
3. Minimap for large code files
4. Theme switching (light/dark)
5. Custom syntax highlighting themes
6. WebAssembly-based compression
7. Regex-based search UI improvements
8. File diff visualization
9. Source map support
10. AST-based code navigation

## Troubleshooting

### Common Issues:

**Syntax highlighting not working:**
- Check that the language is supported in `language-detector.ts`
- Verify file extension is correct
- Check Prism.js language support

**Beautification not working:**
- Not all languages support beautification
- Check `canBeautify()` before attempting
- Some malformed code may fail to beautify

**Hash calculation errors:**
- Only works in secure contexts (HTTPS, localhost)
- Check browser Web Crypto API support
- Very large files may timeout

**Panel resizing issues:**
- Check minimum width constraints
- Ensure container has flex layout
- Mobile might have constrained widths

## References

- [Tailwind CSS v4](https://tailwindcss.com/docs/installation)
- [Prism.js](https://prismjs.com/)
- [js-beautify](https://beautifier.io/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Zustand](https://github.com/pmndrs/zustand)
