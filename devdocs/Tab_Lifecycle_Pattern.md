# Tab Lifecycle Pattern

**Version:** 1.0  
**Date:** February 4, 2026  
**Purpose:** This document defines the Tab Lifecycle pattern used in the C64U Web Control Panel project for managing complex multi-tab interfaces with state management and unsaved changes protection.

---

## Overview

The Tab Lifecycle pattern provides a structured approach to managing tabbed interfaces where each tab represents an independent viewer with its own state, UI, and behavior. The pattern ensures clean transitions between tabs, prevents data loss, and maintains a consistent user experience.

---

## Core Concepts

### 1. Viewer Object

Each tab is backed by a **Viewer Object** that implements the lifecycle interface. A viewer is responsible for:
- Managing its own UI elements
- Handling user interactions
- Maintaining internal state
- Controlling when it can be deactivated

### 2. Lifecycle Methods

Every viewer must implement five lifecycle methods:

| Method | Purpose | When Called | Return Value |
|--------|---------|-------------|--------------|
| `initialize()` | Set up event handlers and initial state | Once, during page load | None |
| `activate()` | Prepare viewer for display | When tab becomes active | None |
| `canDeactivate()` | Check if viewer can be left | Before switching away from tab | Boolean |
| `deactivate()` | Clean up before hiding | After user confirms leaving | None |
| `refresh()` | Reload viewer data (or empty if not needed) | When Refresh button is clicked | None |

### 3. State Isolation

Each viewer maintains its own state independently. State is not shared between viewers unless explicitly designed to do so.

---

## Lifecycle Flow

### Complete Lifecycle Diagram

```
Page Load
    ↓
[All Viewers: initialize()]
    ↓
[First Viewer: activate()]
    ↓
┌─────────────────────────────────┐
│   User Interacts with Tab       │
│   (Viewer is Active)             │
└─────────────────────────────────┘
    ↓
User Clicks Different Tab
    ↓
[Current Viewer: canDeactivate()]
    ↓
    ├─→ Returns false → Tab Switch Cancelled
    │                   (Stay on current tab)
    │
    └─→ Returns true
            ↓
        [Current Viewer: deactivate()]
            ↓
        Hide Current Tab Content
            ↓
        Update Tab Button Styling
            ↓
        Show New Tab Content
            ↓
        [New Viewer: activate()]
            ↓
        ┌─────────────────────────────────┐
        │   User Interacts with New Tab    │
        └─────────────────────────────────┘
```

---

## Implementation Guide

### Step 1: Define Viewer Objects

Each viewer is a JavaScript object with lifecycle methods:

```javascript
var MyViewer = {
    // Internal state
    hasUnsavedChanges: false,
    
    // Lifecycle method 1: Initialize
    initialize: function() {
        console.log('MyViewer: initialize()');
        // Set up event handlers
        $('#my-button').click(() => this.doSomething());
    },
    
    // Lifecycle method 2: Activate
    activate: function() {
        console.log('MyViewer: activate()');
        // Refresh data, focus inputs, etc.
        this.refresh();
    },
    
    // Lifecycle method 3: Can Deactivate
    canDeactivate: function() {
        console.log('MyViewer: canDeactivate()');
        if (this.hasUnsavedChanges) {
            const confirmed = confirm('You have unsaved changes. Leave anyway?');
            if (confirmed) {
                this.hasUnsavedChanges = false;
                return true;
            }
            return false;
        }
        return true;
    },
    
    // Lifecycle method 4: Deactivate
    deactivate: function() {
        console.log('MyViewer: deactivate()');
        // Clean up timers, hide tooltips, etc.
    },
    
    // Lifecycle method 5: Refresh
    refresh: function() {
        console.log('MyViewer: refresh()');
        // Load/refresh viewer data
    },
    
    // Custom methods
    doSomething: function() {
        // Handle user action
        this.hasUnsavedChanges = true;
    }
};
```

### Step 2: Create Viewer Map

Map tab IDs to viewer object names:

```javascript
const viewerMap = {
    'tab1': 'MyViewer',
    'tab2': 'AnotherViewer',
    'tab3': 'ThirdViewer'
};
```

### Step 3: Implement Tab Management

```javascript
let currentActiveTab = 'tab1';

function getActiveViewer() {
    const viewerName = viewerMap[currentActiveTab];
    return window[viewerName];
}

function getViewerByTab(tabId) {
    const viewerName = viewerMap[tabId];
    return window[viewerName];
}

function setupTabs() {
    $('.tab-button').click(function() {
        const targetTab = $(this).data('tab');
        switchToTab(targetTab);
    });
}

function switchToTab(tabId) {
    if (tabId === currentActiveTab) return; // Already on this tab
    
    const currentViewer = getActiveViewer();
    
    // Check if we can leave current tab
    if (currentViewer && !currentViewer.canDeactivate()) {
        console.log('Tab switch cancelled by viewer');
        return; // Cancel switch
    }
    
    // Deactivate current
    if (currentViewer) {
        currentViewer.deactivate();
    }
    
    // Hide all viewer contents
    $('.viewer-content').hide();
    
    // Update tab styling
    $('.tab-button').removeClass('active');
    $(`.tab-button[data-tab="${tabId}"]`).addClass('active');
    
    // Show new viewer content
    $(`#${tabId}-content`).show();
    
    // Activate new viewer
    const newViewer = getViewerByTab(tabId);
    newViewer.activate();
    
    // Update current tab tracking
    currentActiveTab = tabId;
}
```

### Step 4: Initialize on Page Load

```javascript
$(document).ready(function() {
    console.log('=== Initializing Tab System ===');
    
    // Initialize all viewers
    MyViewer.initialize();
    AnotherViewer.initialize();
    ThirdViewer.initialize();
    
    // Set up tab click handlers
    setupTabs();
    
    // Activate first tab
    MyViewer.activate();
    
    // Handle page unload
    window.addEventListener('beforeunload', function(e) {
        const activeViewer = getActiveViewer();
        if (activeViewer && activeViewer.canDeactivate && !activeViewer.canDeactivate()) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });
    
    console.log('=== Initialization Complete ===');
});
```

---

## Lifecycle Method Details

### initialize()

**Purpose:** One-time setup when the page loads.

**Responsibilities:**
- Bind event handlers to UI elements
- Initialize internal state variables
- Set up any required data structures
- Register with external services if needed

**Best Practices:**
- Use arrow functions for event handlers to preserve `this` context
- Do NOT make API calls or load data here (use `activate()` instead)
- Keep initialization fast and synchronous

**Example:**
```javascript
initialize: function() {
    console.log('HexViewer: initialize()');
    $('#hex-address-input').on('change', () => this.loadAddress());
    $('#hex-refresh-btn').click(() => this.refresh());
    this.currentAddress = 0x0400;
    this.bytesPerRow = 16;
}
```

---

### activate()

**Purpose:** Prepare the viewer for display when its tab becomes active.

**Responsibilities:**
- Refresh data from API if needed
- Focus appropriate input fields
- Start timers or polling if required
- Update UI to reflect current state

**Best Practices:**
- Call `refresh()` if the viewer displays dynamic data
- Set focus to the primary input field for better UX
- Check if data needs updating before making API calls

**Example:**
```javascript
activate: function() {
    console.log('HexViewer: activate()');
    $('#hex-address-input').focus();
    if (this.needsRefresh) {
        this.refresh();
        this.needsRefresh = false;
    }
}
```

---

### canDeactivate()

**Purpose:** Determine if the viewer can be left (tab switch or page unload).

**Responsibilities:**
- Check for unsaved changes
- Prompt user for confirmation if needed
- Return `true` to allow deactivation, `false` to prevent it

**Best Practices:**
- Always return a boolean
- Use `confirm()` for user prompts
- Reset unsaved changes flag if user confirms
- Log the decision for debugging

**Example:**
```javascript
canDeactivate: function() {
    console.log(`HexViewer: canDeactivate() -> hasUnsavedChanges=${this.hasUnsavedChanges}`);
    
    if (this.hasUnsavedChanges) {
        const confirmed = confirm('You have unsaved changes. Leave anyway?');
        if (confirmed) {
            this.hasUnsavedChanges = false;
            return true;
        }
        return false;
    }
    
    return true;
}
```

---

### deactivate()

**Purpose:** Clean up before the viewer is hidden.

**Responsibilities:**
- Stop timers or polling
- Hide tooltips or popovers
- Cancel pending API requests
- Save temporary state if needed

**Best Practices:**
- Keep this method fast and synchronous
- Do NOT prompt the user (use `canDeactivate()` for that)
- Clear any visual overlays or highlights

**Example:**
```javascript
deactivate: function() {
    console.log('HexViewer: deactivate()');
    
    // Stop auto-refresh timer if running
    if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
    }
    
    // Hide any tooltips
    $('.hex-tooltip').hide();
}
```

---

## Unsaved Changes Protection

### Tab Switch Protection

The `canDeactivate()` method is called automatically before switching tabs:

```javascript
function switchToTab(tabId) {
    const currentViewer = getActiveViewer();
    
    // Check if we can leave current tab
    if (currentViewer && !currentViewer.canDeactivate()) {
        console.log('Tab switch cancelled by viewer');
        return; // Cancel switch
    }
    
    // ... proceed with tab switch
}
```

### Page Unload Protection

The `beforeunload` event handler prevents accidental data loss:

```javascript
window.addEventListener('beforeunload', function(e) {
    const activeViewer = getActiveViewer();
    if (activeViewer && activeViewer.canDeactivate && !activeViewer.canDeactivate()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});
```

**Browser Behavior:**
- Modern browsers show a generic confirmation message
- The custom message cannot be customized for security reasons
- User can choose "Leave" or "Stay"

---

## State Management Patterns

### Pattern 1: Simple Boolean Flag

For basic unsaved changes tracking:

```javascript
var MyViewer = {
    hasUnsavedChanges: false,
    
    writeData: function() {
        // Perform write operation
        this.hasUnsavedChanges = true;
    },
    
    canDeactivate: function() {
        if (this.hasUnsavedChanges) {
            const confirmed = confirm('You have unsaved changes. Leave anyway?');
            if (confirmed) {
                this.hasUnsavedChanges = false;
                return true;
            }
            return false;
        }
        return true;
    }
};
```

### Pattern 2: Dirty Field Tracking

For tracking which specific fields have changed:

```javascript
var MyViewer = {
    dirtyFields: new Set(),
    
    markDirty: function(fieldName) {
        this.dirtyFields.add(fieldName);
    },
    
    canDeactivate: function() {
        if (this.dirtyFields.size > 0) {
            const fields = Array.from(this.dirtyFields).join(', ');
            const confirmed = confirm(`Modified fields: ${fields}\nLeave anyway?`);
            if (confirmed) {
                this.dirtyFields.clear();
                return true;
            }
            return false;
        }
        return true;
    }
};
```

### Pattern 3: Pending Operations

For tracking async operations:

```javascript
var MyViewer = {
    pendingOperations: 0,
    
    startOperation: function() {
        this.pendingOperations++;
    },
    
    endOperation: function() {
        this.pendingOperations--;
    },
    
    canDeactivate: function() {
        if (this.pendingOperations > 0) {
            const confirmed = confirm(`${this.pendingOperations} operations in progress. Leave anyway?`);
            return confirmed;
        }
        return true;
    }
};
```

---

## Refresh Integration

The Refresh button in the header triggers the active viewer's `refresh()` method:

```javascript
$('#refreshBtn').click(function() {
    const activeViewer = getActiveViewer();
    activeViewer.refresh();
});
```

Viewers that need refresh functionality should implement the `refresh()` method:

```javascript
refresh: function() {
    console.log('MyViewer: refresh()');
    // Reload data from API
    // Update UI
}
```

Viewers without meaningful refresh functionality should provide an empty implementation:

```javascript
refresh: function() {
    console.log('MyViewer: refresh() - not implemented');
    // No refresh needed for this viewer
}
```

---

## HTML Structure and CSS

Refer to **STYLE_GUIDE.md** for the HTML templates (tab bar, tab content containers) and the CSS classes (`.tab-bar`, `.tab-button`, `.viewer-content`) used by the tabbed interface.

---

## Best Practices

### 1. Console Logging

Always log lifecycle method calls for debugging:

```javascript
initialize: function() {
    console.log('MyViewer: initialize()');
    // ...
}
```

### 2. Arrow Functions for Event Handlers

Use arrow functions to preserve `this` context:

```javascript
initialize: function() {
    $('#my-button').click(() => this.doSomething()); // ✅ Correct
    // NOT: $('#my-button').click(this.doSomething); // ❌ Wrong
}
```

### 3. Defensive Programming

Check if methods exist before calling them:

```javascript
const viewer = getActiveViewer();
if (viewer && viewer.refresh) {
    viewer.refresh();
}
```

### 4. State Reset

Always reset state flags when user confirms leaving:

```javascript
canDeactivate: function() {
    if (this.hasUnsavedChanges) {
        const confirmed = confirm('Leave anyway?');
        if (confirmed) {
            this.hasUnsavedChanges = false; // ✅ Reset flag
            return true;
        }
        return false;
    }
    return true;
}
```

### 5. Fast Deactivation

Keep `deactivate()` fast and synchronous:

```javascript
deactivate: function() {
    // ✅ Good: Fast cleanup
    clearInterval(this.timer);
    $('.tooltip').hide();
    
    // ❌ Bad: Slow async operations
    // await this.saveToServer();
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting to Return Boolean

```javascript
// WRONG: No return value
canDeactivate: function() {
    if (this.hasUnsavedChanges) {
        confirm('Leave anyway?');
    }
}

// CORRECT: Always return boolean
canDeactivate: function() {
    if (this.hasUnsavedChanges) {
        return confirm('Leave anyway?');
    }
    return true;
}
```

### ❌ Pitfall 2: Prompting in deactivate()

```javascript
// WRONG: Prompting in deactivate()
deactivate: function() {
    if (this.hasUnsavedChanges) {
        confirm('Save changes?'); // Too late!
    }
}

// CORRECT: Prompt in canDeactivate()
canDeactivate: function() {
    if (this.hasUnsavedChanges) {
        return confirm('Save changes?');
    }
    return true;
}
```

### ❌ Pitfall 3: Async Operations in initialize()

```javascript
// WRONG: Async operations in initialize()
initialize: function() {
    this.loadData(); // Async API call
}

// CORRECT: Async operations in activate()
initialize: function() {
    // Just set up handlers
    $('#btn').click(() => this.loadData());
}

activate: function() {
    this.loadData(); // Now it's safe
}
```

---

## Testing Checklist

When implementing a new viewer, verify:

- [ ] `initialize()` is called once on page load
- [ ] `activate()` is called when tab becomes active
- [ ] `canDeactivate()` returns `true` when no unsaved changes
- [ ] `canDeactivate()` returns `false` when user cancels confirmation
- [ ] `canDeactivate()` returns `true` when user confirms leaving
- [ ] `deactivate()` is called after successful `canDeactivate()`
- [ ] Tab switch is cancelled when `canDeactivate()` returns `false`
- [ ] Page unload shows confirmation when unsaved changes exist
- [ ] Refresh button calls the viewer's `refresh()` method
- [ ] Console logs show lifecycle method calls

---

## Example: Complete Viewer Implementation

```javascript
var HexViewer = {
    // State
    currentAddress: 0x0400,
    bytesPerRow: 16,
    hasUnsavedChanges: false,
    refreshTimer: null,
    
    // Lifecycle: Initialize
    initialize: function() {
        console.log('HexViewer: initialize()');
        
        // Event handlers
        $('#hex-address').on('change', () => this.loadAddress());
        $('#hex-write-btn').click(() => this.writeBytes());
        $('#hex-auto-refresh').on('change', (e) => this.toggleAutoRefresh(e.target.checked));
    },
    
    // Lifecycle: Activate
    activate: function() {
        console.log('HexViewer: activate()');
        $('#hex-address').focus();
        this.refresh();
    },
    
    // Lifecycle: Can Deactivate
    canDeactivate: function() {
        console.log(`HexViewer: canDeactivate() -> hasUnsavedChanges=${this.hasUnsavedChanges}`);
        
        if (this.hasUnsavedChanges) {
            const confirmed = confirm('You have unsaved changes. Leave anyway?');
            if (confirmed) {
                this.hasUnsavedChanges = false;
                return true;
            }
            return false;
        }
        
        return true;
    },
    
    // Lifecycle: Deactivate
    deactivate: function() {
        console.log('HexViewer: deactivate()');
        
        // Stop auto-refresh
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    },
    
    // Custom: Refresh
    refresh: function() {
        console.log('HexViewer: refresh()');
        const length = this.bytesPerRow * 16; // 16 rows
        
        readMemory(this.currentAddress, length, (data) => {
            this.displayHexDump(data);
        }, (error) => {
            showError(`Read failed: ${error}`);
        });
    },
    
    // Custom: Display hex dump
    displayHexDump: function(data) {
        const bytes = new Uint8Array(data);
        let html = '<pre>';
        
        for (let i = 0; i < bytes.length; i += this.bytesPerRow) {
            const addr = (this.currentAddress + i).toString(16).padStart(4, '0').toUpperCase();
            html += `$${addr}: `;
            
            for (let j = 0; j < this.bytesPerRow && i + j < bytes.length; j++) {
                html += bytes[i + j].toString(16).padStart(2, '0').toUpperCase() + ' ';
            }
            
            html += '\n';
        }
        
        html += '</pre>';
        $('#hex-display').html(html);
    },
    
    // Custom: Load address
    loadAddress: function() {
        const addrStr = $('#hex-address').val().replace(/[^0-9A-Fa-f]/g, '');
        const addr = parseInt(addrStr, 16);
        
        if (!isNaN(addr) && addr >= 0 && addr <= 0xFFFF) {
            this.currentAddress = addr;
            this.refresh();
        }
    },
    
    // Custom: Write bytes
    writeBytes: function() {
        // ... write implementation
        this.hasUnsavedChanges = true;
    },
    
    // Custom: Toggle auto-refresh
    toggleAutoRefresh: function(enabled) {
        if (enabled) {
            this.refreshTimer = setInterval(() => this.refresh(), 1000);
        } else {
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
                this.refreshTimer = null;
            }
        }
    }
};
```

---

## Summary

The Tab Lifecycle pattern provides:

✅ **Clean separation** of concerns between viewers  
✅ **State management** with unsaved changes protection  
✅ **Predictable behavior** through standardized lifecycle methods  
✅ **User safety** with confirmation dialogs before data loss  
✅ **Easy debugging** with console logging  
✅ **Extensibility** for adding new viewers  

Use this pattern for any complex multi-tab interface in the C64U Control Panel project.
