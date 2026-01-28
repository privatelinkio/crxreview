# Hooks Guide - API Reference

Quick reference for using the custom hooks in CRXReview.

## useUrlState()

Synchronizes viewer state with URL query parameters. Call once in your route component to enable URL state management.

### Basic Usage

```tsx
import { useUrlState } from '@/hooks/useUrlState';

export function ViewerPage() {
  // Initialize URL state sync - loads from URL params on mount
  useUrlState();

  // Rest of component code...
  return <div>Viewer</div>;
}
```

### What It Does

**On Mount:**
- Parses URL query parameters
- Loads extension if `?url=` parameter present
- Selects initial file if `?file=` parameter present
- Sets search query if `?search=` parameter present

**During Lifetime:**
- Updates URL when file selection changes
- Updates URL when search query changes
- Syncs changes to useViewerStore and useSearchStore

### URL Examples

```
# Landing page
/#/

# Viewer (empty, load extension manually)
/#/app

# Viewer with extension pre-loaded
/#/app?url=abcdef123456

# Load extension and select file
/#/app?url=chrome://webstore/detail/abcdef123456&file=src/background.js

# Load extension and search
/#/app?url=chrome://webstore/detail/abcdef123456&search=onclick

# All parameters
/#/app?url=abcdef&file=manifest.json&search=permissions
```

### Parameters Explained

| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Chrome Web Store URL or extension ID. Downloads and loads the extension. |
| `file` | string | Yes | Path to file in extension to pre-select (e.g., `manifest.json`) |
| `search` | string | Yes | Initial content search query |

### Return Value

```tsx
interface ReturnValue {
  urlParams: {
    url?: string;
    file?: string;
    search?: string;
  }
}
```

## useCrxLoader()

Loads CRX files from URLs, extension IDs, or file uploads.

### Basic Usage

```tsx
import { useCrxLoader } from '@/hooks/useCrxLoader';

export function TopBar() {
  const { loadFromUrl, loadFromFile, isLoading, error, crx } = useCrxLoader();

  const handleUrlInput = async (input: string) => {
    await loadFromUrl(input);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await loadFromFile(file);
    }
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {crx && <p>Loaded: {crx.extensionId}</p>}

      <input
        type="text"
        onBlur={(e) => handleUrlInput(e.target.value)}
        placeholder="Enter extension URL or ID"
      />

      <input
        type="file"
        onChange={handleFileUpload}
        accept=".crx"
      />
    </div>
  );
}
```

### API Methods

#### loadFromUrl(input: string)

Loads a CRX file from a URL or extension ID.

```tsx
// Load from Chrome Web Store URL
await loadFromUrl('https://chrome.google.com/webstore/detail/abcdef123456');

// Load from extension ID only
await loadFromUrl('abcdef123456');

// Load with error handling
try {
  await loadFromUrl(userInput);
} catch (error) {
  console.error('Failed to load:', error);
}
```

#### loadFromFile(file: File)

Loads a CRX file from a File object (e.g., from file input).

```tsx
const file = event.target.files?.[0];
if (file) {
  await loadFromFile(file);
}
```

**Note:** Extension ID is extracted from filename if named like `extension-id.crx`

### Return Value

```tsx
{
  loadFromUrl: (input: string) => Promise<void>;
  loadFromFile: (file: File) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  crx: LoadedCrx | null;
}
```

### State Management

State is managed by `useViewerStore`:
- `crx` - Loaded extension data
- `loadingState` - 'idle' | 'loading' | 'success' | 'error'
- `error` - Error message if loading failed

## useFileSelection()

Manages file selection state in the file tree.

### Basic Usage

```tsx
import { useFileSelection } from '@/hooks/useFileSelection';

export function FileTree({ node }) {
  const {
    selectFile,
    selectedFilePath,
    isSelected,
    getSelectedFileName
  } = useFileSelection();

  return (
    <div>
      <p>Selected: {getSelectedFileName() || 'None'}</p>
      <button onClick={() => selectFile('manifest.json')}>
        Select manifest.json
      </button>
      <button onClick={() => {
        const selected = isSelected('background.js');
        console.log('background.js selected?', selected);
      }}>
        Check background.js
      </button>
    </div>
  );
}
```

### API Methods

#### selectFile(path: string)

Select a file by its path in the extension.

```tsx
selectFile('src/background.js');
selectFile('manifest.json');
selectFile('lib/utils.js');
```

#### deselectFile()

Clear the current file selection.

```tsx
deselectFile();
```

#### isSelected(path: string)

Check if a specific file is currently selected.

```tsx
if (isSelected('manifest.json')) {
  console.log('manifest.json is selected');
}
```

#### getSelectedFileName()

Get just the filename (last part of path) of the selected file.

```tsx
const fileName = getSelectedFileName();
console.log(fileName); // 'background.js' (not 'src/background.js')
```

### Return Value

```tsx
{
  selectedFilePath: string | null;
  selectFile: (path: string) => void;
  deselectFile: () => void;
  isSelected: (path: string) => boolean;
  getSelectedFileName: () => string;
  hasSelection: boolean;
}
```

## Complete Example Component

```tsx
import { useUrlState } from '@/hooks/useUrlState';
import { useCrxLoader } from '@/hooks/useCrxLoader';
import { useFileSelection } from '@/hooks/useFileSelection';

export function ViewerPage() {
  // Initialize URL state sync
  useUrlState();

  // Get CRX loader functions
  const { loadFromUrl, isLoading, error } = useCrxLoader();

  // Get file selection functions
  const { selectFile, selectedFilePath, getSelectedFileName } = useFileSelection();

  const handleLoadExtension = async () => {
    const url = prompt('Enter extension URL or ID:');
    if (url) {
      await loadFromUrl(url);
    }
  };

  const handleSelectFile = (path: string) => {
    selectFile(path);
  };

  return (
    <div>
      {/* Header */}
      <header>
        <button onClick={handleLoadExtension} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load Extension'}
        </button>
        {error && <p className="text-red-600">Error: {error}</p>}
      </header>

      {/* Main content */}
      <main>
        <div>
          <p>Selected file: {getSelectedFileName() || 'None'}</p>
          <button onClick={() => handleSelectFile('manifest.json')}>
            Select manifest.json
          </button>
          <button onClick={() => handleSelectFile('src/background.js')}>
            Select background.js
          </button>
        </div>
      </main>
    </div>
  );
}
```

## Integration with Stores

These hooks integrate with Zustand stores for state management:

### useViewerStore
```tsx
// Hook uses these store actions:
store.loadCrxFromUrl(url)    // Download and load extension
store.selectFile(path)       // Select file in tree
store.crx                    // Currently loaded extension
store.selectedFilePath       // Currently selected file
```

### useSearchStore
```tsx
// Hook uses these store actions:
store.setContentSearchQuery(query)  // Update search
store.contentSearchQuery             // Current search
```

## Common Patterns

### Load Extension from URL Parameter

```tsx
// Automatically done by useUrlState()
// Example URL: /#/app?url=abcdef123456

export function ViewerPage() {
  useUrlState(); // Handles the loading automatically
}
```

### Load Extension from User Input

```tsx
export function TopBar() {
  const { loadFromUrl, isLoading, error } = useCrxLoader();
  const [input, setInput] = useState('');

  const handleLoad = async () => {
    if (input.trim()) {
      await loadFromUrl(input);
      setInput('');
    }
  };

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleLoad()}
        placeholder="Extension URL or ID"
      />
      <button onClick={handleLoad} disabled={isLoading}>
        Load
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
```

### Upload CRX File

```tsx
export function FileUpload() {
  const { loadFromFile, isLoading } = useCrxLoader();

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.crx')) {
      await loadFromFile(file);
    }
  };

  return (
    <input
      type="file"
      accept=".crx"
      onChange={handleFileInput}
      disabled={isLoading}
    />
  );
}
```

### Share Current View

```tsx
export function ShareButton() {
  const { selectedFilePath } = useFileSelection();
  const { contentSearchQuery } = useSearchStore();

  const generateShareLink = () => {
    const params = new URLSearchParams();

    if (selectedFilePath) {
      params.set('file', selectedFilePath);
    }

    if (contentSearchQuery) {
      params.set('search', contentSearchQuery);
    }

    const link = `${window.location.origin}${window.location.pathname}#/app?${params.toString()}`;
    return link;
  };

  return (
    <button onClick={() => {
      const link = generateShareLink();
      navigator.clipboard.writeText(link);
      alert('Share link copied!');
    }}>
      Share Current View
    </button>
  );
}
```

## Error Handling

### Handle Loading Errors

```tsx
const { loadFromUrl, isLoading, error } = useCrxLoader();

useEffect(() => {
  if (error) {
    console.error('Loading failed:', error);
    // Show error UI to user
  }
}, [error]);
```

### Validate Input

```tsx
const handleLoadExtension = async (input: string) => {
  if (!input.trim()) {
    alert('Please enter a URL or extension ID');
    return;
  }

  try {
    await loadFromUrl(input);
  } catch (error) {
    console.error('Failed to load:', error);
  }
};
```

## TypeScript Definitions

All hooks are fully typed:

```tsx
import type { LoadedCrx } from '@/types/index';
import type { SearchState } from '@/store/searchStore';

// Hook return types are automatically inferred
const { loadFromUrl } = useCrxLoader();
// loadFromUrl: (input: string) => Promise<void>

const { selectFile, selectedFilePath } = useFileSelection();
// selectFile: (path: string) => void
// selectedFilePath: string | null
```

## Debugging

### Log URL State

```tsx
export function ViewerPage() {
  const { urlParams } = useUrlState();

  useEffect(() => {
    console.log('URL params:', urlParams);
  }, [urlParams]);
}
```

### Log Store State

```tsx
import { useViewerStore } from '@/store/viewerStore';
import { useSearchStore } from '@/store/searchStore';

useEffect(() => {
  const unsubscribeViewer = useViewerStore.subscribe(
    (state) => state,
    (state) => console.log('Viewer state:', state)
  );

  const unsubscribeSearch = useSearchStore.subscribe(
    (state) => state,
    (state) => console.log('Search state:', state)
  );

  return () => {
    unsubscribeViewer();
    unsubscribeSearch();
  };
}, []);
```

## Performance Tips

1. **Avoid unnecessary re-renders:** Use selectors in hooks
   ```tsx
   const selectFile = useFileSelection();
   // Instead of getting all state, the hook only returns needed properties
   ```

2. **Memoize callbacks:** Wrap expensive operations
   ```tsx
   const handleLoad = useCallback(async (input: string) => {
     await loadFromUrl(input);
   }, [loadFromUrl]);
   ```

3. **Debounce URL updates:** State sync already handles this
   ```tsx
   // URL is updated via useEffect with proper dependencies
   // No excessive history updates
   ```

## Best Practices

1. **Always call useUrlState() in route components** to enable URL synchronization
2. **Check isLoading state** before showing loaded content
3. **Display error messages** to users when loading fails
4. **Use proper TypeScript types** for better IDE support
5. **Memoize event handlers** in components with many re-renders
6. **Test URL parameters** when sharing links
7. **Validate user input** before loading extensions
