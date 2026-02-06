# Developer Guide for the C64U Web Control Panel

## Design philosophy

Refer to the **STYLE_GUIDE.md** document for the design philosophy and all UI/UX standards for this project.

## File structure

All files are deployed to the C64U device's web server root directory at `/flash/html/`:

```
/flash/html/
├── index.html              # Landing page with links to all tools
├── common.css              # Shared styles and CSS variables
├── memory_tool.html        # Memory browser and editor tool
├── api_debug.html          # API testing and debugging tool
├── drives_tool.html        # Drive management tool
├── streams_tool.html       # Data streams control tool
├── config_tool.html        # Configuration viewer and editor
├── disk_flip.html          # Disk flip utility
├── (other tool files)
└── js/
    ├── api-client.js       # API wrapper functions (memory, config, drives, etc.)
    ├── ui-components.js    # UI utility functions (spinner, errors, formatting)
    └── tab-lifecycle.js    # Tab management and lifecycle implementation
```

**Key Points:**
- HTML and CSS files are in the root folder
- JavaScript libraries are in the `/js/` subdirectory
- This allows simple URLs like `http://device-ip/memory_tool.html`
- All tools link back to the root folder (`/`) via the header back link

## How to add new tools

- Create a new HTML for the tool
- Reference the common files (js, css)
- Add the tool button to the main control page.
- Implement the functionality of the tool: either a single page for a simple tool, or a tabbed interface for multi-part tools.

## Common code patterns

- Use the shared JS libraries instead of calling REST API directly.
- Use the common CSS styles for the html input controls, so they share the same look & feel.
- Make new JS methods shared when they're required for 2 or more tools.

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

A dedicated tool, "api_debug.html" will be used to test the shared libraries:

- api-client.js for common API patterns.
- ui-components.js for the reusable UI elements.
- common.css file for the reusable css styles.

This tool will have:

- A tabbed interface for testing the tab lifecycle.
- Each tab will use reusable UI inputs and components.
- Each tab will test a category of the common api-client.js library by using its methods exclusively (no direct REST API calls).

Refer to the **Shared_Libraries_Roadmap.md** document for the complete development workflow, testing strategy, and expansion guidelines for the shared libraries.
