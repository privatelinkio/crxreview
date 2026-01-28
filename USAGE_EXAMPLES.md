# Usage Examples - CRX Review UI Components

Complete code examples for using the implemented UI components and utilities.

## Table of Contents
1. [Basic Setup](#basic-setup)
2. [Using ViewerPage](#using-viewerpage)
3. [File Viewing](#file-viewing)
4. [Code Processing](#code-processing)
5. [Utilities](#utilities)
6. [State Management](#state-management)
7. [Error Handling](#error-handling)

---

## Basic Setup

### Application Entry Point

```tsx
// src/App.tsx
import { ViewerPage } from './pages/ViewerPage';
import './App.css';

function App() {
  return <ViewerPage />;
}

export default App;
```

### With Custom Styling

```tsx
import { ViewerPage } from './pages/ViewerPage';

function App() {
  return (
    <div className="h-screen">
      <ViewerPage />
    </div>
  );
}
```

---

## Using ViewerPage

### Standalone Component

The ViewerPage component manages everything internally:

```tsx
import { ViewerPage } from '@/pages/ViewerPage';

export default function CRXViewer() {
  return <ViewerPage />;
}
```

### Full Example with Error Boundary

```tsx
import { ViewerPage } from '@/pages/ViewerPage';
import { useViewerStore } from '@/store/viewerStore';

function CRXViewerWithErrorBoundary() {
  const error = useViewerStore((state) => state.error);

  return (
    <div className="h-screen flex flex-col">
      {error && (
        <div className="bg-red-50 border border-red-200 p-4">
          <h2 className="text-red-800 font-bold">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      <ViewerPage />
    </div>
  );
}

export default CRXViewerWithErrorBoundary;
```

---

## File Viewing

### Loading a CRX from URL

```tsx
import { useViewerStore } from '@/store/viewerStore';

function LoadCRXButton() {
  const loadCrxFromUrl = useViewerStore((state) => state.loadCrxFromUrl);
  const loadingState = useViewerStore((state) => state.loadingState);

  const handleLoad = async () => {
    // Example: Load Google Chrome extension
    await loadCrxFromUrl(
      'https://chromewebstore.google.com/detail/extension-id'
    );
  };

  return (
    <button
      onClick={handleLoad}
      disabled={loadingState === 'loading'}
      className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
    >
      {loadingState === 'loading' ? 'Loading...' : 'Load Extension'}
    </button>
  );
}
```

### Handling File Selection

```tsx
import { useViewerStore } from '@/store/viewerStore';

function FileNavigator() {
  const { crx, selectedFilePath, selectFile } = useViewerStore();

  if (!crx) return <div>No extension loaded</div>;

  return (
    <div>
      <h2 className="font-bold mb-4">Select a file:</h2>
      <button
        onClick={() => selectFile('manifest.json')}
        className={`block p-2 mb-2 rounded ${
          selectedFilePath === 'manifest.json'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200'
        }`}
      >
        manifest.json
      </button>
      <button
        onClick={() => selectFile('src/main.ts')}
        className={`block p-2 mb-2 rounded ${
          selectedFilePath === 'src/main.ts'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200'
        }`}
      >
        src/main.ts
      </button>
    </div>
  );
}
```

### Displaying File Information

```tsx
import { useViewerStore } from '@/store/viewerStore';
import { formatFileSize } from '@/lib/utils';

function FileInfo() {
  const { crx, selectedFilePath } = useViewerStore();

  if (!crx || !selectedFilePath) {
    return <div>No file selected</div>;
  }

  const fileData = crx.fileCache.get(selectedFilePath);
  if (!fileData) {
    return <div>File data not loaded yet</div>;
  }

  return (
    <div className="p-4 bg-gray-50 rounded">
      <h3 className="font-bold">{selectedFilePath}</h3>
      <p>Size: {formatFileSize(fileData.length)}</p>
      <p>Type: {selectedFilePath.endsWith('.js') ? 'JavaScript' : 'Other'}</p>
    </div>
  );
}
```

---

## Code Processing

### Language Detection

```typescript
import {
  detectLanguageFromPath,
  isImageFile,
  getFileCategory
} from '@/lib/code';

// Detect language from file path
const jsLanguage = detectLanguageFromPath('src/main.js');
console.log(jsLanguage); // 'javascript'

const tsLanguage = detectLanguageFromPath('index.ts');
console.log(tsLanguage); // 'typescript'

// Check if file is an image
const isImg = isImageFile('logo.png');
console.log(isImg); // true

// Get file category
const category = getFileCategory('manifest.json');
console.log(category); // 'data'

// Example categories: 'code' | 'image' | 'data' | 'markup' | 'document'
```

### Syntax Highlighting

```tsx
import { highlightCode, isLanguageSupported } from '@/lib/code';

function CodeHighlighter({ code, language }: { code: string; language: string }) {
  // Check if language is supported
  if (!isLanguageSupported(language)) {
    return <pre>{code}</pre>;
  }

  // Highlight the code
  const result = highlightCode(code, language);

  return (
    <pre className="bg-gray-900 text-white p-4 rounded overflow-auto">
      <code
        dangerouslySetInnerHTML={{ __html: result.html }}
        className={`language-${language}`}
      />
    </pre>
  );
}
```

### Code Beautification

```typescript
import { beautifyCode, canBeautify } from '@/lib/code';

function formatCode(code: string, language: string): string {
  // Check if language supports beautification
  if (!canBeautify(language)) {
    console.warn(`${language} does not support beautification`);
    return code;
  }

  try {
    // Beautify with custom options
    return beautifyCode(code, language, {
      indent_size: 4,
      indent_char: ' ',
      preserve_newlines: true,
      max_preserve_newlines: 2,
    });
  } catch (error) {
    console.error('Beautification failed:', error);
    return code; // Return original on error
  }
}

// Usage
const jsCode = 'const x=1;const y=2;';
const formatted = formatCode(jsCode, 'javascript');
console.log(formatted);
// Output: 'const x = 1;\nconst y = 2;'
```

### Complete Code Processing Pipeline

```tsx
import {
  detectLanguageFromPath,
  isImageFile,
  isTextFile
} from '@/lib/code';
import { highlightCode } from '@/lib/code';
import { beautifyCode, canBeautify } from '@/lib/code';

interface ProcessedCode {
  language: string;
  html: string;
  isBeautified: boolean;
}

function processCode(
  fileContent: string,
  filePath: string
): ProcessedCode {
  // Detect language
  const language = detectLanguageFromPath(filePath);

  // Check if text file
  if (!isTextFile(filePath)) {
    return {
      language: 'text',
      html: `<span>Binary file: ${filePath}</span>`,
      isBeautified: false,
    };
  }

  // Beautify if supported
  let content = fileContent;
  let isBeautified = false;

  if (canBeautify(language)) {
    try {
      content = beautifyCode(fileContent, language);
      isBeautified = true;
    } catch (error) {
      console.warn('Beautification failed, using original');
    }
  }

  // Highlight
  const result = highlightCode(content, language);

  return {
    language: result.language,
    html: result.html,
    isBeautified,
  };
}
```

---

## Utilities

### Hash Calculation

```typescript
import {
  calculateSHA256,
  calculateSHA384,
  calculateSHA512,
  formatHashResult,
  formatFileSize
} from '@/lib/utils';

async function hashFile(fileData: Uint8Array) {
  try {
    // Calculate SHA256
    const sha256Result = await calculateSHA256(fileData);
    console.log(formatHashResult(sha256Result));
    // Output: "SHA-256: a1b2c3d4..."

    // Calculate multiple hashes at once
    const [sha256, sha384, sha512] = await Promise.all([
      calculateSHA256(fileData),
      calculateSHA384(fileData),
      calculateSHA512(fileData),
    ]);

    return {
      sha256: sha256.hash,
      sha384: sha384.hash,
      sha512: sha512.hash,
      size: formatFileSize(fileData.length),
    };
  } catch (error) {
    console.error('Hash calculation failed:', error);
    return null;
  }
}

// Usage
const hashes = await hashFile(someFileData);
console.log(hashes);
// {
//   sha256: "e3b0c44...",
//   sha384: "38b060a...",
//   sha512: "cf83e135...",
//   size: "1.2 MB"
// }
```

### File Downloads

```typescript
import {
  downloadTextFile,
  downloadJsonFile,
  downloadBinaryFile
} from '@/lib/utils';

// Download JavaScript file
function downloadScript(code: string) {
  downloadTextFile(code, 'script.js');
}

// Download JSON configuration
function downloadConfig(config: any) {
  downloadJsonFile(config, 'config.json');
}

// Download binary extension file
function downloadExtension(data: Uint8Array, name: string) {
  downloadBinaryFile(data, name);
}

// Usage
downloadScript('console.log("Hello");');
downloadJsonFile({ version: '1.0.0' }, 'package.json');
downloadBinaryFile(crxData, 'extension.crx');
```

### Clipboard Operations

```typescript
import { copyToClipboard } from '@/lib/utils';

async function copyCodeToClipboard(code: string) {
  try {
    await copyToClipboard(code);
    console.log('Copied to clipboard!');
  } catch (error) {
    console.error('Copy failed:', error);
  }
}

// Usage in React component
function CodeWithCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <button
        onClick={handleCopy}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {copied ? 'Copied!' : 'Copy Code'}
      </button>
      <pre className="bg-gray-900 text-white p-4">{code}</pre>
    </div>
  );
}
```

---

## State Management

### Using Zustand Store

```typescript
import { useViewerStore } from '@/store/viewerStore';

function MyComponent() {
  // Get state
  const {
    crx,                 // Loaded CRX data
    loadingState,        // 'idle' | 'loading' | 'success' | 'error'
    error,               // Error message or null
    selectedFilePath,    // Current file path or null
    fileFilter,          // Filter string

    // Actions
    loadCrx,             // Load from data
    loadCrxFromUrl,      // Load from URL
    selectFile,          // Select file by path
    setFileFilter,       // Set filter pattern
    clearError,          // Clear error
    reset,               // Reset state
  } = useViewerStore();

  // Use state in component
  return (
    <div>
      <p>Status: {loadingState}</p>
      <p>Selected: {selectedFilePath}</p>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### Selecting Files Programmatically

```tsx
import { useViewerStore } from '@/store/viewerStore';

function FileSelector() {
  const selectFile = useViewerStore((state) => state.selectFile);

  return (
    <div className="flex gap-2">
      <button onClick={() => selectFile('src/index.ts')}>
        View Index
      </button>
      <button onClick={() => selectFile('src/main.css')}>
        View Styles
      </button>
      <button onClick={() => selectFile('manifest.json')}>
        View Manifest
      </button>
    </div>
  );
}
```

### Loading Extensions

```tsx
import { useViewerStore } from '@/store/viewerStore';
import { useState } from 'react';

function ExtensionLoader() {
  const [url, setUrl] = useState('');
  const { loadCrxFromUrl, loadingState, error } = useViewerStore();

  const handleLoad = async () => {
    await loadCrxFromUrl(url);
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Chrome Web Store URL"
        className="w-full px-4 py-2 border rounded"
      />

      <button
        onClick={handleLoad}
        disabled={loadingState === 'loading'}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
      >
        {loadingState === 'loading' ? 'Loading...' : 'Load Extension'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Error Handling

### Global Error Handling

```tsx
import { useViewerStore } from '@/store/viewerStore';

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const { error, clearError } = useViewerStore();

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={clearError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
```

### Component-Level Error Handling

```tsx
import { calculateSHA256 } from '@/lib/utils';
import { useState } from 'react';

function HashCalculator({ fileData }: { fileData: Uint8Array }) {
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await calculateSHA256(fileData);
      setHash(result.hash);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to calculate hash'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCalculate}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
      >
        {isLoading ? 'Calculating...' : 'Calculate Hash'}
      </button>

      {hash && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-gray-600">SHA-256:</p>
          <code className="block font-mono break-all">{hash}</code>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Complete Application Example

```tsx
import { useState } from 'react';
import { ViewerPage } from '@/pages/ViewerPage';
import { useViewerStore } from '@/store/viewerStore';

function CompleteApp() {
  const [showStats, setShowStats] = useState(false);
  const { crx } = useViewerStore();

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">CRX Review</h1>
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-800"
          >
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
        </div>
      </header>

      {/* Stats Panel */}
      {showStats && crx && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Extension ID</p>
              <code className="font-mono text-blue-900">{crx.extensionId}</code>
            </div>
            <div>
              <p className="text-sm text-gray-600">Files</p>
              <p className="font-semibold text-blue-900">
                {crx.fileTree.children.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Loaded At</p>
              <p className="font-semibold text-blue-900">
                {crx.loadedAt.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Viewer */}
      <main className="flex-1 min-h-0">
        <ViewerPage />
      </main>
    </div>
  );
}

export default CompleteApp;
```

---

## Testing Examples

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileTree } from '@/components/viewer/FileTree';
import type { FileTreeNode } from '@/lib/zip/file-tree';

describe('FileTree', () => {
  const mockNode: FileTreeNode = {
    name: 'root',
    path: '',
    isDirectory: true,
    size: 0,
    compressedSize: 0,
    date: new Date(),
    children: [
      {
        name: 'src',
        path: 'src',
        isDirectory: true,
        size: 0,
        compressedSize: 0,
        date: new Date(),
        children: [],
      },
    ],
  };

  it('renders file tree', () => {
    render(<FileTree node={mockNode} />);
    expect(screen.getByText('src')).toBeInTheDocument();
  });
});
```

### Utility Testing

```typescript
import { detectLanguageFromPath, isImageFile } from '@/lib/code';

describe('Language Detector', () => {
  it('detects JavaScript files', () => {
    expect(detectLanguageFromPath('app.js')).toBe('javascript');
  });

  it('detects TypeScript files', () => {
    expect(detectLanguageFromPath('app.ts')).toBe('typescript');
  });

  it('identifies image files', () => {
    expect(isImageFile('logo.png')).toBe(true);
    expect(isImageFile('app.js')).toBe(false);
  });
});
```

---

## Tips & Best Practices

1. **Always check language support before beautifying**
   ```typescript
   if (canBeautify(language)) {
     const formatted = beautifyCode(code, language);
   }
   ```

2. **Handle hashing in try-catch for production**
   ```typescript
   try {
     const result = await calculateSHA256(data);
   } catch (error) {
     console.error('Hash failed, continuing without hash');
   }
   ```

3. **Cache file data to avoid re-loading**
   ```typescript
   const cached = crx.fileCache.get(path);
   if (cached) return cached;
   ```

4. **Use proper TypeScript types**
   ```typescript
   import type { FileTreeNode, LoadedCrx } from '@/types/index';
   ```

5. **Optimize large files with virtual scrolling** (future enhancement)

---

**For more examples and API details, see COMPONENT_REFERENCE.md**
