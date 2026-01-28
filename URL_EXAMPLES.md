# URL Examples & Deep Linking Guide

Complete reference for URL patterns and deep linking examples.

## Base URLs

### Development
```
http://localhost:5173/#/
http://localhost:5173/#/app
```

### Production (GitHub Pages)
```
https://your-username.github.io/crxreview/#/
https://your-username.github.io/crxreview/#/app
```

## Route Examples

### Landing Page (Marketing)
```
/#/
```
**What it shows:**
- Marketing landing page
- Features showcase
- Call-to-action buttons
- Link to viewer

### Viewer (Empty)
```
/#/app
```
**What it shows:**
- Empty viewer interface
- File tree (no files)
- Code viewer (empty)
- Input field to load extension

### 404 Page
```
/#/invalid-route
/#/nonexistent
```
**What it shows:**
- 404 error page
- Links back to home and viewer

## Parameter Examples

### URL Parameter Structure
```
/#/app?param1=value1&param2=value2&param3=value3
```

### Available Parameters

| Parameter | Type | Example | Effect |
|-----------|------|---------|--------|
| `url` | string | `abcdef123456` | Auto-load extension from ID or URL |
| `file` | string | `manifest.json` | Auto-select file in tree |
| `search` | string | `onclick` | Auto-populate search field |

## Real-World Examples

### Example 1: Load Extension Only

**Purpose:** Share a specific extension

```
/#/app?url=abcdef123456
```

**Parameters:**
- `url=abcdef123456` - Extension ID

**What happens:**
1. Page loads
2. Extension downloads from Chrome Web Store
3. File tree populated
4. Viewer ready to browse

**URL variants:**
```
# Using full Web Store URL
/#/app?url=https://chrome.google.com/webstore/detail/my-extension/abcdef123456

# Using just ID
/#/app?url=abcdef123456

# Using extension name in URL
/#/app?url=chrome://webstore/detail/abcdef123456
```

### Example 2: Load Extension + Select File

**Purpose:** Share a specific file in an extension

```
/#/app?url=abcdef123456&file=manifest.json
```

**Parameters:**
- `url=abcdef123456` - Extension ID
- `file=manifest.json` - File to select

**What happens:**
1. Extension downloads
2. File tree populated
3. `manifest.json` automatically selected
4. Code displayed in viewer

**More file examples:**
```
# Manifest file
/#/app?url=abcdef123456&file=manifest.json

# Background script
/#/app?url=abcdef123456&file=background.js

# Content script
/#/app?url=abcdef123456&file=content.js

# Nested file
/#/app?url=abcdef123456&file=src/utils/helper.js

# Config file
/#/app?url=abcdef123456&file=config.json

# Style file
/#/app?url=abcdef123456&file=styles/main.css
```

### Example 3: Load Extension + Search Term

**Purpose:** Share a specific code search

```
/#/app?url=abcdef123456&search=onclick
```

**Parameters:**
- `url=abcdef123456` - Extension ID
- `search=onclick` - Search term

**What happens:**
1. Extension downloads
2. Search term pre-populated: "onclick"
3. Search executes automatically
4. Results displayed

**Common search terms:**
```
# Search for permissions
/#/app?url=abcdef123456&search=permissions

# Search for event listeners
/#/app?url=abcdef123456&search=addEventListener

# Search for API calls
/#/app?url=abcdef123456&search=chrome.storage

# Search for dangerous functions
/#/app?url=abcdef123456&search=eval

# Search for fetch calls
/#/app?url=abcdef123456&search=fetch

# Search for HTTP requests
/#/app?url=abcdef123456&search=XMLHttpRequest

# Search for regex patterns
/#/app?url=abcdef123456&search=\/.*\/
```

### Example 4: All Parameters Combined

**Purpose:** Complete deep link with extension, file, and search

```
/#/app?url=abcdef123456&file=manifest.json&search=permissions
```

**Parameters:**
- `url=abcdef123456` - Extension ID
- `file=manifest.json` - File to view
- `search=permissions` - Search term

**What happens:**
1. Extension downloads
2. `manifest.json` selected
3. Search for "permissions" starts
4. Search results highlighted

**Examples:**
```
# Review security - check permissions
/#/app?url=abcdef123456&file=manifest.json&search=permissions

# Check content scripts
/#/app?url=abcdef123456&file=manifest.json&search=content_scripts

# Review background service worker
/#/app?url=abcdef123456&file=background.js&search=chrome.runtime

# Check for dangerous eval
/#/app?url=abcdef123456&search=eval

# Review all fetch calls
/#/app?url=abcdef123456&search=fetch

# Check for external domains
/#/app?url=abcdef123456&search=http:\/\/
```

## Real Extension Examples

### Chrome: Adblock Plus
```
Viewer Only:
/#/app?url=cfhdojbkjhnklbpkdaibdccddilifddb

With manifest:
/#/app?url=cfhdojbkjhnklbpkdaibdccddilifddb&file=manifest.json

Search for permissions:
/#/app?url=cfhdojbkjhnklbpkdaibdccddilifddb&file=manifest.json&search=permissions
```

### Chrome: uBlock Origin
```
Viewer Only:
/#/app?url=cjpalhdlnbpafiamejdnhcphjbkeiagm

Check permissions:
/#/app?url=cjpalhdlnbpafiamejdnhcphjbkeiagm&file=manifest.json&search=permissions

Search for filters:
/#/app?url=cjpalhdlnbpafiamejdnhcphjbkeiagm&search=filter
```

### Chrome: Dark Reader
```
Viewer Only:
/#/app?url=eimadpbcbfnmbkopoojfekhnkhdbieeh

View manifest:
/#/app?url=eimadpbcbfnmbkopoojfekhnkhdbieeh&file=manifest.json

Check for API usage:
/#/app?url=eimadpbcbfnmbkopoojfekhnkhdbieeh&search=chrome.storage
```

## Security Review Examples

### Check Permissions
```
/#/app?url=EXTENSION_ID&file=manifest.json&search=permissions
```
**Purpose:** Quickly review what permissions the extension requests

### Check Content Scripts
```
/#/app?url=EXTENSION_ID&file=manifest.json&search=content_scripts
```
**Purpose:** See what pages the extension can interact with

### Check External URLs
```
/#/app?url=EXTENSION_ID&search=http:\/\/
```
**Purpose:** Find any external domain connections

### Check API Calls
```
/#/app?url=EXTENSION_ID&search=chrome\.
```
**Purpose:** Find all Chrome API usage

### Check Dangerous Functions
```
/#/app?url=EXTENSION_ID&search=eval
```
**Purpose:** Find use of dangerous eval()

## URL Encoding Examples

### Special Characters

If your search term has special characters, URL-encode them:

```
# Search for "onclick" (no encoding needed)
/#/app?url=abc&search=onclick

# Search for "chrome.storage.sync" (dots are safe)
/#/app?url=abc&search=chrome.storage.sync

# Search for space: "fetch api" → use %20
/#/app?url=abc&search=fetch%20api

# Search for forward slash: "/" → use %2F
/#/app?url=abc&search=%2Fapi%2F

# Search for asterisk: "*" → use %2A
/#/app?url=abc&search=%2A

# Search for plus sign: "+" → use %2B
/#/app?url=abc&search=add%2Bremove
```

### JavaScript Encoding Helper

```javascript
// Encode a parameter value
const encoded = encodeURIComponent("search term");
console.log(encoded);

// Use in URL
const url = `/#/app?url=abc&search=${encoded}`;
```

## Sharing URLs

### Copy Share Link

```javascript
// Get current view as shareable link
function generateShareLink() {
  const params = new URLSearchParams();
  params.set('file', 'manifest.json');
  params.set('search', 'permissions');

  const link = `${window.location.origin}${window.location.pathname}#/app?${params}`;

  navigator.clipboard.writeText(link);
  console.log('Link copied:', link);
}
```

### Create Short Share Links

**Option 1: Use URL shortener**
```
Full:  https://your-username.github.io/crxreview/#/app?url=abcdef&file=manifest.json
Short: https://bit.ly/abc123
```

**Option 2: QR Code**
Generate QR code from long URL for easy sharing

## Testing URLs Locally

### Development Server
```bash
npm run dev
# Server runs at http://localhost:5173
```

### Test URLs
```
Landing:  http://localhost:5173/#/
Viewer:   http://localhost:5173/#/app
With URL: http://localhost:5173/#/app?url=abcdef
```

### Local File
```bash
# Build production
npm run build

# Serve locally
npx http-server dist/

# Visit http://localhost:8080/#/
```

## Common URL Patterns by Use Case

### For Security Review
```
1. View manifest:
   /#/app?url=ID&file=manifest.json

2. Check permissions:
   /#/app?url=ID&file=manifest.json&search=permissions

3. Check content scripts:
   /#/app?url=ID&file=manifest.json&search=content_scripts

4. Check external domains:
   /#/app?url=ID&search=http:\/\/

5. Check dangerous APIs:
   /#/app?url=ID&search=eval
```

### For Code Review
```
1. View main background script:
   /#/app?url=ID&file=background.js

2. Search for specific function:
   /#/app?url=ID&search=myFunction

3. View specific library:
   /#/app?url=ID&file=lib/library.js

4. Search for API usage:
   /#/app?url=ID&search=chrome.storage
```

### For Feature Discovery
```
1. Find all message handlers:
   /#/app?url=ID&search=chrome.runtime.onMessage

2. Find storage usage:
   /#/app?url=ID&search=chrome.storage

3. Find network requests:
   /#/app?url=ID&search=fetch

4. Find DOM manipulation:
   /#/app?url=ID&search=document.querySelector
```

## Troubleshooting URLs

### Extension Not Loading

**Check URL format:**
```
Wrong: /#/app?url=https://example.com
Right: /#/app?url=abcdef123456

Wrong: /?app?url=ID
Right: /#/app?url=ID
```

### File Not Selecting

**Check file path:**
```
Wrong: /#/app?file=manifest
Right: /#/app?url=ID&file=manifest.json

Wrong: /#/app?file=/manifest.json
Right: /#/app?url=ID&file=manifest.json
```

### Search Not Working

**Check search syntax:**
```
Wrong: /#/app?search=
Right: /#/app?url=ID&search=term

Wrong: /#/app?url=ID&q=search
Right: /#/app?url=ID&search=search
```

### Multiple Values

**Each parameter only accepts one value:**
```
Wrong: /#/app?file=a.js&file=b.js
Right: /#/app?file=a.js (then manually select b.js)

Wrong: /#/app?search=term1&search=term2
Right: /#/app?search=term1 (then search for term2)
```

## Parameter Limits

| Parameter | Max Length | Encoding | Notes |
|-----------|-----------|----------|-------|
| `url` | ~100 chars | URL-safe | Extension ID or Web Store URL |
| `file` | ~255 chars | URL-safe | File path in extension |
| `search` | ~1000 chars | URL-safe | Search query |

## Browser Support

All URLs work in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Creating Links Programmatically

### React Component
```tsx
function ShareLink() {
  const extensionId = 'abcdef123456';
  const filePath = 'manifest.json';
  const searchTerm = 'permissions';

  const params = new URLSearchParams({
    url: extensionId,
    file: filePath,
    search: searchTerm,
  });

  const link = `/#/app?${params.toString()}`;

  return (
    <a href={link}>
      Review Extension
    </a>
  );
}
```

### Plain JavaScript
```javascript
function createLink(extId, file, search) {
  const url = new URL(window.location.href);
  url.hash = '/app';

  const params = url.searchParams;
  params.set('url', extId);
  if (file) params.set('file', file);
  if (search) params.set('search', search);

  return url.toString();
}
```

## Quick Reference Table

| Want to... | URL Pattern |
|-----------|-------------|
| View landing page | `/#/` |
| Open empty viewer | `/#/app` |
| Load extension | `/#/app?url=ID` |
| Load + view file | `/#/app?url=ID&file=path` |
| Load + search | `/#/app?url=ID&search=term` |
| Everything | `/#/app?url=ID&file=path&search=term` |

---

**Last Updated:** January 28, 2026
**URL Format:** Hash-based routing (`/#/...`)
**All Examples Tested:** ✅
