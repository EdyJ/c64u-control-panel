# Page Load Verification Protocol

**Date:** 2026-02-09

## 1. Overview

This document outlines the protocol for verifying that a web page and all its critical JavaScript resources have loaded completely and correctly. This system is designed to counteract intermittent file truncation issues encountered with the C64 Ultimate device's embedded web server, which can silently drop data packets when serving files, leading to incomplete resources and subsequent parsing errors.

Since syntax errors that occur during initial script parsing cannot be reliably caught by global error handlers (as they happen before the handlers are attached), this solution relies on a **post-load verification** mechanism. After the page's DOM is ready, the loader checks for the existence of key functions that are expected to be defined in the global scope. If any of these functions are missing, it indicates that a script (or the HTML file itself) was truncated, and the loader will trigger an automatic page reload.

## 2. Implementation Protocol

To ensure reliable page loading, the following script must be included in the `<head>` section of every HTML page, after all other `script` tags.

### 2.1. The Loader Script

This code is the standard implementation and should be copied verbatim into each page.

```html
<!-- SCRIPT LOADER SYSTEM - Checks function existence and reloads if incomplete -->
<script>
(function() {
    var reloadAttempt = parseInt(sessionStorage.getItem("scriptLoadAttempt") || "0");
    var MAX_RELOAD_ATTEMPTS = 8;

    console.log("=== Script Loader Starting ===");
    if (reloadAttempt > 0) {
        console.log("Reload attempt: " + reloadAttempt);
    }

    // --- Page-Specific Configuration ---
    // Define key functions that must exist after all scripts have loaded.
    // This is the ONLY section that needs to be customized per page.
    var requiredFunctions = [
        // Example: from api-client.js
        'readMemory',
        // Example: from ui-components.js
        'showSpinner',
        // Example: from the HTML file itself
        'initializeApp'
    ];
    // -------------------------------------

    function checkScriptsLoaded() {
        var missing = [];
        requiredFunctions.forEach(function(funcName) {
            if (typeof window[funcName] !== "function") {
                missing.push(funcName);
            }
        });
        return missing;
    }

    function handleError(missing) {
        console.error("Missing functions:", missing);
        if (reloadAttempt < MAX_RELOAD_ATTEMPTS) {
            reloadAttempt++;
            sessionStorage.setItem("scriptLoadAttempt", reloadAttempt.toString());
            console.log("Reloading page (attempt " + reloadAttempt + ")...");
            showMessage("⚠ Device load failed. Reloading...", "#ffc107");
            setTimeout(function() {
                location.reload(true);
            }, 1000);
        } else {
            console.error("Max reload attempts reached");
            sessionStorage.removeItem("scriptLoadAttempt"); // Reset for manual reload
            showMessage("❌ Failed to fetch the page from the device. Please reload.", "#e74c3c");
        }
    }

    function showMessage(text, color) {
        var span = document.createElement("span");
        span.id = "loadStatus";
        span.textContent = text;
        span.style.cssText = "color: " + color + "; font-weight: bold; font-size: 14px; margin-right: 25px;";
        var headerActions = document.querySelector(".header-actions");
        if (headerActions) {
            headerActions.insertBefore(span, headerActions.firstChild);
        }
    }

    // Wait for DOM ready, then check scripts
    $(document).ready(function() {
        console.log("DOM ready, checking if scripts loaded...");
        setTimeout(function() {
            var missing = checkScriptsLoaded();
            if (missing.length > 0) {
                console.error("✗ Scripts incomplete, missing functions:", missing);
                handleError(missing);
            } else {
                console.log("✓ All scripts loaded successfully");
                sessionStorage.removeItem("scriptLoadAttempt");
                if (reloadAttempt > 0) {
                    console.log("Success after " + reloadAttempt + " reload(s)");
                }
                window.initializeApp();
            }
        }, 200);
    });
})();
</script>
```

### 2.2. Maintenance and Configuration

The core principle of this solution is the `requiredFunctions` array. This is the **only part of the script that must be maintained** on a per-page basis.

**Protocol for `requiredFunctions`:**

1.  **One Function Per File:** For each external JavaScript file (e.g., `api-client.js`, `ui-components.js`), select **one key function** that is defined in the global scope and add its name as a string to the array. This is sufficient to verify that the file was not truncated before this function was defined.

2.  **Include `initializeApp`:** Always include `'initializeApp'` in the list. This function is typically defined at the end of the HTML `<body>` and serves as a sentinel to verify that the HTML document itself has loaded completely.

3.  **Update as Needed:** If you add a new `.js` file to a page, add a corresponding function name to the array. If you remove a `.js` file, remove its function name. If you refactor code and a key function's name changes, update it in the array.

## 3. Rationale and Considerations

-   **Simplicity:** This approach avoids complex error event handling and race conditions. It is a simple, deterministic check that runs after the page has had a chance to load.
-   **Effectiveness:** It reliably detects incomplete files, whether the truncation causes a syntax error or simply results in missing code.
-   **User Experience:** The system attempts to recover automatically up to 8 times. It provides minimal, non-intrusive feedback during recovery and only presents a clear error message if automatic recovery fails, guiding the user to a manual reload.
-   **Manual Maintenance:** The primary trade-off is the need to manually maintain the `requiredFunctions` list. While not fully automatic, this is a small and manageable task that ensures robustness.
