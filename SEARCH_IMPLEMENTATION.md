# Search and Filtering Implementation

This document describes the search and filtering functionality implemented for CRX Review.

## Overview

The search and filtering system consists of several interconnected modules:

1. **File Filtering** - Filter files by name pattern and type category
2. **Content Search** - Full-text search across file contents
3. **Search Worker** - Background processing with Web Worker
4. **UI Components** - React components for user interaction
5. **Custom Hooks** - State management for search and filter operations
6. **Zustand Store** - Global state management

## Architecture

### File Structure

```
src/
├── lib/search/
│   ├── file-filter.ts           # File filtering utilities
│   ├── content-search.ts        # Content search utilities
│   ├── search.worker.ts         # Web Worker for background search
│   └── index.ts                 # Module exports
├── hooks/
│   ├── useFileFilter.ts         # File filter state management
│   └── useContentSearch.ts      # Content search state management
├── components/viewer/
│   ├── FileFilter.tsx           # File filter UI component
│   ├── ContentSearch.tsx        # Search modal component
│   └── SearchAndFilterPanel.tsx # Integrated panel component
├── store/
│   ├── searchStore.ts           # Zustand search store
│   └── index.ts                 # Store exports
```

## Core Modules

### 1. File Filter (`src/lib/search/file-filter.ts`)

File filtering provides regex-based filename matching and file type categorization.

#### Features

- **Glob-like patterns**: `*.js`, `src/**/*.ts`, `??.txt`
- **Regex patterns**: Full regex support with optional case sensitivity
- **File type categories**: Images, Code, Markup, Locales, Misc
- **Tree filtering**: Preserves directory structure while filtering files

#### Key Functions

```typescript
// Create a filter pattern
const pattern = createFilterPattern('*.js', false, false);

// Match a filename
const matches = matchesPattern('index.js', pattern);

// Get file category
const category = getFileTypeCategory('style.css');

// Filter entire file tree
const filtered = filterFileTree(tree, {
  namePattern: '*.js',
  useRegex: false,
  caseSensitive: false,
  categories: ['code'],
});

// Get matching files
const files = getMatchingFiles(tree, filterConfig);
```

#### File Type Categories

- **Images**: PNG, JPG, JPEG, GIF, SVG, WebP, ICO
- **Code**: JS, TS, TSX, JSX, MJS, CJS
- **Markup**: HTML, CSS, SCSS, LESS, XML, JSON, YAML
- **Locales**: _locales/*.json, messages.json
- **Misc**: Everything else

### 2. Content Search (`src/lib/search/content-search.ts`)

Full-text search across file contents with context and highlighting.

#### Features

- **Pattern matching**: Case-sensitive/insensitive, whole-word, regex
- **Context lines**: Automatically include surrounding lines
- **Text highlighting**: Wrap matches in HTML tags
- **Match preview**: Generate snippet with match highlighted
- **Result sorting**: Sort by relevance and file path
- **Statistics**: Track total matches and files

#### Key Functions

```typescript
// Create search pattern
const pattern = createSearchPattern(
  'TODO',
  false,  // caseSensitive
  false,  // wholeWord
  false   // useRegex
);

// Search content
const matches = searchContent(content, pattern, {
  contextLines: 3,
});

// Highlight matches
const highlighted = highlightMatches(text, pattern);

// Get preview
const preview = getMatchPreview(match, 100);

// Sort results
const sorted = sortSearchResults(results);

// Get statistics
const stats = getSearchStatistics(results);
```

### 3. Search Worker (`src/lib/search/search.worker.ts`)

Web Worker for background search processing to prevent UI blocking on large files.

#### Features

- **Background processing**: Non-blocking full-text search
- **Progress reporting**: Real-time updates on search progress
- **Text detection**: Automatically skip binary files
- **Cancellation**: Ability to cancel ongoing search
- **Error handling**: Graceful error handling per file

#### Communication Protocol

```typescript
// Send search request
worker.postMessage({
  type: 'search',
  searchId: 'search-123',
  query: 'TODO',
  options: {
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
  },
  files: [
    { fileId: 'file-1', filePath: 'index.js', content: '...' },
  ],
});

// Receive progress updates
worker.onmessage = (event) => {
  if (event.data.type === 'progress') {
    console.log(event.data.progress);
  }
};

// Receive results
// {
//   type: 'complete',
//   results: FileSearchResult[]
// }

// Cancel search
worker.postMessage({ type: 'cancel' });
```

## Custom Hooks

### useFileFilter

Manages file filtering state and provides convenient methods for filter operations.

```typescript
const filter = useFileFilter();

// State
filter.namePattern           // Current filter pattern
filter.useRegex             // Whether using regex
filter.caseSensitive        // Whether case-sensitive
filter.selectedCategories   // Selected file type categories
filter.patternError         // Validation error message
filter.isActive             // Whether any filters are active

// Methods
filter.setNamePattern(pattern)
filter.setUseRegex(useRegex)
filter.setCaseSensitive(caseSensitive)
filter.toggleCategory(category)
filter.setSelectedCategories(categories)
filter.clearFilters()
filter.getFilteredTree(tree)          // Returns filtered tree
filter.getMatchingFilePaths(tree)     // Returns matching file paths
```

### useContentSearch

Manages content search state and operations with Web Worker support.

```typescript
const search = useContentSearch();

// State
search.query                 // Current search query
search.isSearching          // Whether search is in progress
search.results              // Array of FileSearchResult
search.progress             // Current search progress
search.error                // Error message if any
search.statistics           // Search statistics
search.totalMatches         // Total number of matches

// Methods
search.setQuery(query)
search.search(files, options)        // Perform search
search.cancel()                      // Cancel ongoing search
search.clearResults()                // Clear results
search.getNextMatch(currentIndex)    // Navigate to next result
search.getPreviousMatch(currentIndex) // Navigate to previous result
```

## UI Components

### FileFilter Component

Provides user interface for file filtering with pattern input and category selection.

```tsx
<FileFilter
  onFilterChange={() => console.log('filter changed')}
  className="custom-class"
/>
```

**Features:**
- Text input for filename patterns
- Regex mode toggle
- Case sensitivity toggle
- File type category checkboxes
- Pattern validation with error display
- Clear filters button
- Active filter status display

### ContentSearch Component

Modal-based search interface with results navigation.

```tsx
<ContentSearch
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  files={[
    { fileId: 'id1', filePath: 'index.js', content: '...' },
  ]}
  onSelectMatch={(fileId, filePath, match) => {
    console.log('Match selected', match);
  }}
/>
```

**Features:**
- Search input with options (case-sensitive, whole-word, regex)
- Real-time search with progress indication
- Results grouped by file with match counts
- Match navigation within and between files
- Context preview with highlighting
- Statistics display
- Search cancellation

### SearchAndFilterPanel Component

Integrated panel combining both search and filtering.

```tsx
<SearchAndFilterPanel
  onSelectFile={(filePath) => {}}
  onSelectMatch={(filePath, match) => {}}
/>
```

## Zustand Store

Global state management for search and filtering operations.

```typescript
import { useSearchStore } from '@/store';

const store = useSearchStore();

// File filter state
store.fileFilterPattern
store.fileFilterUseRegex
store.fileFilterCaseSensitive
store.fileFilterCategories

// Content search state
store.contentSearchQuery
store.contentSearchResults
store.contentSearchIsActive
store.selectedSearchMatch
store.selectedSearchFile

// UI state
store.isSearchPanelOpen
store.isFilterPanelOpen

// File filter actions
store.setFileFilterPattern(pattern)
store.setFileFilterUseRegex(useRegex)
store.setFileFilterCaseSensitive(caseSensitive)
store.setFileFilterCategories(categories)
store.toggleFileFilterCategory(category)
store.clearFileFilter()

// Content search actions
store.setContentSearchQuery(query)
store.setContentSearchResults(results)
store.setContentSearchIsActive(isActive)
store.setSelectedSearchMatch(match, filePath)
store.clearContentSearch()

// UI actions
store.setSearchPanelOpen(isOpen)
store.setFilterPanelOpen(isOpen)

// Global reset
store.reset()
```

## Usage Examples

### Basic File Filtering

```typescript
import { useFileFilter } from '@/hooks/useFileFilter';

function MyComponent() {
  const filter = useFileFilter();
  const crx = useViewerStore(state => state.crx);

  const filtered = filter.getFilteredTree(crx.fileTree);

  return (
    <div>
      <FileFilter />
      <FileList files={getAllFiles(filtered)} />
    </div>
  );
}
```

### Content Search

```typescript
import { useContentSearch } from '@/hooks/useContentSearch';

function SearchComponent() {
  const search = useContentSearch();

  const handleSearch = async () => {
    const files = [
      { fileId: 'id1', filePath: 'index.js', content: '...' },
    ];
    await search.search(files);
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
        {search.results.map(result => (
          <div key={result.fileId}>
            <h3>{result.filePath}</h3>
            <p>{result.matchCount} matches</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Using the Store

```typescript
import { useSearchStore } from '@/store';

function StoreExample() {
  const searchStore = useSearchStore();

  return (
    <div>
      <input
        value={searchStore.fileFilterPattern}
        onChange={(e) =>
          searchStore.setFileFilterPattern(e.target.value)
        }
      />

      <button onClick={() => searchStore.clearFileFilter()}>
        Clear Filter
      </button>
    </div>
  );
}
```

## Performance Considerations

### Web Worker Usage

The search system uses Web Workers to prevent UI blocking:

1. **Large files**: Files larger than ~1MB are processed in the background
2. **Progress reporting**: Real-time updates prevent perceived slowness
3. **Cancellation**: Users can cancel searches if needed
4. **Fallback**: Main-thread fallback if Workers are unavailable

### Optimization Strategies

1. **Lazy evaluation**: File tree filtering only processes on demand
2. **Memoization**: React useMemo hooks prevent unnecessary recalculations
3. **Text detection**: Binary files are skipped automatically
4. **Pattern caching**: Compiled regex patterns are reused

## Testing

### Unit Testing

Test files should cover:

```typescript
// File filter tests
- Pattern matching (glob and regex)
- Category detection
- Tree filtering
- File path matching

// Content search tests
- Pattern creation
- Match finding
- Context extraction
- Result sorting

// Integration tests
- Hook state management
- Component rendering
- Store updates
```

### Integration Testing

Test user workflows:

1. Enter filter pattern → see filtered files
2. Select file type → see filtered files
3. Enter search query → see results with progress
4. Navigate results → file selected
5. Clear filters/search → state reset

## Browser Compatibility

- **Web Worker**: All modern browsers
- **Regex**: All modern browsers
- **File API**: All modern browsers
- **Fallback**: Main-thread search if Worker unavailable

## Future Enhancements

1. **Search History**: Save recent searches
2. **Advanced Filters**: More filter options (size, date, etc.)
3. **Export Results**: Export search results to CSV/JSON
4. **Replace**: Find and replace functionality
5. **Search Bookmarks**: Save common searches
6. **Fuzzy Search**: Approximate pattern matching
7. **Performance Indexing**: Pre-index files for faster search

## Troubleshooting

### Searches are slow

1. Check file count and size
2. Use more specific patterns
3. Enable case sensitivity (faster)
4. Check browser console for errors

### Patterns not matching

1. Check pattern syntax (glob vs regex)
2. Test pattern with example files
3. Verify case sensitivity setting
4. Use pattern validation

### Worker not loading

1. Check CORS headers
2. Verify worker path is correct
3. Check browser console for errors
4. Fallback to main-thread search

## References

- [MDN Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [JavaScript RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Hooks](https://react.dev/reference/react)
