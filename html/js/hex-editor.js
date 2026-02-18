/**
 * hex-editor.js
 * Hex Editor Component
 *
 * Provides hex editing functionality with nibble-level cursor control,
 * selection support, and clipboard operations.
 *
 * Pattern: Function-based with global state (matches codebase standard)
 * Specification: HEX_EDITOR_SPEC.md v2.1
 *
 * Version: 2.0 - Rewritten using function-based pattern
 * Date: February 6, 2026
 */

// ============================================================================
// GLOBAL STATE
// ============================================================================

let hexEditorState = {
    // Configuration
    container: null,
    startAddress: 0x0000,
    bytesPerRow: 16,
    pageSize: 256,           // Page size for navigation
    charsetPuaBase: 0xEE00,  // PUA base for C64 character display

    // Data
    originalData: null,      // Uint8Array - original data
    currentData: null,       // Uint8Array - current data (edited)

    // Edit mode
    editMode: false,
    modalOpen: false,        // Modal dialog open (disables input handlers)

    // Cursor (nibble-level)
    cursor: {
        byteIndex: 0,        // Absolute byte index (0-based)
        nibble: 0,           // 0 = high nibble, 1 = low nibble
        row: 0,              // Row number (0-based)
        col: 0               // Column within row (0-based)
    },

    // Selection
    selection: {
        active: false,
        anchorNibble: 0,     // Start of selection (absolute nibble index)
        endNibble: 0         // End of selection (absolute nibble index)
    },

    // Cursor blink (C64-style)
    cursorBlinkInterval: null
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the hex editor with data
 * @param {jQuery} container - Container element
 * @param {number} startAddress - Starting memory address
 * @param {Uint8Array} data - Data to display/edit
 */
function hexEditorInit(container, startAddress, data) {
    hexEditorState.container = container;
    hexEditorState.startAddress = startAddress;
    hexEditorState.originalData = new Uint8Array(data);
    hexEditorState.currentData = new Uint8Array(data);  // Clone
    hexEditorState.editMode = false;
    hexEditorState.cursor = { byteIndex: 0, nibble: 0, row: 0, col: 0 };
    hexEditorState.selection = { active: false, anchorNibble: 0, endNibble: 0 };

    hexEditorRender();
    console.log('HexEditor: Initialized with', data.length, 'bytes at address', startAddress.toString(16).toUpperCase());
}

/**
 * Set new data (e.g., after loading from API)
 * @param {Uint8Array} data - New data
 * @param {number} startAddress - New start address
 */
function hexEditorSetData(data, startAddress) {
    hexEditorState.originalData = new Uint8Array(data);
    hexEditorState.currentData = new Uint8Array(data);
    hexEditorState.startAddress = startAddress;
    hexEditorState.editMode = false;
    hexEditorState.cursor = { byteIndex: 0, nibble: 0, row: 0, col: 0 };
    hexEditorState.selection = { active: false, anchorNibble: 0, endNibble: 0 };

    hexEditorRender();
}

// ============================================================================
// RENDERING
// ============================================================================

/**
 * Render the entire hex display
 */
function hexEditorRender() {
    const html = [];
    const totalRows = Math.ceil(hexEditorState.currentData.length / hexEditorState.bytesPerRow);

    for (let row = 0; row < totalRows; row++) {
        html.push(hexEditorRenderRow(row));
    }

    hexEditorState.container.html(html.join(''));

    // Apply edit mode styling if active
    if (hexEditorState.editMode) {
        $('.hex-bytes').addClass('edit-mode');
        hexEditorApplyCursor();
    }

    // Apply selection if active
    if (hexEditorState.selection.active) {
        hexEditorRenderSelection();
    }
}

/**
 * Render a single row
 * @param {number} row - Row index
 * @returns {string} HTML for the row
 */
function hexEditorRenderRow(row) {
    const startIndex = row * hexEditorState.bytesPerRow;
    const endIndex = Math.min(startIndex + hexEditorState.bytesPerRow, hexEditorState.currentData.length);
    const address = hexEditorState.startAddress + startIndex;

    // Address column
    const addressHex = address.toString(16).toUpperCase().padStart(4, '0');

    // Hex bytes column
    const bytesHtml = [];
    for (let i = startIndex; i < endIndex; i++) {
        bytesHtml.push(hexEditorRenderByte(i));
    }

    // Characters column
    const charsHtml = [];
    for (let i = startIndex; i < endIndex; i++) {
        charsHtml.push(hexEditorRenderChar(i));
    }

    return `<div class="hex-row" data-row="${row}">
        <span class="hex-address">${addressHex}:</span>
        <span class="hex-bytes">${bytesHtml.join(' ')}</span>
        <span class="hex-chars">${charsHtml.join('')}</span>
    </div>`;
}

/**
 * Render a single byte (two nibbles)
 * @param {number} byteIndex - Absolute byte index
 * @returns {string} HTML for the byte
 */
function hexEditorRenderByte(byteIndex) {
    const byte = hexEditorState.currentData[byteIndex];
    const highNibble = (byte >> 4).toString(16).toUpperCase();
    const lowNibble = (byte & 0x0F).toString(16).toUpperCase();

    const highNibbleIndex = byteIndex * 2;
    const lowNibbleIndex = byteIndex * 2 + 1;

    // Check if byte is modified (different from original)
    const isModified = hexEditorState.editMode &&
                       hexEditorState.currentData[byteIndex] !== hexEditorState.originalData[byteIndex];
    const modifiedClass = isModified ? ' hex-byte-modified' : '';

    return `<span class="hex-byte${modifiedClass}" data-byte="${byteIndex}">` +
           `<span class="hex-nibble" data-nibble="${highNibbleIndex}">${highNibble}</span>` +
           `<span class="hex-nibble" data-nibble="${lowNibbleIndex}">${lowNibble}</span>` +
           `</span>`;
}

/**
 * Render a single character
 * @param {number} byteIndex - Absolute byte index
 * @returns {string} HTML for the character
 */
function hexEditorRenderChar(byteIndex) {
    const byte = hexEditorState.currentData[byteIndex];
    // Use C64 font with PUA base + byte value
    const codepoint = hexEditorState.charsetPuaBase + byte;
    const char = String.fromCodePoint(codepoint);

    return `<span class="hex-char" data-byte="${byteIndex}">${char}</span>`;
}

// ============================================================================
// CURSOR MANAGEMENT
// ============================================================================

/**
 * Start cursor blinking (C64-style: 400ms on, 400ms off)
 */
function hexEditorStartCursorBlink() {
    hexEditorStopCursorBlink();

    // Make cursor visible initially
    $('.hex-nibble-cursor').addClass('hex-cursor-visible');

    // Blink every 400ms
    hexEditorState.cursorBlinkInterval = setInterval(function() {
        $('.hex-nibble-cursor').toggleClass('hex-cursor-visible');
    }, 400);
}

/**
 * Stop cursor blinking
 */
function hexEditorStopCursorBlink() {
    if (hexEditorState.cursorBlinkInterval) {
        clearInterval(hexEditorState.cursorBlinkInterval);
        hexEditorState.cursorBlinkInterval = null;
    }
    // Remove visible class
    $('.hex-nibble-cursor').removeClass('hex-cursor-visible');
}

/**
 * Apply cursor visual (reverse video on current nibble)
 */
function hexEditorApplyCursor() {
    // Clear all cursors
    $('.hex-nibble').removeClass('hex-nibble-cursor hex-cursor-visible');

    // Calculate absolute nibble index
    const nibbleIndex = hexEditorState.cursor.byteIndex * 2 + hexEditorState.cursor.nibble;

    // Apply cursor class
    $(`.hex-nibble[data-nibble="${nibbleIndex}"]`).addClass('hex-nibble-cursor');

    // Restart blink if in edit mode
    if (hexEditorState.editMode) {
        hexEditorStartCursorBlink();
    }
}

/**
 * Clear cursor visual
 */
function hexEditorClearCursor() {
    $('.hex-nibble').removeClass('hex-nibble-cursor');
}

/**
 * Move cursor to specific position
 * @param {number} byteIndex - Byte index
 * @param {number} nibble - Nibble (0 or 1)
 */
function hexEditorSetCursor(byteIndex, nibble) {
    // Clamp to valid range
    const maxByteIndex = hexEditorState.currentData.length - 1;
    byteIndex = Math.max(0, Math.min(byteIndex, maxByteIndex));
    nibble = Math.max(0, Math.min(nibble, 1));

    // Update cursor state
    hexEditorState.cursor.byteIndex = byteIndex;
    hexEditorState.cursor.nibble = nibble;
    hexEditorState.cursor.row = Math.floor(byteIndex / hexEditorState.bytesPerRow);
    hexEditorState.cursor.col = byteIndex % hexEditorState.bytesPerRow;

    // Update visual
    if (hexEditorState.editMode) {
        hexEditorApplyCursor();
    }
}

/**
 * Get current cursor position as absolute nibble index
 * @returns {number} Absolute nibble index
 */
function hexEditorGetCursorNibble() {
    return hexEditorState.cursor.byteIndex * 2 + hexEditorState.cursor.nibble;
}

// ============================================================================
// EDIT MODE
// ============================================================================

/**
 * Enter edit mode
 */
function hexEditorEnterEditMode() {
    hexEditorState.editMode = true;

    // Reset cursor to first byte
    hexEditorSetCursor(0, 0);

    // Visual feedback
    $('.hex-bytes').addClass('edit-mode');
    $('.hex-display').addClass('no-select');

    // Disable header and refresh button
    $('.mem-header').addClass('input-disabled');
    $('#refreshBtn').addClass('input-disabled');

    // Clear any text selection
    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }

    // Start cursor blinking
    hexEditorApplyCursor();
    hexEditorStartCursorBlink();

    console.log('HexEditor: Entered edit mode');
}

/**
 * Exit edit mode
 * @param {boolean} save - True to keep changes, false to discard
 */
function hexEditorExitEditMode(save) {
    if (!save) {
        // Restore original data
        hexEditorState.currentData = new Uint8Array(hexEditorState.originalData);
    } else {
        // Update original data to current (save changes)
        hexEditorState.originalData = new Uint8Array(hexEditorState.currentData);
    }

    hexEditorState.editMode = false;
    hexEditorState.selection.active = false;

    // Stop cursor blinking
    hexEditorStopCursorBlink();

    // Remove visual feedback
    $('.hex-bytes').removeClass('edit-mode');
    $('.hex-display').removeClass('no-select');

    // Re-enable header and refresh button
    $('.mem-header').removeClass('input-disabled');
    $('#refreshBtn').removeClass('input-disabled');

    // Re-render
    hexEditorRender();

    console.log('HexEditor: Exited edit mode, save=' + save);
}

/**
 * Check if data has been modified
 * @returns {boolean} True if modified
 */
function hexEditorIsModified() {
    for (let i = 0; i < hexEditorState.currentData.length; i++) {
        if (hexEditorState.currentData[i] !== hexEditorState.originalData[i]) {
            return true;
        }
    }
    return false;
}

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

/**
 * Main keyboard event handler - routes to edit mode or browse mode based on state.
 * Returns true if the key was handled, false otherwise.
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} True if handled
 */
function hexEditorHandleKey(e) {
    // Ctrl+S (save) - handled everywhere, works in edit mode only, except when modal is open
    if (e.key === 's' && e.ctrlKey) {
        if (hexEditorState.editMode && !hexEditorState.modalOpen && hexEditorSaveCallback) {
            hexEditorSaveCallback();
        }
        return true;
    }

    // Disable all input when modal is open
    if (hexEditorState.modalOpen) {
        return false;
    }

    // Route based on mode
    if (hexEditorState.editMode) {
        return hexEditorHandleEditModeKey(e);
    } else {
        return hexEditorHandleBrowseModeKey(e);
    }
}

/**
 * Handle keyboard events in edit mode.
 * Returns true if the key was handled, false otherwise.
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} True if handled
 */
function hexEditorHandleEditModeKey(e) {
    const key = e.key;
    const shift = e.shiftKey;
    const ctrl = e.ctrlKey;

    // Ctrl+C (copy)
    if (ctrl && key === 'c') {
        hexEditorCopy();
        return true;
    }
    // Ctrl+V (paste)
    if (ctrl && key === 'v') {
        hexEditorPaste();
        return true;
    }
    // Ctrl+A (select all)
    if (ctrl && key === 'a') {
        hexEditorSelectAll();
        return true;
    }

    // Allow browser defaults for modifier keys (except for Ctrl combos already handled)
    if (e.ctrlKey || e.shiftKey || e.altKey) {
        return false;
    }

    if (key === 'Escape') {
        hexEditorHandleEscape();
        return true;
    } else if (key === 'ArrowLeft') {
        hexEditorMoveCursor(-1, 0, shift);
        return true;
    } else if (key === 'ArrowRight') {
        hexEditorMoveCursor(1, 0, shift);
        return true;
    } else if (key === 'ArrowUp') {
        hexEditorMoveCursor(0, -1, shift);
        return true;
    } else if (key === 'ArrowDown') {
        hexEditorMoveCursor(0, 1, shift);
        return true;
    } else if (key === 'Home') {
        hexEditorMoveHome(shift);
        return true;
    } else if (key === 'End') {
        hexEditorMoveEnd(shift);
        return true;
    } else if (key === 'PageUp') {
        hexEditorMovePage(-8, shift);
        return true;
    } else if (key === 'PageDown') {
        hexEditorMovePage(8, shift);
        return true;
    } else if (key === 'Tab') {
        hexEditorMoveTab(shift);
        return true;
    } else if (key === 'Enter') {
        hexEditorMoveEnter();
        return true;
    } else if (key === 'Backspace') {
        hexEditorBackspace();
        return true;
    } else if (key === 'Delete') {
        // Do nothing per spec
        return true;
    } else if (/^[0-9A-Fa-f]$/.test(key)) {
        hexEditorTypeChar(key.toUpperCase());
        return true;
    }

    return false;
}

/**
 * Handle browse mode keyboard navigation.
 * Returns true if the key was handled, false otherwise.
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} True if handled
 */
function hexEditorHandleBrowseModeKey(e) {
    // Don't handle if focus is in an input field
    const inInputField = $(e.target).is('input, textarea, select');
    if (inInputField) {
        return false;
    }

    // Don't navigate if API is busy
    if (isApiBusy()) {
        // Consume navigation key events but don't navigate
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', 'r', 'R'].includes(e.key)) {
            return true;
        }
        return false;
    }

    // Allow browser defaults for modifier keys (except for Ctrl combos already handled)
    if (e.ctrlKey || e.shiftKey || e.altKey) {
        return false;
    }

    // E key to enter edit mode
    if (e.key === 'e' || e.key === 'E') {
        if (hexEditorEnterEditModeCallback) {
            hexEditorEnterEditModeCallback();
        }
        return true;
    }

    // A key to focus address input
    if (e.key === 'a' || e.key === 'A') {
        const addressInput = $('#hex-address')[0];
        if (addressInput) {
            addressInput.focus();
            addressInput.select();
        }
        return true;
    }

    switch(e.key) {
        case 'ArrowUp':
            hexEditorNavigateUp(hexEditorNavigationCallback);
            return true;
        case 'ArrowDown':
            hexEditorNavigateDown(hexEditorNavigationCallback);
            return true;
        case 'ArrowLeft':
            hexEditorNavigateLeft(hexEditorNavigationCallback);
            return true;
        case 'ArrowRight':
            hexEditorNavigateRight(hexEditorNavigationCallback);
            return true;
        case 'PageUp':
            hexEditorNavigatePrevPage(hexEditorNavigationCallback);
            return true;
        case 'PageDown':
            hexEditorNavigateNextPage(hexEditorNavigationCallback);
            return true;
        case 'Home':
            hexEditorNavigateToAddress(0x0000, hexEditorNavigationCallback);
            return true;
        case 'End':
            const lastAddress = 0x10000 - hexEditorState.pageSize;
            hexEditorNavigateToAddress(lastAddress, hexEditorNavigationCallback);
            return true;
        case 'r':
        case 'R':
            const currentAddress = hexEditorState.startAddress;
            hexEditorNavigateToAddress(currentAddress, hexEditorNavigationCallback);
            return true;
    }

    return false;
}


/**
 * Move cursor (with optional selection)
 * @param {number} deltaCol - Column delta (-1, 0, 1)
 * @param {number} deltaRow - Row delta (-1, 0, 1, -8, 8)
 * @param {boolean} extend - Extend selection
 */
function hexEditorMoveCursor(deltaCol, deltaRow, extend) {
    if (extend && !hexEditorState.selection.active) {
        // Start selection
        hexEditorState.selection.active = true;
        hexEditorState.selection.anchorNibble = hexEditorGetCursorNibble();
    }

    let byteIndex = hexEditorState.cursor.byteIndex;
    let nibble = hexEditorState.cursor.nibble;

    if (deltaCol !== 0) {
        // Move nibble by nibble
        let nibbleIndex = byteIndex * 2 + nibble + deltaCol;
        const maxNibble = hexEditorState.currentData.length * 2 - 1;
        nibbleIndex = Math.max(0, Math.min(nibbleIndex, maxNibble));
        byteIndex = Math.floor(nibbleIndex / 2);
        nibble = nibbleIndex % 2;
    }

    if (deltaRow !== 0) {
        // Move by rows
        const newByteIndex = byteIndex + (deltaRow * hexEditorState.bytesPerRow);
        const maxByteIndex = hexEditorState.currentData.length - 1;

        // Stay in place if moving up from first row or down from last row
        const currentRow = Math.floor(byteIndex / hexEditorState.bytesPerRow);
        const newRow = Math.floor(newByteIndex / hexEditorState.bytesPerRow);
        const totalRows = Math.ceil(hexEditorState.currentData.length / hexEditorState.bytesPerRow);

        if ((deltaRow < 0 && currentRow === 0) || (deltaRow > 0 && currentRow === totalRows - 1)) {
            // Stay in place
            return;
        }

        byteIndex = Math.max(0, Math.min(newByteIndex, maxByteIndex));
    }

    hexEditorSetCursor(byteIndex, nibble);

    if (extend) {
        hexEditorState.selection.endNibble = hexEditorGetCursorNibble();
        hexEditorRenderSelection();
    } else {
        hexEditorClearSelection();
    }
}

/**
 * Move to start of row
 * @param {boolean} extend - Extend selection
 */
function hexEditorMoveHome(extend) {
    if (extend && !hexEditorState.selection.active) {
        hexEditorState.selection.active = true;
        hexEditorState.selection.anchorNibble = hexEditorGetCursorNibble();
    }

    const rowStart = hexEditorState.cursor.row * hexEditorState.bytesPerRow;
    hexEditorSetCursor(rowStart, 0);

    if (extend) {
        hexEditorState.selection.endNibble = hexEditorGetCursorNibble();
        hexEditorRenderSelection();
    } else {
        hexEditorClearSelection();
    }
}

/**
 * Move to end of row (first nibble of last byte)
 * @param {boolean} extend - Extend selection
 */
function hexEditorMoveEnd(extend) {
    if (extend && !hexEditorState.selection.active) {
        hexEditorState.selection.active = true;
        hexEditorState.selection.anchorNibble = hexEditorGetCursorNibble();
    }

    const rowEnd = Math.min(
        (hexEditorState.cursor.row + 1) * hexEditorState.bytesPerRow - 1,
        hexEditorState.currentData.length - 1
    );

    // Special case for Shift+End: go to last nibble of row
    const nibble = extend ? 1 : 0;

    hexEditorSetCursor(rowEnd, nibble);

    if (extend) {
        hexEditorState.selection.endNibble = hexEditorGetCursorNibble();
        hexEditorRenderSelection();
    } else {
        hexEditorClearSelection();
    }
}

/**
 * Move by Tab (to next/prev byte)
 * @param {boolean} backward - Shift+Tab (backward)
 */
function hexEditorMoveTab(backward) {
    hexEditorClearSelection();

    let byteIndex = hexEditorState.cursor.byteIndex;

    if (backward) {
        // Shift+Tab: If on low nibble, go to high nibble of same byte, else prev byte
        if (hexEditorState.cursor.nibble === 1) {
            hexEditorSetCursor(byteIndex, 0);
        } else if (byteIndex > 0) {
            hexEditorSetCursor(byteIndex - 1, 0);
        }
    } else {
        // Tab: Next byte
        if (byteIndex < hexEditorState.currentData.length - 1) {
            hexEditorSetCursor(byteIndex + 1, 0);
        }
    }
}

/**
 * Move to next row (Enter key)
 */
function hexEditorMoveEnter() {
    hexEditorClearSelection();

    const nextRowStart = (hexEditorState.cursor.row + 1) * hexEditorState.bytesPerRow;
    if (nextRowStart < hexEditorState.currentData.length) {
        hexEditorSetCursor(nextRowStart, 0);
    }
}

/**
 * Move by page (PageUp/PageDown)
 * @param {number} deltaRows - Number of rows to move (+8 or -8)
 * @param {boolean} extend - Extend selection
 */
function hexEditorMovePage(deltaRows, extend) {
    if (extend && !hexEditorState.selection.active) {
        hexEditorState.selection.active = true;
        hexEditorState.selection.anchorNibble = hexEditorGetCursorNibble();
    }

    const currentRow = hexEditorState.cursor.row;
    const currentCol = hexEditorState.cursor.col;
    const nibble = hexEditorState.cursor.nibble;
    const totalRows = Math.ceil(hexEditorState.currentData.length / hexEditorState.bytesPerRow);

    // Calculate target row
    let targetRow = currentRow + deltaRows;

    // Clamp to first or last row
    if (targetRow < 0) {
        targetRow = 0;
    } else if (targetRow >= totalRows) {
        targetRow = totalRows - 1;
    }

    // Calculate target byte index (same column and nibble)
    let targetByteIndex = targetRow * hexEditorState.bytesPerRow + currentCol;

    // Clamp to valid range
    const maxByteIndex = hexEditorState.currentData.length - 1;
    targetByteIndex = Math.min(targetByteIndex, maxByteIndex);

    hexEditorSetCursor(targetByteIndex, nibble);

    if (extend) {
        hexEditorState.selection.endNibble = hexEditorGetCursorNibble();
        hexEditorRenderSelection();
    } else {
        hexEditorClearSelection();
    }
}

/**
 * Handle Escape key (clear selection or exit edit mode)
 */
function hexEditorHandleEscape() {
    if (hexEditorState.selection.active) {
        // First Escape: clear selection
        hexEditorClearSelection();
    } else {
        // Second Escape (or first if no selection): exit edit mode (Cancel)
        // Check if there are unsaved changes
        if (hexEditorIsModified()) {
            if (!confirm('Discard all changes?')) {
                return; // User canceled, stay in edit mode
            }
        }

        hexEditorExitEditMode(false);  // false = cancel (don't save)

        // Trigger UI update (hide Save/Cancel, show Edit button)
        $('#hex-save-btn, #hex-cancel-btn').hide();
        $('#hex-edit-btn').show();
    }
}

/**
 * Type a hex character
 * @param {string} char - Hex character (0-9, A-F)
 */
function hexEditorTypeChar(char) {
    // If selection is active, replace all selected nibbles with this char
    if (hexEditorState.selection.active) {
        hexEditorReplaceSelection(char);
        return;
    }

    const byteIndex = hexEditorState.cursor.byteIndex;
    const nibble = hexEditorState.cursor.nibble;

    // Get current byte
    let byte = hexEditorState.currentData[byteIndex];

    // Replace nibble
    const nibbleValue = parseInt(char, 16);
    if (nibble === 0) {
        // High nibble
        byte = (nibbleValue << 4) | (byte & 0x0F);
    } else {
        // Low nibble
        byte = (byte & 0xF0) | nibbleValue;
    }

    // Update data
    hexEditorState.currentData[byteIndex] = byte;

    // Move cursor forward
    const nibbleIndex = byteIndex * 2 + nibble;
    const maxNibble = hexEditorState.currentData.length * 2 - 1;

    if (nibbleIndex < maxNibble) {
        const nextNibbleIndex = nibbleIndex + 1;
        hexEditorSetCursor(Math.floor(nextNibbleIndex / 2), nextNibbleIndex % 2);
    }

    // Re-render
    hexEditorRender();
}

/**
 * Backspace - restore original nibble and move back
 */
function hexEditorBackspace() {
    const byteIndex = hexEditorState.cursor.byteIndex;
    const nibble = hexEditorState.cursor.nibble;
    const nibbleIndex = byteIndex * 2 + nibble;

    if (nibbleIndex === 0) return;  // At start, do nothing

    // Move back one nibble
    const prevNibbleIndex = nibbleIndex - 1;
    const prevByteIndex = Math.floor(prevNibbleIndex / 2);
    const prevNibble = prevNibbleIndex % 2;

    // Restore original nibble value
    const originalByte = hexEditorState.originalData[prevByteIndex];
    let currentByte = hexEditorState.currentData[prevByteIndex];

    if (prevNibble === 0) {
        // Restore high nibble
        currentByte = (originalByte & 0xF0) | (currentByte & 0x0F);
    } else {
        // Restore low nibble
        currentByte = (currentByte & 0xF0) | (originalByte & 0x0F);
    }

    hexEditorState.currentData[prevByteIndex] = currentByte;

    // Move cursor
    hexEditorSetCursor(prevByteIndex, prevNibble);

    // Re-render
    hexEditorRender();
}

// ============================================================================
// SELECTION
// ============================================================================

/**
 * Clear selection
 */
function hexEditorClearSelection() {
    hexEditorState.selection.active = false;
    $('.hex-nibble').removeClass('hex-nibble-selected');
}

/**
 * Render selection visual
 */
function hexEditorRenderSelection() {
    // Clear previous selection
    $('.hex-nibble').removeClass('hex-nibble-selected');

    if (!hexEditorState.selection.active) return;

    // Get selection range (normalized)
    const start = Math.min(hexEditorState.selection.anchorNibble, hexEditorState.selection.endNibble);
    const end = Math.max(hexEditorState.selection.anchorNibble, hexEditorState.selection.endNibble);

    // Apply selection class to all nibbles in range
    for (let i = start; i <= end; i++) {
        $(`.hex-nibble[data-nibble="${i}"]`).addClass('hex-nibble-selected');
    }
}

/**
 * Select all data
 */
function hexEditorSelectAll() {
    hexEditorState.selection.active = true;
    hexEditorState.selection.anchorNibble = 0;
    hexEditorState.selection.endNibble = hexEditorState.currentData.length * 2 - 1;

    hexEditorRenderSelection();
}

/**
 * Replace all selected nibbles with a character
 * @param {string} char - Hex character
 */
function hexEditorReplaceSelection(char) {
    const start = Math.min(hexEditorState.selection.anchorNibble, hexEditorState.selection.endNibble);
    const end = Math.max(hexEditorState.selection.anchorNibble, hexEditorState.selection.endNibble);

    const nibbleValue = parseInt(char, 16);

    // Replace each nibble in selection
    for (let nibbleIndex = start; nibbleIndex <= end; nibbleIndex++) {
        const byteIndex = Math.floor(nibbleIndex / 2);
        const nibble = nibbleIndex % 2;
        let byte = hexEditorState.currentData[byteIndex];

        if (nibble === 0) {
            byte = (nibbleValue << 4) | (byte & 0x0F);
        } else {
            byte = (byte & 0xF0) | nibbleValue;
        }

        hexEditorState.currentData[byteIndex] = byte;
    }

    // Move cursor to end of selection
    hexEditorSetCursor(Math.floor(end / 2), end % 2);

    // Clear selection
    hexEditorClearSelection();

    // Re-render
    hexEditorRender();
}

// ============================================================================
// CLIPBOARD OPERATIONS
// ============================================================================

/**
 * Copy selected bytes (or current byte) to clipboard
 */
function hexEditorCopy() {
    let bytes = [];

    if (hexEditorState.selection.active) {
        // Copy selection
        const start = Math.min(hexEditorState.selection.anchorNibble, hexEditorState.selection.endNibble);
        const end = Math.max(hexEditorState.selection.anchorNibble, hexEditorState.selection.endNibble);

        const startByte = Math.floor(start / 2);
        const endByte = Math.floor(end / 2);

        for (let i = startByte; i <= endByte; i++) {
            bytes.push(hexEditorState.currentData[i]);
        }
    } else {
        // Copy current byte
        bytes.push(hexEditorState.currentData[hexEditorState.cursor.byteIndex]);
    }

    // Format as space-separated uppercase hex
    const hexString = bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');

    // Copy to clipboard (with fallback for non-secure contexts)
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(hexString).then(() => {
            console.log('HexEditor: Copied to clipboard:', hexString);
        }).catch(err => {
            console.error('HexEditor: Failed to copy:', err);
        });
    } else {
        // Fallback for non-HTTPS contexts
        const textarea = document.createElement('textarea');
        textarea.value = hexString;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            console.log('HexEditor: Copied to clipboard (fallback):', hexString);
        } catch (err) {
            console.error('HexEditor: Failed to copy (fallback):', err);
        }
        document.body.removeChild(textarea);
    }
}

/**
 * Paste hex data from clipboard
 */
function hexEditorPaste() {
    // Helper function to process pasted text
    function processPaste(text) {
        const bytes = hexEditorParseHexString(text);
        if (bytes.length === 0) {
            console.warn('HexEditor: No valid hex data in clipboard');
            return;
        }

        let byteIndex, maxBytes;
        let keepSelection = false;
        let keepCursor = false;
        let savedCursorByte = hexEditorState.cursor.byteIndex;
        let savedCursorNibble = hexEditorState.cursor.nibble;

        // If there's a selection, paste within the selection
        if (hexEditorState.selection.active) {
            // Convert nibble indices to byte indices
            const startByteIndex = Math.floor(hexEditorState.selection.anchorNibble / 2);
            const endByteIndex = Math.floor(hexEditorState.selection.endNibble / 2);
            const selectionSize = Math.abs(endByteIndex - startByteIndex) + 1;

            // Start at beginning of selection
            byteIndex = Math.min(startByteIndex, endByteIndex);

            // Limit paste to selection size
            maxBytes = Math.min(bytes.length, selectionSize);

            // Keep selection active and cursor at original position after paste
            keepSelection = true;
            keepCursor = true;

            console.log('HexEditor: Pasting within selection (', maxBytes, 'bytes)');
        } else {
            // No selection, paste at cursor position
            byteIndex = hexEditorState.cursor.byteIndex;
            maxBytes = bytes.length;
        }

        // Paste bytes
        for (let i = 0; i < maxBytes && byteIndex < hexEditorState.currentData.length; i++, byteIndex++) {
            hexEditorState.currentData[byteIndex] = bytes[i];
        }

        // Move cursor (or restore original position)
        if (keepCursor) {
            // Restore original cursor position
            hexEditorSetCursor(savedCursorByte, savedCursorNibble);
        } else {
            // Move cursor to end of pasted data
            hexEditorSetCursor(Math.min(byteIndex, hexEditorState.currentData.length - 1), 0);
        }

        // Clear selection only if not pasting within selection
        if (!keepSelection) {
            hexEditorClearSelection();
        } else {
            // Re-render selection
            hexEditorRenderSelection();
        }

        // Re-render
        hexEditorRender();

        console.log('HexEditor: Pasted', maxBytes, 'bytes');
    }

    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
            processPaste(text);
        }).catch(err => {
            console.error('HexEditor: Failed to paste:', err);
        });
    } else {
        // Fallback: Show manual paste dialog
        hexEditorShowPasteDialog(processPaste);
    }
}

/**
 * Show manual paste dialog (fallback for non-secure contexts)
 * @param {Function} callback - Function to call with pasted text
 */
function hexEditorShowPasteDialog(callback) {
    // Set modal flag to disable hex editor input
    hexEditorState.modalOpen = true;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';

    // Instructions (no title, simplified)
    const instructions = document.createElement('div');
    instructions.className = 'modal-instructions';
    instructions.textContent = 'Paste hex data below';

    // Input textarea
    const textarea = document.createElement('textarea');
    textarea.className = 'modal-textarea';
    textarea.placeholder = '41 42 43 or 414243';

    // Buttons container
    const buttons = document.createElement('div');
    buttons.className = 'modal-buttons';

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';

    // Paste button
    const pasteBtn = document.createElement('button');
    pasteBtn.textContent = 'Paste';

    // Assemble dialog
    buttons.appendChild(cancelBtn);
    buttons.appendChild(pasteBtn);
    dialog.appendChild(instructions);
    dialog.appendChild(textarea);
    dialog.appendChild(buttons);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Focus textarea
    setTimeout(() => textarea.focus(), 100);

    // Helper to close dialog
    function closeDialog() {
        document.body.removeChild(overlay);
        hexEditorState.modalOpen = false;  // Re-enable hex editor input
    }

    // Event handlers
    pasteBtn.onclick = function() {
        const text = textarea.value.trim();
        if (text) {
            callback(text);
        }
        closeDialog();
    };

    cancelBtn.onclick = function() {
        closeDialog();
    };

    // Overlay keydown - only handle ESC and Ctrl+V prevention
    overlay.onkeydown = function(e) {
        // ESC to cancel
        if (e.key === 'Escape') {
            closeDialog();
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Prevent Ctrl+V from opening another dialog
        if (e.key === 'v' && e.ctrlKey) {
            e.stopPropagation();
            return;
        }
    };

    // Textarea keydown - Enter to paste
    textarea.onkeydown = function(e) {
        // Enter (without Ctrl) to paste
        if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
            pasteBtn.click();
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Prevent Ctrl+V from opening another dialog
        if (e.key === 'v' && e.ctrlKey) {
            e.stopPropagation();
        }
    };
}

/**
 * Parse hex string from clipboard (supports multiple formats)
 * @param {string} text - Text from clipboard
 * @returns {Array<number>} Array of byte values
 */
function hexEditorParseHexString(text) {
    // Remove common prefixes and separators
    text = text.replace(/0x/gi, ' ')
               .replace(/\$/g, ' ')
               .replace(/,/g, ' ')
               .replace(/\s+/g, ' ')
               .trim();

    const bytes = [];

    // Try parsing as space-separated hex bytes
    const parts = text.split(' ');
    for (const part of parts) {
        if (part.length === 0) continue;

        // Parse pairs of hex digits
        for (let i = 0; i < part.length; i += 2) {
            const hex = part.substr(i, 2);
            const byte = parseInt(hex, 16);
            if (!isNaN(byte)) {
                bytes.push(byte);
            }
        }
    }

    return bytes;
}

// ============================================================================
// MOUSE INTERACTION
// ============================================================================

/**
 * Set up mouse click handlers
 */
function hexEditorSetupMouse() {
    // Track mouse drag state
    let isDragging = false;
    let dragStartNibble = null;

    // Mouse down on nibble (start potential drag)
    hexEditorState.container.on('mousedown', '.hex-nibble', function(e) {
        if (!hexEditorState.editMode) return;
        if (hexEditorState.modalOpen) return;  // Disable input when modal is open

        const nibbleIndex = parseInt($(this).data('nibble'));
        const byteIndex = Math.floor(nibbleIndex / 2);
        const nibble = nibbleIndex % 2;

        if (e.shiftKey) {
            // Shift-click: extend or start selection
            if (!hexEditorState.selection.active) {
                // Start selection from current cursor position
                hexEditorState.selection.active = true;
                hexEditorState.selection.anchorNibble = hexEditorGetCursorNibble();
            }
            // Extend selection to clicked position
            hexEditorState.selection.endNibble = nibbleIndex;
            hexEditorSetCursor(byteIndex, nibble);
            hexEditorRenderSelection();
        } else {
            // Regular click: prepare for potential drag
            isDragging = true;
            dragStartNibble = nibbleIndex;

            // Clear existing selection and move cursor
            hexEditorClearSelection();
            hexEditorSetCursor(byteIndex, nibble);
        }

        e.preventDefault(); // Prevent text selection
    });

    // Mouse move during drag
    hexEditorState.container.on('mousemove', '.hex-nibble', function(e) {
        if (!hexEditorState.editMode || !isDragging) return;
        if (hexEditorState.modalOpen) return;  // Disable input when modal is open

        const nibbleIndex = parseInt($(this).data('nibble'));
        const byteIndex = Math.floor(nibbleIndex / 2);
        const nibble = nibbleIndex % 2;

        // Start selection if not already active
        if (!hexEditorState.selection.active) {
            hexEditorState.selection.active = true;
            hexEditorState.selection.anchorNibble = dragStartNibble;
        }

        // Extend selection to current position
        hexEditorState.selection.endNibble = nibbleIndex;
        hexEditorSetCursor(byteIndex, nibble);
        hexEditorRenderSelection();
    });

    // Mouse up anywhere (end drag)
    $(document).on('mouseup.hexeditor', function(e) {
        if (isDragging) {
            isDragging = false;
            dragStartNibble = null;
        }
    });

    // Click on character (position at corresponding byte)
    hexEditorState.container.on('click', '.hex-char', function(e) {
        if (!hexEditorState.editMode) return;
        if (hexEditorState.modalOpen) return;  // Disable input when modal is open

        const byteIndex = parseInt($(this).data('byte'));

        if (e.shiftKey && hexEditorState.selection.active) {
            // Extend selection to this byte
            hexEditorState.selection.endNibble = byteIndex * 2;
            hexEditorSetCursor(byteIndex, 0);
            hexEditorRenderSelection();
        } else {
            // Move cursor
            hexEditorSetCursor(byteIndex, 0);
            hexEditorClearSelection();
        }
    });

    // Helper function to find nibble to the left of click position
    function findNibbleToLeft(clickX, $container) {
        const $nibbles = $container.find('.hex-nibble');
        if ($nibbles.length === 0) return null;

        let leftmostNibble = null;
        let maxLeftX = -Infinity;

        $nibbles.each(function() {
            const $nibble = $(this);
            const offset = $nibble.offset();
            const rightX = offset.left + $nibble.outerWidth();

            // Find the rightmost nibble that ends before or at the click position
            if (rightX <= clickX && rightX > maxLeftX) {
                maxLeftX = rightX;
                leftmostNibble = $nibble;
            }
        });

        return leftmostNibble;
    }

    // Mouse down on space (start drag from nearest nibble)
    hexEditorState.container.on('mousedown', '.hex-bytes', function(e) {
        if (!hexEditorState.editMode) return;
        if (hexEditorState.modalOpen) return;  // Disable input when modal is open
        if (e.target !== this) return; // Only handle clicks on spaces

        const leftNibble = findNibbleToLeft(e.pageX, $(this));
        if (!leftNibble) return;

        const nibbleIndex = parseInt(leftNibble.data('nibble'));
        const nextNibbleIndex = nibbleIndex + 1;
        const maxNibbleIndex = hexEditorState.currentData.length * 2 - 1;

        if (nextNibbleIndex <= maxNibbleIndex) {
            const byteIndex = Math.floor(nextNibbleIndex / 2);
            const nibble = nextNibbleIndex % 2;

            if (e.shiftKey) {
                // Shift-click: extend or start selection
                if (!hexEditorState.selection.active) {
                    hexEditorState.selection.active = true;
                    hexEditorState.selection.anchorNibble = hexEditorGetCursorNibble();
                }
                hexEditorState.selection.endNibble = nextNibbleIndex;
                hexEditorSetCursor(byteIndex, nibble);
                hexEditorRenderSelection();
            } else {
                // Regular click: prepare for drag
                isDragging = true;
                dragStartNibble = nextNibbleIndex;
                hexEditorClearSelection();
                hexEditorSetCursor(byteIndex, nibble);
            }

            e.preventDefault();
        }
    });

    // Mouse move on space during drag
    hexEditorState.container.on('mousemove', '.hex-bytes', function(e) {
        if (!hexEditorState.editMode || !isDragging) return;
        if (hexEditorState.modalOpen) return;  // Disable input when modal is open
        if (e.target !== this) return; // Only handle movement over spaces

        const leftNibble = findNibbleToLeft(e.pageX, $(this));
        if (!leftNibble) return;

        const nibbleIndex = parseInt(leftNibble.data('nibble'));
        const nextNibbleIndex = nibbleIndex + 1;
        const maxNibbleIndex = hexEditorState.currentData.length * 2 - 1;

        if (nextNibbleIndex <= maxNibbleIndex) {
            const byteIndex = Math.floor(nextNibbleIndex / 2);
            const nibble = nextNibbleIndex % 2;

            if (!hexEditorState.selection.active) {
                hexEditorState.selection.active = true;
                hexEditorState.selection.anchorNibble = dragStartNibble;
            }

            hexEditorState.selection.endNibble = nextNibbleIndex;
            hexEditorSetCursor(byteIndex, nibble);
            hexEditorRenderSelection();
        }
    });
}

// ============================================================================
// DATA ACCESS
// ============================================================================

/**
 * Get current data
 * @returns {Uint8Array} Current data
 */
function hexEditorGetData() {
    return new Uint8Array(hexEditorState.currentData);
}

/**
 * Get modified bytes (returns array of {address, value} objects)
 * @returns {Array<{address: number, value: number}>} Modified bytes
 */
function hexEditorGetChanges() {
    const changes = [];
    for (let i = 0; i < hexEditorState.currentData.length; i++) {
        if (hexEditorState.currentData[i] !== hexEditorState.originalData[i]) {
            changes.push({
                address: hexEditorState.startAddress + i,
                value: hexEditorState.currentData[i]
            });
        }
    }
    return changes;
}

/**
 * Save changes to C64 memory
 * Writes all bytes from first modified to last modified in a single operation
 * @param {function} callback - Success callback
 * @param {function} errorCallback - Error callback
 */
function hexEditorSaveChanges(callback, errorCallback) {
    const changes = hexEditorGetChanges();

    if (changes.length === 0) {
        console.log('HexEditor: No changes to save');
        if (callback) callback();
        return;
    }

    // Find first and last modified byte
    const firstChange = changes[0];
    const lastChange = changes[changes.length - 1];

    const startAddress = firstChange.address;
    const endAddress = lastChange.address;
    const length = endAddress - startAddress + 1;

    // Extract all bytes from first to last modified (including unmodified in between)
    const dataToWrite = [];
    for (let i = 0; i < length; i++) {
        const byteIndex = (startAddress - hexEditorState.startAddress) + i;
        dataToWrite.push(hexEditorState.currentData[byteIndex]);
    }

    console.log(`HexEditor: Writing ${length} bytes from $${startAddress.toString(16).toUpperCase()} to $${endAddress.toString(16).toUpperCase()}`);

    // Write to C64 memory
    writeMemory(startAddress, dataToWrite,
        function() {
            console.log('HexEditor: Save successful');
            if (callback) callback();
        },
        function(errorMsg) {
            console.error('HexEditor: Save failed:', errorMsg);
            if (errorCallback) errorCallback(errorMsg);
        }
    );
}

/**
 * Get address range information
 * @returns {object} {startAddress, endAddress, length}
 */
function hexEditorGetAddressRange() {
    return {
        startAddress: hexEditorState.startAddress,
        endAddress: hexEditorState.startAddress + hexEditorState.currentData.length - 1,
        length: hexEditorState.currentData.length
    };
}

// ============================================================================
// NAVIGATION (BROWSING MODE)
// ============================================================================

/**
 * Validate and fix address to be within memory boundaries
 * @param {number} address - Address to validate
 * @param {number} pageSize - Page size (optional, uses current if not provided)
 * @returns {number} Valid address within boundaries
 */
function hexEditorValidateAddress(address, pageSize) {
    if (pageSize === undefined) {
        pageSize = hexEditorState.pageSize;
    }

    // Clamp address to valid range
    if (address < 0) {
        address = 0;
    }

    // Check if address + pageSize exceeds memory limit
    if (address + pageSize > 0x10000) {
        address = 0x10000 - pageSize;
    }

    // Ensure address doesn't exceed 0xFFFF
    if (address > 0xFFFF) {
        address = 0xFFFF;
    }

    return address;
}

/**
 * Set page size for navigation
 * @param {number} pageSize - Page size in bytes
 */
function hexEditorSetPageSize(pageSize) {
    hexEditorState.pageSize = pageSize;
    console.log('HexEditor: Page size set to', pageSize);
}

/**
 * Set charset PUA base for character display
 * @param {number} puaBase - PUA base value (e.g., 0xEF00)
 */
function hexEditorSetCharsetPuaBase(puaBase) {
    hexEditorState.charsetPuaBase = puaBase;
    console.log('HexEditor: Charset PUA base set to', puaBase.toString(16).toUpperCase());
}

/**
 * Navigate to a specific address
 * @param {number} address - Target address
 * @param {Function} callback - Callback function(data) to receive new data
 */
function hexEditorNavigateToAddress(address, callback) {
    if (hexEditorState.editMode) {
        console.warn('HexEditor: Cannot navigate while in edit mode');
        return;
    }

    // Validate and fix address to be within boundaries
    address = hexEditorValidateAddress(address);

    // console.log('HexEditor: Navigate to address', address.toString(16).toUpperCase());

    // Read memory from C64 via API
    readMemory(address, hexEditorState.pageSize,
        function(arrayBuffer) {
            // Success: convert ArrayBuffer to Uint8Array
            const newData = new Uint8Array(arrayBuffer);
            hexEditorSetData(newData, address);

            if (callback) {
                callback(newData);
            }
        },
        function(errorMsg) {
            // Error: already displayed by readMemory via showError
            console.error('HexEditor: Failed to read memory:', errorMsg);
        }
    );
}

/**
 * Navigate up (previous row, -16 bytes)
 * @param {Function} callback - Callback function(data) to receive new data
 */
function hexEditorNavigateUp(callback) {
    const newAddress = hexEditorState.startAddress - hexEditorState.bytesPerRow;
    hexEditorNavigateToAddress(newAddress, callback);
}

/**
 * Navigate down (next row, +16 bytes)
 * @param {Function} callback - Callback function(data) to receive new data
 */
function hexEditorNavigateDown(callback) {
    const newAddress = hexEditorState.startAddress + hexEditorState.bytesPerRow;
    hexEditorNavigateToAddress(newAddress, callback);
}

/**
 * Navigate left (previous byte, -1 byte)
 * @param {Function} callback - Callback function(data) to receive new data
 */
function hexEditorNavigateLeft(callback) {
    const newAddress = hexEditorState.startAddress - 1;
    hexEditorNavigateToAddress(newAddress, callback);
}

/**
 * Navigate right (next byte, +1 byte)
 * @param {Function} callback - Callback function(data) to receive new data
 */
function hexEditorNavigateRight(callback) {
    const newAddress = hexEditorState.startAddress + 1;
    hexEditorNavigateToAddress(newAddress, callback);
}

/**
 * Navigate to previous page (-pageSize bytes)
 * @param {Function} callback - Callback function(data) to receive new data
 */
function hexEditorNavigatePrevPage(callback) {
    const newAddress = hexEditorState.startAddress - hexEditorState.pageSize;
    hexEditorNavigateToAddress(newAddress, callback);
}

/**
 * Navigate to next page (+pageSize bytes)
 * @param {Function} callback - Callback function(data) to receive new data
 */
function hexEditorNavigateNextPage(callback) {
    const newAddress = hexEditorState.startAddress + hexEditorState.pageSize;
    hexEditorNavigateToAddress(newAddress, callback);
}

/**
 * Setup keyboard handler for browsing mode navigation
 */
/**
 * Set callback for navigation updates
 * @param {Function} callback - Callback to call after navigation
 */
let hexEditorNavigationCallback = null;

function hexEditorSetNavigationCallback(callback) {
    hexEditorNavigationCallback = callback;
}

/**
 * Callback for entering edit mode (set from UI)
 */
let hexEditorEnterEditModeCallback = null;

function hexEditorSetEnterEditModeCallback(callback) {
    hexEditorEnterEditModeCallback = callback;
}

/**
 * Callback for saving changes (set from UI)
 */
let hexEditorSaveCallback = null;

function hexEditorSetSaveCallback(callback) {
    hexEditorSaveCallback = callback;
}

