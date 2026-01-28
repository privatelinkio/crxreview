# CRX Review - User Guide

A comprehensive guide to using CRX Review for analyzing Chrome Extensions.

## Quick Start

1. Visit the application at its hosted URL or open it locally
2. Click on the upload area or drag and drop a `.crx` file
3. Wait for the file to load and parse
4. Explore the file structure in the left sidebar
5. Click on any file to view its contents

## Getting Started

### Loading Your First Extension

#### Method 1: File Upload

1. **From Landing Page**: Click the large upload area in the center of the screen
2. **From Viewer**: Use the "Upload New CRX" button in the top navigation bar
3. Select a `.crx` file from your computer

#### Method 2: Drag and Drop

1. Drag a `.crx` file from your file explorer
2. Drop it anywhere on the upload area (it will highlight when valid)
3. The file uploads and processes automatically

#### Method 3: URL Loading (Advanced)

If you have access to a URL pointing to a CRX file, you can load it directly:

1. Look for the URL input option in the landing page
2. Paste the extension's download URL
3. Click load to fetch and parse the extension

**Note**: The URL must be accessible from your browser. CORS restrictions may apply.

### Understanding the Interface

The viewer interface consists of five main areas:

```
┌─────────────────────────────────────────────────────────┐
│                    TOP BAR                              │
│  [Logo] Extension Name | Size | ID | [Download] [New] │
├──────────────┬─────────────────────────────────────────┤
│              │                                          │
│ FILE TREE    │          CODE VIEWER                    │
│              │                                          │
│ ├─ manifest  │  function exampleFunc() {               │
│ ├─ images/   │    return "Hello World";                │
│ ├─ scripts/  │  }                                       │
│ └─ styles/   │                                          │
│              │  [Copy] [Download] [Format]             │
├──────────────┼─────────────────────────────────────────┤
│  SEARCH BAR  │  FILTER OPTIONS                         │
│  [Input...]  │  [Type Filter] [Size Filter]            │
└──────────────┴─────────────────────────────────────────┘
```

## Working with Files

### Navigating the File Tree

The file tree on the left shows your extension's directory structure:

- **Folders**: Click the arrow to expand/collapse
- **Files**: Click to view contents in the main panel
- **File Icons**: Different icons indicate file types:
  - Document icon: Code files (JS, HTML, CSS)
  - Image icon: Image files (PNG, JPG, GIF)
  - Settings icon: JSON files
  - Generic icon: Other files

### Viewing File Contents

When you select a file:

1. **Code Files**: Display with syntax highlighting
   - Language automatically detected
   - Line numbers shown
   - Supports: JavaScript, HTML, CSS, JSON, TypeScript, and more

2. **Image Files**: Display as images
   - Full preview in the viewer
   - Right-click to save or open in new tab

3. **Binary Files**: Show file info
   - File name, size, and type
   - Cannot be previewed as text

4. **Unknown Files**: Display raw content
   - May show as binary or text depending on content

### Using the Source Toolbar

The toolbar above code displays these actions:

- **Copy**: Copy file contents to clipboard
- **Download**: Save the file to your computer
- **Format**: Auto-format code for readability (if supported)
- **View Raw**: Toggle between formatted and raw display
- **Info**: Show file properties (size, path, encoding)

## Searching and Filtering

### Content Search

Find specific text within extension files:

1. Click in the **Search Files** input at the bottom
2. Type your search query
3. Results highlight matching files
4. Click a result to view the file and see highlighted matches

**Search Features**:
- Case-insensitive by default
- Searches file names and contents
- Regular expressions supported (surround with `/` and `/`)
- Real-time results as you type

**Example Searches**:
- `chrome.tabs` - Find API usage
- `TODO` - Find code comments
- `/^function\s+\w+/ ` - Find all function declarations
- `secret` - Find potential API keys

### File Filtering

Filter files by type and other criteria:

- **By Type**: Select from dropdown (JavaScript, Images, JSON, etc.)
- **By Size**: Show only files larger/smaller than specified size
- **By Name**: Enter pattern to match file names
- **Combined Filters**: Use multiple filters together

**Example Filters**:
- Show only JS files: Set type to "JavaScript"
- Find large files: Set size minimum to "100 KB"
- Find config files: Name filter "*.json"

## Managing Your Extension

### Downloading Files

#### Download Single File

1. Select the file in the tree
2. Click the **Download** button in the toolbar
3. File saves to your downloads folder with original name

#### Download All Files

1. Click **Download All** in the top bar
2. Choose format:
   - **ZIP Archive**: All files in directory structure
   - **TAR Archive**: Alternative archive format
3. Archive saves to your downloads folder

#### Download Entire Extension

1. Click **Download CRX** in the top bar
2. Downloads the original `.crx` file

### Getting Extension Information

The **Top Bar** displays key information:

- **Extension Name**: From manifest.json name field
- **Extension ID**: Unique Chrome Web Store identifier
- **Version**: Current version from manifest
- **Size**: Total uncompressed file size
- **Loaded At**: When the extension was loaded

Click the info icon for detailed extension metadata:
- Manifest version
- Permissions
- Content scripts
- Background scripts
- Icons and resources

## Advanced Features

### Manifest Analysis

The `manifest.json` file contains extension configuration:

1. Find and open `manifest.json`
2. Review key sections:
   - **name/version**: Extension identity
   - **permissions**: What the extension can access
   - **content_scripts**: Scripts injected into pages
   - **background**: Background service worker
   - **action**: Extension icon and popup

### Examining Permissions

To understand what an extension can do:

1. Open `manifest.json`
2. Look for the `permissions` array
3. Common permissions:
   - `tabs` - Read and modify tabs
   - `storage` - Store local data
   - `activeTab` - Access current tab
   - `webRequest` - Monitor network requests
   - `<all_urls>` - Access all websites

### Reviewing Content Scripts

Content scripts run on web pages:

1. Search for `content_scripts` in manifest
2. Note the URLs they affect (`matches` field)
3. Find the script files listed
4. Review the code for what they do

### Checking Background Workers

Modern extensions use service workers instead of background pages:

1. Look for `background.service_worker` in manifest
2. Find and examine the worker file
3. Service workers handle events and maintain state

## Tips and Tricks

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + F` | Focus search input |
| `Ctrl/Cmd + C` | Copy selected file contents |
| `Ctrl/Cmd + D` | Download selected file |
| `Esc` | Clear search/filter |
| `Arrow Up/Down` | Navigate file list |
| `Enter` | Open selected file |

### Search Tips

1. **Find API Usage**: Search for `chrome.` to find API calls
2. **Find Network Requests**: Search for `fetch(` or `XMLHttpRequest`
3. **Find Comments**: Search for `//` or `/*` for developer notes
4. **Find Hardcoded Values**: Search for specific strings or domains
5. **Find All Functions**: Use regex `/^function \w+/` in JS files

### Performance Tips

1. **Large Extensions**: May take time to load initially
   - The first load processes and indexes all files
   - Subsequent navigation is fast
   - Close unused tabs to save memory

2. **Search Optimization**:
   - Be specific with search queries for faster results
   - Use filters before searching to reduce search scope
   - Regular expressions are slower than plain text

3. **Memory Usage**:
   - Close the tool when done to free memory
   - Don't load multiple large extensions simultaneously
   - Clear browser cache periodically

### Navigation Tips

1. **Breadcrumb Navigation**: The file path shows at the top
   - Click path segments to jump to that directory
   - Useful for large extensions with deep nesting

2. **File Tree Organization**:
   - Folders sort alphabetically before files
   - Expand/collapse folders to focus on areas of interest
   - Double-click a folder to expand all sub-folders

3. **Recent Files**:
   - The tool remembers your last viewed file
   - Returns to it when you reload the page

## Troubleshooting

### Upload Issues

**Problem**: Upload button doesn't work
- Solution: Ensure you're selecting a valid `.crx` file
- Try refreshing the page and uploading again
- Check browser console for errors (F12)

**Problem**: File is too large
- Solution: Browser memory may have limits
- Try closing other tabs
- Use a different browser if available
- Consider uploading a different extension first

### Display Issues

**Problem**: Code doesn't show syntax highlighting
- Solution: Refresh the page to reload Prism.js
- Check that JavaScript is enabled
- Try a different browser

**Problem**: Images don't display
- Solution: Images must be in a supported format (PNG, JPG, GIF, WebP)
- Check file extension matches actual format
- Some binary image formats may not preview

### Search Issues

**Problem**: Search returns no results
- Solution: Check spelling of search term
- Try searching in a specific file type
- Use simple text, not special characters
- Expand your search criteria

**Problem**: Search is slow
- Solution: This is normal for large extensions
- Try being more specific with your search
- Filter by file type first
- Use a simpler search pattern

### Performance Issues

**Problem**: Interface is sluggish
- Solution: Close other applications
- Disable browser extensions
- Try a different browser
- Clear browser cache and reload

**Problem**: File downloads are slow
- Solution: This is normal for large files
- Large files take time to process
- Check your internet connection
- Try downloading individual files instead

## Security Notes

### Safe to Use

- CRX Review runs entirely in your browser
- No data is sent to external servers
- Your extensions are not uploaded anywhere
- All processing happens locally on your computer

### What You Can See

When you analyze an extension, you can view:
- All source code
- Configuration files
- Resources and assets
- Manifest configuration
- Any embedded content

### Sensitive Information

Be aware that extension code may contain:
- API keys or tokens
- Hardcoded URLs and endpoints
- Tracking codes
- Analytics identifiers
- User data handling logic

## Frequently Asked Questions

### Can I edit files?
No, CRX Review is a viewer-only tool. To modify an extension, you need the source code and development environment.

### Can I repackage and upload extensions?
CRX files require cryptographic signing. Download the extracted files, but you'll need the original signing key to repackage as a CRX file.

### What file types are supported?
Any file type can be viewed. Text files show with syntax highlighting. Images show as previews. Binary files show basic information.

### Can I save my analysis?
You can download individual files or the entire archive. Screenshots and notes must be saved separately.

### Does this work offline?
Yes! Once the page loads, CRX Review works completely offline. File processing uses only local browser APIs.

### What browsers are supported?
- Chrome/Chromium 88+
- Firefox 87+
- Safari 14+
- Edge 88+

Mobile browsers also work but with limited interface optimization.

### Can I use this with unpacked extensions?
Not directly. You can manually create a ZIP file of your unpacked extension files and upload it as a ZIP instead.

### How are permissions handled?
This application requires only basic file reading permissions from your browser. It doesn't request special browser APIs beyond FileReader.

## Getting Help

If you encounter issues:

1. **Check This Guide**: Search for your issue above
2. **Check Browser Console**: Press F12 and look for error messages
3. **Try These Steps**:
   - Refresh the page
   - Clear browser cache
   - Try a different browser
   - Try a different extension

4. **Report Issues**: Open an issue on the project GitHub repository with:
   - Description of the problem
   - Steps to reproduce
   - Browser and OS information
   - Any error messages from console
