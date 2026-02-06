# Shared JavaScript Libraries Implementation Guide

**Version:** 1.0  
**Date:** February 6, 2026  
**Purpose:** This document provides the implementation plan, development workflow, and expansion strategy for the three shared JavaScript libraries.

---

## Overview

This guide covers the practical aspects of creating and maintaining the three shared JavaScript libraries:

1. **api-client.js** - C64U REST API interface layer
2. **ui-components.js** - Reusable UI utility functions
3. **tab-lifecycle.js** - Tab management and lifecycle implementation

For specifications, see **SHARED_LIBRARIES.md**.

---

## api-client.js

### Initial Implementation

Start with the memory operations and error handling from **C64U Memory REST API Reference.md**:

1. `parseApiError(jqXHR)` - Robust error parser that handles JSON errors array
2. `readMemory(address, length, callback, errorCallback)` - Read memory operation
3. `writeMemory(address, dataArray, callback, errorCallback)` - Write memory operation (handles both PUT and POST)

### Future Expansion

As tools are migrated to the new specifications, add methods for:

#### Configuration API
- `getConfigCategories(callback, errorCallback)` - Get list of all config categories
- `getConfigCategory(category, callback, errorCallback)` - Get all items in a category
- `getConfigItem(category, item, callback, errorCallback)` - Get specific config item
- `setConfigItem(category, item, value, callback, errorCallback)` - Set config item value

#### Drive Operations
- `mountDisk(drive, path, callback, errorCallback)` - Mount disk image to drive
- `unmountDisk(drive, callback, errorCallback)` - Unmount disk from drive
- `getDriveStatus(drive, callback, errorCallback)` - Get current drive status

#### Stream Operations
- `enableStream(streamName, callback, errorCallback)` - Enable a data stream
- `disableStream(streamName, callback, errorCallback)` - Disable a data stream
- `getStreamStatus(callback, errorCallback)` - Get status of all streams

#### Other Operations
- Add methods as needed when rolling over tools to the new specifications
- Follow the consistent signature pattern: `function(params..., callback, errorCallback)`

---

## ui-components.js

### Initial Implementation

Implement the functions specified in **STYLE_GUIDE.md** (lines 516-566):

1. `showSpinner(show)` - Show/hide the global spinner
2. `showError(message)` - Display error in the global error box
3. `hideError()` - Hide the global error box
4. `showSuccess(containerId, message)` - Display success message with checkmark
5. `showErrorStatus(containerId, message)` - Display error message with cross
6. `formatAddress(addressStr)` - Format and validate hex address (returns null if invalid)

### Future Expansion

As UI needs arise, add functions for:

#### Keyboard Handling
- `setupHexInput(inputId)` - Configure input to accept only hex characters
- `handleEnterKey(inputId, callback)` - Execute callback when Enter is pressed

#### Data Formatting
- `formatHexByte(value)` - Format byte as 2-digit hex (e.g., "0F")
- `formatHexWord(value)` - Format word as 4-digit hex (e.g., "C000")
- `formatByteArray(bytes)` - Format array of bytes as hex string

#### Form Validation
- `validateRange(value, min, max)` - Validate numeric range
- `validateHexString(str, length)` - Validate hex string of specific length

#### Other Utilities
- Add functions as needed when rolling over tools
- Keep functions simple and focused on a single task

---

## tab-lifecycle.js

### Initial Implementation

Extract and refactor the tab management code from memory_tool.html:

1. `setupTabs()` - Bind click handlers to tab buttons
2. `switchToTab(tabId)` - Switch to a specific tab (with canDeactivate check)
3. `getActiveViewer()` - Get the currently active viewer object
4. `getViewerByTab(tabId)` - Get viewer object for a specific tab

### Future Expansion

The tab lifecycle library should be relatively stable. Potential additions:

- Support for programmatically triggering tab switches
- Support for tab-specific refresh behavior
- Support for tab enable/disable states
- Add only if multiple tools require the same functionality

---

## Development Workflow

### Phase 1: Create api-client.js
1. Extract `parseApiError()`, `readMemory()`, `writeMemory()` from **C64U Memory REST API Reference.md**
2. Integrate with `showSpinner()` and `showError()` calls (will be implemented in Phase 2)
3. Save to `/home/ubuntu/upload/api-client.js` for testing

### Phase 2: Create ui-components.js
1. Implement functions from **STYLE_GUIDE.md**
2. Save to `/home/ubuntu/upload/ui-components.js` for testing

### Phase 3: Create tab-lifecycle.js
1. Extract tab management code from memory_tool.html
2. Make it reusable and configurable
3. Save to `/home/ubuntu/upload/tab-lifecycle.js` for testing

### Phase 4: Test Integration
1. Duplicate memory_tool.html to api_debug.html
2. Update api_debug.html to use all three libraries
3. Verify all functionality works identically to memory_tool.html
4. Test edge cases and error scenarios

### Phase 5: Migrate Other Tools
1. Apply the same pattern to other HTML tools
2. Add new API methods to api-client.js as needed
3. Add new UI utilities to ui-components.js as needed
4. Update tools one at a time, testing thoroughly

---

## Testing Strategy

### api-client.js Testing

Use api_debug.html to test:

#### Memory Operations
- Read small block (16 bytes)
- Read large block (256+ bytes)
- Read boundary addresses (0000, FFFF)
- Write single byte (PUT method)
- Write multiple bytes ≤128 (PUT method)
- Write multiple bytes >128 (POST method)
- Write boundary addresses

#### Error Handling
- Invalid address formats
- Wrong password (403 error)
- Network errors (simulated)
- JSON errors array parsing
- ArrayBuffer error decoding

#### Edge Cases
- Address padding (e.g., "400" → "0400")
- Uppercase conversion
- Empty data arrays
- Maximum length reads/writes

### ui-components.js Testing

Use api_debug.html to test:

#### Spinner
- Visibility during API calls
- Hidden after success
- Hidden after error

#### Error Display
- Global error box display
- Error message content
- Error box dismissal

#### Success/Error Status
- Inline success messages with checkmark
- Inline error messages with cross
- Correct color coding

#### Address Formatting
- Valid hex addresses (with/without prefix)
- Invalid characters
- Out of range values (>FFFF)
- Padding to 4 digits
- Uppercase conversion

### tab-lifecycle.js Testing

Use api_debug.html to test:

#### Tab Switching
- Click to switch tabs
- Visual feedback (active state)
- Content visibility
- Multiple switches

#### Lifecycle Methods
- initialize() called once
- activate() called on switch
- canDeactivate() blocks switch when false
- deactivate() called after confirmation
- refresh() called by Refresh button

#### Unsaved Changes Protection
- Prompt when switching with unsaved changes
- Cancel switch on "Cancel"
- Proceed on "OK"
- Page unload protection (beforeunload)

#### Refresh Behavior
- Functional refresh (viewers with data)
- Empty refresh (viewers without data)
- No errors on empty implementation

---

## Expansion Guidelines

### When to Add to api-client.js
- When a new REST API endpoint is needed by a tool
- When multiple tools need the same API call
- When error handling needs to be consistent

### When to Add to ui-components.js
- When a UI pattern is used in 2+ tools
- When validation/formatting logic is duplicated
- When DOM manipulation is complex and reusable

### When to Add to tab-lifecycle.js
- Rarely - only when multiple tabbed tools need the same feature
- Prefer keeping tab-specific logic in individual tools
- Only add truly generic functionality

---

## Code Organization

### File Headers

Each library file should start with a header comment:

```javascript
/**
 * api-client.js
 * C64U REST API Interface Layer
 * 
 * Provides all methods for interfacing with the C64U REST API.
 * This is the only file that should make direct REST API calls.
 * 
 * Version: 1.0
 * Date: February 6, 2026
 */
```

### Function Documentation

Each function should have a JSDoc-style comment:

```javascript
/**
 * Read memory from the C64.
 * @param {number} address - Memory address (0x0000-0xFFFF)
 * @param {number} length - Number of bytes to read
 * @param {function} callback - Success callback, receives ArrayBuffer
 * @param {function} errorCallback - Error callback, receives error message string
 */
function readMemory(address, length, callback, errorCallback) {
    // Implementation
}
```

### Code Style

- Use consistent indentation (4 spaces)
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and single-purpose
- Follow the patterns established in the reference documents

---

## Migration Checklist

When migrating a tool to use the shared libraries:

- [ ] Add `<script>` tags for all three libraries
- [ ] Remove inline API calls, replace with api-client.js methods
- [ ] Remove inline UI functions, replace with ui-components.js methods
- [ ] If tabbed, use tab-lifecycle.js instead of inline tab management
- [ ] Test all functionality
- [ ] Test error scenarios
- [ ] Test on mobile devices
- [ ] Update tool-specific documentation if needed

---

## Summary

The implementation follows a phased approach:

1. **Phase 1-3**: Create the three library files
2. **Phase 4**: Test integration with api_debug.html
3. **Phase 5**: Migrate other tools one at a time

Expansion is driven by actual needs as tools are migrated. Add functions only when they're needed by multiple tools or when they improve consistency and maintainability.
