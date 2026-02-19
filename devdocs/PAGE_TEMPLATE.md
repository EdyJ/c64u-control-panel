# No Concurrent File Load Protocol

Protocol and template files to create simple web pages that don't cause concurrent file request to the host.

## Rules

- Local font, css and js files can only be loaded sequentially via the inline loader code. No `<link>` / `<script src>` declarations in the head section of the html page.
- No `@font-face`, `@import`, or `url('...')` elements in css files.

- common-inline.css and common-inline.js are actually inlined into each HTML file, so each one has its own copy of the file embedded in <STYLE> and <SCRIPT> tags, respectively. Any changes in these files or in the embedded copies must be manually synced the original and all copies.

    - When creating a new html file or updating an existing one, the content of these files are copied to the html file as inline styles / functions in the corresponding blocks.

    - When the inline css or js code changes in any html file, it must also be changed in the corresponding inline file and all other html files using this protocol.

- Loaded fonts may be referenced with the `font-family` only, example:

    ```css
    font-family: 'C64ProMono', monospace;
    ```

---

## How to Create a New Page

1. **Duplicate the template file:**
   - Copy `template.html` from the `/flash/html/` directory
   - Rename it to your tool's name (e.g., `mytool.html`)

2. **Update the page metadata:**
   - Change the `<title>` element (line 6)
   - Update the `<h1>` in the header (line 232)
   - Modify the back link `href` if needed (line 238)

3. **Configure page-specific resources:**
   - Edit `requiredFonts`, `requiredCSS`, `requiredJS` arrays (lines 14-42) to include only the files your tool needs
   - Update `contentItems` array (lines 44-47) to specify which elements should be disabled during load

4. **Add your tool content:**
   - Replace the placeholder content in the `<body>` with your tool's HTML
   - Add your tool's JavaScript code in the final `<script>` block (lines 280-295)
   - Define `window.initializeApp = function() { ... }` to run initialization code after all resources load

5. **Test the page:**
   - Open the HTML file in a browser to verify layout and functionality
   - Note: REST API calls will fail without a C64U device

---

## Template File Reference

The template file (`/flash/html/template.html`) contains:

| Section | Description |
|---------|-------------|
| **HEAD** | Meta tags, title, favicon, resource declarations |
| **Local Requests** | JavaScript variables defining required fonts, CSS, JS files |
| **External Requests** | jQuery and other CDN scripts |
| **Inline CSS** | All styles copied from `common-inline.css` |
| **Inline JS** | Page loader copied from `common-inline.js` |
| **BODY** | Header, error box, tab bar, content area |
| **Tool Script** | Placeholder for tool-specific JavaScript |

For detailed HTML templates for common patterns (headers, tabs, forms, etc.), see **STYLE_GUIDE.md**.

# Template

A file `template.html` containing the minimum elements to create a page. When creating a new page, this file may be duplicated and the content added.

## HEAD

`<meta>` elements

`<title>` element

`<link>` element to disable the automatic fetching of favicon.ico:

```html
<link id="app-favicon" rel="icon" href="data:,">
```

### Local Requests section

`<script>` block with local file requirements and page declarations as global top-level vars:

```html
<script>
// Fonts: objects (url + font metadata)
var requiredFonts = [
  {
    url: "fonts/C64ProMono.woff2",
    family: "C64ProMono",
    weight: "normal", // or "400"
    style: "normal",  // or "italic"
    display: "swap",  // optional; "swap" recommended
    format: "woff2"   // optional; helps debugging/clarity
  }
];

// CSS: objects with url
var requiredCSS = [
  { url: "css/base.css" },
  { url: "css/theme.css" }
];

// JS: objects with url
var requiredJS = [
  { url: "js/ui-components.js" },
  { url: "js/api-client.js" },
  { url: "js/tab-lifecycle.js" },
  { url: "js/hex-editor.js" }
];

// UI selectors to disable or hide during load
// Optional: also add content-disabled or content-hidden to these elements in the body
// so they start disabled.
var contentItems = [
  ".viewer-content",
  ".tab-bar"
];
</script>
```

### External Requests section

`<script src=’…’>` blocks referencing external JS files. At least jQuery is specified here.

Note: the 6502-reasm library uses a CommonJS shim loader to make it globally accessible. Include it in this section.

### Inline CSS Styles section

`<style>` block with a copy of `common-inline.css` inlined, so essential css styles are always available.

### Inline JS Scripts section

`<script>` block with a copy of `common-inline.js` inlined, an embedded page loader and helper functions.

## BODY

The initial state of the page may be prepared for the page load in the div styles. The content elements may use `content-disabled` or `content-hidden`. Both classes will be removed from the elements listed in `contentItems` when the page load is complete.

```
.container
    <header>
        Page header / title, back link
        .header-actions
          Spinner
          Refresh button
          auth-box
    .error-box
    .tab-bar (optional). Optionally with `content-disabled` css style.
    (page content). Optionally with `content-disabled` or `content-hidden` css style.
```
