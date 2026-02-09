# Developer Guide for the C64U Web Control Panel

## Design philosophy

Refer to the **STYLE_GUIDE.md** document for the design philosophy and all UI/UX standards for this project.

## File structure

All files are deployed to the C64U device's web server root directory at `/flash/html/`:

```
/flash/html/
├── index.html              # Landing page with links to all tools
├── memory_tool.html        # Memory browser and editor tool
├── api_debug.html          # API testing and debugging tool
├── drives_tool.html        # Drive management tool
├── streams_tool.html       # Data streams control tool
├── config_tool.html        # Configuration viewer and editor
├── disk_flip.html          # Disk flip utility
├── (other tool files)
├── css/
│   ├── common.css          # Shared styles and CSS variables
│   ├── hex-display.css     # Hex editor display and editing styles
│   └── (other CSS files)
└── js/
    ├── api-client.js       # API wrapper functions (memory, config, drives, etc.)
    ├── ui-components.js    # UI utility functions (spinner, errors, formatting)
    ├── tab-lifecycle.js    # Tab management and lifecycle implementation
    ├── hex-editor.js       # Hex editor/viewer library
    └── (other JS libraries)
```

**Key Points:**
- HTML files are in the root folder
- CSS files are in the `/css/` subdirectory
- JavaScript libraries are in the `/js/` subdirectory
- This allows simple URLs like `http://device-ip/memory_tool.html`
- All tools link back to the root folder (`/`) via the header back link

## How to add new tools

- Create a new HTML for the tool
- Reference the common files (js, css)
- Add the tool button to the main control page.
- Implement the functionality of the tool: either a single page for a simple tool, or a tabbed interface for multi-part tools.

## JavaScript coding pattern

All JavaScript code in this project follows a **simple function-based pattern** for consistency, reliability, and maintainability.

### Core Principles

1. **No classes or constructors** - Use simple functions and object literals
2. **No `this` keyword** - Avoid instance-based patterns
3. **Global state when needed** - Use module-level variables for shared state
4. **Pure functions** - Functions operate on parameters and global state
5. **Viewer objects** - Use object literals with lifecycle methods for tab integration

### Pattern Examples

**Simple utility functions:**
```javascript
function showSpinner(show) {
    if (show) {
        $('#spinner').show();
    } else {
        $('#spinner').hide();
    }
}
```

**Functions with global state:**
```javascript
let currentActiveTab = null;
let _tabViewerMap = {};

function setupTabs(tabToViewerMap, initialTab) {
    _tabViewerMap = tabToViewerMap;
    currentActiveTab = initialTab;
    // ...
}
```

**Viewer objects for tab integration:**
```javascript
const MyViewer = {
    initialize: function() {
        // Called once on page load
    },
    activate: function() {
        // Called when tab is shown
    },
    deactivate: function() {
        // Called when leaving tab
    },
    canDeactivate: function() {
        // Return false to prevent tab switch
        return true;
    },
    refresh: function() {
        // Called when refresh button is clicked (optional functionality)
    }
};
```

### Why This Pattern?

✅ **No race conditions** - Simple objects load instantly  
✅ **Fast parsing** - No complex constructor functions  
✅ **Maintainable** - Functions can be defined in any order  
✅ **Testable** - Pure functions are easy to test  
✅ **Consistent** - All libraries use the same pattern  

### Anti-Patterns to Avoid

❌ **Constructor functions** - `function MyClass() { this.method = function() {} }`  
❌ **ES6 classes** - `class MyClass { constructor() {} }`  
❌ **Prototype chains** - `MyClass.prototype.method = function() {}`  
❌ **Complex closures** - Nested functions with captured state  

## Common code patterns

- Use the shared JS libraries instead of calling REST API directly.
- Use the common CSS styles for the html input controls, so they share the same look & feel.
- Make new JS methods shared when they're required for 2 or more tools.
- Follow the **JavaScript coding pattern** documented above for all new code.

Refer to the **SHARED_LIBRARIES.md** document for the complete specification of the three shared JavaScript libraries (api-client.js, ui-components.js, tab-lifecycle.js).

## Tab lifecycle

This is used by complex, multi-part tools. It's documented in the file **Tab_Lifecycle_Pattern.md**.

## REST API Calls

Refer to the **C64U REST API.md** document for full details and reference on using the REST API, error handling, authentication, and the endpoint catalog.

The memory operations have additional client-side implementation details in the **C64U Memory REST API Reference.md** document.

## Security

The control panel is intended to be used within the local network. As such, all connections are HTTP, including sending the password via custom header. There's no session management.

The password input field should be adequately configured to have the same identification across pages so it can be recognized and auto-filled by the browser's password manager.

## Browser Compatibility

It must run on both desktop and mobile browsers. Use jQuery 3.7.1 without plugins, which is a good combination of stability and compatibility.

CDN URL: https://code.jquery.com/jquery-3.7.1.min.js

## Testing procedure

Testing should be performed on the actual C64 Ultimate device to ensure proper integration with the REST API and verify behavior in the target environment. Upload the modified or new files to the device via FTP, maintaining the proper file structure with HTML files in the root directory, CSS files in the `/css/` subdirectory, and JavaScript libraries in the `/js/` subdirectory. Access the tools through the device's web interface and verify that all functionality works as expected, including shared library integration, API operations, UI responsiveness, and error handling.

Refer to the **Shared_Libraries_Roadmap.md** document for the complete development workflow, testing strategy, and expansion guidelines for the shared libraries.
