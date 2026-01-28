# Search and Filtering System - Complete Documentation

Welcome to the comprehensive search and filtering system for CRX Review. This document provides a complete overview of all components, utilities, and how to use them.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Component Reference](#component-reference)
4. [Hook Reference](#hook-reference)
5. [Utility Reference](#utility-reference)
6. [Store Reference](#store-reference)
7. [Examples](#examples)
8. [Best Practices](#best-practices)
9. [Performance Tips](#performance-tips)
10. [FAQ](#faq)

## Quick Start

### Installation

All components are already integrated into the project. Just import and use:

```tsx
import { SearchAndFilterPanel } from '@/components/viewer/SearchAndFilterPanel';

export function MyViewer() {
  return (
    <SearchAndFilterPanel
      onSelectFile={(filePath) => console.log(filePath)}
      onSelectMatch={(filePath, match) => console.log(match)}
    />
  );
}
```

### Basic Usage

#### File Filtering

```tsx
import { FileFilter } from '@/components/viewer/FileFilter';

export function MyComponent() {
  return <FileFilter onFilterChange={() => console.log('Filter updated')} />;
}
```

#### Content Search

```tsx
import { ContentSearch } from '@/components/viewer/ContentSearch';
import { useState } from 'react';

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const files = [
    { fileId: '1', filePath: 'index.js', content: '// code here' },
  ];

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Search</button>
      <ContentSearch
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        files={files}
        onSelectMatch={(fileId, filePath, match) => {
          console.log(`Match in ${filePath} at line ${match.lineNumber}`);
        }}
      />
    </>
  );
}
```

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                           │
│  ┌──────────────────┐        ┌──────────────────────────┐  │
│  │   FileFilter     │        │    ContentSearch Modal   │  │
│  │   Component      │        │      Component           │  │
│  └────────┬─────────┘        └──────────┬───────────────┘  │
└───────────┼───────────────────────────────┼──────────────────┘
            │                               │
            ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    State Management                          │
│  ┌──────────────────┐        ┌──────────────────────────┐  │
│  │  useFileFilter   │        │  useContentSearch Hook   │  │
│  │      Hook        │        │      + Web Worker        │  │
│  └────────┬─────────┘        └──────────┬───────────────┘  │
│           │                              │                  │
│           └──────┬───────────────────────┘                  │
│                  ▼                                           │
│           ┌──────────────────┐                              │
│           │  Zustand Store   │                              │
│           │   (searchStore)  │                              │
│           └──────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Core Utilities                              │
│  ┌──────────────────┐        ┌──────────────────────────┐  │
│  │ file-filter.ts   │        │  content-search.ts       │  │
│  │  - Patterns      │        │  - Search Logic          │  │
│  │  - Categories    │        │  - Highlighting          │  │
│  │  - Tree Filter   │        │  - Statistics            │  │
│  └──────────────────┘        └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│              Data (File Tree + Content)                      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### File Filtering Flow

```
User Input (Pattern, Category)
         ↓
useFileFilter Hook
         ↓
FileFilter Component
         ↓
createFilterPattern()
         ↓
filterFileTree() or getMatchingFiles()
         ↓
Display Filtered Results
```

#### Search Flow

```
User Input (Query, Options)
         ↓
useContentSearch Hook
         ↓
ContentSearch Modal Component
         ↓
Web Worker (or Main Thread Fallback)
         ↓
createSearchPattern()
         ↓
searchContent() for each file
         ↓
sortSearchResults()
         ↓
Display Results with Highlighting
```

## Component Reference

### FileFilter Component

**Location**: `src/components/viewer/FileFilter.tsx`

A comprehensive file filtering UI component.

#### Props

```typescript
interface FileFilterProps {
  onFilterChange?: () => void;  // Called when filter changes
  className?: string;             // Additional CSS classes
}
```

#### Features

- Pattern input with glob/regex modes
- Case sensitivity toggle
- File type category checkboxes
- Real-time validation
- Error messages
- Clear filters button
- Filter status badge

#### Example

```tsx
<FileFilter
  onFilterChange={() => {
    // Trigger any side effects
  }}
  className="bg-white p-4"
/>
```

### ContentSearch Component

**Location**: `src/components/viewer/ContentSearch.tsx`

A modal-based search interface with results navigation.

#### Props

```typescript
interface ContentSearchProps {
  isOpen: boolean;                          // Modal visibility
  onClose: () => void;                      // Close handler
  files: Array<{
    fileId: string;
    filePath: string;
    content: string;
  }>;
  onSelectMatch?: (
    fileId: string,
    filePath: string,
    match: SearchMatch
  ) => void;
  className?: string;                       // Additional CSS classes
}
```

#### Features

- Search input with options (case-sensitive, whole-word, regex)
- Real-time progress display
- Results grouped by file
- Navigation within/between files
- Context preview with highlighting
- Search statistics
- Cancellation support
- Keyboard shortcuts

#### Example

```tsx
const [isOpen, setIsOpen] = useState(false);

<ContentSearch
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  files={fileList}
  onSelectMatch={(fileId, filePath, match) => {
    console.log(`Line ${match.lineNumber}: ${match.lineContent}`);
  }}
/>
```

### SearchAndFilterPanel Component

**Location**: `src/components/viewer/SearchAndFilterPanel.tsx`

Integrated panel combining search and filter functionality.

#### Props

```typescript
interface SearchAndFilterPanelProps {
  onSelectFile?: (filePath: string) => void;
  onSelectMatch?: (filePath: string, match: SearchMatch) => void;
  className?: string;
}
```

#### Features

- Combined search and filter toolbar
- Collapsible panels for each feature
- File count display
- Integrated state management

#### Example

```tsx
<SearchAndFilterPanel
  onSelectFile={(path) => viewer.openFile(path)}
  onSelectMatch={(path, match) => viewer.jumpToLine(match.lineNumber)}
/>
```

## Hook Reference

### useFileFilter Hook

**Location**: `src/hooks/useFileFilter.ts`

Manages file filtering state and operations.

#### State

```typescript
namePattern: string;              // Current filter pattern
useRegex: boolean;                // Use regex vs glob
caseSensitive: boolean;           // Case sensitivity
selectedCategories: FileTypeCategory[];  // Selected types
patternError: string | null;      // Validation error
isActive: boolean;                // Any filters applied
```

#### Methods

```typescript
setNamePattern(pattern: string): void
setUseRegex(useRegex: boolean): void
setCaseSensitive(caseSensitive: boolean): void
toggleCategory(category: FileTypeCategory): void
setSelectedCategories(categories: FileTypeCategory[]): void
clearFilters(): void
getFilteredTree(tree: FileTreeNode): FileTreeNode
getMatchingFilePaths(tree: FileTreeNode): string[]
```

#### Example

```tsx
const filter = useFileFilter();

// Set a pattern
filter.setNamePattern('*.js');

// Toggle categories
filter.toggleCategory('code');

// Get filtered files
const files = filter.getMatchingFilePaths(crx.fileTree);

// Clear everything
filter.clearFilters();

// Check if active
if (filter.isActive) {
  console.log('Filters are applied');
}
```

### useContentSearch Hook

**Location**: `src/hooks/useContentSearch.ts`

Manages content search state and operations with Web Worker support.

#### State

```typescript
query: string;                    // Search query
isSearching: boolean;             // Search in progress
results: FileSearchResult[];      // Search results
progress: SearchProgress | null;  // Current progress
error: string | null;             // Error message
statistics: {...} | null;         // Search statistics
totalMatches: number;             // Total match count
```

#### Methods

```typescript
setQuery(query: string): void
search(files: FileList, options?: SearchOptions): Promise<void>
cancel(): void
clearResults(): void
getNextMatch(currentIndex: number): FileSearchResult | null
getPreviousMatch(currentIndex: number): FileSearchResult | null
```

#### Example

```tsx
const search = useContentSearch();

// Set query
search.setQuery('TODO');

// Perform search
await search.search(files, {
  caseSensitive: false,
  wholeWord: true,
  useRegex: false,
});

// Navigate results
const nextResult = search.getNextMatch(0);

// Handle results
search.results.forEach(result => {
  console.log(`${result.filePath}: ${result.matchCount} matches`);
});

// Cancel if needed
search.cancel();

// Clear all
search.clearResults();
```

## Utility Reference

### File Filter Utilities

**Location**: `src/lib/search/file-filter.ts`

Core file filtering functions.

#### Key Functions

```typescript
// Pattern creation
createFilterPattern(
  pattern: string,
  useRegex?: boolean,
  caseSensitive?: boolean
): RegExp | null

// Pattern matching
matchesPattern(filename: string, pattern: RegExp): boolean

// File categorization
getFileTypeCategory(filename: string): FileTypeCategory
belongsToCategories(
  filename: string,
  categories: FileTypeCategory[]
): boolean

// Tree filtering
filterFileTree(
  node: FileTreeNode,
  config: FileFilterConfig
): FileTreeNode

// File matching
getMatchingFiles(
  node: FileTreeNode,
  config: FileFilterConfig
): string[]

// Validation
validateRegexPattern(pattern: string): string | null
```

#### File Type Categories

```typescript
type FileTypeCategory = 'images' | 'code' | 'markup' | 'locales' | 'misc'

// Detailed in FILE_TYPE_CATEGORIES constant
FILE_TYPE_CATEGORIES: {
  images: { extensions: ['png', 'jpg', ...], patterns: [...] },
  code: { extensions: ['js', 'ts', ...], patterns: [...] },
  markup: { extensions: ['html', 'css', ...], patterns: [...] },
  locales: { extensions: ['json', ...], patterns: [...] },
  misc: { extensions: [], patterns: [] }
}
```

### Content Search Utilities

**Location**: `src/lib/search/content-search.ts`

Core search functions.

#### Key Functions

```typescript
// Pattern creation
createSearchPattern(
  query: string,
  caseSensitive?: boolean,
  wholeWord?: boolean,
  useRegex?: boolean
): RegExp | null

// Search execution
searchContent(
  content: string,
  pattern: RegExp,
  options?: SearchOptions
): SearchMatch[]

// Highlighting
highlightMatches(text: string, pattern: RegExp): string

// Preview generation
getMatchPreview(match: SearchMatch, maxLength?: number): string

// HTML escaping
escapeHtml(text: string): string

// Validation
validateSearchPattern(pattern: string): string | null

// Result processing
sortSearchResults(results: FileSearchResult[]): FileSearchResult[]
getSearchStatistics(results: FileSearchResult[])
```

#### Data Structures

```typescript
interface SearchMatch {
  fileId: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  matchStart: number;
  matchEnd: number;
  lineContent: string;
  contextBefore: string[];
  contextAfter: string[];
}

interface FileSearchResult {
  filePath: string;
  fileId: string;
  matchCount: number;
  matches: SearchMatch[];
}

interface SearchProgress {
  currentFile: string;
  filesProcessed: number;
  totalFiles: number;
  matchesFound: number;
}

interface SearchOptions {
  query?: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  useRegex?: boolean;
  contextLines?: number;
}
```

## Store Reference

**Location**: `src/store/searchStore.ts`

Global state management using Zustand.

### State Structure

```typescript
// File filter state
fileFilterPattern: string
fileFilterUseRegex: boolean
fileFilterCaseSensitive: boolean
fileFilterCategories: FileTypeCategory[]

// Content search state
contentSearchQuery: string
contentSearchResults: FileSearchResult[]
contentSearchIsActive: boolean
selectedSearchMatch: SearchMatch | null
selectedSearchFile: string | null

// UI state
isSearchPanelOpen: boolean
isFilterPanelOpen: boolean
```

### Actions

```typescript
// File filter actions
setFileFilterPattern(pattern: string): void
setFileFilterUseRegex(useRegex: boolean): void
setFileFilterCaseSensitive(caseSensitive: boolean): void
setFileFilterCategories(categories: FileTypeCategory[]): void
toggleFileFilterCategory(category: FileTypeCategory): void
clearFileFilter(): void

// Content search actions
setContentSearchQuery(query: string): void
setContentSearchResults(results: FileSearchResult[]): void
setContentSearchIsActive(isActive: boolean): void
setSelectedSearchMatch(match: SearchMatch | null, filePath?: string): void
clearContentSearch(): void

// UI actions
setSearchPanelOpen(isOpen: boolean): void
setFilterPanelOpen(isOpen: boolean): void

// Global reset
reset(): void
```

### Usage

```typescript
import { useSearchStore } from '@/store';

const store = useSearchStore();

// Read state
const pattern = store.fileFilterPattern;
const results = store.contentSearchResults;

// Update state
store.setFileFilterPattern('*.js');
store.setContentSearchQuery('TODO');

// Toggle
store.toggleFileFilterCategory('code');

// Clear
store.clearFileFilter();
store.clearContentSearch();

// Reset all
store.reset();
```

## Examples

### Example 1: Basic File Listing with Filter

```tsx
import { useFileFilter } from '@/hooks/useFileFilter';
import { useViewerStore } from '@/store';
import { getAllFiles } from '@/lib/zip/file-tree';
import { FileFilter } from '@/components/viewer/FileFilter';

export function FileListWithFilter() {
  const crx = useViewerStore(state => state.crx);
  const filter = useFileFilter();

  const filteredFiles = filter.getMatchingFilePaths(crx.fileTree);

  return (
    <div>
      <FileFilter />
      <div>
        {filteredFiles.map(path => (
          <div key={path}>{path}</div>
        ))}
      </div>
      <p>Found {filteredFiles.length} files</p>
    </div>
  );
}
```

### Example 2: Search Specific Files

```tsx
import { useContentSearch } from '@/hooks/useContentSearch';
import { ContentSearch } from '@/components/viewer/ContentSearch';
import { useState } from 'react';

export function SearchView() {
  const [isOpen, setIsOpen] = useState(false);
  const search = useContentSearch();

  const files = [
    { fileId: '1', filePath: 'index.js', content: 'console.log("test");' },
    { fileId: '2', filePath: 'app.js', content: 'TODO: refactor' },
  ];

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Search</button>

      <ContentSearch
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        files={files}
        onSelectMatch={(fileId, filePath, match) => {
          console.log(`Found in ${filePath} at line ${match.lineNumber}`);
        }}
      />

      <div>
        <h3>Results: {search.totalMatches} matches</h3>
        {search.results.map(result => (
          <div key={result.fileId}>
            <strong>{result.filePath}</strong>
            <ul>
              {result.matches.slice(0, 3).map((match, i) => (
                <li key={i}>Line {match.lineNumber}: {match.lineContent}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
```

### Example 3: Filter by Category

```tsx
import { useFileFilter } from '@/hooks/useFileFilter';
import { useViewerStore } from '@/store';

export function CodeFilesOnly() {
  const crx = useViewerStore(state => state.crx);
  const filter = useFileFilter();

  // Set to show only code files
  const handleShowCodeOnly = () => {
    filter.setSelectedCategories(['code']);
  };

  const files = filter.getMatchingFilePaths(crx.fileTree);

  return (
    <>
      <button onClick={handleShowCodeOnly}>Show Code Files Only</button>
      <div>
        {files.map(path => <div key={path}>{path}</div>)}
      </div>
    </>
  );
}
```

### Example 4: Using Store for Persistence

```tsx
import { useSearchStore } from '@/store';
import { useEffect } from 'react';

export function PersistentSearch() {
  const store = useSearchStore();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lastSearch');
    if (saved) {
      store.setContentSearchQuery(saved);
    }
  }, []);

  // Save to localStorage when query changes
  const handleSearch = (query: string) => {
    store.setContentSearchQuery(query);
    localStorage.setItem('lastSearch', query);
  };

  return (
    <input
      value={store.contentSearchQuery}
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Persistent search..."
    />
  );
}
```

## Best Practices

### 1. Always Validate Patterns

```typescript
// Good
const error = validateRegexPattern(userInput);
if (error) {
  showError(error);
  return;
}

// Bad
try {
  new RegExp(userInput);
} catch (e) {
  // Silent failure
}
```

### 2. Provide User Feedback

```typescript
// Good
{search.isSearching && <LoadingSpinner />}
{search.error && <ErrorAlert message={search.error} />}
{search.progress && <ProgressBar value={search.progress} />}

// Bad
// No indication of what's happening
```

### 3. Use Hooks for State

```typescript
// Good - Automatic updates, side effects
const filter = useFileFilter();
const filtered = filter.getFilteredTree(tree);

// Less good - Manual state management
const [pattern, setPattern] = useState('');
// ... lots of manual synchronization
```

### 4. Lazy Load File Content

```typescript
// Good - Only load what you need
const onDemandFiles = files.slice(0, 100);
await search.search(onDemandFiles);

// Risky - Loading everything upfront
const allFiles = await loadAllFiles();
await search.search(allFiles);
```

### 5. Handle Large Result Sets

```typescript
// Good - Show pagination/virtualization
{search.results.slice(0, 20).map(r => <Result key={r.fileId} {...r} />)}
<Pagination total={search.results.length} />

// Bad - Rendering all results at once
{search.results.map(r => <Result key={r.fileId} {...r} />)}
```

## Performance Tips

### 1. Use Web Worker

The search hook automatically uses Web Worker when available:

```typescript
// This automatically uses Web Worker for large searches
const search = useContentSearch();
await search.search(files);  // Non-blocking!
```

### 2. Optimize Pattern Matching

```typescript
// Good - Specific pattern
filter.setNamePattern('src/**/*.js');

// Less efficient - Generic pattern
filter.setNamePattern('*');  // Matches everything
```

### 3. Debounce Input

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSetPattern = useDebouncedCallback((p) => {
  filter.setNamePattern(p);
}, 300);

<input onChange={(e) => debouncedSetPattern(e.target.value)} />
```

### 4. Memoize Expensive Computations

```typescript
const filteredFiles = useMemo(
  () => filter.getMatchingFilePaths(crx.fileTree),
  [crx.fileTree, filter.namePattern, filter.selectedCategories]
);
```

### 5. Virtual Scrolling for Large Lists

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList height={600} itemCount={search.results.length} itemSize={35}>
  {({ index, style }) => (
    <div style={style}>{search.results[index].filePath}</div>
  )}
</FixedSizeList>
```

## FAQ

### Q: How do I load file content?

**A**: File content needs to be loaded from your source and passed to the search component:

```typescript
const files = allFiles.map(file => ({
  fileId: file.path,
  filePath: file.path,
  content: loadFileContent(file.path),  // Your loader function
}));

<ContentSearch files={files} />
```

### Q: Can I search and filter simultaneously?

**A**: Yes! Use the SearchAndFilterPanel component which handles both:

```tsx
<SearchAndFilterPanel
  onSelectFile={handleFile}
  onSelectMatch={handleMatch}
/>
```

Or compose them manually:

```tsx
const filteredFiles = filter.getMatchingFilePaths(crx.fileTree);
const filesToSearch = loadFileContents(filteredFiles);
await search.search(filesToSearch);
```

### Q: How do I export search results?

**A**: Convert results to your desired format:

```typescript
const csv = search.results
  .map(r => `${r.filePath},${r.matchCount}`)
  .join('\n');

downloadFile(csv, 'results.csv');
```

### Q: Can I use regex in file filter?

**A**: Yes! Toggle the regex mode:

```typescript
filter.setUseRegex(true);
filter.setNamePattern('^src/.*\\.js$');
```

### Q: What's the difference between patterns?

**A**:
- **Glob**: `*.js`, `src/**/*.ts` - Simple, familiar
- **Regex**: `^src/.*\.js$` - Powerful, complex

### Q: How do I handle very large CRX files?

**A**:
1. Use pagination/virtualization
2. Search only filtered files
3. Lazy load file content
4. Use Web Worker (automatic)

### Q: Can I search just one file?

**A**: Yes! Pass a single-file array:

```typescript
await search.search([
  { fileId: 'id', filePath: 'index.js', content: '...' }
]);
```

### Q: What browsers are supported?

**A**: All modern browsers. Web Worker is used when available with main-thread fallback.

## Resources

- `SEARCH_IMPLEMENTATION.md` - Detailed technical documentation
- `SEARCH_INTEGRATION_GUIDE.md` - Integration examples
- `SEARCH_FILTERING_SUMMARY.md` - High-level overview
- Source code with JSDoc comments
- Test files with examples

---

Happy searching! For questions or issues, refer to the documentation or examine the source code and tests.
