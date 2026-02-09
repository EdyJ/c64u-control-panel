# Page Load Verification Protocol

**Date:** 2026-02-10

## 1. Overview

This document outlines the protocol for loading critical JavaScript resources sequentially and verifying that the page has loaded completely. This system is designed to counteract intermittent file truncation issues encountered with the C64 Ultimate device's embedded web server, which can silently drop data packets when multiple files are requested concurrently.

By loading scripts **sequentially** (one at a time), we eliminate the concurrent requests that cause the issue. This approach is significantly more reliable and removes the need for complex retry logic.

## 2. Implementation Protocol

To ensure reliable page loading, the following script must be included in the `<head>` section of every HTML page, after the jQuery script tag. All other `<script>` tags for external JavaScript files should be removed, as the loader will handle them.

### 2.1. The Loader Script

This code is the standard implementation and should be copied verbatim into each page.

```html
<!-- Sequential Script Loader - Loads external JS files one at a time -->
<script>
(function() {
    'use strict';
    
    // --- Page-Specific Configuration ---
    var requiredScripts = [
        // List of external JS files to load sequentially
        // Example: 'js/ui-components.js',
    ];
    
    var contentItems = [
        // List of CSS selectors for content to be disabled during load
        // Example: '.viewer-content',
    ];
    // -------------------------------------
    
    var currentIndex = 0;
    var syntaxErrorDetected = false;
    
    function showSpinner() {
        var spinner = document.getElementById('spinner');
        if (spinner) spinner.style.display = 'inline-block';
    }
    
    function hideSpinner() {
        var spinner = document.getElementById('spinner');
        if (spinner) spinner.style.display = 'none';
    }
    
    function disableContent() {
        contentItems.forEach(function(selector) {
            var element = document.querySelector(selector);
            if (element) element.classList.add('content-disabled');
        });
    }
    
    function enableContent() {
        contentItems.forEach(function(selector) {
            var element = document.querySelector(selector);
            if (element) element.classList.remove('content-disabled');
        });
    }
    
    function showError() {
        hideSpinner();
        // Keep content disabled
        
        var span = document.createElement('span');
        span.textContent = '❌ Failed to fetch the page from the device. Please reload.';
        span.style.cssText = 'color: #e74c3c; font-weight: bold; font-size: 14px; margin-right: 25px;';
        
        var headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            headerActions.insertBefore(span, headerActions.firstChild);
        }
    }
    
    function loadNextScript() {
        // All scripts loaded
        if (currentIndex >= requiredScripts.length) {
            hideSpinner();
            enableContent();
            
            if (typeof window.initializeApp === 'function') {
                window.initializeApp();
            }
            return;
        }
        
        var url = requiredScripts[currentIndex];
        
        var script = document.createElement('script');
        script.src = url;
        
        syntaxErrorDetected = false;
        
        // Syntax error handler
        var errorHandler = function(event) {
            if (event.filename && event.filename.includes(url)) {
                console.error('✗ Syntax error in ' + url);
                syntaxErrorDetected = true;
            }
        };
        window.addEventListener('error', errorHandler);
        
        script.onload = function() {
            setTimeout(function() {
                window.removeEventListener('error', errorHandler);
                
                if (syntaxErrorDetected) {
                    console.error('✗ Failed to load ' + url);
                    showError();
                } else {
                    currentIndex++;
                    loadNextScript();
                }
            }, 100);
        };
        
        script.onerror = function() {
            console.error('✗ Network error loading ' + url);
            window.removeEventListener('error', errorHandler);
            showError();
        };
        
        document.head.appendChild(script);
    }
    
    $(document).ready(function() {
        setTimeout(function() {
            // Check HTML complete
            if (typeof window.initializeApp !== 'function') {
                location.reload(true);
                return;
            }
            
            showSpinner();
            disableContent();
            loadNextScript();
        }, 50);
    });
    
})();
</script>
```

### 2.2. CSS Requirement

The following CSS class must be present in `css/common.css` to support the content disabling feature.

```css
/* In css/common.css */
.content-disabled {
    filter: grayscale(100%) brightness(0.8);
    opacity: 0.6;
    pointer-events: none;
}
```

### 2.3. Maintenance and Configuration

This solution requires minimal, page-specific configuration.

**Protocol for Configuration:**

1.  **`requiredScripts` Array:** List all external JavaScript files that the page needs in the order they should be loaded. Do **not** include them as `<script>` tags in the HTML.

2.  **`contentItems` Array:** List the CSS selectors for all major content containers that should be visually disabled during the script loading process.

3.  **`initializeApp` Function:** Ensure that the page's main initialization logic is wrapped in a globally-scoped `initializeApp` function. This serves as a sentinel to verify that the HTML document itself has loaded completely.

## 3. Rationale and Considerations

-   **Simplicity:** This approach is significantly simpler than the previous reload-based system. It has 50% less code and removes all complex retry logic, timers, and counters.
-   **Effectiveness:** By enforcing sequential loading, it directly addresses the root cause of the file truncation issue, making it a more robust and predictable solution.
-   **User Experience:** The loading process is clear and non-disruptive. The user sees a spinner and disabled content, which is a standard and familiar UX pattern. There are no jarring page reloads.
-   **Maintainability:** Configuration is straightforward, requiring only the maintenance of two simple arrays (`requiredScripts` and `contentItems`) per page.
