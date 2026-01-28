# CRX Review - Troubleshooting Guide

Complete troubleshooting guide for common issues and their solutions.

## File Upload Issues

### Issue: Upload area is unresponsive

**Symptoms**: Clicking the upload area does nothing, drag and drop doesn't work

**Solutions**:

1. **Check File Format**:
   - Ensure the file has `.crx` extension
   - Check file size (must be larger than 16 bytes)
   - Verify file is a valid Chrome Extension file

2. **Browser Issues**:
   - Refresh the page (Ctrl+R or Cmd+R)
   - Clear browser cache (Ctrl+Shift+Delete)
   - Try a different browser
   - Disable browser extensions and try again

3. **System Issues**:
   - Check available disk space
   - Close other resource-heavy applications
   - Restart the browser
   - Restart your computer

### Issue: File upload fails silently

**Symptoms**: File appears to upload but nothing happens afterward

**Solutions**:

1. **Enable JavaScript**:
   - Check that JavaScript is enabled in browser settings
   - Look for notification bar about disabled JavaScript
   - Enable it and reload the page

2. **Check Browser Console**:
   - Open Developer Tools (F12 or Ctrl+Shift+I)
   - Go to Console tab
   - Look for error messages
   - Take note of errors for reporting

3. **File Validation**:
   - File must be valid CRX (not just renamed file)
   - File magic number must be: `Cr24` (hex: 43 72 32 34)
   - File must have proper CRX header structure

### Issue: "Invalid CRX file" error

**Symptoms**: Error message appears after uploading a valid extension

**Causes & Solutions**:

1. **File Corruption**:
   - Solution: Re-download the extension from Chrome Web Store
   - Use a fresh copy of the file
   - Check file integrity if downloaded from external source

2. **Format Mismatch**:
   - Solution: Ensure file is CRX format, not ZIP
   - CRX file structure: Header (16 bytes) + Public Key + Signature + ZIP data
   - Don't rename ZIP files to .crx

3. **Header Corruption**:
   - Verify file starts with: `Cr24` (hex bytes 43 72 32 34)
   - Use hex editor to inspect first 16 bytes
   - Download fresh copy if corrupted

4. **Signature Issues**:
   - Solution: Use CRX files from official Chrome Web Store
   - Extensions with invalid signatures won't load
   - Some modified CRX files may be rejected

### Issue: File is too large

**Symptoms**: Upload fails or page becomes unresponsive with large files

**Solutions**:

1. **Browser Memory**:
   - Close other tabs and applications
   - Restart the browser
   - Try again with fresh memory
   - Use a browser with more memory available

2. **File Size Limits**:
   - Browser memory is the limiting factor
   - Typical limit: 512 MB to 2 GB depending on browser
   - Large extensions (100+ MB) may cause issues
   - Try a different browser with more available RAM

3. **Optimization**:
   - Ensure you have adequate free RAM (at least 2x file size)
   - Close video streaming and other heavy apps
   - Use a desktop/laptop instead of mobile device
   - Try browser in incognito mode (may reduce memory usage)

## Display and Rendering Issues

### Issue: File tree doesn't show files

**Symptoms**: File tree sidebar is empty after successful upload

**Causes & Solutions**:

1. **Wait for Processing**:
   - Large files take time to parse
   - Look for loading spinner or progress indicator
   - Wait for "Loading..." status to complete
   - May take 30 seconds or more for very large extensions

2. **Browser Console Errors**:
   - Open Developer Tools (F12)
   - Check Console tab for errors
   - Look for messages starting with "Error" or "Exception"
   - Common errors indicate parsing issues

3. **Try Different File**:
   - Try loading a smaller, simpler extension
   - Confirm file tree works with other files
   - Issue may be specific to that extension

### Issue: Code doesn't show syntax highlighting

**Symptoms**: Code displays as plain text without colors

**Solutions**:

1. **Refresh Page**:
   - Reload the page (Ctrl+R or Cmd+R)
   - Prism.js may not have loaded initially
   - Second load usually fixes this

2. **Enable JavaScript**:
   - Ensure JavaScript is enabled in browser settings
   - Syntax highlighting requires JavaScript
   - Check for JavaScript notification in address bar

3. **Supported Languages**:
   - Not all file types have highlighting
   - Supported: JavaScript, HTML, CSS, JSON, TypeScript, Python, PHP, etc.
   - Unknown file types show plain text

4. **Browser Issues**:
   - Clear browser cache
   - Disable browser extensions
   - Try incognito mode
   - Try a different browser

### Issue: Images don't display

**Symptoms**: Image files show blank or broken preview

**Solutions**:

1. **Supported Formats**:
   - CRX Review supports: PNG, JPG, JPEG, GIF, WebP, SVG
   - Other formats may not display
   - Try downloading and opening in image viewer

2. **Check File**:
   - File extension may not match actual format
   - File may be corrupted
   - Try opening with your system image viewer
   - If it opens there, try downloading and opening from here

3. **Display Issues**:
   - Refresh the page
   - Check browser zoom level (Ctrl+0 to reset)
   - Try a different browser
   - Clear browser cache

### Issue: Text is too small or too large

**Symptoms**: Code or file contents are hard to read

**Solutions**:

1. **Adjust Zoom**:
   - Increase zoom: Ctrl+Plus (or Cmd+Plus on Mac)
   - Decrease zoom: Ctrl+Minus (or Cmd+Minus on Mac)
   - Reset zoom: Ctrl+0 (or Cmd+0 on Mac)

2. **Font Size Settings**:
   - Look for font size options in settings
   - Some browsers allow font scaling

3. **Full Screen View**:
   - Press F11 for full screen
   - Provides more space for code viewing

### Issue: Layout is broken or misaligned

**Symptoms**: UI elements overlap or panels are in wrong positions

**Solutions**:

1. **Refresh**:
   - Reload the page (Ctrl+R)
   - Layout usually resets properly

2. **Clear Cache**:
   - Clear browser cache and cookies
   - Go to Settings > Privacy > Clear browsing data
   - Check "Cookies and other site data"

3. **Reset View**:
   - Resize browser window
   - Close and reopen developer tools
   - Try different browser window size

4. **Browser Reset**:
   - Restart the browser completely
   - On some systems, browser memory state causes issues

## Search and Filter Issues

### Issue: Search returns no results

**Symptoms**: Results are empty even when text exists in files

**Solutions**:

1. **Check Search Term**:
   - Verify spelling is correct (case-insensitive)
   - Try simpler search terms
   - Avoid special characters
   - Try exact phrase instead of partial words

2. **Search Scope**:
   - Check if filters are limiting search scope
   - Clear all filters (click X button)
   - Search across all files
   - Try searching just file names vs contents

3. **Wait for Indexing**:
   - First search may take a moment
   - Large files need time to process
   - Status shows if search is in progress
   - Wait for completion before trying again

4. **Special Characters**:
   - If using regex, ensure valid regex syntax
   - Escape special characters: `.`, `*`, `+`, `?`, `[`, `]`, etc.
   - Use double backslash: `\\` for literal backslash

### Issue: Search is very slow

**Symptoms**: Search takes 30+ seconds or appears frozen

**Solutions**:

1. **Reduce Search Scope**:
   - Use file type filter first
   - Filter by file name pattern
   - Search in specific file types only
   - Limit search to relevant folders

2. **Simplify Search**:
   - Use plain text instead of regex
   - Shorter search terms are faster
   - Avoid complex regex patterns
   - More specific searches are faster

3. **Browser Performance**:
   - Close other tabs and applications
   - Disable browser extensions
   - Restart the browser
   - Use a different browser

4. **File Size**:
   - Very large extensions (100+ MB) take longer
   - Multiple large text files slow down search
   - This is normal behavior, not a bug

### Issue: Filters don't work

**Symptoms**: Filters appear selected but file list doesn't change

**Solutions**:

1. **Verify Filter Setting**:
   - Check that filter is actually selected
   - Click filter button again to ensure it's active
   - Look for visual indicator of active filter

2. **Clear Filters**:
   - Click X button to clear all filters
   - Click each filter again to reapply
   - Sometimes clearing and reapplying fixes issues

3. **Specific Filters**:
   - File type filter must match exact MIME type
   - Size filter uses bytes (example: "100000" for 100 KB)
   - Name filter uses glob patterns (example: "*.js")

4. **Multiple Filters**:
   - Multiple filters use AND logic (must match all)
   - To match any, use OR in regex
   - Clear filters and apply one at a time to test

## Download and Export Issues

### Issue: Download button doesn't work

**Symptoms**: Clicking download does nothing or shows error

**Solutions**:

1. **Browser Settings**:
   - Check if downloads are allowed
   - Go to Settings > Privacy > Files
   - Ensure downloads are not blocked

2. **Disk Space**:
   - Ensure sufficient disk space available
   - Check Downloads folder is accessible
   - Free up space if needed

3. **File Size**:
   - Very large downloads may fail
   - Try downloading individual files first
   - Check browser's download manager

4. **Try Again**:
   - Refresh page and try downloading again
   - Browser sometimes needs retry
   - Try different file or archive format

### Issue: Downloaded file is corrupted

**Symptoms**: Downloaded file can't be opened or is incomplete

**Solutions**:

1. **Check File Size**:
   - Compare downloaded size with displayed size
   - If smaller, download was interrupted
   - Try downloading again

2. **Verify Integrity**:
   - Test opening file with appropriate application
   - Check file header/signature if possible
   - Try re-downloading

3. **Network Issues**:
   - Slow or unstable internet may cause corruption
   - Try downloading when connection is stable
   - Use wired connection if available

4. **Try Different Format**:
   - Try downloading as different format (ZIP vs TAR)
   - Some browsers handle different formats better
   - Try different browser

## Browser-Specific Issues

### Chrome/Chromium

**Issue**: Extensions disabled in Chrome
- Solution: CRX Review doesn't require special permissions, but if it's disabled:
  - Go to Settings > Extensions
  - Find CRX Review and enable it
  - Or reinstall from Chrome Web Store

**Issue**: Storage issues
- Solution: Chrome has memory limits for web apps
  - Try closing other tabs
  - Clear browser cache
  - Restart Chrome

### Firefox

**Issue**: StyleSheet loading issues
- Solution: Some CSS may not load properly in Firefox
  - Refresh page with Ctrl+Shift+R (hard refresh)
  - Clear Firefox cache
  - Try Firefox in Safe Mode

**Issue**: Large file handling
- Solution: Firefox may handle large files differently
  - Try Chrome or Edge if available
  - Disable Firefox extensions
  - Allocate more memory to Firefox

### Safari

**Issue**: IndexedDB not available
- Solution: Safari has limited IndexedDB support
  - Try using localStorage instead
  - Clear Safari cache
  - Update to latest Safari version

**Issue**: File upload not working
- Solution: Safari has stricter security for file uploads
  - Ensure app has permission to access files
  - Try different file
  - Update macOS

### Edge

**Issue**: Performance slower than Chrome
- Solution: Edge uses Chromium but has different memory management
  - Try Chrome instead
  - Close other Edge tabs
  - Allocate more RAM to Edge
  - Clear browsing data

## Performance Issues

### Issue: App is slow or freezing

**Symptoms**: Interface is sluggish, delays in interactions

**Solutions**:

1. **Close Other Applications**:
   - Close browsers, video players, heavy apps
   - Check Task Manager / Activity Monitor for resource usage
   - Close background processes

2. **Browser Optimization**:
   - Close other tabs
   - Disable browser extensions
   - Try private/incognito mode
   - Restart the browser

3. **System Optimization**:
   - Close other programs
   - Restart your computer
   - Check available RAM
   - Check disk space availability

4. **Extension Optimization**:
   - Load smaller extensions first
   - Close CRX Review tab between uses
   - Use different browser if available

### Issue: Memory usage keeps increasing

**Symptoms**: Browser uses more and more memory over time

**Solutions**:

1. **Clear Memory**:
   - Reload the page (Ctrl+R)
   - Close and reopen the tab
   - Close and reopen the browser

2. **Limit Usage**:
   - Only load one extension at a time
   - Close CRX Review when not in use
   - Don't keep multiple tabs open
   - Avoid loading very large extensions repeatedly

3. **Browser Settings**:
   - Increase available system RAM
   - Restart the browser
   - Try different browser with different memory management

### Issue: Search takes excessive memory

**Symptoms**: Memory usage spikes during search operations

**Solutions**:

1. **Limit Search Scope**:
   - Apply filters before searching
   - Search specific file types only
   - Reduce file size limits

2. **Optimize Search**:
   - Use simple text search instead of regex
   - Break large searches into smaller ones
   - Clear previous searches

3. **Wait and Retry**:
   - Pause and let system recover
   - Force garbage collection (not user-accessible)
   - Restart browser and try again

## Advanced Troubleshooting

### Checking Browser Console

For technical issues, check browser console:

1. Open Developer Tools: F12 or Ctrl+Shift+I
2. Go to Console tab
3. Look for error messages (red text)
4. Note any error details

**Common Console Errors**:
- `Uncaught Error: Invalid CRX` - File format issue
- `Uncaught ReferenceError` - JavaScript execution issue
- `CORS error` - Network request blocked
- `Out of memory` - Browser ran out of RAM

### Checking Network Requests

To verify no data is being sent:

1. Open Developer Tools: F12
2. Go to Network tab
3. Upload file and perform actions
4. Check that only local requests appear
5. No requests to external servers should occur

### Checking Storage

To verify data storage:

1. Open Developer Tools: F12
2. Go to Application tab
3. Check Local Storage section
4. Should only contain app settings, not extension data

## Still Having Issues?

If none of these solutions work:

1. **Document the Issue**:
   - Take screenshots
   - Note exact steps to reproduce
   - Record browser and OS information
   - Copy error messages from console

2. **Check Compatibility**:
   - Verify browser is supported (Chrome 88+, Firefox 87+, Safari 14+, Edge 88+)
   - Check if OS is current version
   - Verify adequate system resources

3. **Report the Issue**:
   - Open GitHub issue with details
   - Include browser, OS, and error information
   - Describe steps to reproduce
   - Attach console logs if possible

4. **Workarounds**:
   - Try different browser
   - Try different device if available
   - Download extension files and analyze offline
   - Wait for updates to the tool

## Glossary

- **CRX**: Chrome Extension format (proprietary compressed format)
- **ZIP**: Standard compression format that CRX is based on
- **Manifest**: Configuration file (manifest.json) for extensions
- **Content Script**: Code that runs on web pages
- **Service Worker**: Background process handling events
- **Cache**: Temporary storage for faster access
- **CORS**: Cross-Origin Resource Sharing policy
- **Regex**: Regular expression for pattern matching
