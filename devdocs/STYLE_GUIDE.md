# Style Guide for the C64U Web Control Panel

**Version:** 2.0
**Date:** February 6, 2026
**Purpose:** This document defines the comprehensive UI/UX standards for the Commodore 64 Web-based Control Panel project. It is the single, authoritative source for all design and development, merging previous specification documents.

---

## Design Philosophy

The project follows these principles:

### ✅ Simple and Straightforward
- Use **HTML sections** for visual components
- Apply **CSS classes** for consistent styling
- **Avoid creating HTML components programmatically** via JavaScript
- Keep markup declarative and readable

### ✅ CSS-Driven Consistency
- Define reusable CSS classes in `common.css`
- Components share look through CSS, not through JavaScript generation
- Developers write HTML directly, apply classes for styling

### ✅ Minimal JavaScript
- JavaScript handles behavior and data, not DOM generation
- Use jQuery for event binding and data manipulation
- Keep HTML structure visible in source files

---

## UI Component Specification

### Component Philosophy

**NOT THIS (programmatic generation):**
```javascript
function createPasswordInput(containerId) {
    const html = '<input type="password" id="password" ...>';
    $(containerId).html(html);
}
```

**BUT THIS (CSS classes + HTML templates):**
```html
<!-- HTML: Developer writes this directly -->
<div class="auth-box">
    <form autocomplete="on">
        <input type="text" name="username" value="ultimate-api"
               autocomplete="username" style="display: none;">
        <input type="password" id="apiPassword" name="password"
               placeholder="API Password" autocomplete="current-password"
               class="auth-password-input">
    </form>
</div>
```

```css
/* CSS: Defines consistent styling */
.auth-box {
    background: var(--card-bg);
    padding: 5px 10px;
    border-radius: 4px;
    border: 1px solid var(--border);
}
.auth-password-input {
    width: 120px;
    border: none;
    background: transparent;
    padding: 0;
}
```

---

## `common.css` Specification

### Purpose
Provide reusable CSS classes that developers apply to their HTML elements for consistent styling.

### Structure

#### 1. CSS Variables (Design Tokens)
```css
:root {
    /* Colors */
    --primary: #3498db;
    --success: #2ecc71;
    --danger: #e74c3c;
    --warning: #ff9800;
    --bg: #1a1c1e;
    --card-bg: #25282c;
    --text: #e0e0e0;
    --text-dim: #a0a0a0;
    --border: #3a3f44;
    --input-bg: #2d3136;

    /* Spacing */
    --spacing-xs: 5px;
    --spacing-sm: 10px;
    --spacing-md: 20px;
    --spacing-lg: 30px;

    /* Border Radius */
    --radius-sm: 4px;
    --radius-md: 8px;

    /* Transitions */
    --transition: all 0.2s ease;
}
```

#### 2. Base Styles
```css
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: var(--bg);
    margin: 0;
    padding: var(--spacing-md);
    color: var(--text);
}

.container {
    max-width: 1000px; /* Can be 800px for simpler pages */
    margin: 0 auto;
}
```

#### 3. Header Components
```css
header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    border-bottom: 2px solid var(--primary);
    padding-bottom: var(--spacing-sm);
}

h1 {
    margin: 0;
    font-size: 24px;
    color: var(--primary);
}

.back-link {
    font-size: 12px;
    color: var(--text-dim);
    text-decoration: none;
    margin-top: var(--spacing-xs);
    display: inline-block;
}

.back-link:hover {
    color: var(--primary);
}

.header-actions {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
}
```

#### 4. Authentication Box
```css
.auth-box {
    background: var(--card-bg);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
}

.auth-password-input {
    width: 120px;
    border: none;
    background: transparent;
    padding: 0;
    color: var(--text);
    font-family: monospace;
}
```

#### 5. Loading Spinner
```css
.spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid var(--text-dim);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
```

#### 6. Error/Success Messages
```css
.error-box {
    display: none;
    background: var(--danger);
    color: white;
    padding: var(--spacing-sm);
    border-radius: var(--radius-sm);
    margin-bottom: 15px;
    font-weight: bold;
}

.success-message {
    color: var(--success);
}

.error-message {
    color: var(--danger);
}
```

#### 7. Tab Components
When the tool uses a tabbed interface, each tab should implement the following lifecycle methods in its corresponding JavaScript module: `initialize()`, `activate()`, `deactivate()`, and `canDeactivate()`.

```css
.tab-bar {
    display: flex;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-md);
    border-bottom: 2px solid var(--border);
}

.tab-button {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--input-bg);
    color: var(--text-dim);
    border: none;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    cursor: pointer;
    font-weight: bold;
    border: 1px solid var(--border);
    border-bottom: none;
    transition: var(--transition);
}

.tab-button:hover {
    background: var(--card-bg);
    color: var(--text);
}

.tab-button.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

.viewer-content {
    background: var(--card-bg);
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    padding: var(--spacing-md);
    min-height: 400px;
}
```

#### 8. Form Controls
```css
input[type="text"],
input[type="password"],
select {
    padding: 8px;
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text);
    font-family: monospace;
}

select {
    cursor: pointer;
}

input:focus,
select:focus {
    outline: none;
    border-color: var(--primary);
}

label {
    color: var(--text-dim);
    font-weight: bold;
}
```

#### 9. Buttons
```css
button {
    padding: 8px 16px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-weight: bold;
    transition: var(--transition);
}

button:hover {
    opacity: 0.8;
}

.btn-primary { background: var(--primary); }
.btn-success { background: var(--success); }
.btn-danger { background: var(--danger); }
.btn-warning { background: var(--warning); }
```

#### 10. Control Groups
```css
.control-group {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
    margin-bottom: 15px;
}

.control-group label {
    color: var(--text-dim);
    font-weight: bold;
}

.control-group input {
    width: 100px;
}
```

#### 11. Info/Status Boxes
```css
.info-box {
    background: rgba(255, 255, 255, 0.05);
    padding: var(--spacing-sm);
    border-radius: var(--radius-sm);
    margin-bottom: 15px;
    font-size: 12px;
    color: var(--text-dim);
}
```

#### 12. Memory/Code Display (for debug viewers)
```css
.memory-display {
    background: #121416;
    color: #7fdbff;
    padding: 15px;
    border-radius: var(--radius-sm);
    font-family: monospace;
    font-size: 13px;
    white-space: pre;
    overflow-x: auto;
    margin-top: 15px;
    border: 1px solid #333;
}

.code-display {
    background: var(--input-bg);
    color: var(--text);
    padding: 15px;
    border-radius: var(--radius-sm);
    font-family: monospace;
    font-size: 13px;
    white-space: pre;
    overflow-x: auto;
    border: 1px solid var(--border);
}
```

#### 13. Responsive Design
```css
@media (max-width: 768px) {
    body {
        padding: var(--spacing-sm);
    }

    header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-sm);
    }

    .header-actions {
        width: 100%;
        justify-content: space-between;
    }

    .tab-bar {
        flex-wrap: wrap;
    }

    .control-group {
        flex-wrap: wrap;
    }
}
```

---

## HTML Templates for Common Patterns

### Template 1: Standard Page Header
```html
<header>
    <div>
        <h1>Tool Name</h1>
        <a href="index.html" class="back-link">← Back to Control Panel</a>
    </div>
    <div class="header-actions">
        <span id="spinner" class="spinner" style="display:none;"></span>
        <button id="refreshBtn" class="btn-success">Refresh</button>
        <div class="auth-box">
            <form autocomplete="on">
                <input type="text" name="username" value="ultimate-api"
                       autocomplete="username" style="display: none;">
                <input type="password" id="apiPassword" name="password"
                       placeholder="API Password" autocomplete="current-password"
                       class="auth-password-input">
            </form>
        </div>
    </div>
</header>
```

### Template 2: Error Display
```html
<div id="errorBox" class="error-box"></div>
```

### Template 3: Tabbed Interface
```html
<div class="tab-bar">
    <button class="tab-button active" data-tab="tab1">Tab 1 Name</button>
    <button class="tab-button" data-tab="tab2">Tab 2 Name</button>
</div>

<div id="tab1-content" class="viewer-content">
    <!-- Tab 1 content -->
</div>

<div id="tab2-content" class="viewer-content" style="display:none;">
    <!-- Tab 2 content -->
</div>
```

### Template 4: Control Group (Horizontal Form)
```html
<div class="control-group">
    <label>Address:</label>
    <input type="text" id="address-input" value="0400" placeholder="0400">
    <label>Length:</label>
    <input type="text" id="length-input" value="256" placeholder="256">
    <button id="read-btn" class="btn-primary">Read</button>
</div>
```

### Template 5: Info Box
```html
<div class="info-box">
    <strong>Information Title</strong><br>
    Description text goes here. This box is used for help text or status information.
</div>
```

### Template 6: Status Display
```html
<div id="status-display" style="margin-top: 15px; color: var(--text-dim);"></div>
```

### Template 7: Memory/Code Display
```html
<div id="memory-output" class="memory-display" style="display:none;"></div>
```

---

## UX Patterns & Behaviors

### 1. Unsaved Changes Protection
Any page or tab that performs write operations must protect users from losing unsaved changes.

- **Tab Switching:** Implement the `canDeactivate()` protocol. If a tab has unsaved changes (`hasUnsavedChanges` is true), prompt the user for confirmation before switching away.
- **Page Navigation:** Use the `beforeunload` event listener to trigger a native browser confirmation dialog if the user attempts to close or navigate away from a page with unsaved data.

### 2. API Feedback
- **Loading:** The global spinner (`#spinner`) must be visible during all asynchronous API calls.
- **Success:** Briefly show a green checkmark (`✓`) or a success message near the action button.
- **Error:** Display critical errors in the global `#errorBox`. For validation or specific action failures, show an inline red cross (`✗`) with a descriptive message.

### 3. Address Formatting
- **Display:** Always format hexadecimal addresses with a `$` prefix for clarity (e.g., `$D020`).
- **Input:** Input fields should be flexible, accepting hex values with or without a prefix. The input must be validated and padded to a 4-digit, uppercase hex string before being sent to the API.

---

## Technical Standards

### 1. API Integration
- Refer to the **C64U REST API.md** document for the REST API usage guide and endpoint catalog.
- Refer to the **C64U Memory REST API Reference.md** document for memory read/write client-side implementation details.
- Refer to the **Tab_Lifecycle_Pattern.md** document for the implementation reference of tabbed tools.

### 2. Dependencies
- **jQuery:** Refer to the **DEVELOPMENT.md** document for specific version and CDN URL.
- **Fonts:** Use a standard system sans-serif font stack for the general UI and a monospace stack for data/code displays.

---

## JavaScript Helper Functions (`ui-components.js`)

These are utility functions for common operations, not HTML generators:

### Spinner Control
```javascript
function showSpinner(show) {
    if (show) {
        $('#spinner').show();
    } else {
        $('#spinner').hide();
    }
}
```

### Error Display
```javascript
function showError(message) {
    $('#errorBox').text(message).fadeIn();
}

function hideError() {
    $('#errorBox').fadeOut();
}
```

### Success/Error Status
```javascript
function showSuccess(containerId, message) {
    $(`#${containerId}`).html(`<span class="success-message">✓ ${message}</span>`);
}

function showErrorStatus(containerId, message) {
    $(`#${containerId}`).html(`<span class="error-message">✗ ${message}</span>`);
}
```

### Address Formatting
```javascript
function formatAddress(addressStr) {
    // Remove non-hex characters
    const cleaned = addressStr.replace(/[^0-9A-Fa-f]/g, '');
    // Parse and validate
    const address = parseInt(cleaned, 16);
    if (isNaN(address) || address < 0 || address > 0xFFFF) {
        return null;
    }
    // Return 4-digit hex string
    return address.toString(16).padStart(4, '0').toUpperCase();
}
```

---

## Standardization Requirements

### Password Input Consistency
**CRITICAL:** All pages must use the same password input structure for browser password manager compatibility:

```html
<div class="auth-box">
    <form autocomplete="on">
        <input type="text" name="username" value="ultimate-api"
               autocomplete="username" style="display: none;">
        <input type="password" id="apiPassword" name="password"
               placeholder="API Password" autocomplete="current-password"
               class="auth-password-input">
    </form>
</div>
```

**Key Points:**
- ID must be `apiPassword` (consistent across all pages)
- Name must be `password`
- Hidden username field with value `ultimate-api`
- Wrapped in `<form>` with `autocomplete="on"`

### Color Usage
Use CSS variables consistently:
- `var(--primary)` - Primary actions, highlights
- `var(--success)` - Success messages, confirmations
- `var(--danger)` - Errors, warnings, destructive actions
- `var(--warning)` - Warnings, cautions
- `var(--text)` - Primary text
- `var(--text-dim)` - Secondary text, labels

### Button Classes
- `.btn-primary` - Primary actions (default blue)
- `.btn-success` - Positive actions (green)
- `.btn-danger` - Destructive actions (red)
- `.btn-warning` - Warning actions (orange)

---

## Implementation Checklist

Use this checklist to ensure new tools and pages adhere to the standards.

- [ ] Uses CSS variables for all colors, spacing, and radii.
- [ ] Page content is wrapped in a `.container` with an appropriate max-width (800px or 1000px).
- [ ] Header includes the tool title, a back link to `index.html`, and the standard auth box.
- [ ] The password field uses the `apiPassword` ID and is structured correctly for password managers.
- [ ] The global spinner is shown during all API calls.
- [ ] Buttons use the correct classes (`.btn-primary`, `.btn-success`, `.btn-danger`, `.btn-warning`).
- [ ] Destructive actions (Writes) use `.btn-danger` and are protected by a confirmation prompt.
- [ ] `canDeactivate` protocol is implemented for tabs with write functionality.
- [ ] `beforeunload` handler is implemented for pages with write functionality.
- [ ] Hex addresses are correctly formatted and validated for API calls.

---

## Migration Strategy for Existing Tools

### Step 1: Add common.css
```html
<link rel="stylesheet" href="common.css">
```

### Step 2: Replace Inline Styles with Classes
**Before:**
```html
<div style="background: #25282c; padding: 20px; border-radius: 8px;">
```

**After:**
```html
<div class="viewer-content">
```

### Step 3: Standardize Password Input
Replace existing password inputs with the standard template.

### Step 4: Use CSS Variables
**Before:**
```css
.my-element {
    color: #e0e0e0;
    background: #25282c;
}
```

**After:**
```css
.my-element {
    color: var(--text);
    background: var(--card-bg);
}
```

---

## Summary

### What ui-components.js Should Be

**NOT:** A library of functions that generate HTML components programmatically

**BUT:** A library of utility functions that:
- Show/hide spinners
- Display error messages
- Format addresses
- Handle common operations
- Manipulate existing HTML elements

### What common.css Should Be

A comprehensive stylesheet with:
- CSS variables (design tokens)
- Reusable classes for all common UI patterns
- Consistent styling across all tools
- Mobile responsive design

### What Developers Do

1. Write HTML directly using standard templates
2. Apply CSS classes from common.css
3. Use utility functions from ui-components.js for behavior
4. Keep markup declarative and visible

### Benefits

✅ **Simple:** HTML structure is visible and understandable
✅ **Straightforward:** No complex component generation logic
✅ **Maintainable:** Easy to modify HTML directly
✅ **Consistent:** CSS classes ensure uniform appearance
✅ **Flexible:** Developers can customize while following patterns

---

## Conclusion

The proper design for UI components in this project is:

1. **common.css** - Comprehensive stylesheet with reusable classes
2. **HTML templates** - Standard patterns developers copy and customize
3. **ui-components.js** - Utility functions for common operations (not HTML generators)
