# Component and Utility Reference

Quick reference for all new components and utilities added to CRX Review.

## Components

### ViewerPage
**Location:** `src/pages/ViewerPage.tsx`
**Purpose:** Main application layout

```tsx
<ViewerPage />
```

**State Management:**
- Uses Zustand store for CRX data and file selection
- Manages file loading from ZIP
- Displays error and loading states

---

### TopBar
**Location:** `src/components/viewer/TopBar.tsx`
**Purpose:** URL input, load controls, error display

```tsx
<TopBar />
```

**Features:**
- Chrome Web Store URL input
- Load/Download buttons
- Error message display
- Extension info panel

---

### FileTree
**Location:** `src/components/viewer/FileTree.tsx`
**Purpose:** Hierarchical file browser

```tsx
<FileTree node={fileTreeRoot} level={0} />
```

**Props:**
- `node: FileTreeNode` - Root node of file tree
- `level?: number` - Nesting depth (default 0)

**Events:**
- Click folder to expand/collapse
- Click file to select

---

### CodeViewer
**Location:** `src/components/viewer/CodeViewer.tsx`
**Purpose:** Code display with highlighting and tools

```tsx
<CodeViewer
  fileName="main.js"
  filePath="src/main.js"
  fileData={uint8Array}
  isLoading={false}
/>
```

**Props:**
- `fileName: string` - Display name
- `filePath: string` - Full path (for language detection)
- `fileData: Uint8Array` - File contents
- `isLoading?: boolean` - Loading indicator

**Features:**
- Syntax highlighting
- Beautification toggle
- Copy to clipboard
- Works with images and text

---

### SourceToolbar
**Location:** `src/components/viewer/SourceToolbar.tsx`
**Purpose:** File operations toolbar

```tsx
<SourceToolbar
  fileName="script.js"
  filePath="src/script.js"
  fileData={uint8Array}
  fileContent="const x = 1;"
  isBeautified={false}
  onBeautifyToggle={() => {}}
  onCopyContent={() => {}}
/>
```

**Props:**
- `fileName: string`
- `filePath: string`
- `fileData: Uint8Array`
- `fileContent: string`
- `isBeautified: boolean`
- `onBeautifyToggle: () => void`
- `onCopyContent: () => void`

**Buttons:**
- Beautify - Toggle code formatting
- Copy - Copy content to clipboard
- Download - Save file to disk
- Hash - Calculate SHA256 hash

---

### PanelResizer
**Location:** `src/components/viewer/PanelResizer.tsx`
**Purpose:** Draggable panel divider

```tsx
<PanelResizer
  onResize={(width) => setLeftWidth(width)}
  minLeftWidth={200}
  minRightWidth={300}
/>
```

**Props:**
- `onResize?: (leftWidth: number) => void`
- `minLeftWidth?: number` - Minimum width (default 200px)
- `minRightWidth?: number` - Minimum width (default 300px)

---

### ImagePreview
**Location:** `src/components/viewer/ImagePreview.tsx`
**Purpose:** Display images with metadata

```tsx
<ImagePreview
  data={uint8Array}
  fileName="logo.png"
  filePath="assets/logo.png"
/>
```

**Props:**
- `data: Uint8Array` - Image binary data
- `fileName: string` - Display name
- `filePath: string` - Full path

**Displays:**
- Image preview
- File size
- Dimensions
- Aspect ratio

---

### ContentSearch
**Location:** `src/components/viewer/ContentSearch.tsx`
**Purpose:** Full-text search interface

```tsx
<ContentSearch
  isOpen={true}
  onClose={() => {}}
  files={fileArray}
  onSelectMatch={(id, path, match) => {}}
/>
```

**Props:**
- `isOpen: boolean` - Show/hide modal
- `onClose: () => void` - Close handler
- `files: Array<{fileId, filePath, content}>` - Files to search
- `onSelectMatch?: (fileId, filePath, match) => void`
- `className?: string`

---

### FileFilter
**Location:** `src/components/viewer/FileFilter.tsx`
**Purpose:** File filtering UI

```tsx
<FileFilter
  onFilterChange={() => {}}
  className="mb-4"
/>
```

**Props:**
- `onFilterChange?: () => void` - Change handler
- `className?: string` - Additional CSS classes

**Features:**
- Pattern input (with regex option)
- Case sensitivity toggle
- File type categories
- Clear filters button

---

## Code Processing Utilities

### Language Detector

**File:** `src/lib/code/language-detector.ts`

**Functions:**

```typescript
// Detect from file path
detectLanguageFromPath(filePath: string): SupportedLanguage

// Detect from MIME type
detectLanguageFromMime(mimeType: string): SupportedLanguage

// Get Prism.js language ID
getPrismLanguage(language: SupportedLanguage): string

// Check if highlighting supported
isHighlightable(language: SupportedLanguage): boolean

// Check if text file
isTextFile(filePath: string): boolean

// Check if image file
isImageFile(filePath: string): boolean

// Get file category
getFileCategory(filePath: string): 'code' | 'image' | 'data' | 'markup' | 'document' | 'unknown'
```

**Supported Languages:**
JavaScript, TypeScript, JSX, TSX, HTML, CSS, SCSS, Less, JSON, YAML, XML, Python, Ruby, PHP, Go, Rust, Bash, Markdown

**Usage:**
```typescript
import { detectLanguageFromPath, isImageFile } from '@/lib/code';

const lang = detectLanguageFromPath('main.ts');     // 'typescript'
const isImg = isImageFile('photo.jpg');              // true
```

---

### Beautifier

**File:** `src/lib/code/beautifier.ts`

**Functions:**

```typescript
// Check if beautifiable
canBeautify(language: string): boolean

// Format code
beautifyCode(
  code: string,
  language: string,
  options?: BeautifyOptions
): string

// Simple minify
minifyCode(code: string): string
```

**Supported Languages:**
JavaScript, TypeScript, JSX, TSX, HTML, CSS, SCSS, Less, JSON

**Options:**
```typescript
interface BeautifyOptions {
  indent_size?: number;           // 2
  indent_char?: string;           // ' '
  preserve_newlines?: boolean;    // true
  max_preserve_newlines?: number; // 2
}
```

**Usage:**
```typescript
import { beautifyCode, canBeautify } from '@/lib/code';

if (canBeautify('javascript')) {
  const formatted = beautifyCode(code, 'javascript', {
    indent_size: 4
  });
}
```

---

### Highlighter

**File:** `src/lib/code/highlighter.ts`

**Functions:**

```typescript
// Highlight code with syntax coloring
highlightCode(
  code: string,
  language: string
): HighlightResult

// List supported languages
getSupportedLanguages(): string[]

// Check support
isLanguageSupported(language: string): boolean
```

**Returns:**
```typescript
interface HighlightResult {
  html: string;      // HTML with <span> tags for colors
  language: string;  // Language used
}
```

**Usage:**
```typescript
import { highlightCode } from '@/lib/code';

const result = highlightCode('const x = 1;', 'javascript');
// result.html = '<span class="token keyword">const</span> x <span class="token operator">=</span> <span class="token number">1</span>;'
```

---

## Utility Functions

### Hash Calculator

**File:** `src/lib/utils/hash.ts`

**Functions:**

```typescript
// Calculate specific hashes
async calculateSHA256(data: Uint8Array): Promise<HashResult>
async calculateSHA384(data: Uint8Array): Promise<HashResult>
async calculateSHA512(data: Uint8Array): Promise<HashResult>

// Generic hash function
async calculateHash(
  data: Uint8Array,
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512'
): Promise<HashResult>

// Calculate multiple hashes
async calculateMultipleHashes(
  data: Uint8Array,
  algorithms?: HashAlgorithm[]
): Promise<HashResult[]>

// Format for display
formatHashResult(result: HashResult): string

// Format file size
formatFileSize(bytes: number): string
```

**Returns:**
```typescript
interface HashResult {
  algorithm: string;  // 'SHA-256', etc.
  hash: string;       // Hex string
  bytes: number;      // Input size
}
```

**Usage:**
```typescript
import { calculateSHA256, formatHashResult, formatFileSize } from '@/lib/utils';

const result = await calculateSHA256(fileData);
console.log(formatHashResult(result));  // "SHA-256: a1b2c3d4..."
console.log(formatFileSize(result.bytes)); // "1.5 MB"
```

---

### Download Helper

**File:** `src/lib/utils/download-helper.ts`

**Functions:**

```typescript
// Generic download
downloadFile(
  data: string | Uint8Array,
  filename: string,
  mimeType?: string
): void

// Download text
downloadTextFile(content: string, filename: string): void

// Download JSON
downloadJsonFile(data: unknown, filename: string): void

// Download binary
downloadBinaryFile(data: Uint8Array, filename: string): void

// Copy to clipboard
async copyToClipboard(text: string): Promise<void>

// Generate timestamped filename
generateDownloadFilename(baseName: string, extension: string): string
```

**Usage:**
```typescript
import { downloadTextFile, copyToClipboard, generateDownloadFilename } from '@/lib/utils';

// Download file
downloadTextFile(codeContent, 'script.js');

// Copy to clipboard
await copyToClipboard('Text to copy');

// Generate filename with date
const name = generateDownloadFilename('export', 'json'); // "export-2026-01-28.json"
```

---

## State Management

### ViewerStore

**File:** `src/store/viewerStore.ts`

**Hooks:**
```typescript
const {
  loadingState,           // 'idle' | 'loading' | 'success' | 'error'
  error,                  // Error message or null
  crx,                    // Loaded CRX data
  selectedFilePath,       // Currently selected file
  fileFilter,             // Filter string

  loadCrx,                // Load from data
  loadCrxFromUrl,         // Load from Chrome Web Store
  selectFile,             // Select file by path
  setFileFilter,          // Set filter pattern
  clearError,             // Clear error message
  reset                   // Reset state
} = useViewerStore();
```

**Usage:**
```typescript
import { useViewerStore } from '@/store/viewerStore';

function MyComponent() {
  const { crx, selectFile } = useViewerStore();

  return (
    <button onClick={() => selectFile('src/main.js')}>
      Select file
    </button>
  );
}
```

---

## Quick Start Example

```tsx
import { ViewerPage } from '@/pages/ViewerPage';
import { useViewerStore } from '@/store/viewerStore';
import { calculateSHA256, formatFileSize } from '@/lib/utils';
import { beautifyCode, isHighlightable } from '@/lib/code';

function App() {
  return <ViewerPage />;
}

// In a component
function FileInfo() {
  const { crx, selectedFilePath } = useViewerStore();

  if (!crx || !selectedFilePath) {
    return <div>No file selected</div>;
  }

  const fileData = crx.fileCache.get(selectedFilePath);
  if (!fileData) return null;

  return (
    <div>
      <p>File: {selectedFilePath}</p>
      <p>Size: {formatFileSize(fileData.length)}</p>
      {/* Hash calculation and beautification examples shown in SourceToolbar */}
    </div>
  );
}
```

---

## CSS Classes Reference

### Layout
- `flex`, `flex-col` - Flexbox layouts
- `gap-1` to `gap-6` - Spacing between children
- `p-2` to `p-6` - Padding
- `m-2` to `m-6` - Margin

### Colors
- `bg-white`, `bg-gray-50`, `bg-gray-100`
- `text-gray-600`, `text-gray-900`
- `text-blue-500`, `text-red-600`
- `border-gray-200`, `border-gray-300`

### Responsive
- `flex-1` - Flex grow
- `min-w-0` - Allow text truncation
- `overflow-auto` - Scrollable
- `max-h-96` - Max height

### States
- `hover:bg-gray-50`
- `focus:ring-2 focus:ring-blue-500`
- `disabled:opacity-50`
- `transition-colors`

### Text
- `text-sm`, `text-lg` - Font sizes
- `font-semibold`, `font-mono` - Font styles
- `truncate` - Single-line ellipsis
- `break-all` - Break long words

---

## File Size and Performance

**Component Sizes (Gzip):**
- Code Viewer: ~8 KB
- File Tree: ~4 KB
- All components: ~25 KB
- Code utilities: ~35 KB
- Total JS: ~143 KB

**Performance Tips:**
1. File cache prevents re-loading
2. Search uses Web Worker
3. Virtual scrolling for large files
4. Memoized components prevent re-renders
5. Lazy language loading in Prism

---

## Browser Compatibility

- **Chrome:** 90+
- **Firefox:** 88+
- **Safari:** 14+
- **Edge:** 90+

**APIs Used:**
- Web Crypto API (hashing)
- Clipboard API (copy)
- Blob API (downloads)
- Web Workers (search)
- File API (loading)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Syntax highlighting missing | Check language in `language-detector.ts` |
| Beautify button disabled | Use `canBeautify()` to check support |
| Hash calculation fails | Check HTTPS context, try smaller file |
| Panel resize stuck | Check minimum width constraints |
| Search not working | Verify worker thread initialization |
| Download fails | Check CORS, mime type, filename |

---

## Import Examples

```typescript
// Components
import { TopBar, FileTree, CodeViewer } from '@/components/viewer';
import { ViewerPage } from '@/pages/ViewerPage';

// Code processing
import { detectLanguageFromPath, isImageFile } from '@/lib/code';
import { beautifyCode, canBeautify } from '@/lib/code';
import { highlightCode } from '@/lib/code';

// Utilities
import { calculateSHA256, formatFileSize } from '@/lib/utils';
import { downloadTextFile, copyToClipboard } from '@/lib/utils';

// State
import { useViewerStore } from '@/store/viewerStore';
```

---

## Further Documentation

- Full implementation guide: `IMPLEMENTATION_GUIDE.md`
- API reference: See JSDoc comments in source files
- Zustand store: `src/store/viewerStore.ts`
- Type definitions: `src/types/index.ts`
