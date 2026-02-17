# Developer Guide for the C64U Web Control Panel

## Design philosophy

Refer to the **STYLE_GUIDE.md** document for the design philosophy and all UI/UX standards for this project.

## File structure

All files are deployed to the C64U device's web server root directory at `/flash/html/`:

```
/flash/html/
├── index.html              # Landing page with links to all tools
├── template.html           # Template for creating new tools
├── memory_tool.html        # Memory browser and editor tool
├── api_debug.html          # API testing and debugging tool
├── drives_tool.html        # Drive management tool
├── streams_tool.html       # Data streams control tool
├── config_tool.html        # Configuration viewer and editor
├── disk_flip.html          # Disk flip utility
├── (other tool files)
├── css/
│   ├── common-inline.css   # Shared styles and CSS variables, copied to html files as inline css
│   ├── mem-tool.css        # Memory display and editing styles
│   └── (other CSS files)
└── js/
    ├── common-inline.js    # Page loader, copied to html files as inline script
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
- Font files are in the `/fonts/` subdirectory
- All tools link back to the root folder (`/`) via the header back link

## How to add new tools

1. **Use the template file (recommended):**
   - Copy `/flash/html/template.html` to your new tool's name (e.g., `mytool.html`)
   - See **PAGE_TEMPLATE.md** for detailed instructions on customizing the template

2. **Alternative: Duplicate an existing tool:**
   - Copy an existing HTML file and modify its content
   - This works well if your tool is similar to an existing one

## Common code patterns

- Use the shared JS libraries instead of calling REST API directly.
- Use the common CSS styles for the html input controls, so they share the same look & feel.

### The `initializeApp` Function

Every page may define a global `initializeApp` function. This function serves as the main entry point for the page's application logic.

```javascript
// In each HTML file (e.g., api_debug.html)

window.initializeApp = function() {
    // All page-specific initialization code goes here
    console.log("=== API Debug Tool Initializing ===");
    setupViewers();
    setupTabs(tabToViewerMap, initialTab);
};
```

**Key Requirements:**

1.  **Global Scope:** It must be attached to the `window` object to be globally accessible.
2.  **Entry Point:** It should contain all the code that was previously in the `$(document).ready()` block.
3.  **Called by Loader:** The page loader will automatically call this function after all external scripts have been successfully loaded.

Refer to the **SHARED_LIBRARIES.md** document for the complete specification of the three shared JavaScript libraries (api-client.js, ui-components.js, tab-lifecycle.js).

## Tab lifecycle

This is used by multi-tab tools. It's documented in the file **Tab_Lifecycle_Pattern.md**.

## REST API Calls

Refer to the **C64U REST API.md** document for full details and reference on using the REST API, error handling, authentication, and the endpoint catalog.

## Security

The control panel is intended to be used within the local network. As such, all connections are HTTP, including sending the password via custom header. There's no session management.

The password input field should be adequately configured to have the same identification across pages so it can be recognized and auto-filled by the browser's password manager.

## Browser Compatibility

It must run on both desktop and mobile browsers. Use jQuery 3.7.1 without plugins, which is a good combination of stability and compatibility.

CDN URL: https://code.jquery.com/jquery-3.7.1.min.js

## Testing procedure

The HTML, CSS, and JavaScript structure can be tested in a desktop browser by opening the HTML file directly. This allows verification of:
- Layout and styling
- JavaScript syntax and logic
- Tab switching behavior
- Form interactions and UI components

Note: REST API calls will fail in local testing (no C64U device available).

## Web Server Limitations

### No concurrent request

Handling concurrent requests produces intermittent file truncation and missing chunks. The page loader implemented in 'common-inline.js', which is copied as an inline script to html files, ensures that the local files used by the page (fonts, css, js, favicon) are loaded sequentially. Refer to **PAGE_TEMPLATE.md** for details.

### Query Strings Not Supported

The C64 Ultimate's embedded web server does **not** support query strings in URLs. Appending a `?` followed by any parameters to a file request (e.g., `http://device-ip/file.html?param=value`) will result in a **404 Not Found** error.

This is a critical limitation to be aware of when developing features. Do not use query strings for cache busting, passing parameters, or any other purpose. All state must be managed client-side or through the REST API.
