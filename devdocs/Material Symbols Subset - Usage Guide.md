# Material Symbols Subset - Usage Guide

## What's Included

This subset contains **27 icons** from Material Symbols Outlined:

- settings_backup_restore
- cycle
- restart_alt
- replay
- power_settings_new
- mode_off_on
- menu
- adjust
- settings
- close
- check
- cancel
- block
- sync
- autorenew
- check_small
- close_small
- error
- dangerous
- play_arrow
- play_circle
- play_pause
- pause
- pause_circle
- stop
- stop_circle
- not_started

**File Size**: 18KB (reduced from 3.7MB - **99.5% smaller!**)

---

## Important Note About Ligatures

The subset font file **does not include ligature tables** to keep the file size minimal (18KB). This means you **cannot** use text names like "settings" directly. Instead, use **unicode codepoints**.

---

## Installation

1. Copy `MaterialSymbols-subset.woff2` to your project's font directory
2. Copy `material-symbols.css` to your project's CSS directory
3. Update the font path in the CSS file if needed
4. Include material-symbols.css in your HTML

---

## Usage in HTML

Use **unicode HTML entities** to display icons:

```html
<!-- Settings icon -->
<span class="material-symbols-outlined">&#xe8b8;</span>

<!-- Play icon -->
<span class="material-symbols-outlined">&#xe037;</span>

<!-- Close icon -->
<span class="material-symbols-outlined">&#xe5cd;</span>

<!-- In buttons -->
<button>
  <span class="material-symbols-outlined">&#xe5ca;</span>
  Confirm
</button>
```

### ❌ This Will NOT Work

```html
<!-- Text names don't work without ligatures -->
<span class="material-symbols-outlined">settings</span>
```

---

## Icon Reference with Unicode Codepoints

| Icon Name | Unicode | HTML Entity | CSS Content |
|-----------|---------|-------------|-------------|
| adjust | e39e | `&#xe39e;` | `\e39e` |
| autorenew | e863 | `&#xe863;` | `\e863` |
| block | f08c | `&#xf08c;` | `\f08c` |
| cancel | e888 | `&#xe888;` | `\e888` |
| check | e5ca | `&#xe5ca;` | `\e5ca` |
| check_small | f88b | `&#xf88b;` | `\f88b` |
| close | e5cd | `&#xe5cd;` | `\e5cd` |
| close_small | f508 | `&#xf508;` | `\f508` |
| cycle | f854 | `&#xf854;` | `\f854` |
| dangerous | e99a | `&#xe99a;` | `\e99a` |
| error | f8b6 | `&#xf8b6;` | `\f8b6` |
| menu | e5d2 | `&#xe5d2;` | `\e5d2` |
| mode_off_on | f16f | `&#xf16f;` | `\f16f` |
| not_started | f0d1 | `&#xf0d1;` | `\f0d1` |
| pause | e034 | `&#xe034;` | `\e034` |
| pause_circle | e1a2 | `&#xe1a2;` | `\e1a2` |
| play_arrow | e037 | `&#xe037;` | `\e037` |
| play_circle | e1c4 | `&#xe1c4;` | `\e1c4` |
| play_pause | f137 | `&#xf137;` | `\f137` |
| power_settings_new | f8c7 | `&#xf8c7;` | `\f8c7` |
| replay | e042 | `&#xe042;` | `\e042` |
| restart_alt | f053 | `&#xf053;` | `\f053` |
| settings | e8b8 | `&#xe8b8;` | `\e8b8` |
| settings_backup_restore | e8ba | `&#xe8ba;` | `\e8ba` |
| stop | e047 | `&#xe047;` | `\e047` |
| stop_circle | ef71 | `&#xef71;` | `\ef71` |
| sync | e627 | `&#xe627;` | `\e627` |

---

## Using with CSS ::before / ::after

```css
.icon-settings::before {
  font-family: 'Material Symbols Outlined';
  content: '\e8b8';
  margin-right: 8px;
}

.icon-play::before {
  font-family: 'Material Symbols Outlined';
  content: '\e037';
}
```

```html
<button class="icon-settings">Settings</button>
<button class="icon-play">Play</button>
```

---

## Customization

### Size

Change icon size with CSS `font-size`:

```css
.material-symbols-outlined {
  font-size: 18px;  /* Small */
  font-size: 24px;  /* Default */
  font-size: 36px;  /* Large */
  font-size: 48px;  /* Extra large */
}
```

### Color

Icons inherit text color:

```css
.material-symbols-outlined.blue {
  color: #1976d2;  /* Blue */
}
```

### Variable Font Axes

Material Symbols supports variable font axes:

#### Fill (0 = outlined, 1 = filled)

```css
.material-symbols-outlined.fill {
  font-variation-settings: 'FILL' 1;
}
```

#### Weight (100-700)

```css
.material-symbols-outlined.wght-700 {
  font-variation-settings: 'wght' 700;  /* Bold */
}
```

#### Grade (-25 to 200)

```css
.material-symbols-outlined.grad-high {
  font-variation-settings: 'GRAD' 200;  /* High emphasis */
}
```

#### Optical Size (20-48)

```css
.material-symbols-outlined.opsz-48 {
  font-variation-settings: 'opsz' 48;
}
```

#### Combining Multiple Axes

```css
.material-symbols-outlined.custom-preset {
  font-variation-settings: 'FILL' 1, 'wght' 700, 'GRAD' 200, 'opsz' 48;
}
```

---

## Icon Reference

| Icon Name | Unicode | Preview |
|-----------|---------|---------|
| adjust | e39e | ⚙ |
| autorenew | e863 | ↻ |
| block | f08c | 🚫 |
| cancel | e888 | ✖ |
| check | e5ca | ✓ |
| check_small | f88b | ✓ |
| close | e5cd | ✕ |
| close_small | f508 | ✕ |
| cycle | f854 | ⟳ |
| dangerous | e99a | ⚠ |
| error | f8b6 | ⚠ |
| menu | e5d2 | ☰ |
| mode_off_on | f16f | ⏻ |
| not_started | f0d1 | ▷ |
| pause | e034 | ⏸ |
| pause_circle | e1a2 | ⏸ |
| play_arrow | e037 | ▶ |
| play_circle | e1c4 | ▶ |
| play_pause | f137 | ⏯ |
| power_settings_new | f8c7 | ⏻ |
| replay | e042 | ↺ |
| restart_alt | f053 | ⟲ |
| settings | e8b8 | ⚙ |
| settings_backup_restore | e8ba | ⚙ |
| stop | e047 | ⏹ |
| stop_circle | ef71 | ⏹ |
| sync | e627 | ⟳ |

---

## Compatibility with font replacement extensions

**Important**: To prevent font replacement extensions from replacing these icons:

✅ **DO**: Use the font-family without generic fallback
```css
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';  /* Correct */
}
```

❌ **DON'T**: Add generic fallbacks like sans-serif
```css
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined', sans-serif;  /* Wrong - extensions may replace! */
}
```

---

## JavaScript Helper (Optional)

Create a helper function for easier icon usage:

```javascript
const icons = {
  settings: '\ue8b8',
  play_arrow: '\ue037',
  pause: '\ue034',
  stop: '\ue047',
  check: '\ue5ca',
  close: '\ue5cd',
  menu: '\ue5d2',
  sync: '\ue627',
  error: '\uf8b6',
  // ... add more as needed
};

function createIcon(name, size = 24) {
  const span = document.createElement('span');
  span.className = 'material-symbols-outlined';
  span.textContent = icons[name];
  span.style.fontSize = `${size}px`;
  return span;
}

// Usage:
document.body.appendChild(createIcon('settings', 32));
```

---

## Complete Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Material Symbols Example</title>
  <link rel="stylesheet" href="material-symbols.css">
  <style>
    .icon-button {
      background: none;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
  </style>
</head>
<body>
  <h1>Control Panel</h1>

  <!-- Settings button -->
  <button class="icon-button">
    <span class="material-symbols-outlined">&#xe8b8;</span>
    Settings
  </button>

  <!-- Play controls -->
  <button class="icon-button">
    <span class="material-symbols-outlined">&#xe037;</span>
  </button>
  <button class="icon-button">
    <span class="material-symbols-outlined">&#xe034;</span>
  </button>
  <button class="icon-button">
    <span class="material-symbols-outlined">&#xe047;</span>
  </button>

  <!-- Actions -->
  <button class="icon-button">
    <span class="material-symbols-outlined">&#xe5ca;</span>
    Confirm
  </button>
  <button class="icon-button">
    <span class="material-symbols-outlined">&#xe5cd;</span>
    Cancel
  </button>
</body>
</html>
```
