# Shared JavaScript Libraries Specification

**Version:** 2.0
**Date:** February 17, 2026  
**Purpose:** This document defines the specification for the three shared JavaScript libraries used across the C64U Web Control Panel project.

---

## Overview

The project uses three shared JavaScript libraries located in `/flash/html/js/`:

1. **api-client.js** - C64U REST API interface layer
2. **ui-components.js** - Reusable UI utility functions
3. **tab-lifecycle.js** - Tab management and lifecycle implementation

All three libraries use simple function-based architecture without modules or namespaces to keep the implementation straightforward.

---

## api-client.js

### Purpose

Provides all methods that interface with the C64U REST API. This is the **only** file that should make direct REST API calls. All tools must use these methods instead of calling the API directly.

### Scope

- Memory read/write operations
- Error handling and parsing
- Configuration operations
- Drive operations
- Stream operations
- Any helper methods needed by multiple tools

### Core Functions

The library provides these primary functions:

1. `parseApiError(jqXHR)` - Robust error parser that handles JSON errors array
2. `readMemory(address, length, callback, errorCallback)` - Read memory operation
3. `writeMemory(address, dataArray, callback, errorCallback)` - Write memory operation (handles both PUT and POST)
4. `getConfigCategories(callback, errorCallback)` - Get list of all config categories
5. `getConfigCategory(category, callback, errorCallback)` - Get all items in a category
6. `getConfigItem(category, item, callback, errorCallback)` - Get specific config item
7. `setConfigItem(category, item, value, callback, errorCallback)` - Set config item value
8. `mountDisk(drive, path, callback, errorCallback)` - Mount disk image to drive
9. `unmountDisk(drive, callback, errorCallback)` - Unmount disk from drive
10. `getDriveStatus(drive, callback, errorCallback)` - Get current drive status
11. `enableStream(streamName, ip, callback, errorCallback)` - Enable a data stream
12. `disableStream(streamName, callback, errorCallback)` - Disable a data stream
13. `getStreamStatus(callback, errorCallback)` - Get status of all streams

### Design Principles

- **Simple functions** - No modules, namespaces, or classes
- **Consistent signatures** - All API methods follow the pattern: `function(params..., callback, errorCallback)`
- **Centralized error handling** - All errors go through `parseApiError()`
- **Password retrieval** - Each method reads password from `$('#apiPassword').val()`
- **Spinner integration** - Methods should call `showSpinner()` from ui-components.js
- **Error display** - Methods should call `showError()` from ui-components.js on errors

---

## ui-components.js

### Purpose

Provides reusable UI utility functions for common operations. These functions manipulate existing HTML elements and provide formatting/validation helpers.

### Scope

- Spinner control
- Error/success message display
- Address formatting and validation
- Keyboard handling
- Form validation
- Any other UI utilities needed by multiple tools

### Functions

#### Core Functions

1. `showSpinner(show)` - Show/hide the global spinner
2. `showError(message)` - Display error in the global error box
3. `hideError()` - Hide the global error box
4. `showSuccess(containerId, message)` - Display success message with checkmark
5. `showErrorStatus(containerId, message)` - Display error message with cross
6. `formatAddress(addressStr)` - Format and validate hex address (returns null if invalid)
7. `isApiBusy()` - Check if an API call is currently in progress (returns boolean)

#### Keyboard Handling

1. `setupHexInput(inputId)` - Configure input to accept only hex characters
2. `handleEnterKey(inputId, callback)` - Execute callback when Enter is pressed

#### Data Formatting

1. `formatHexByte(value)` - Format byte as 2-digit hex (e.g., "0F")
2. `formatHexWord(value)` - Format word as 4-digit hex (e.g., "C000")
3. `formatByteArray(bytes)` - Format array of bytes as hex string

#### Form Validation

1. `validateRange(value, min, max)` - Validate numeric range
2. `validateHexString(str, length)` - Validate hex string of specific length

### Design Principles

- **Simple functions** - No modules, namespaces, or classes
- **DOM manipulation** - Functions work with existing HTML elements via jQuery
- **No HTML generation** - Functions manipulate elements, they don't create them
- **Validation helpers** - Return null or false for invalid input, not exceptions

### Code Reference

See `ui-components.js` in the `/flash/html/js/` directory for complete implementation examples.

---

## tab-lifecycle.js

### Purpose

Provides reusable tab management functionality for tools that implement a tabbed interface. Implements the patterns described in **Tab_Lifecycle_Pattern.md**.

### Scope

- Tab switching logic
- Viewer lifecycle management (initialize, activate, canDeactivate, deactivate, refresh)
- Current tab tracking
- Event handler setup

### Design Principles

- **Reusable across tools** - Different tools can use this library with minimal configuration
- **Viewer-agnostic** - Works with any viewer objects that implement the lifecycle interface
- **Simple integration** - Tools provide a viewer map and call setup functions

### Required Lifecycle Methods

Each viewer object must implement these five methods:

1. `initialize()` - One-time setup (event handlers, state initialization)
2. `activate()` - Prepare for display (refresh data, focus inputs)
3. `canDeactivate()` - Check if viewer can be left (returns boolean)
4. `deactivate()` - Clean up before hiding (stop timers, hide tooltips)
5. `refresh()` - Refresh viewer data when global Refresh button is clicked (or empty if not needed)

### Core Functions

The library should provide:

1. `setupTabs()` - Bind click handlers to tab buttons
2. `switchToTab(tabId)` - Switch to a specific tab (with canDeactivate check)
3. `getActiveViewer()` - Get the currently active viewer object
4. `getViewerByTab(tabId)` - Get viewer object for a specific tab

### Integration Pattern

Tools using this library should:

1. Define viewer objects with lifecycle methods
2. Create a `viewerMap` mapping tab IDs to viewer names
3. Call `setupTabs()` during initialization
4. Activate the first viewer
5. Set up the global Refresh button to call `refresh()` on active viewer
6. Set up `beforeunload` handler for unsaved changes protection

### Code Reference

See **Tab_Lifecycle_Pattern.md** for complete implementation examples and flow diagrams.

---

## Best Practices

### For api-client.js
- Always use the robust `parseApiError()` function
- Always check `errors` array in write success responses
- Always format addresses as 4-digit uppercase hex
- Always use relative URLs (no hostname)

### For ui-components.js
- Keep functions simple and focused
- Don't generate HTML, only manipulate existing elements
- Return null/false for validation failures
- Use jQuery for DOM manipulation

### For tab-lifecycle.js
- Respect the `canDeactivate()` return value
- Always call lifecycle methods in the correct order
- Don't skip lifecycle methods
- All viewers must implement all five lifecycle methods (use empty function if not needed)

---

## Summary

| Library | Purpose | Key Functions |
|---------|---------|---------------|
| **api-client.js** | REST API interface | Memory operations, error handling, config, drives, streams |
| **ui-components.js** | UI utilities | Spinner, errors, formatting, validation |
| **tab-lifecycle.js** | Tab management | Tab switching, lifecycle management |

All three libraries use simple function-based architecture for maximum clarity and ease of maintenance.
