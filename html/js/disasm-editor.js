/**
 * disasm-editor.js
 * Disassembly Editor Component
 *
 * Provides disassembly display functionality using the 6502-reasm library.
 *
 * Pattern: Function-based with global state (matches hex-editor.js pattern)
 *
 * Version: 1.0
 * Date: February 18, 2026
 */

// ============================================================================
// GLOBAL STATE
// ============================================================================

let disasmEditorState = {
    container: null,
    startAddress: 0xC000,
    currentLength: 64,
    libraryLoaded: false
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the disassembly editor
 * @param {jQuery} container - Container element
 * @param {number} startAddress - Starting memory address
 * @param {number} length - Number of bytes to disassemble
 */
function disasmEditorInit(container, startAddress, length) {
    disasmEditorState.container = container;
    disasmEditorState.startAddress = validateMemoryAddress(startAddress, length);
    disasmEditorState.currentLength = length;

    disasmEditorRender();
    console.log('DisasmEditor: Initialized with', length, 'bytes at address', formatHexWord(startAddress));
}

/**
 * Set new address and length
 * @param {number} startAddress - New start address
 * @param {number} length - New length
 */
function disasmEditorSetAddress(startAddress, length) {
    disasmEditorState.startAddress = validateMemoryAddress(startAddress, length);
    disasmEditorState.currentLength = length;
}

/**
 * Set page size (length) for navigation
 * @param {number} length - Length in bytes
 */
function disasmEditorSetLength(length) {
    disasmEditorState.currentLength = length;
    console.log('DisasmEditor: Length set to', length);
}

// ============================================================================
// RENDERING
// ============================================================================

/**
 * Render the disassembly display
 */
function disasmEditorRender() {
    const $display = disasmEditorState.container;
    $display.empty();

    $display.html('<div class="disasm-placeholder">Loading...</div>');
}

// ============================================================================
// DATA LOADING AND DISASSEMBLY
// ============================================================================

/**
 * Load memory and disassemble
 * @param {Function} callback - Callback function to call after loading
 */
function disasmEditorLoadAndDisassemble(callback) {
    const address = disasmEditorState.startAddress;
    const length = disasmEditorState.currentLength;

    disasmEditorUpdateSubheader();

    if (typeof window.reasm6502 === 'undefined' || !window.reasm6502.disasm) {
        showError('6502-reasm library not loaded');
        return;
    }

    disasmEditorState.libraryLoaded = true;

    readMemory(address, length,
        function(arrayBuffer) {
            try {
                const bytes = Array.from(new Uint8Array(arrayBuffer));
                const disasmResult = window.reasm6502.disasm(bytes, address);

                disasmEditorRenderDisassembly(disasmResult, bytes, address);

                if (callback) {
                    callback();
                }
            } catch (error) {
                showError(`Disassembly error: ${error.message}`);
            }
        },
        function(errorMsg) {
            showError(`Error reading memory: ${errorMsg}`);
        }
    );
}

/**
 * Render disassembly result
 * @param {Array} instructions - Array of instruction objects from 6502-reasm
 * @param {Array} bytes - Array of byte values
 * @param {number} startAddress - Starting address
 */
function disasmEditorRenderDisassembly(instructions, bytes, startAddress) {
    const $display = disasmEditorState.container;
    $display.empty();

    let html = '';

    for (let i = 0; i < instructions.length; i++) {
        const instr = instructions[i];
        const addr = instr.address;
        const addrHex = formatHexWord(addr);

        const col1 = `<span class="disasm-col-addr">$${addrHex}</span>`;

        const instrBytes = instr.bytes || [];
        let bytesHex = '';
        for (let j = 0; j < instrBytes.length; j++) {
            bytesHex += formatHexByte(instrBytes[j]) + ' ';
        }
        bytesHex = bytesHex.padEnd(9, ' ');
        const col2 = `<span class="disasm-col-bytes">${bytesHex}</span>`;

        const assembly = instr.assembly || '???';
        const col3 = `<span class="disasm-col-instr">${assembly}</span>`;

        const col4 = disasmEditorGetJumpTarget(instr, bytes, startAddress);

        html += `<div class="disasm-row">${col1}${col2}${col3}${col4}</div>`;
    }

    $display.html(html);
}

/**
 * Get jump target for an instruction
 * @param {Object} instr - Instruction object
 * @param {Array} bytes - Array of byte values
 * @param {number} startAddress - Starting address
 * @returns {string} HTML for jump target column
 */
function disasmEditorGetJumpTarget(instr, bytes, startAddress) {
    const assembly = instr.assembly || '';
    const addr = instr.address;
    const instrBytes = instr.bytes || [];

    if (/^(BCC|BCS|BEQ|BMI|BNE|BPL|BVC|BVS)\s/.test(assembly)) {
        if (instrBytes.length === 2) {
            const offset = instrBytes[1];
            const signedOffset = offset > 127 ? offset - 256 : offset;
            const targetAddr = (addr + 2 + signedOffset) & 0xFFFF;
            return `<span class="disasm-col-target">→ $${formatHexWord(targetAddr)}</span>`;
        }
    }

    if (/^JMP\s\$[0-9A-F]{4}/.test(assembly)) {
        if (instrBytes.length === 3) {
            const targetAddr = instrBytes[1] | (instrBytes[2] << 8);
            return `<span class="disasm-col-target">→ $${formatHexWord(targetAddr)}</span>`;
        }
    }

    if (/^JSR\s\$[0-9A-F]{4}/.test(assembly)) {
        if (instrBytes.length === 3) {
            const targetAddr = instrBytes[1] | (instrBytes[2] << 8);
            return `<span class="disasm-col-target">→ $${formatHexWord(targetAddr)}</span>`;
        }
    }

    if (/^JMP\s\(\$[0-9A-F]{4}\)/.test(assembly)) {
        if (instrBytes.length === 3) {
            const indirectAddr = instrBytes[1] | (instrBytes[2] << 8);
            const indirectHex = formatHexWord(indirectAddr);

            disasmEditorPeekIndirectTarget(indirectAddr, function(targetAddr) {
                if (targetAddr !== null) {
                    const targetHex = formatHexWord(targetAddr);
                    $(`.disasm-row`).eq(disasmEditorGetInstrIndex(addr)).find('.disasm-col-target').html(`→ ($${indirectHex}) $${targetHex}`);
                }
            });

            return `<span class="disasm-col-target">→ ($${indirectHex})</span>`;
        }
    }

    return '<span class="disasm-col-target"></span>';
}

/**
 * Get instruction index by address
 * @param {number} addr - Address to find
 * @returns {number} Index
 */
function disasmEditorGetInstrIndex(addr) {
    const rows = $('.disasm-row');
    for (let i = 0; i < rows.length; i++) {
        const rowAddr = parseInt($(rows[i]).find('.disasm-col-addr').text().replace('$', ''), 16);
        if (rowAddr === addr) {
            return i;
        }
    }
    return 0;
}

/**
 * Read indirect target address
 * @param {number} indirectAddr - Indirect address to read
 * @param {Function} callback - Callback with target address
 */
function disasmEditorPeekIndirectTarget(indirectAddr, callback) {
    readMemory(indirectAddr, 2,
        function(data) {
            const bytes = new Uint8Array(data);
            const targetAddr = bytes[0] | (bytes[1] << 8);
            callback(targetAddr);
        },
        function(error) {
            callback(null);
        }
    );
}

/**
 * Update the subheader address display
 */
function disasmEditorUpdateSubheader() {
    const startAddr = disasmEditorState.startAddress;
    const endAddr = Math.min(0xFFFF, startAddr + disasmEditorState.currentLength - 1);

    const startHex = formatHexWord(startAddr);
    const endHex = formatHexWord(endAddr);

    $('#disasm-current-address').text(
        `$${startHex} (${startAddr}) - $${endHex} (${endAddr})`
    );
}

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Navigate to a specific address
 * @param {number} address - Target address
 * @param {Function} callback - Callback function to call after navigation
 */
function disasmEditorNavigateToAddress(address, callback) {
    address = validateMemoryAddress(address, disasmEditorState.currentLength);
    disasmEditorState.startAddress = address;

    disasmEditorLoadAndDisassemble(callback);
}

/**
 * Navigate up (previous byte)
 * @param {Function} callback - Callback function to call after navigation
 */
function disasmEditorNavigateUp(callback) {
    const newAddress = disasmEditorState.startAddress - 1;
    disasmEditorNavigateToAddress(newAddress, callback);
}

/**
 * Navigate down (next byte)
 * @param {Function} callback - Callback function to call after navigation
 */
function disasmEditorNavigateDown(callback) {
    const newAddress = disasmEditorState.startAddress + 1;
    disasmEditorNavigateToAddress(newAddress, callback);
}

/**
 * Navigate to previous page
 * @param {Function} callback - Callback function to call after navigation
 */
function disasmEditorNavigatePrevPage(callback) {
    const newAddress = disasmEditorState.startAddress - disasmEditorState.currentLength;
    disasmEditorNavigateToAddress(newAddress, callback);
}

/**
 * Navigate to next page
 * @param {Function} callback - Callback function to call after navigation
 */
function disasmEditorNavigateNextPage(callback) {
    const newAddress = disasmEditorState.startAddress + disasmEditorState.currentLength;
    disasmEditorNavigateToAddress(newAddress, callback);
}

/**
 * Get address range information
 * @returns {Object} {startAddress, endAddress, length}
 */
function disasmEditorGetAddressRange() {
    return {
        startAddress: disasmEditorState.startAddress,
        endAddress: disasmEditorState.startAddress + disasmEditorState.currentLength - 1,
        length: disasmEditorState.currentLength
    };
}

// ============================================================================
// KEYBOARD HANDLING
// ============================================================================

let disasmEditorNavigationCallback = null;

function disasmEditorSetNavigationCallback(callback) {
    disasmEditorNavigationCallback = callback;
}

/**
 * Handle keyboard events
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} True if handled
 */
function disasmEditorHandleKey(e) {
    const inInputField = $(e.target).is('input, textarea, select');
    if (inInputField) {
        return false;
    }

    if (isApiBusy()) {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'r', 'R'].includes(e.key)) {
            return true;
        }
        return false;
    }

    if (e.ctrlKey || e.shiftKey || e.altKey) {
        return false;
    }

    switch(e.key) {
        case 'ArrowUp':
            disasmEditorNavigateUp(disasmEditorNavigationCallback);
            return true;
        case 'ArrowDown':
            disasmEditorNavigateDown(disasmEditorNavigationCallback);
            return true;
        case 'PageUp':
            disasmEditorNavigatePrevPage(disasmEditorNavigationCallback);
            return true;
        case 'PageDown':
            disasmEditorNavigateNextPage(disasmEditorNavigationCallback);
            return true;
        case 'r':
        case 'R':
            disasmEditorLoadAndDisassemble(disasmEditorNavigationCallback);
            return true;
        case 'a':
        case 'A':
            const addressInput = $('#disasm-address')[0];
            if (addressInput) {
                addressInput.focus();
                addressInput.select();
            }
            return true;
    }

    return false;
}
