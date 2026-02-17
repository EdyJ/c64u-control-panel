# Tab Lifecycle Pattern

**Version:** 1.0  
**Date:** February 4, 2026  
**Purpose:** This document defines the Tab Lifecycle pattern used in the C64U Web Control Panel project for managing complex multi-tab interfaces with state management and unsaved changes protection.

---

## Overview

The Tab Lifecycle pattern provides a structured approach to managing tabbed interfaces where each tab represents an independent viewer with its own state, UI, and behavior. The pattern ensures clean transitions between tabs, prevents data loss, and maintains a consistent user experience.

The Tab Lifecycle pattern provides:

✅ **Clean separation** of concerns between viewers  
✅ **State management** with unsaved changes protection  
✅ **Predictable behavior** through standardized lifecycle methods  
✅ **User safety** with confirmation dialogs before data loss  
✅ **Easy debugging** with console logging  
✅ **Extensibility** for adding new viewers  

Use this pattern for any complex multi-tab interface in the C64U Control Panel project.

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

### Step 3: Initialize on Page Load

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
- Initialize internal state variables
- Set up any required data structures

**Best Practices:**
- Do NOT make API calls or load data here (use `activate()` instead)
- Keep initialization fast and synchronous

**Example:**
```javascript
initialize: function() {
    console.log('HexViewer: initialize()');
    this.currentAddress = 0x0400;
    this.bytesPerRow = 16;
}
```

---

### activate()

**Purpose:** Prepare the viewer for display when its tab becomes active.

**Responsibilities:**
- Bind event handlers (UI elements, shortcuts)
- Register with external services if needed
- Refresh data from API if needed
- Focus appropriate input fields
- Start timers or polling if required
- Update UI to reflect current state

**Best Practices:**
- Use arrow functions for event handlers to preserve `this` context
- Call `refresh()` if the viewer displays dynamic data
- Set focus to the primary input field for better UX
- Check if data needs updating before making API calls

**Example:**
```javascript
activate: function() {
    console.log('HexViewer: activate()');
    $('#hex-address-input').on('change', () => this.loadAddress());
    $('#hex-refresh-btn').click(() => this.refresh());
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
- Unbind event handlers (UI elements, shortcuts)
- Unregister with external services if needed
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
    $('#hex-address-input').off('change');
    $('#hex-refresh-btn').off('click');

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

The `canDeactivate()` method is called automatically before switching tabs.

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

Refer to **STYLE_GUIDE.md** for the HTML templates (tab bar, tab content containers) and the CSS classes (`.tab-bar`, `.tab-button`, `.tab-content`) used by the tabbed interface.

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

### 3. State Reset

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
