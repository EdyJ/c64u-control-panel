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
    
    // Data
    originalData: null,      // Uint8Array - original data
    currentData: null,       // Uint8Array - current data (edited)
    
    // Edit mode
    editMode: false,
    
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
    }
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
    
    // Apply cursor if in edit mode
    if (hexEditorState.editMode) {
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
    
    return `<span class="hex-byte" data-byte="${byteIndex}">` +
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
    // Display printable ASCII, otherwise show '.'
    const char = (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
    const escaped = char.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return `<span class="hex-char" data-byte="${byteIndex}">${escaped}</span>`;
}

// ============================================================================
// CURSOR MANAGEMENT
// ============================================================================

/**
 * Apply cursor visual (reverse video on current nibble)
 */
function hexEditorApplyCursor() {
    // Clear all cursors
    $('.hex-nibble').removeClass('hex-nibble-cursor');
    
    // Calculate absolute nibble index
    const nibbleIndex = hexEditorState.cursor.byteIndex * 2 + hexEditorState.cursor.nibble;
    
    // Apply cursor class
    $(`.hex-nibble[data-nibble="${nibbleIndex}"]`).addClass('hex-nibble-cursor');
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
    hexEditorApplyCursor();
    
    // Bind keyboard handler
    $(document).on('keydown.hexeditor', hexEditorHandleKeyDown);
    
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
    
    // Unbind keyboard handler
    $(document).off('keydown.hexeditor');
    
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
 * Main keyboard event handler
 * @param {KeyboardEvent} e - Keyboard event
 */
function hexEditorHandleKeyDown(e) {
    if (!hexEditorState.editMode) return;
    
    const key = e.key;
    const shift = e.shiftKey;
    const ctrl = e.ctrlKey;
    
    // Handle different keys
    if (ctrl && key === 'c') {
        e.preventDefault();
        hexEditorCopy();
    } else if (ctrl && key === 'v') {
        e.preventDefault();
        hexEditorPaste();
    } else if (ctrl && key === 'a') {
        e.preventDefault();
        hexEditorSelectAll();
    } else if (key === 'Escape') {
        e.preventDefault();
        hexEditorHandleEscape();
    } else if (key === 'ArrowLeft') {
        e.preventDefault();
        hexEditorMoveCursor(-1, 0, shift);
    } else if (key === 'ArrowRight') {
        e.preventDefault();
        hexEditorMoveCursor(1, 0, shift);
    } else if (key === 'ArrowUp') {
        e.preventDefault();
        hexEditorMoveCursor(0, -1, shift);
    } else if (key === 'ArrowDown') {
        e.preventDefault();
        hexEditorMoveCursor(0, 1, shift);
    } else if (key === 'Home') {
        e.preventDefault();
        hexEditorMoveHome(shift);
    } else if (key === 'End') {
        e.preventDefault();
        hexEditorMoveEnd(shift);
    } else if (key === 'PageUp') {
        e.preventDefault();
        hexEditorMovePage(-8, shift);
    } else if (key === 'PageDown') {
        e.preventDefault();
        hexEditorMovePage(8, shift);
    } else if (key === 'Tab') {
        e.preventDefault();
        hexEditorMoveTab(shift);
    } else if (key === 'Enter') {
        e.preventDefault();
        hexEditorMoveEnter();
    } else if (key === 'Backspace') {
        e.preventDefault();
        hexEditorBackspace();
    } else if (key === 'Delete') {
        e.preventDefault();
        // Do nothing per spec
    } else if (/^[0-9A-Fa-f]$/.test(key)) {
        e.preventDefault();
        hexEditorTypeChar(key.toUpperCase());
    }
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
    
    // Copy to clipboard
    navigator.clipboard.writeText(hexString).then(() => {
        console.log('HexEditor: Copied to clipboard:', hexString);
    }).catch(err => {
        console.error('HexEditor: Failed to copy:', err);
    });
}

/**
 * Paste hex data from clipboard
 */
function hexEditorPaste() {
    navigator.clipboard.readText().then(text => {
        const bytes = hexEditorParseHexString(text);
        if (bytes.length === 0) {
            console.warn('HexEditor: No valid hex data in clipboard');
            return;
        }
        
        // Paste at cursor position
        let byteIndex = hexEditorState.cursor.byteIndex;
        for (let i = 0; i < bytes.length && byteIndex < hexEditorState.currentData.length; i++, byteIndex++) {
            hexEditorState.currentData[byteIndex] = bytes[i];
        }
        
        // Move cursor to end of pasted data
        hexEditorSetCursor(Math.min(byteIndex, hexEditorState.currentData.length - 1), 0);
        
        // Clear selection
        hexEditorClearSelection();
        
        // Re-render
        hexEditorRender();
        
        console.log('HexEditor: Pasted', bytes.length, 'bytes');
    }).catch(err => {
        console.error('HexEditor: Failed to paste:', err);
    });
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
    // Click on nibble
    hexEditorState.container.on('click', '.hex-nibble', function(e) {
        if (!hexEditorState.editMode) return;
        
        const nibbleIndex = parseInt($(this).data('nibble'));
        const byteIndex = Math.floor(nibbleIndex / 2);
        const nibble = nibbleIndex % 2;
        
        if (e.shiftKey && hexEditorState.selection.active) {
            // Extend selection
            hexEditorState.selection.endNibble = nibbleIndex;
            hexEditorSetCursor(byteIndex, nibble);
            hexEditorRenderSelection();
        } else {
            // Move cursor
            hexEditorSetCursor(byteIndex, nibble);
            hexEditorClearSelection();
        }
    });
    
    // Click on character (position at corresponding byte)
    hexEditorState.container.on('click', '.hex-char', function(e) {
        if (!hexEditorState.editMode) return;
        
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
    
    // Click on space between bytes (move to next nibble to the right)
    hexEditorState.container.on('click', '.hex-bytes', function(e) {
        if (!hexEditorState.editMode) return;
        
        // Only handle clicks on the element itself (spaces), not on child spans (nibbles)
        if (e.target !== this) return;
        
        // Get click position and find nearest nibble
        const $bytes = $(this);
        const $nibbles = $bytes.find('.hex-nibble');
        
        if ($nibbles.length === 0) return;
        
        const clickX = e.pageX;
        let closestNibble = null;
        let minDistance = Infinity;
        
        $nibbles.each(function() {
            const $nibble = $(this);
            const offset = $nibble.offset();
            const width = $nibble.outerWidth();
            const centerX = offset.left + width / 2;
            const distance = Math.abs(clickX - centerX);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestNibble = $nibble;
            }
        });
        
        if (closestNibble) {
            const nibbleIndex = parseInt(closestNibble.data('nibble'));
            // Move to the nibble to the right (high nibble of next byte)
            const nextNibbleIndex = nibbleIndex + 1;
            const maxNibbleIndex = hexEditorState.currentData.length * 2 - 1;
            
            if (nextNibbleIndex <= maxNibbleIndex) {
                const byteIndex = Math.floor(nextNibbleIndex / 2);
                const nibble = nextNibbleIndex % 2;
                hexEditorSetCursor(byteIndex, nibble);
                hexEditorClearSelection();
            }
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

