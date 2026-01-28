# Quick Start Guide

Get up and running with CRXReview routing and landing page in minutes.

## Installation

```bash
# Clone repository
git clone https://github.com/brentlangston/crxreview.git
cd crxreview

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173/#/` to see the landing page.

## Project Structure

```
src/
├── App.tsx                 # Router setup with HashRouter
├── main.tsx               # Application entry point
├── pages/
│   ├── LandingPage.tsx    # Marketing landing page
│   ├── ViewerPage.tsx     # Main extension viewer
│   └── NotFoundPage.tsx   # 404 page
├── hooks/
│   ├── useUrlState.ts     # URL ↔ State synchronization
│   ├── useCrxLoader.ts    # CRX file loading
│   └── useFileSelection.ts# File selection state
├── components/
│   └── ErrorBoundary.tsx  # Error handling
├── store/
│   ├── viewerStore.ts     # Viewer state (Zustand)
│   └── searchStore.ts     # Search state (Zustand)
└── ...other files
```

## Key Routes

### Landing Page
```
URL: http://localhost:5173/#/
File: src/pages/LandingPage.tsx
Purpose: Marketing page with features and CTA
```

### Viewer
```
URL: http://localhost:5173/#/app
File: src/pages/ViewerPage.tsx
Purpose: Extension review interface
```

### Viewer with Extension Pre-loaded
```
URL: http://localhost:5173/#/app?url=abcdef123456
Purpose: Auto-loads extension on mount
Parameters:
  - url: Chrome extension ID or Web Store URL
  - file: Path to file to select
  - search: Initial search query
```

### 404 Not Found
```
URL: http://localhost:5173/#/not-found (or any invalid route)
Purpose: Shows when route doesn't exist
```

## Common Tasks

### Add useUrlState to a Route

```tsx
import { useUrlState } from '@/hooks/useUrlState';

export function MyViewPage() {
  // This call enables URL state management
  useUrlState();

  // Your component code
  return <div>View</div>;
}
```

**What it does:**
- Reads URL parameters on mount
- Loads extension if `?url=` provided
- Selects file if `?file=` provided
- Sets search if `?search=` provided
- Updates URL when state changes

### Load Extension from User Input

```tsx
import { useCrxLoader } from '@/hooks/useCrxLoader';

function LoadButton() {
  const { loadFromUrl, isLoading, error } = useCrxLoader();

  return (
    <div>
      <button
        onClick={() => loadFromUrl('abcdef123456')}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Load Extension'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### Load Extension from File Upload

```tsx
import { useCrxLoader } from '@/hooks/useCrxLoader';

function FileUpload() {
  const { loadFromFile, isLoading } = useCrxLoader();

  return (
    <input
      type="file"
      accept=".crx"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) loadFromFile(file);
      }}
      disabled={isLoading}
    />
  );
}
```

### Select File Programmatically

```tsx
import { useFileSelection } from '@/hooks/useFileSelection';

function FileSelector() {
  const { selectFile, getSelectedFileName } = useFileSelection();

  return (
    <div>
      <p>Selected: {getSelectedFileName()}</p>
      <button onClick={() => selectFile('manifest.json')}>
        View manifest.json
      </button>
    </div>
  );
}
```

### Create Shareable Link

```tsx
import { useFileSelection } from '@/hooks/useFileSelection';
import { useSearchStore } from '@/store/searchStore';

function ShareButton() {
  const { selectedFilePath } = useFileSelection();
  const contentSearchQuery = useSearchStore((s) => s.contentSearchQuery);

  const createShareLink = () => {
    const params = new URLSearchParams();
    if (selectedFilePath) params.set('file', selectedFilePath);
    if (contentSearchQuery) params.set('search', contentSearchQuery);

    const url = `${window.location.origin}/#/app?${params}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <button onClick={createShareLink}>
      Share Current View
    </button>
  );
}
```

## URL Examples

### Basic Navigation
```
Home page:  http://localhost:5173/#/
Viewer:     http://localhost:5173/#/app
```

### With Extension
```
# Load specific extension
http://localhost:5173/#/app?url=abcdef123456

# Chrome Web Store URL also works
http://localhost:5173/#/app?url=https://chrome.google.com/webstore/detail/ext-name/abcdef123456
```

### With File Selection
```
# Load extension and select manifest.json
http://localhost:5173/#/app?url=abcdef123456&file=manifest.json

# Select nested file
http://localhost:5173/#/app?url=abcdef123456&file=src/background.js
```

### With Search
```
# Load extension and search for "onclick"
http://localhost:5173/#/app?url=abcdef123456&search=onclick

# Search for "permissions"
http://localhost:5173/#/app?url=abcdef123456&search=permissions
```

### Combined
```
# All together
http://localhost:5173/#/app?url=abcdef123456&file=manifest.json&search=permissions
```

## Building for Production

```bash
# Build production bundle
npm run build

# Output goes to dist/ folder
# Ready to deploy to GitHub Pages
```

### GitHub Pages Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy `dist/` folder to GitHub Pages:
   ```bash
   # Using GitHub Actions (recommended)
   # Check .github/workflows/deploy.yml

   # Or manual push
   git subtree push --prefix dist origin gh-pages
   ```

3. Access your deployed app:
   ```
   https://your-username.github.io/crxreview/
   ```

## Development Workflow

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Make Changes
Edit any file in `src/`

### 3. Test Locally
- Landing page: `http://localhost:5173/#/`
- Viewer: `http://localhost:5173/#/app`
- With URL params: `http://localhost:5173/#/app?url=...`

### 4. Check TypeScript
```bash
npm run type-check
```

### 5. Build & Deploy
```bash
npm run build
# Deploy dist/ to GitHub Pages
```

## Troubleshooting

### Landing page not loading
**Check:**
- Is dev server running? (`npm run dev`)
- Are you using hash routing? (`/#/`)
- Check browser console for errors
- Check network tab for failed requests

### Routes not working
**Check:**
- Using hash syntax: `/#/app` not `/app`
- `HashRouter` is in App.tsx
- Routes are defined correctly in App.tsx
- React Router DOM is installed

### Extension not loading from URL
**Check:**
- Valid extension ID format (alphanumeric, ~32 chars)
- Extension exists and can be downloaded
- Browser console for specific error
- Network tab to see download requests

### URL parameters not applied
**Check:**
- `useUrlState()` is called in ViewerPage
- Parameters are URL-encoded correctly
- Valid parameter names: `url`, `file`, `search`
- Check browser console for parsing errors

## File Organization

### Pages
- `LandingPage.tsx` - Marketing page (no hooks needed)
- `ViewerPage.tsx` - Main app (calls useUrlState())
- `NotFoundPage.tsx` - 404 page

### Hooks
- `useUrlState.ts` - Parses and syncs URL params
- `useCrxLoader.ts` - Loads CRX files
- `useFileSelection.ts` - File tree selection

### Components
- `ErrorBoundary.tsx` - Catches render errors

### Stores
- `viewerStore.ts` - Extension and file selection state
- `searchStore.ts` - Search and filter state

## Testing URLs Locally

```bash
# Start dev server
npm run dev

# Test different routes
http://localhost:5173/#/                    # Landing
http://localhost:5173/#/app                 # Viewer
http://localhost:5173/#/invalid              # 404
http://localhost:5173/#/app?url=abc123      # Viewer with param
http://localhost:5173/#/app?file=manifest.json  # With file
```

## Production Build Details

### Bundle Breakdown
```
vendor.js      46.5 KB (React, React-DOM, React-Router)
zip.js         96.7 KB (jszip for CRX handling)
utils.js      106.6 KB (Zustand, js-beautify, Lucide)
syntax.js      19.0 KB (Prism.js for code highlighting)
index.js      264.0 KB (Application code)
index.css      27.4 KB (Tailwind CSS styles)

Total: ~338 KB (compressed: ~105 KB gzipped)
```

### GitHub Pages Configuration

File: `.github/workflows/deploy.yml`

Automatically builds and deploys on push to main branch.

```bash
# Or deploy manually
npm run build
git subtree push --prefix dist origin gh-pages
```

## Environment Variables

Not needed for this project. All configuration is in:
- `vite.config.ts` - Build settings
- `.env` - Optional for GitHub Pages URL (not required)

## API Reference

### useUrlState()
```tsx
useUrlState() // Call in component
// Returns: { urlParams: { url?, file?, search? } }
```

### useCrxLoader()
```tsx
const { loadFromUrl, loadFromFile, isLoading, error, crx } = useCrxLoader()

await loadFromUrl(urlOrId)      // Load CRX from URL or ID
await loadFromFile(crxFile)     // Load CRX from File object
```

### useFileSelection()
```tsx
const { selectFile, selectedFilePath, isSelected, getSelectedFileName } = useFileSelection()

selectFile(path)          // Select file by path
isSelected(path)          // Check if path selected
getSelectedFileName()     // Get just filename (no path)
```

## Next Steps

1. **Customize Landing Page**
   - Edit `src/pages/LandingPage.tsx`
   - Change colors, text, icons

2. **Add More Routes**
   - Add route in `src/App.tsx`
   - Create new page component in `src/pages/`

3. **Modify Styling**
   - Edit Tailwind CSS classes
   - Update `src/index.css`

4. **Add Features**
   - Extend hooks with new functionality
   - Add state to stores as needed
   - Create custom components

## Resources

- [React Router Documentation](https://reactrouter.com)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)

## Getting Help

1. Check `ROUTING.md` for detailed routing documentation
2. Check `HOOKS_GUIDE.md` for hook API reference
3. Check `IMPLEMENTATION_SUMMARY.md` for architecture details
4. See browser console for error messages
5. Check GitHub Issues for known problems
