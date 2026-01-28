# CRX Review - Testing Guide

This guide provides comprehensive manual testing procedures to verify all features of the CRX Review application.

## Table of Contents

1. [Setup and Prerequisites](#setup-and-prerequisites)
2. [Feature Testing](#feature-testing)
3. [Real Extension Testing](#real-extension-testing)
4. [Keyboard Navigation](#keyboard-navigation)
5. [Responsive Design](#responsive-design)
6. [Performance Testing](#performance-testing)
7. [Error Handling](#error-handling)
8. [Browser Compatibility](#browser-compatibility)

---

## Setup and Prerequisites

### System Requirements

- **Node.js**: v16 or higher
- **npm**: v7 or higher
- **Browsers**: Chrome/Edge 90+, Firefox 88+, Safari 14+

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Test Extensions

For testing, you'll need the following extension IDs or URLs:

1. **uBlock Origin**
   - Chrome Web Store ID: `cjpalhdlnbpafiamejdnhcphjbkeiagm`
   - URL: `https://chrome.google.com/webstore/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm`

2. **React Developer Tools**
   - Chrome Web Store ID: `fmkadmapgofadopljbjfkapdkoienihi`
   - URL: `https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi`

3. **Vimium C**
   - Chrome Web Store ID: `hfjbmkfikiseskyc77fwhyleeofakkk`
   - URL: `https://chrome.google.com/webstore/detail/vimium-c/hfjbmkfikiseskyc77fwhyleeofakkk`

---

## Feature Testing

### 1. URL Input and Loading

**Test Case 1.1: Load from Chrome Web Store URL**

- [ ] Start the app and navigate to `/app`
- [ ] Paste a Chrome Web Store URL in the input field
- [ ] Click "Load" button
- [ ] Verify loading spinner appears
- [ ] Verify extension ID displays when loaded
- [ ] Verify file tree populates with files
- **Expected**: Extension loads successfully, file tree shows hierarchical structure

**Test Case 1.2: Load from Extension ID**

- [ ] Clear the input field
- [ ] Enter an extension ID (e.g., `cjpalhdlnbpafiamejdnhcphjbkeiagm`)
- [ ] Click "Load" button
- [ ] Verify extension loads successfully
- **Expected**: App resolves ID to extension and loads it

**Test Case 1.3: Invalid URL Handling**

- [ ] Enter an invalid URL
- [ ] Click "Load" button
- [ ] Verify error message appears in red banner
- [ ] Verify loading state is cleared
- **Expected**: Error message explains what went wrong

**Test Case 1.4: Empty Input Handling**

- [ ] Leave input field empty
- [ ] Click "Load" button
- [ ] Verify button is disabled when input is empty
- **Expected**: Button remains disabled, no action taken

### 2. File Tree Navigation

**Test Case 2.1: Expand/Collapse Folders**

- [ ] Load an extension
- [ ] Click folder expand arrows (▶) to expand
- [ ] Verify nested files/folders appear
- [ ] Click expanded folder arrow (▼) to collapse
- [ ] Verify nested content is hidden
- **Expected**: Folder hierarchy toggles smoothly

**Test Case 2.2: File Selection**

- [ ] Expand at least one folder
- [ ] Click on a file in the tree
- [ ] Verify file is highlighted in blue
- [ ] Verify file content appears in the code viewer
- [ ] Verify file name appears in the right panel header
- **Expected**: File selection works correctly, content displays

**Test Case 2.3: File Icons**

- [ ] Expand several folders with different file types
- [ ] Verify correct icons appear:
  - Folders: 📁
  - Code files: {}
  - Images: 🖼️
  - Markup: 🏷️
  - Data: 📄
  - Documents: 📝
- **Expected**: Icons match file types appropriately

**Test Case 2.4: Nested Navigation**

- [ ] Navigate through multiple levels of nested folders
- [ ] Select files at different depth levels
- [ ] Verify all selections work correctly
- **Expected**: Deep nesting works without issues

### 3. Code Viewer

**Test Case 3.1: Syntax Highlighting**

- [ ] Load an extension
- [ ] Select a JavaScript file
- [ ] Verify syntax highlighting appears with colors
- [ ] Select a JSON file
- [ ] Verify different color scheme for JSON syntax
- [ ] Select an HTML file
- [ ] Verify HTML syntax highlighting
- **Expected**: Different file types have appropriate highlighting

**Test Case 3.2: Large Files**

- [ ] Find a large file (>100KB if available)
- [ ] Click to view it
- [ ] Verify it loads and displays without hanging
- [ ] Scroll through content smoothly
- **Expected**: Large files load without performance issues

**Test Case 3.3: Image Viewing**

- [ ] If extension has images, select an image file
- [ ] Verify image displays instead of code
- [ ] Verify image is centered and properly sized
- [ ] Verify filename appears in header
- **Expected**: Images render correctly

**Test Case 3.4: Binary Files**

- [ ] Try to select a binary file (if available)
- [ ] Verify appropriate error message appears
- [ ] Verify no code is displayed
- **Expected**: Error message indicates file cannot be viewed

### 4. Toolbar Features

**Test Case 4.1: Beautification**

- [ ] Select a minified JavaScript file
- [ ] Click the "Beautify" button in toolbar
- [ ] Verify code becomes formatted with indentation
- [ ] Click "Beautify" again
- [ ] Verify code reverts to original minified state
- **Expected**: Beautification toggles correctly

**Test Case 4.2: Copy to Clipboard**

- [ ] Select any file
- [ ] Click "Copy" button in toolbar
- [ ] Verify copy success message or feedback
- [ ] Open a text editor and paste
- [ ] Verify file content is pasted
- **Expected**: Copy functionality works correctly

**Test Case 4.3: Download**

- [ ] Select a file
- [ ] Click "Download" button in toolbar
- [ ] Verify file downloads with correct name
- [ ] Verify file content matches what's displayed
- **Expected**: File downloads with correct name and content

**Test Case 4.4: Download CRX**

- [ ] Load an extension
- [ ] Click "Download CRX" button in top bar
- [ ] Verify `.crx` file downloads
- [ ] Verify filename includes extension ID
- **Expected**: CRX file downloads successfully

### 5. Search Functionality

**Test Case 5.1: Open Search Panel**

- [ ] Have an extension loaded with a file selected
- [ ] Press `Ctrl+F` (or `Cmd+F` on Mac)
- [ ] Verify search panel appears below the header
- [ ] Verify search input field is focused
- **Expected**: Search panel opens immediately

**Test Case 5.2: Close Search Panel**

- [ ] With search panel open, press `Escape`
- [ ] Verify search panel closes
- [ ] Click search panel close button (if available)
- [ ] Verify search panel closes
- **Expected**: Panel closes when requested

**Test Case 5.3: Search with Multiple Results**

- [ ] Open search panel
- [ ] Enter a common word (e.g., "function")
- [ ] Verify search results show multiple matches
- [ ] Navigate through results
- [ ] Verify each result highlights the match
- **Expected**: All matching files appear in results

**Test Case 5.4: No Results**

- [ ] Enter a search term that matches nothing
- [ ] Verify "No results found" message appears
- [ ] Verify no files are highlighted
- **Expected**: Clear feedback when no matches found

### 6. File Filtering

**Test Case 6.1: Filter by Category**

- [ ] Click "Filter Files" button
- [ ] Check filter categories (JavaScript, JSON, HTML, CSS, etc.)
- [ ] Verify file tree updates to show only selected categories
- [ ] Uncheck categories
- [ ] Verify file tree updates accordingly
- **Expected**: Filtering works correctly

**Test Case 6.2: Filter by Name Pattern**

- [ ] Enter a filename pattern (e.g., "manifest")
- [ ] Verify only matching files appear
- [ ] Clear pattern
- [ ] Verify all files reappear
- **Expected**: Pattern matching works correctly

**Test Case 6.3: Active Filter Indicator**

- [ ] Apply a filter
- [ ] Verify filter button shows active state (yellow)
- [ ] Verify count of active filters displays
- [ ] Clear filters
- [ ] Verify button returns to normal state
- **Expected**: Active filter state is clearly indicated

---

## Real Extension Testing

### Test uBlock Origin

**Loading uBlock Origin:**

1. [ ] Enter the extension ID: `cjpalhdlnbpafiamejdnhcphjbkeiagm`
2. [ ] Wait for loading to complete
3. [ ] Verify extension loads without errors

**Content Verification:**

- [ ] Expand the manifest root folder
- [ ] Verify `manifest.json` appears
- [ ] Click on `manifest.json`
- [ ] Verify JSON syntax highlighting
- [ ] Check for expected structure (permissions, description, etc.)

**Features Testing:**

- [ ] Test beautification on minified files
- [ ] Search for "background" in the extension
- [ ] Test file filtering by JavaScript files
- [ ] Download the CRX file
- [ ] Copy a file to clipboard

**Expected Results:**

- All files load correctly
- Syntax highlighting works for all file types
- File operations (copy, download) work
- No console errors in dev tools

### Test React Developer Tools

**Loading React Developer Tools:**

1. [ ] Enter the extension ID: `fmkadmapgofadopljbjfkapdkoienihi`
2. [ ] Wait for loading to complete
3. [ ] Verify extension loads without errors

**Content Verification:**

- [ ] Verify manifest.json loads and displays correctly
- [ ] Check that content scripts are visible
- [ ] Verify background script appears

**Testing Large Files:**

- [ ] Find the largest file in the extension
- [ ] Scroll through it to test performance
- [ ] Test beautification if available
- [ ] Verify no lag or performance issues

**Expected Results:**

- Large files handle smoothly
- Search functionality works across many files
- No performance degradation

### Test Vimium C

**Loading Vimium C:**

1. [ ] Enter the extension ID: `hfjbmkfikiseskyc77fwhyleeofakkk`
2. [ ] Wait for loading to complete
3. [ ] Verify extension loads without errors

**Feature Testing:**

- [ ] Navigate through various file types
- [ ] Test search across extension
- [ ] Test keyboard navigation (arrow keys)
- [ ] Test responsive behavior

---

## Keyboard Navigation

### Test Case: Keyboard Shortcuts

**Ctrl/Cmd+F to Open Search**

- [ ] Have app open with extension loaded
- [ ] Press `Ctrl+F` on Windows/Linux or `Cmd+F` on Mac
- [ ] Verify search panel opens immediately
- [ ] Verify cursor is in search input field
- **Expected**: Shortcut works on first press

**Escape to Close Search**

- [ ] With search panel open, press `Escape`
- [ ] Verify search panel closes
- [ ] Verify focus returns to previous element
- **Expected**: Escape closes panel correctly

**Tab Navigation**

- [ ] Start at top of page
- [ ] Press `Tab` repeatedly
- [ ] Verify all interactive elements are reachable
- [ ] Verify focus order is logical (left to right, top to bottom)
- [ ] Verify no focus traps
- **Expected**: Tab order is logical and complete

**Enter Key**

- [ ] Focus on a file in the tree
- [ ] Press `Enter` to select it
- [ ] Verify file content displays
- **Expected**: Enter key selects files

**Arrow Keys in File Tree**

- [ ] Focus on a file tree item
- [ ] Press Up/Down arrows to navigate
- [ ] Verify correct items get focus
- [ ] Press Right arrow on folders to expand
- [ ] Press Left arrow on folders to collapse
- **Expected**: Arrow key navigation works intuitively

---

## Responsive Design

### Desktop Layout (1024px+)

**Test Case: Desktop Display**

- [ ] Open DevTools and set viewport to 1280x800
- [ ] Verify file tree on left, code viewer on right
- [ ] Verify resizable divider appears between panels
- [ ] Drag resizer to adjust panel widths
- [ ] Verify minimum widths are enforced (200px left, 300px right)
- **Expected**: Desktop layout shows both panels side-by-side

### Tablet Layout (768px - 1023px)

**Test Case: Tablet Display**

- [ ] Open DevTools and set viewport to 768x1024
- [ ] Verify layout is readable
- [ ] Test file tree navigation
- [ ] Test file viewing
- [ ] Verify all text is readable without horizontal scroll
- **Expected**: Content adapts well to tablet size

### Mobile Layout (320px - 767px)

**Test Case: Mobile Display**

- [ ] Open DevTools and set viewport to 375x667 (mobile)
- [ ] Verify file tree shows initially
- [ ] Click a file
- [ ] Verify code viewer appears fullscreen
- [ ] Verify "Back" button appears
- [ ] Click back button
- [ ] Verify file tree reappears
- [ ] Verify no horizontal scrolling needed
- **Expected**: Mobile view swaps between tree and code

**Test Case: Orientation Changes**

- [ ] Start in portrait (375x667)
- [ ] Rotate to landscape (667x375)
- [ ] Verify layout adapts properly
- [ ] Test file operations work in both orientations
- **Expected**: Orientation changes handled smoothly

### Panel Resizing

**Test Case: Resizable Panels (Desktop)**

- [ ] Open on desktop (1024px+)
- [ ] Position cursor on the resizer (vertical divider)
- [ ] Drag left to narrow file tree
- [ ] Verify minimum left width is 200px (can't go smaller)
- [ ] Drag right to narrow code viewer
- [ ] Verify minimum right width is 300px (can't go smaller)
- [ ] Release and verify position persists on file change
- **Expected**: Resizer works smoothly with constraints

---

## Performance Testing

### Test Case: Large File Handling

**Setup:**

- Load an extension with large files (100KB+)

**Verification:**

- [ ] Select large file
- [ ] Verify file loads within 2 seconds
- [ ] Scroll through file
- [ ] Verify smooth scrolling without stuttering
- [ ] Perform search in file
- [ ] Verify search completes quickly

**Expected Results:**

- Files under 1MB load in <2s
- Scrolling is smooth (60fps)
- Search is responsive (<500ms for results)

### Test Case: Memory Usage

**Setup:**

- Open Chrome DevTools Memory tab
- Take heap snapshot before loading extension

**Verification:**

- [ ] Load extension
- [ ] Take heap snapshot after loading
- [ ] Compare memory usage
- [ ] Navigate between multiple files
- [ ] Search across extension
- [ ] Take final heap snapshot

**Expected Results:**

- Memory growth <50MB
- No obvious memory leaks
- GC runs periodically

### Test Case: Syntax Highlighting Performance

**Setup:**

- [ ] Load an extension with many code files
- [ ] Time how long it takes to load a large file

**Verification:**

- [ ] First load with syntax highlighting
- [ ] Verify highlighting completes within 1 second
- [ ] Switch between files
- [ ] Verify smooth transitions

**Expected Results:**

- Initial highlighting: <1s
- File switching: <200ms

---

## Error Handling

### Test Case: Network Errors

**Scenario: Failed to Download Extension**

- [ ] Enter an invalid extension ID
- [ ] Click Load
- [ ] Verify error message displays explaining the issue
- [ ] Verify loading spinner stops
- [ ] Verify UI remains responsive
- **Expected**: Graceful error handling

**Scenario: Corrupted CRX File**

- [ ] Upload a corrupted .crx file
- [ ] Verify error message appears
- [ ] Verify app doesn't crash
- **Expected**: Error caught and displayed clearly

### Test Case: Decoding Errors

**Scenario: Invalid Encoding in File**

- [ ] Find a file with invalid UTF-8 encoding (if available)
- [ ] Select it
- [ ] Verify error message appears
- [ ] Verify user can still navigate to other files
- **Expected**: Error doesn't crash app

### Test Case: Browser Compatibility Issues

**Scenario: Missing File API Support**

- [ ] On older browsers, verify graceful degradation
- [ ] Verify error messages for unsupported features
- **Expected**: Clear feedback about limitations

---

## Browser Compatibility

### Chrome/Edge 90+

- [ ] Load extension
- [ ] Test all features
- [ ] Verify no console errors
- [ ] Test keyboard shortcuts
- **Expected**: Full functionality

### Firefox 88+

- [ ] Load extension
- [ ] Test file operations
- [ ] Test search
- [ ] Verify no console errors
- **Expected**: Full functionality

### Safari 14+

- [ ] Load extension
- [ ] Test basic features
- [ ] Verify keyboard shortcuts work
- **Expected**: Core functionality works

---

## Accessibility Testing

### Test Case: Screen Reader Support

**Using NVDA/JAWS (Windows) or VoiceOver (Mac):**

- [ ] Enable screen reader
- [ ] Navigate through file tree
- [ ] Verify folders and files are announced
- [ ] Verify file selection is announced
- [ ] Verify loading states are announced
- [ ] Verify error messages are announced

**Expected Results:**

- All interactive elements are announced
- Hierarchy is clear through nesting
- State changes are announced (loading, error, etc.)

### Test Case: Keyboard-Only Navigation

- [ ] Disconnect mouse
- [ ] Use only Tab, Enter, Escape, and arrow keys
- [ ] Navigate file tree
- [ ] Select files
- [ ] Operate search
- [ ] Close panels

**Expected Results:**

- All features accessible without mouse
- Focus is always visible
- Tab order is logical

### Test Case: Color Contrast

- [ ] Use browser color contrast checker
- [ ] Verify text has at least 4.5:1 contrast for normal text
- [ ] Verify buttons have sufficient contrast
- [ ] Check syntax highlighting colors

**Expected Results:**

- All text meets WCAG AA standards
- No color-only indicators

---

## Regression Testing Checklist

After making code changes, verify these critical paths:

- [ ] Extension loads from URL
- [ ] Extension loads from ID
- [ ] File tree displays correctly
- [ ] File selection works
- [ ] Code viewer shows content
- [ ] Syntax highlighting works
- [ ] Search opens with Ctrl+F
- [ ] Search closes with Escape
- [ ] Copy to clipboard works
- [ ] Download file works
- [ ] Beautification works
- [ ] Mobile layout works
- [ ] Panel resizing works
- [ ] Error states display
- [ ] Type checking passes (`npm run type-check`)
- [ ] No console errors

---

## Test Execution Summary

| Feature | Status | Notes |
|---------|--------|-------|
| URL Loading | [ ] | |
| File Navigation | [ ] | |
| Code Viewing | [ ] | |
| Syntax Highlighting | [ ] | |
| Search | [ ] | |
| Filtering | [ ] | |
| Copy/Download | [ ] | |
| Beautification | [ ] | |
| Keyboard Navigation | [ ] | |
| Mobile Responsive | [ ] | |
| Performance | [ ] | |
| Error Handling | [ ] | |
| Accessibility | [ ] | |
| Browser Compat | [ ] | |

---

## Notes for Testers

1. **Clear Cache**: Between major tests, clear browser cache to ensure fresh loads
2. **Console Check**: Always open DevTools console to check for errors
3. **Network Tab**: Monitor network requests to verify extension downloads
4. **Performance**: Use Chrome DevTools Lighthouse for performance audits
5. **Accessibility**: Use axe DevTools browser extension for accessibility checks

---

## Reporting Bugs

When reporting issues, please include:

1. **Steps to Reproduce**: Clear steps to trigger the issue
2. **Expected Behavior**: What should happen
3. **Actual Behavior**: What actually happened
4. **Browser/OS**: Chrome, Firefox, Safari, etc. with version
5. **Screenshot/Video**: Visual evidence of the issue
6. **Console Errors**: Any JavaScript errors from DevTools
7. **Network Requests**: Failed requests shown in Network tab

---

## Contact & Support

For questions about testing or to report issues, please check the project README or contact the development team.
