# Memory Tool - Keyboard Shortcuts

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
| **A** | Focus address input (with text selected) |
| **R** | Refresh current memory from C64 |

### Address Input
| Key | Action |
|-----|--------|
| **Enter** | Navigate to entered address and remove focus |

---

## Edit Mode

### Editing
| Key | Action |
|-----|--------|
| **0-9, A-F** | Type hex digit at cursor position |
| **Backspace** | Delete previous hex digit |
| **Delete** | Delete current hex digit |
| **↑** (Arrow Up) | Move cursor up one row (-16 bytes) |
| **↓** (Arrow Down) | Move cursor down one row (+16 bytes) |
| **←** (Arrow Left) | Move cursor left one nibble |
| **→** (Arrow Right) | Move cursor right one nibble |
| **Home** | Move cursor to first byte |
| **End** | Move cursor to last byte |
| **Page Up** | Move cursor up one page (-pageSize bytes) |
| **Page Down** | Move cursor down one page (+pageSize bytes) |

### Selection
| Key | Action |
|-----|--------|
| **Shift + Arrow Keys** | Extend selection |
| **Shift + Home** | Select from cursor to start |
| **Shift + End** | Select from cursor to end |
| **Shift + Page Up/Down** | Extend selection by page |

### Actions
| Key | Action |
|-----|--------|
| **Ctrl+V** | Open paste dialog |
| **Ctrl+S** | Save changes to C64 memory |
| **Escape** | Cancel edit mode (with confirmation if modified) |

### Paste Dialog (Modal)
| Key | Action |
|-----|--------|
| **Enter** | Paste data and close dialog |
| **Escape** | Cancel and close dialog |
| **All other keys** | Work normally in textarea |

