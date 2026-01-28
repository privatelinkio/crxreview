# CRXReview Routing & Navigation Guide

Complete documentation for the routing system, landing page, and URL state management.

## Architecture Overview

CRXReview uses **HashRouter** for client-side routing, enabling deployment on GitHub Pages without requiring server-side routing configuration.

```
/crxreview/
├── index.html          → Renders App component with HashRouter
├── 404.html            → GitHub Pages SPA fallback for client-side routing
└── assets/             → Built application assets
```

## URL Structure

All routes use hash-based routing compatible with GitHub Pages:

```
Base URL: https://user.github.io/crxreview/

Landing Page:    https://user.github.io/crxreview/#/
Viewer:          https://user.github.io/crxreview/#/app
404 Handler:     https://user.github.io/crxreview/#/not-found (automatic)

Viewer with params:
  https://user.github.io/crxreview/#/app?url=chrome://webstore/detail/{ext_id}&file=manifest.json&search=permissions
```

## Routes

### 1. Landing Page (`/`)

**File:** `src/pages/LandingPage.tsx`

Marketing page showcasing the product with:
- Hero section
- Feature showcase grid (6 features)
- How it works (3-step process)
- CTA sections
- Footer with links and GitHub repository

**Components:**
- Navigation bar with logo and GitHub link
- Responsive design (mobile-first with Tailwind CSS)
- Professional styling with Lucide icons

**Key Features:**
- Links to `/app` route for viewer
- External links to Chrome Extension documentation
- Fully responsive across all screen sizes

### 2. Viewer Page (`/app`)

**File:** `src/pages/ViewerPage.tsx`

Main application interface for reviewing Chrome extensions:
- TopBar (extension input and controls)
- FileTree panel (left sidebar)
- CodeViewer panel (right content area)
- PanelResizer (resizable divider)

**URL State Integration:**
- Loads extension from `?url=` parameter on mount
- Selects initial file from `?file=` parameter
- Sets initial search from `?search=` parameter
- Syncs viewer state back to URL for deep linking

### 3. 404 Not Found Page (`*`)

**File:** `src/pages/NotFoundPage.tsx`

Catch-all page for undefined routes:
- Clean error page design
- Links back to home and viewer
- Uses Lucide icons for visual appeal

## Hooks

### useUrlState()

**File:** `src/hooks/useUrlState.ts`

Synchronizes viewer state with URL query parameters.

**Functionality:**
- Parses URL on mount and loads extension if `?url=` provided
- Selects initial file if `?file=` provided
- Sets initial search if `?search=` provided
- Updates URL when viewer state changes
- Enables deep linking and URL sharing

**Usage:**
```tsx
import { useUrlState } from '@/hooks/useUrlState';

export function ViewerPage() {
  useUrlState(); // Initialize URL state sync on mount
  // ... rest of component
}
```

**URL Format Example:**
```
/#/app?url=chrome://webstore/detail/abcdef123456&file=src/background.js&search=onclick
```

**Parameter Details:**
- `url` - Chrome Web Store URL or extension ID (optional, loads on mount)
- `file` - Path to initially selected file (optional)
- `search` - Initial content search query (optional)

### useCrxLoader()

**File:** `src/hooks/useCrxLoader.ts`

Manages CRX file loading from URLs or file uploads.

**Functions:**
```tsx
const { loadFromUrl, loadFromFile, isLoading, error, crx } = useCrxLoader();

// Load from URL or extension ID
await loadFromUrl('https://chrome.google.com/webstore/detail/...');
// or
await loadFromUrl('abcdef123456'); // Extension ID

// Load from file upload
const file = event.target.files[0];
await loadFromFile(file);
```

**Properties:**
- `loadFromUrl(input: string)` - Load CRX from URL or ID
- `loadFromFile(file: File)` - Load CRX from uploaded file
- `isLoading` - Boolean indicating load state
- `error` - Error message if loading failed
- `crx` - Loaded extension data

### useFileSelection()

**File:** `src/hooks/useFileSelection.ts`

Manages file selection state.

**Functions:**
```tsx
const {
  selectFile,
  selectedFilePath,
  isSelected,
  deselectFile,
  getSelectedFileName,
  hasSelection
} = useFileSelection();

// Select a file
selectFile('manifest.json');

// Check if selected
if (isSelected('background.js')) {
  console.log('File is selected');
}

// Get selected file name
const fileName = getSelectedFileName(); // 'manifest.json'
```

**Properties:**
- `selectedFilePath` - Current selected file path
- `selectFile(path)` - Select file by path
- `deselectFile()` - Clear selection
- `isSelected(path)` - Check if path is selected
- `getSelectedFileName()` - Get just the file name
- `hasSelection` - Boolean indicating selection state

## Error Handling

### ErrorBoundary Component

**File:** `src/components/ErrorBoundary.tsx`

React error boundary for catching component errors:
- Displays user-friendly error message
- Shows error details from caught exception
- Provides "Return to Home" button

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## GitHub Pages Compatibility

### 404.html Redirect Strategy

**File:** `public/404.html`

GitHub Pages serves `404.html` for any path not matching a real file. This enables client-side routing:

1. User navigates to `https://user.github.io/crxreview/#/app?...`
2. GitHub Pages processes the request:
   - Checks for `/crxreview/app` file (doesn't exist)
   - Serves `404.html` instead
3. `404.html` script executes:
   - Detects GitHub Pages environment
   - Redirects to `index.html` with hash preserved
4. React app loads and HashRouter processes the hash

**Key Points:**
- Hash is preserved in redirect: `location.hash`
- Works with query parameters: `location.search`
- Automatic detection of GitHub Pages base path
- No server-side configuration needed

### Deployment Steps

1. Build production bundle:
   ```bash
   npm run build
   ```

2. Push `dist/` folder to GitHub Pages:
   ```bash
   # Typically via GitHub Actions or manual push
   git push origin gh-pages
   ```

3. Enable GitHub Pages in repository settings:
   - Source: `gh-pages` branch or `/dist` folder
   - Custom domain optional

## Store Integration

### useViewerStore (Zustand)

**File:** `src/store/viewerStore.ts`

Manages viewer state:
- `loadCrxFromUrl(url)` - Download and load CRX
- `selectFile(path)` - Select file in tree
- `setFileFilter(filter)` - Filter files
- `reset()` - Clear all state

### useSearchStore (Zustand)

**File:** `src/store/searchStore.ts`

Manages search state:
- `contentSearchQuery` - Current search text
- `setContentSearchQuery(query)` - Update search
- `contentSearchResults` - Search matches
- `setContentSearchResults(results)` - Update results

URL state hook syncs these stores to URL parameters.

## App Component

**File:** `src/App.tsx`

Top-level component with router setup:

```tsx
<ErrorBoundary>
  <HashRouter>
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<ViewerPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  </HashRouter>
</ErrorBoundary>
```

**Features:**
- Error boundary wraps entire app
- HashRouter for GitHub Pages compatibility
- Suspense for code splitting
- Automatic 404 handling for undefined routes

## Deep Linking Examples

### Share specific file:
```
/#/app?url=chrome://webstore/detail/abcdef123456&file=src/background.js
```

### Share with search term:
```
/#/app?url=chrome://webstore/detail/abcdef123456&search=permissions
```

### Share specific file with search:
```
/#/app?url=chrome://webstore/detail/abcdef123456&file=manifest.json&search=permissions
```

## Best Practices

1. **Always use HashRouter** for GitHub Pages deployment
2. **Preserve state in URL** for shareability and bookmarking
3. **Initialize URL state** in route components with `useUrlState()`
4. **Handle loading states** while extensions are being downloaded
5. **Provide error messages** for failed loads
6. **Test 404.html** locally before deployment (use dev server with non-existent paths)

## Testing Routing

### Local Development
```bash
npm run dev
# Navigate to http://localhost:5173/#/
# Test routes: http://localhost:5173/#/app
```

### Production Build
```bash
npm run build
# Serve dist/ folder locally:
npx http-server dist/
# Navigate to http://localhost:8080/#/
```

### GitHub Pages Test
Deploy to GitHub Pages and test:
- Direct link to root: `https://user.github.io/crxreview/#/`
- Direct link to app: `https://user.github.io/crxreview/#/app`
- Link with parameters: `https://user.github.io/crxreview/#/app?url=...&file=manifest.json`

## Performance Considerations

1. **Code Splitting:** Lazy loading via React Router Suspense
2. **Bundle Size:**
   - Vendor: 46.5 KB (gzipped 16.5 KB)
   - Main app: 264 KB (gzipped 82 KB)
3. **Route Loading:** Sub-millisecond for hash routing
4. **URL Updates:** Debounced to avoid excessive history updates

## Troubleshooting

### Landing page not loading
- Check `base: '/crxreview/'` in vite.config.ts
- Verify `<HashRouter>` wraps routes

### Routes not working
- Ensure hash syntax: `/#/app` not `/app`
- Check `ErrorBoundary` logs in console
- Verify React Router DOM version (should be ^7.13.0)

### URL parameters not loading extension
- Check `useUrlState()` is called in ViewerPage
- Verify `?url=` parameter format matches extension URL
- Check browser console for load errors

### 404.html not working on GitHub Pages
- Ensure `404.html` is in `dist/` after build
- Check GitHub Pages settings point to correct source
- Clear browser cache and retry
- Test with direct URL: `https://user.github.io/crxreview/abc123` (should redirect)
