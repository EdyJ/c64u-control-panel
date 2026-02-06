# C64U Web Control Panel Style Guide

**Version:** 1.0

**Date:** February 4, 2026

**Purpose:** This document defines the UI/UX standards for the Commodore 64 Web-based Control Panel project. Use this as a reference when creating new tools or updating existing ones to ensure a consistent, professional, and functional experience.

---

## 🎨 Color Palette

The project uses a dark theme with high-contrast accents for clarity and a modern "terminal" feel.

| Variable | Value | Usage |
| --- | --- | --- |
| `--primary` | `#3498db` | Primary actions, active tabs, headings, focus borders |
| `--success` | `#2ecc71` | Success messages, refresh buttons, positive status |
| `--danger` | `#e74c3c` | Destructive actions (writes), error backgrounds |
| `--bg` | `#1a1c1e` | Main page background |
| `--card-bg` | `#25282c` | Component containers, viewer backgrounds |
| `--text` | `#e0e0e0` | Primary text color |
| `--text-dim` | `#a0a0a0` | Secondary text, labels, back links |
| `--border` | `#3a3f44` | Component borders, tab separators |
| `--input-bg` | `#2d3136` | Input fields, inactive tab buttons |

---

## 📐 Layout & Structure

### 1. Main Container

All pages should be wrapped in a `.container` class with a maximum width of `800px` or `1000px` and centered.

```css
.container { max-width: 1000px; margin: 0 auto; padding: 20px; }
```

### 2. Header

The header contains the title, a back link to the page's root `/`, and global actions (Refresh, Spinner, Auth).

- **Title:** `h1` with `--primary` color.

- **Back Link:** Small text with arrow (`← Back to Control Panel`).

- **Actions:** Flexbox container for the spinner, refresh button (optional), and password box.

### 3. Tabbed Interface in complex tools

For complex tools, use a tabbed architecture to isolate functionality of each tab.

- **Tab Bar:** Flex container with a bottom border.

- **Tab Buttons:** Rounded top corners, transition on hover, `--primary` background when active.

- **Lifecycle:** Each tab should implement `initialize()`, `activate()`, `deactivate()`, and `canDeactivate()`.

---

## 🧩 Components

### 1. Buttons

Standard buttons have `8px 16px` padding and `4px` border radius.

- **Primary:** `--primary` background.

- **Success:** `--success` background (use for Refresh/Safe actions).

- **Danger:** `--danger` background (use for Cancel/Destructive actions).

### 2. Input Fields

- **Style:** Monospace font, `--input-bg` background, `1px` border.

- **Focus:** `--primary` border color, no outline.

- **Password:** Must be inside a `<form>` with `autocomplete="on"` for password manager compatibility.

### 3. Dropdown Menus (Select)

- **Style:** Should match Input Fields for visual coherence.

- **CSS:**
  ```css
  select {
      padding: 8px;
      background: var(--input-bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--text);
      font-family: monospace;
      cursor: pointer;
  }
  select:focus {
      outline: none;
      border-color: var(--primary);
  }
  ```

### 4. Spinner

A 12px rotating circle used to indicate API activity.

```css
.spinner {
    display: inline-block;
    width: 12px; height: 12px;
    border: 2px solid var(--text-dim);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}
```

### 5. Memory/Data Display (debug viewers only)

For hex dumps or code in debug viewers, use a dedicated dark monospace container.

- **Background:** `#121416`

- **Text Color:** `#7fdbff` (Light Blue)

- **Font:** Monospace, `13px`

---

## ⌨️ UX Patterns

### 1. Unsaved Changes Protection

Always implement the `canDeactivate` protocol for any tab or page that performs write operations.

- **Tab Switch:** Prompt user if `hasUnsavedChanges` is true.

- **Page Leave:** Use the `beforeunload` event listener to trigger a browser confirmation dialog.

### 2. API Feedback

- **Loading:** Show the spinner during all async operations.

- **Success:** Show a green checkmark (`✓`) near the action button.

- **Error:** Use a global `#errorBox` at the top of the page for critical errors, and inline red text (`✗`) for specific action failures.

### 3. Address Formatting

- **Display:** Always show hex addresses with a `$` prefix (e.g., `$D020`).

- **Input:** Accept hex with our without prefix, but validate and pad to 4 digits for API calls.

---

## 🛠 Technical Standards

### 1. API Integration

- Use the **C64U Memory REST API Reference** for all memory operations.

- Use the **api_calls.rst** reference for all API operations.

- Always use relative URLs (e.g., `/v1/machine:readmem`).

- Handle `ArrayBuffer` responses and decode error messages properly.

### 2. Dependencies

- **jQuery:** Use for DOM manipulation and AJAX (CDN: `https://cdn.jsdelivr.net/npm/jquery` ).

- **Fonts:** Standard system sans-serif stack for UI, Monospace for data.

---

## 📝 Implementation Checklist

- [ ] Uses CSS variables for colors.

- [ ] Header includes back link to `index.html`.

- [ ] Password field is in a form with proper autocomplete.

- [ ] Spinner is visible during API calls.

- [ ] Destructive actions (Writes) use `.btn-danger`.

- [ ] `canDeactivate` protocol implemented for writes.

- [ ] `beforeunload` handler implemented.

- [ ] Addresses are padded to 4-digit hex for API calls.

- [ ] Error handling decodes `ArrayBuffer` responses.

