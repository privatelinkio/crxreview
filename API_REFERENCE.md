# CRX Review - API Reference

Complete API documentation for the core CRX parsing and download functionality.

## CRX Module

### `src/lib/crx/url-patterns.ts`

#### `extractExtensionId(input: string)`

Extracts Chrome extension ID from various URL formats.

**Parameters:**
- `input` (string): URL or extension ID in any supported format

**Returns:**
```typescript
| { success: true; extensionId: string }
| { success: false; error: string }
```

**Supported Formats:**
- `https://chrome.google.com/webstore/detail/[name]/[id]`
- `https://chrome.google.com/webstore/detail/[id]`
- `https://clients2.google.com/service/update2/crx?id=[id]`
- Raw 32-character ID: `[a-z]{32}`

**Example:**
```typescript
const result = extractExtensionId('https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcpwyalccd4h');
if (result.success) {
  console.log(result.extensionId); // 'cjpalhdlnbpafiamejdnhcpwyalccd4h'
} else {
  console.error(result.error);
}
```

#### `isValidExtensionId(id: unknown)`

Type guard for validating extension ID format.

**Parameters:**
- `id` (unknown): Value to validate

**Returns:**
- `true` if valid 32-character lowercase extension ID
- `false` otherwise

**Type Guard:**
```typescript
if (isValidExtensionId(id)) {
  // TypeScript now knows id is string
  const safeId: string = id;
}
```

---

### `src/lib/crx/download.ts`

#### `buildCrxDownloadUrl(extensionId: string)`

Constructs the official Google CRX download URL.

**Parameters:**
- `extensionId` (string): Valid 32-character extension ID

**Returns:**
- `string`: Full download URL

**Throws:**
- `Error` if extension ID is invalid

**URL Format:**
```
https://clients2.google.com/service/update2/crx?response=redirect&os=linux&arch=x86-64&os_arch=x86_64&acceptformat=crx2,crx3&x=id%3D{id}%26v%3D0
```

**Example:**
```typescript
const url = buildCrxDownloadUrl('cjpalhdlnbpafiamejdnhcpwyalccd4h');
// https://clients2.google.com/service/update2/crx?...
```

#### `downloadCrx(extensionId: string)`

Downloads CRX file from Chrome's update server.

**Parameters:**
- `extensionId` (string): Valid 32-character extension ID

**Returns:**
```typescript
Promise<
  | { success: true; data: ArrayBuffer }
  | { success: false; error: string }
>
```

**Errors:**
- Invalid extension ID format
- Network errors (timeout, offline, DNS)
- HTTP errors (404, 403, 500)
- Empty response

**Example:**
```typescript
const result = await downloadCrx('cjpalhdlnbpafiamejdnhcpwyalccd4h');
if (result.success) {
  const crxData = result.data;
  console.log(`Downloaded ${crxData.byteLength} bytes`);
} else {
  console.error(`Download failed: ${result.error}`);
}
```

---

### `src/lib/crx/parser.ts`

#### `parseCrxHeader(buffer: ArrayBuffer)`

Parses CRX file header and locates ZIP data.

**Parameters:**
- `buffer` (ArrayBuffer): CRX file data

**Returns:**
```typescript
| { success: true; header: { version: number; zipOffset: number } }
| { success: false; error: string }
```

**Version Support:**
- **2** - CRX2 format (16 bytes header + key + signature)
- **3** - CRX3 format (12 bytes header + protobuf header)

**CRX2 Structure:**
```
Offset  Type      Description
0-3     bytes     Magic "Cr24"
4-7     uint32    Version (2)
8-11    uint32    Public key length (LE)
12-15   uint32    Signature length (LE)
16+     bytes     Public key + Signature + ZIP
```

**CRX3 Structure:**
```
Offset  Type      Description
0-3     bytes     Magic "Cr24"
4-7     uint32    Version (3)
8-11    uint32    Header length (LE)
12+     bytes     Header (protobuf) + ZIP
```

**Example:**
```typescript
const result = parseCrxHeader(crxBuffer);
if (result.success) {
  const { version, zipOffset } = result.header;
  console.log(`CRX version ${version}, ZIP starts at byte ${zipOffset}`);

  const zipData = crxBuffer.slice(zipOffset);
} else {
  console.error(`Parse failed: ${result.error}`);
}
```

---

### `src/lib/crx/zip-converter.ts`

#### `crxToZip(crxBuffer: ArrayBuffer)`

Converts CRX file to ZIP format by stripping headers.

**Parameters:**
- `crxBuffer` (ArrayBuffer): Complete CRX file data

**Returns:**
```typescript
| { success: true; zipData: ArrayBuffer }
| { success: false; error: string }
```

**Process:**
1. Parse CRX header
2. Validate ZIP magic number (0x504B)
3. Extract ZIP portion
4. Return as new ArrayBuffer

**Example:**
```typescript
const result = crxToZip(crxData);
if (result.success) {
  const zipData = result.zipData;
  // Now ready for ZIP extraction
} else {
  console.error(`Conversion failed: ${result.error}`);
}
```

---

## ZIP Module

### `src/lib/zip/extractor.ts`

#### `extractZipEntries(zipData: ArrayBuffer)`

Extracts all file entries from ZIP data.

**Parameters:**
- `zipData` (ArrayBuffer): ZIP file data

**Returns:**
```typescript
Promise<
  | { success: true; files: ZipFileEntry[] }
  | { success: false; error: string }
>
```

**ZipFileEntry Interface:**
```typescript
interface ZipFileEntry {
  name: string              // Path in ZIP
  dir: boolean              // Is directory
  size: number              // Uncompressed size
  compressedSize: number    // Compressed size
  date: Date                // File modification date
  data?: Uint8Array         // File contents (optional)
}
```

**Example:**
```typescript
const result = await extractZipEntries(zipData);
if (result.success) {
  for (const entry of result.files) {
    console.log(`${entry.name} - ${entry.size} bytes`);
  }
} else {
  console.error(`Extraction failed: ${result.error}`);
}
```

#### `loadZipFile(zipData: ArrayBuffer, filePath: string)`

Loads a specific file from ZIP.

**Parameters:**
- `zipData` (ArrayBuffer): ZIP file data
- `filePath` (string): Path of file to load

**Returns:**
```typescript
Promise<
  | { success: true; files: ZipFileEntry[] }
  | { success: false; error: string }
>
```

**Example:**
```typescript
const result = await loadZipFile(zipData, 'manifest.json');
if (result.success) {
  const content = result.files[0].data;
  const text = new TextDecoder().decode(content);
} else {
  console.error(`Load failed: ${result.error}`);
}
```

---

### `src/lib/zip/file-tree.ts`

#### `buildFileTree(entries: ZipFileEntry[])`

Builds hierarchical file tree from flat ZIP entries.

**Parameters:**
- `entries` (ZipFileEntry[]): Flat list from ZIP

**Returns:**
- `FileTreeNode`: Root node of tree

**FileTreeNode Interface:**
```typescript
interface FileTreeNode {
  name: string              // Just the name
  path: string              // Full path from root
  isDirectory: boolean      // Is this a directory
  size: number              // File size (0 for dirs)
  compressedSize: number    // Compressed size
  date: Date                // Modification date
  children: FileTreeNode[]  // Sub-items
}
```

**Sorting:**
- Directories appear before files
- Items alphabetically sorted within each level

**Example:**
```typescript
const tree = buildFileTree(entries);
// tree.children = [subdirs first, then files]
// Each ordered alphabetically
```

#### `getAllFiles(node: FileTreeNode)`

Gets flat list of all files in tree.

**Parameters:**
- `node` (FileTreeNode): Root to traverse

**Returns:**
- `FileTreeNode[]`: All non-directory nodes

**Example:**
```typescript
const allFiles = getAllFiles(tree);
const jsFiles = allFiles.filter(f => f.path.endsWith('.js'));
```

#### `findNodeByPath(node: FileTreeNode, path: string)`

Finds node by path.

**Parameters:**
- `node` (FileTreeNode): Root to search from
- `path` (string): Path to find (e.g., "src/manifest.json")

**Returns:**
- `FileTreeNode | undefined`: Found node or undefined

**Example:**
```typescript
const manifest = findNodeByPath(tree, 'manifest.json');
if (manifest && !manifest.isDirectory) {
  console.log(`Found manifest: ${manifest.size} bytes`);
}
```

---

## Store Module

### `src/store/viewerStore.ts`

#### `useViewerStore()`

Zustand hook for application state.

**State Properties:**

```typescript
loadingState: 'idle' | 'loading' | 'success' | 'error'
error: string | null
crx: LoadedCrx | null
selectedFilePath: string | null
fileFilter: string
```

**LoadedCrx Interface:**
```typescript
interface LoadedCrx {
  extensionId: string
  fileName: string
  loadedAt: Date
  crxData: ArrayBuffer              // Original CRX
  zipData: ArrayBuffer              // Extracted ZIP
  fileTree: FileTreeNode            // File structure
  fileCache: Map<string, Uint8Array> // Cached files
}
```

**Actions:**

#### `loadCrx(extensionId: string, crxData: ArrayBuffer)`

Load pre-downloaded CRX data.

**Parameters:**
- `extensionId` (string): Extension ID
- `crxData` (ArrayBuffer): CRX file data

**Process:**
1. Parse CRX header
2. Convert to ZIP
3. Extract entries
4. Build file tree
5. Update store state

**Example:**
```typescript
const store = useViewerStore();
await store.loadCrx(
  'cjpalhdlnbpafiamejdnhcpwyalccd4h',
  crxArrayBuffer
);
console.log(`Loaded ${store.crx.fileTree.children.length} items`);
```

#### `loadCrxFromUrl(input: string)`

Download and load CRX from URL or ID.

**Parameters:**
- `input` (string): URL or extension ID

**Process:**
1. Extract extension ID
2. Download from Google
3. Parse and process CRX
4. Update state

**Example:**
```typescript
const store = useViewerStore();
await store.loadCrxFromUrl('cjpalhdlnbpafiamejdnhcpwyalccd4h');
if (store.error) {
  console.error(store.error);
} else {
  console.log('Loaded successfully');
}
```

#### `selectFile(path: string)`

Change currently selected file.

**Parameters:**
- `path` (string): File path in tree

**Example:**
```typescript
store.selectFile('manifest.json');
```

#### `setFileFilter(filter: string)`

Update file search filter.

**Parameters:**
- `filter` (string): Search term

**Example:**
```typescript
store.setFileFilter('src');
// Store filters displayed files
```

#### `clearError()`

Clear error message.

**Example:**
```typescript
store.clearError();
```

#### `reset()`

Reset store to initial state.

**Example:**
```typescript
store.reset();
// Returns to idle state
```

---

## Utilities

### `src/utils/file-helpers.ts`

#### `getFileExtension(filePath: string)`

Extract file extension.

**Parameters:**
- `filePath` (string): Full file path

**Returns:**
- `string`: Extension (lowercase) or empty string

**Example:**
```typescript
getFileExtension('src/manifest.json'); // 'json'
getFileExtension('README');             // ''
```

#### `getFileName(filePath: string)`

Get filename from path.

**Parameters:**
- `filePath` (string): Full path

**Returns:**
- `string`: Just the filename

**Example:**
```typescript
getFileName('src/components/Button.tsx'); // 'Button.tsx'
```

#### `getDirectoryPath(filePath: string)`

Get directory portion of path.

**Parameters:**
- `filePath` (string): Full path

**Returns:**
- `string`: Directory path or empty string

**Example:**
```typescript
getDirectoryPath('src/components/Button.tsx'); // 'src/components'
```

#### `formatFileSize(bytes: number)`

Format bytes as human-readable size.

**Parameters:**
- `bytes` (number): Size in bytes

**Returns:**
- `string`: Formatted size (e.g., "1.5 MB")

**Example:**
```typescript
formatFileSize(1048576); // '1.00 MB'
formatFileSize(256);     // '256 B'
```

#### `isTextFile(fileName: string)`

Detect if file is likely text-based.

**Parameters:**
- `fileName` (string): Filename or path

**Returns:**
- `boolean`: true if text file

**Recognized Extensions:**
- JS, TS, JSX, TSX
- JSON, XML, HTML, CSS, SCSS
- TXT, MD, YAML, TOML
- Python, Shell, Java, C++, Rust, etc.

**Example:**
```typescript
isTextFile('script.js');  // true
isTextFile('image.png');  // false
```

#### `isManifestFile(fileName: string)`

Check if file is a manifest.

**Parameters:**
- `fileName` (string): Filename

**Returns:**
- `boolean`: true if manifest file

**Example:**
```typescript
isManifestFile('manifest.json');  // true
isManifestFile('package.json');   // false
```

#### `filterFiles(files: string[], filter: string)`

Filter file list by search term.

**Parameters:**
- `files` (string[]): File paths
- `filter` (string): Search term

**Returns:**
- `string[]`: Matching files (case-insensitive)

**Example:**
```typescript
const files = ['src/index.js', 'src/style.css', 'README.md'];
filterFiles(files, 'src'); // ['src/index.js', 'src/style.css']
```

---

## Type Definitions

### `src/types/index.ts`

#### `LoadingState`

Type for loading state.

```typescript
type LoadingState = 'idle' | 'loading' | 'success' | 'error'
```

#### `LoadedCrx`

Complete loaded extension data.

```typescript
interface LoadedCrx {
  extensionId: string
  fileName: string
  loadedAt: Date
  crxData: ArrayBuffer
  zipData: ArrayBuffer
  fileTree: FileTreeNode
  fileCache: Map<string, Uint8Array>
}
```

#### `ViewerState`

Complete application state.

```typescript
interface ViewerState {
  loadingState: LoadingState
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

---

## Error Handling Pattern

All async operations return Result types:

```typescript
type Result<T> =
  | { success: true; [key]: T }
  | { success: false; error: string }
```

Always check the `success` property before accessing data:

```typescript
const result = await someOperation();
if (result.success) {
  // result.data is safely accessible
} else {
  // result.error contains the message
}
```

---

## Integration Example

Complete example loading and displaying an extension:

```typescript
import { useViewerStore } from '@/store'
import { getAllFiles } from '@/lib/zip'

function ExtensionViewer() {
  const store = useViewerStore()

  const handleLoadExtension = async (input: string) => {
    await store.loadCrxFromUrl(input)
  }

  const handleSelectFile = (path: string) => {
    store.selectFile(path)
  }

  if (store.loadingState === 'loading') {
    return <div>Loading...</div>
  }

  if (store.error) {
    return <div className="error">{store.error}</div>
  }

  if (!store.crx) {
    return (
      <input
        placeholder="Extension ID or URL"
        onChange={(e) => handleLoadExtension(e.target.value)}
      />
    )
  }

  const allFiles = getAllFiles(store.crx.fileTree)
  const filteredFiles = allFiles
    .filter(f => f.path.toLowerCase().includes(store.fileFilter))
    .map(f => f.path)

  return (
    <div>
      <h2>{store.crx.extensionId}</h2>
      <input
        placeholder="Filter files"
        onChange={(e) => store.setFileFilter(e.target.value)}
      />
      <ul>
        {filteredFiles.map(path => (
          <li key={path} onClick={() => handleSelectFile(path)}>
            {path}
          </li>
        ))}
      </ul>
      {store.selectedFilePath && (
        <div>Selected: {store.selectedFilePath}</div>
      )}
    </div>
  )
}
```
