# Developer Guide for the C64U Web Control Panel

## Design philosophy

- HTML structure is written directly and visible in source files
- CSS classes provide consistent styling
- JavaScript handles behavior and data, NOT DOM generation

## How to add new tools

- Create a new HTML for the tool
- Reference the common files (js, css)
- Add the tool button to the main control page.
- Implement the functionality of the tool: either a single page for a simple tool, or a tabbed interface for multi-part tools.

## Common code patterns

- Use the shared JS libraries instead of calling REST API directly.
- Use the common CSS styles for the html input controls, so they share the same look & feel.
- Make JS methods shared when they're used for 2 or more tools.

## Tab lifecycle

This is used by complex, multi-part tools. It's documented in the file **Tab_Lifecycle_Pattern.md**.

## REST API Calls

Refer to the **C64U REST API Guide.md** document for full details and reference on using the REST API, error handling and authentication.

The memory operations are referenced in the **C64U Memory REST API Reference.md** document.

The full list of REST API calls and specific json results is documented in the **api_calls.md** document.

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
- tab-lifecycle.js for the tabbed interface.
- common.css file for the reusable css styles.

This tool will have:

- A tabbed interface for testing the tab lifecycle.
- Each tab will use reusable UI inputs and components.
- Each tab will test a category of the common api-client.js library by using its methods exclusively (no direct REST API calls).
