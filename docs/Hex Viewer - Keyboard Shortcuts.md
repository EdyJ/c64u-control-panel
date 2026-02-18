# Hex Viewer - Keyboard Shortcuts

## Browsing Mode (Non-Edit Mode)

### Navigation
| Key | Action |
|-----|--------|
| **↑** (Arrow Up) | Navigate to previous row (-16 bytes) |
| **↓** (Arrow Down) | Navigate to next row (+16 bytes) |
| **←** (Arrow Left) | Navigate to previous byte (-1 byte) |
| **→** (Arrow Right) | Navigate to next byte (+1 byte) |
| **Page Up** | Navigate to previous page (-pageSize bytes) |
| **Page Down** | Navigate to next page (+pageSize bytes) |
| **Home** | Navigate to start of memory ($0000) |
| **End** | Navigate to end of memory (last valid page) |

### Actions
| Key | Action |
|-----|--------|
| **E** | Enter edit mode |
| **A** | Focus address input |
| **R** | Refresh current memory from C64 |

---

## Edit Mode

### Editing
| Key | Action |
|-----|--------|
| **0-9, A-F** | Type hex digit at cursor position |
| **Backspace** | Revert previous hex digit |
| **Delete** | Revert current hex byte |
| **↑** (Arrow Up) | Move cursor up one row (-16 bytes) |
| **↓** (Arrow Down) | Move cursor down one row (+16 bytes) |
| **←** (Arrow Left) | Move cursor left one nibble |
| **→** (Arrow Right) | Move cursor right one nibble |
| **Home** | Move cursor to first byte |
| **End** | Move cursor to last byte |
| **Page Up** | Move cursor up one page (-pageSize bytes) |
| **Page Down** | Move cursor down one page (+pageSize bytes) |
| **Tab** | Move cursor to next byte |
| **Shift+Tab** | Move cursor to previous byte |
| **Enter** | Move cursor to beginning of the next row |


### Selection
| Key | Action |
|-----|--------|
| **Shift + Arrow Keys** | Extend selection |
| **Shift + Home** | Select from cursor to start |
| **Shift + End** | Select from cursor to end |
| **Shift + Page Up/Down** | Extend selection by page |
| **Ctrl+A** | Select all editable bytes |
| **Ctrl+C** | Copy selected bytes to clipboard |

### Actions
| Key | Action |
|-----|--------|
| **Ctrl+V** | Open paste dialog |
| **Ctrl+S** | Save changes to C64 memory |
| **Escape** | Cancel edit mode (with confirmation if modified) |

