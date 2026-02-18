# Shared JavaScript Libraries Specification

**Version:** 2.2
**Date:** February 18, 2026  
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
2. `validateMemoryAddress(address, pageSize)` - Validate and clamp address within memory boundaries (0x0000-0xFFFF)
3. `readMemory(address, length, callback, errorCallback)` - Read memory operation
4. `writeMemory(address, dataArray, callback, errorCallback)` - Write memory operation (handles both PUT and POST)
5. `getConfigCategories(callback, errorCallback)` - Get list of all config categories
6. `getConfigCategory(category, callback, errorCallback)` - Get all items in a category
7. `getConfigItem(category, item, callback, errorCallback)` - Get specific config item
8. `setConfigItem(category, item, value, callback, errorCallback)` - Set config item value
9. `mountDisk(drive, path, callback, errorCallback)` - Mount disk image to drive
10. `unmountDisk(drive, callback, errorCallback)` - Unmount disk from drive
11. `getDriveStatus(drive, callback, errorCallback)` - Get current drive status
12. `enableStream(streamName, ip, callback, errorCallback)` - Enable a data stream
13. `disableStream(streamName, callback, errorCallback)` - Disable a data stream
14. `getStreamStatus(callback, errorCallback)` - Get status of all streams
15. `isApiBusy()` - Check if an API call is currently in progress (returns boolean)
16. `setApiBusy(busy)` - Internal function to set the busy state

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

#### Keyboard Handling

1. `setupHexInput(inputId)` - Configure input to accept only hex characters
2. `handleEnterKey(inputId, callback)` - Execute callback when Enter is pressed

#### Input Handling

1. `handleInputChange(inputId, callback)` - Handle input/select/checkbox change with automatic blur, callback receives value
2. `handleButtonClick(buttonId, callback)` - Handle button click with automatic blur

#### Data Formatting

1. `formatHexByte(value)` - Format byte as 2-digit hex (e.g., "0F")
2. `formatHexWord(value)` - Format word as 4-digit hex (e.g., "C000")
3. `parseAddressInput(inputId, pageSize)` - Parse and validate address from input field, returns address or null
4. `formatByteArray(bytes)` - Format array of bytes as hex string

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
- Tab lifecycle management (initialize, activate, canDeactivate, deactivate, refresh)
- Current tab tracking
- Event handler setup

### Design Principles

- **Reusable across tools** - Different tools can use this library with minimal configuration
- **Tab-agnostic** - Works with any tab objects that implement the lifecycle interface
- **Simple integration** - Tools provide a tab map and call setup functions

### Required Lifecycle Methods

Each tab object must implement these five methods:

1. `initialize()` - One-time setup (state initialization)
2. `activate()` - Prepare for display (register keyboard handler, refresh data, focus inputs)
3. `canDeactivate()` - Check if tab can be left (returns boolean)
4. `deactivate()` - Clean up before hiding (stop timers, hide tooltips, clean handlers)
5. `refresh()` - Refresh tab data when global Refresh button is clicked (or empty if not needed)

#### Optional Lifecycle Method

6. `handleKeyDown(e)` - Handle keyboard events (return `true` if handled, `false` otherwise)

### Core Functions

The library provides:

1. `initializeTabs(tabMap, initialTab)` - Initialize the entire tab system (all tabs, click handlers, Refresh button, beforeunload, initial tab activation)
2. `switchToTab(tabId)` - Switch to a specific tab (with canDeactivate check)
3. `getActiveTab()` - Get the currently active tab object
4. `getTab(tabId)` - Get tab object for a specific tab

### Integration Pattern

Tools using this library should:

1. Define tab objects with lifecycle methods
2. Create a `tabMap` mapping tab IDs to tab object names
3. Call `initializeTabs(tabMap, initialTab)` - This handles everything including Refresh button and beforeunload

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
- All tabs must implement all five lifecycle methods (use empty function if not needed)

---

## Summary

| Library | Purpose | Key Functions |
|---------|---------|---------------|
| **api-client.js** | REST API interface | Memory operations, error handling, config, drives, streams |
| **ui-components.js** | UI utilities | Spinner, errors, formatting, validation |
| **tab-lifecycle.js** | Tab management | Tab switching, lifecycle management |

All three libraries use simple function-based architecture for maximum clarity and ease of maintenance.
