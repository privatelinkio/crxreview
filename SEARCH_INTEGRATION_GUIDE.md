# Search and Filtering Integration Guide

This guide explains how to integrate the search and filtering components into your application.

## Quick Start

### 1. Basic Setup

Import the necessary components and hooks:

```tsx
import { FileFilter } from '@/components/viewer/FileFilter';
import { ContentSearch } from '@/components/viewer/ContentSearch';
import { SearchAndFilterPanel } from '@/components/viewer/SearchAndFilterPanel';
import { useFileFilter } from '@/hooks/useFileFilter';
import { useContentSearch } from '@/hooks/useContentSearch';
import { useSearchStore } from '@/store';
```

### 2. Using the Integrated Panel (Easiest)

For most use cases, use the pre-built integrated panel:

```tsx
export function ViewerPage() {
  return (
    <div>
      <SearchAndFilterPanel
        onSelectFile={(filePath) => {
          console.log('File selected:', filePath);
        }}
        onSelectMatch={(filePath, match) => {
          console.log('Match selected:', match);
        }}
      />
    </div>
  );
}
```

### 3. Custom Implementation

If you need more control, compose the components yourself:

```tsx
export function CustomViewer() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filter = useFileFilter();
  const crx = useViewerStore(state => state.crx);

  return (
    <>
      <div className="toolbar">
        <button onClick={() => setIsSearchOpen(true)}>Search</button>
        <button onClick={() => setIsFilterOpen(!isFilterOpen)}>Filter</button>
      </div>

      {isFilterOpen && (
        <FileFilter onFilterChange={() => {}} />
      )}

      <ContentSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        files={/* prepare file list */}
        onSelectMatch={(fileId, filePath, match) => {
          // Handle match selection
        }}
      />
    </>
  );
}
```

## File Filtering Implementation

### Basic Filtering

```tsx
import { useFileFilter } from '@/hooks/useFileFilter';
import { useViewerStore } from '@/store';
import { getAllFiles } from '@/lib/zip/file-tree';

function FileList() {
  const crx = useViewerStore(state => state.crx);
  const filter = useFileFilter();

  // Get filtered files
  const filteredTree = filter.getFilteredTree(crx.fileTree);
  const filteredFiles = getAllFiles(filteredTree);

  return (
    <div>
      <FileFilter />
      <ul>
        {filteredFiles.map(file => (
          <li key={file.path}>{file.name}</li>
        ))}
      </ul>
      <p>Showing {filteredFiles.length} files</p>
    </div>
  );
}
```

### Programmatic Filtering

```tsx
import { filterFileTree, getMatchingFiles } from '@/lib/search/file-filter';

function FilterExample() {
  const crx = useViewerStore(state => state.crx);

  // Method 1: Filter the tree structure
  const filtered = filterFileTree(crx.fileTree, {
    namePattern: '*.js',
    useRegex: false,
    caseSensitive: false,
    categories: ['code'],
  });

  // Method 2: Get matching file paths
  const matches = getMatchingFiles(crx.fileTree, {
    namePattern: 'src/**/*.ts',
  });

  return <div>Found {matches.length} files</div>;
}
```

### Filter with Store

```tsx
import { useSearchStore } from '@/store';

function StoreFilterExample() {
  const store = useSearchStore();

  return (
    <div>
      <input
        value={store.fileFilterPattern}
        onChange={(e) =>
          store.setFileFilterPattern(e.target.value)
        }
        placeholder="Filter pattern..."
      />

      <label>
        <input
          type="checkbox"
          checked={store.fileFilterUseRegex}
          onChange={(e) =>
            store.setFileFilterUseRegex(e.target.checked)
          }
        />
        Use Regex
      </label>

      <button onClick={() => store.clearFileFilter()}>
        Clear Filter
      </button>
    </div>
  );
}
```

## Content Search Implementation

### Basic Search

```tsx
import { useContentSearch } from '@/hooks/useContentSearch';

function SearchExample() {
  const search = useContentSearch();
  const [files, setFiles] = useState<Array<{
    fileId: string;
    filePath: string;
    content: string;
  }>>([]);

  const handleSearch = async () => {
    await search.search(files, {
      caseSensitive: false,
      wholeWord: false,
      useRegex: false,
    });
  };

  return (
    <div>
      <input
        value={search.query}
        onChange={(e) => search.setQuery(e.target.value)}
        placeholder="Search..."
      />
      <button onClick={handleSearch}>Search</button>

      <div>
        <p>Total matches: {search.totalMatches}</p>
        {search.results.map(result => (
          <div key={result.fileId}>
            <h3>{result.filePath}</h3>
            <p>{result.matchCount} matches</p>
          </div>
        ))}
      </div>

      {search.isSearching && <p>Searching...</p>}
      {search.error && <p>Error: {search.error}</p>}
    </div>
  );
}
```

### Search Modal

```tsx
import { ContentSearch } from '@/components/viewer/ContentSearch';

function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const files = [
    { fileId: 'id1', filePath: 'index.js', content: '...' },
    { fileId: 'id2', filePath: 'style.css', content: '...' },
  ];

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Search</button>
      <ContentSearch
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        files={files}
        onSelectMatch={(fileId, filePath, match) => {
          console.log('Selected match in', filePath);
          // Handle selection
        }}
      />
    </>
  );
}
```

## Loading File Content

To search file contents, you need to load them from the CRX data:

```tsx
import { useViewerStore } from '@/store';
import { getAllFiles } from '@/lib/zip/file-tree';
import { useAsync } from 'react-use';

function LoadAndSearch() {
  const crx = useViewerStore(state => state.crx);
  const [files, setFiles] = useState([]);

  useAsync(async () => {
    if (!crx) return;

    const allFiles = getAllFiles(crx.fileTree);
    const fileContents = await Promise.all(
      allFiles.map(async (file) => {
        // Load file content from crx.fileCache or extract from CRX
        const content = await loadFileContent(crx, file.path);
        return {
          fileId: file.path,
          filePath: file.path,
          content,
        };
      })
    );

    setFiles(fileContents);
  }, [crx]);

  return <ContentSearch files={files} {...props} />;
}

// Helper function to load file content
async function loadFileContent(crx: LoadedCrx, filePath: string): Promise<string> {
  // Check cache first
  if (crx.fileCache.has(filePath)) {
    const data = crx.fileCache.get(filePath);
    return new TextDecoder().decode(data);
  }

  // Extract from ZIP if not in cache
  // This depends on your extraction implementation
  return '';
}
```

## State Management with Store

The search store provides global state management:

```tsx
import { useSearchStore } from '@/store';

function StatusBar() {
  const store = useSearchStore();

  return (
    <div>
      {store.fileFilterPattern && (
        <span>Filter: {store.fileFilterPattern}</span>
      )}

      {store.contentSearchIsActive && (
        <span>
          Found {store.contentSearchResults.length} files with{' '}
          {store.contentSearchResults.reduce(
            (sum, r) => sum + r.matchCount,
            0
          )}{' '}
          matches
        </span>
      )}

      {store.selectedSearchMatch && (
        <span>
          Selected: {store.selectedSearchFile}:{' '}
          {store.selectedSearchMatch.lineNumber}
        </span>
      )}
    </div>
  );
}
```

## Advanced Patterns

### Filter then Search

Search only within filtered files:

```tsx
function FilteredSearch() {
  const filter = useFileFilter();
  const search = useContentSearch();
  const crx = useViewerStore(state => state.crx);

  const handleSearch = async () => {
    // Get filtered files
    const matchingPaths = filter.getMatchingFilePaths(
      crx.fileTree
    );

    // Only search these files
    const filesToSearch = await loadFiles(matchingPaths);
    await search.search(filesToSearch);
  };

  return (
    <>
      <FileFilter />
      <button onClick={handleSearch}>Search in Filtered Files</button>
    </>
  );
}
```

### Real-time Search

Search as user types:

```tsx
function RealtimeSearch() {
  const search = useContentSearch();
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (search.query.length > 2) {
      search.search(files);
    }
  }, [search.query]);

  return (
    <div>
      <input
        value={search.query}
        onChange={(e) => search.setQuery(e.target.value)}
        placeholder="Search as you type..."
      />
      <Results results={search.results} />
    </div>
  );
}
```

### Search History

Save and recall searches:

```tsx
function SearchWithHistory() {
  const search = useContentSearch();
  const [history, setHistory] = useState<string[]>([]);

  const handleSearch = async (query: string) => {
    search.setQuery(query);
    await search.search(files);
    setHistory([query, ...history.filter(h => h !== query)]);
  };

  return (
    <div>
      <input
        value={search.query}
        onChange={(e) => search.setQuery(e.target.value)}
        list="search-history"
      />
      <datalist id="search-history">
        {history.map(item => (
          <option key={item} value={item} />
        ))}
      </datalist>
      <button
        onClick={() =>
          handleSearch(search.query)
        }
      >
        Search
      </button>
    </div>
  );
}
```

### Export Results

Export search results:

```tsx
function ExportResults() {
  const search = useContentSearch();

  const handleExport = () => {
    const csv = [
      ['File', 'Matches', 'Line Numbers'],
      ...search.results.map(r => [
        r.filePath,
        r.matchCount,
        r.matches.map(m => m.lineNumber).join(', '),
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    downloadFile(csv, 'search-results.csv');
  };

  return (
    <button
      disabled={search.results.length === 0}
      onClick={handleExport}
    >
      Export Results ({search.totalMatches} matches)
    </button>
  );
}
```

## Performance Optimization

### Lazy Load File Content

Only load content when needed:

```tsx
const lazyLoadFiles = async (
  tree: FileTreeNode,
  filter: FileFilterConfig
) => {
  const matchingPaths = getMatchingFiles(tree, filter);

  return matchingPaths
    .slice(0, 100) // Load first 100 only
    .map(path => ({
      filePath: path,
      fileId: path,
      content: '', // Load on demand
    }));
};
```

### Virtual Scrolling

For large result sets, use virtual scrolling:

```tsx
import { FixedSizeList } from 'react-window';

function VirtualResultList({ results }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={results.length}
      itemSize={35}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {results[index].filePath}
        </div>
      )}
    </FixedSizeList>
  );
}
```

### Debounce Filters

Debounce filter changes to avoid excessive recalculations:

```tsx
import { useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';

function DebouncedFilter() {
  const filter = useFileFilter();

  const debouncedSetPattern = useDebouncedCallback(
    (pattern: string) => {
      filter.setNamePattern(pattern);
    },
    300
  );

  return (
    <input
      onChange={(e) =>
        debouncedSetPattern(e.target.value)
      }
      placeholder="Type to filter..."
    />
  );
}
```

## Testing

### Unit Test Example

```tsx
import { renderHook, act } from '@testing-library/react';
import { useFileFilter } from '@/hooks/useFileFilter';

test('useFileFilter updates pattern', () => {
  const { result } = renderHook(() => useFileFilter());

  act(() => {
    result.current.setNamePattern('*.js');
  });

  expect(result.current.namePattern).toBe('*.js');
});
```

### Integration Test Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FileFilter } from '@/components/viewer/FileFilter';

test('FileFilter renders and updates', () => {
  const onChange = jest.fn();
  render(<FileFilter onFilterChange={onChange} />);

  const input = screen.getByPlaceholderText(/filter/i);
  fireEvent.change(input, { target: { value: '*.js' } });

  expect(onChange).toHaveBeenCalled();
});
```

## Troubleshooting

### Searches returning no results

1. Check file content is loaded
2. Verify pattern syntax
3. Check case sensitivity setting
4. Test with simpler pattern

### Filter not showing any files

1. Verify filter pattern is valid
2. Check file paths match pattern
3. Ensure categories include desired files
4. Test clearing filters

### Performance issues

1. Reduce number of files in search
2. Use more specific patterns
3. Enable Web Worker
4. Check for binary files

## API Reference

See `SEARCH_IMPLEMENTATION.md` for complete API documentation.
