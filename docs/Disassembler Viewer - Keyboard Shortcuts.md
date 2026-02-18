# Disassembler Viewer - Keyboard Shortcuts

## Browsing Mode (Non-Edit Mode)

### Navigation
| Key | Action |
|-----|--------|
| **↑** (Arrow Up) | Navigate to previous byte |
| **↓** (Arrow Down) | Navigate to next byte |
| **Page Up** | Navigate to previous page |
| **Page Down** | Navigate to next page |

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
| **←** (Arrow Left) | Move cursor left one nibble |
| **→** (Arrow Right) | Move cursor right one nibble |
| **↑** (Arrow Up) | Move cursor to previous instruction |
| **↓** (Arrow Down) | Move cursor to next instruction |
| **Home** | Move cursor to first byte in current instruction |
| **End** | Move cursor to last byte in current instruction |
| **Page Up** | Move cursor up 8 instructions |
| **Page Down** | Move cursor down 8 instructions |
| **Tab** | Move cursor to next byte |
| **Shift+Tab** | Move cursor to previous byte |
| **Enter** | Move cursor to next instruction |

### Selection
| Key | Action |
|-----|--------|
| **Shift + Arrow Keys** | Extend selection |
| **Shift + Home** | Select from cursor to first instruction |
| **Shift + End** | Select from cursor to last instruction |
| **Shift + Page Up/Down** | Extend selection by page |
| **Ctrl+A** | Select all editable bytes |
| **Ctrl+C** | Copy selected bytes to clipboard |

### Actions
| Key | Action |
|-----|--------|
| **Ctrl+V** | Open paste dialog (paste hex bytes) |
| **Shift+Ctrl+V** | Open paste assembly dialog (paste 6502 assembly) |
| **Ctrl+S** | Save changes to C64 memory |
| **Escape** | Cancel edit mode (with confirmation if modified) |
