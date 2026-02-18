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
- **Do not create HTML components programmatically** via JavaScript
- Keep markup declarative and readable

### ✅ CSS-Driven Consistency
- Components share look through CSS, not through JavaScript generation
- Developers write HTML directly, apply classes for styling

### ✅ Minimal JavaScript
- JavaScript handles behavior and data, not DOM generation
- Use jQuery for event binding and data manipulation
- Keep HTML structure visible in source files

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

<div id="tab1-content" class="tab-content">
    <!-- Tab 1 content -->
</div>

<div id="tab2-content" class="tab-content" style="display:none;">
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
- Refer to the **Tab_Lifecycle_Pattern.md** document for the implementation reference of tabbed tools.
- Refer to the **SHARED_LIBRARIES.md** document for the specification of the shared JavaScript libraries.

### 2. Dependencies
- **jQuery:** Refer to the **DEVELOPMENT.md** document for specific version and CDN URL.
- **Fonts:** Use a standard system sans-serif font stack for the general UI and a monospace stack for data/code displays.

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

