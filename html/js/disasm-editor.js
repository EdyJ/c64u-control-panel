/**
 * disasm-editor.js
 * Disassembly Editor Component
 *
 * Provides disassembly display and editing functionality using the 6502-reasm library.
 *
 * Pattern: Function-based with global state (matches hex-editor.js pattern)
 *
 * Version: 1.1
 * Date: February 18, 2026
 */

// ============================================================================
// GLOBAL STATE
// ============================================================================

let disasmEditorState = {
    container: null,
    startAddress: 0xC000,
    currentLength: 48,
    libraryLoaded: false,
    showAllOpcodes: false,

    // Edit mode
    editMode: false,
    modalOpen: false,
    originalData: null,
    currentData: null,
    editableLength: 0,

    // Instruction tracking (rebuilt after each modification)
    instructionBoundaries: [],
    byteToInstrMap: [],

    // Cursor (nibble-level)
    cursor: {
        byteIndex: 0,
        nibble: 0
    },

    // Selection
    selection: {
        active: false,
        anchorNibble: 0,
        endNibble: 0
    },

    // Cursor blink
    cursorBlinkInterval: null
};

// ============================================================================
// OFFICIAL OPCODES
// ============================================================================

const OFFICIAL_OPCODES = new Set([
    'ADC','AND','ASL','BCC','BCS','BEQ','BIT','BMI','BNE','BPL',
    'BRK','BVC','BVS','CLC','CLD','CLI','CLV','CMP','CPX','CPY',
    'DEC','DEX','DEY','EOR','INC','INX','INY','JMP','JSR','LDA',
    'LDX','LDY','LSR','NOP','ORA','PHA','PHP','PLA','PLP','ROL',
    'ROR','RTI','RTS','SBC','SEC','SED','SEI','STA','STX','STY',
    'TAX','TAY','TSX','TXA','TXS','TYA'
]);

function isOfficialOpcode(mnemonic) {
    const op = mnemonic.split(' ')[0];
    return OFFICIAL_OPCODES.has(op);
}

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

/**
 * Set whether to show all opcodes (including undocumented)
 * @param {boolean} showAll - True to show all opcodes, false for official only
 */
function disasmEditorSetShowAllOpcodes(showAll) {
    disasmEditorState.showAllOpcodes = showAll;
    console.log('DisasmEditor: Show all opcodes:', showAll);
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

        const col1 = `<span class="disasm-col-addr">${addrHex}:</span>`;

        const instrBytes = instr.bytes || [];
        let bytesHex = '';
        for (let j = 0; j < instrBytes.length; j++) {
            const byteVal = instrBytes[j];
            bytesHex += (byteVal === undefined ? 'XX' : formatHexByte(byteVal)) + ' ';
        }
        bytesHex = bytesHex.padEnd(9, ' ');
        const col2 = `<span class="disasm-col-bytes">${bytesHex}</span>`;

        let assembly = instr.assembly || '???';
        if (!disasmEditorState.showAllOpcodes && assembly !== '???' && !isOfficialOpcode(assembly)) {
            assembly = '???';
        }
        const col3 = `<span class="disasm-col-instr">${assembly}</span>`;

        const col4 = disasmEditorGetJumpTarget(instr, bytes, startAddress);

        html += `<div class="disasm-row">${col1}${col2}${col3}${col4}</div>`;
    }

    $display.html(html);
}

/**
 * Render disassembly in edit mode with editable nibbles
 * @param {Array} instructions - Array of instruction objects from 6502-reasm
 * @param {Array} bytes - Array of byte values
 * @param {number} startAddress - Starting address
 */
function disasmEditorRenderDisassemblyEditMode(instructions, bytes, startAddress) {
    const $display = disasmEditorState.container;
    $display.empty();

    const state = disasmEditorState;
    const originalData = state.originalData;
    const currentData = state.currentData;

    let html = '';
    let byteIndex = 0;

    for (let i = 0; i < instructions.length; i++) {
        const instr = instructions[i];
        const addr = instr.address;
        const addrHex = formatHexWord(addr);

        const col1 = `<span class="disasm-col-addr">${addrHex}:</span>`;

        const instrBytes = instr.bytes || [];
        let bytesHtml = '';

        for (let j = 0; j < instrBytes.length; j++) {
            const byteVal = instrBytes[j];
            if (byteVal !== undefined && byteIndex < currentData.length) {
                const currentByte = currentData[byteIndex];
                const highNibble = (currentByte >> 4).toString(16).toUpperCase();
                const lowNibble = (currentByte & 0x0F).toString(16).toUpperCase();

                const isModified = currentByte !== originalData[byteIndex];
                const modifiedClass = isModified ? ' disasm-byte-modified' : '';

                const highNibbleIndex = byteIndex * 2;
                const lowNibbleIndex = byteIndex * 2 + 1;

                bytesHtml += `<span class="disasm-byte${modifiedClass}" data-byte="${byteIndex}">` +
                    `<span class="disasm-nibble" data-nibble="${highNibbleIndex}">${highNibble}</span>` +
                    `<span class="disasm-nibble" data-nibble="${lowNibbleIndex}">${lowNibble}</span>` +
                    `</span> `;
                byteIndex++;
            } else {
                bytesHtml += '   ';
            }
        }

        bytesHtml = bytesHtml.padEnd(27, ' ');
        const col2 = `<span class="disasm-col-bytes">${bytesHtml}</span>`;

        let assembly = instr.assembly || '???';
        if (!state.showAllOpcodes && assembly !== '???' && !isOfficialOpcode(assembly)) {
            assembly = '???';
        }
        const col3 = `<span class="disasm-col-instr">${assembly}</span>`;

        const col4 = disasmEditorGetJumpTarget(instr, bytes, startAddress);

        html += `<div class="disasm-row">${col1}${col2}${col3}${col4}</div>`;
    }

    $display.html(html);
}

/**
 * Re-render from current data (after modification)
 */
function disasmEditorRenderDisassemblyFromData() {
    const state = disasmEditorState;
    const bytes = Array.from(state.currentData);
    const disasmResult = window.reasm6502.disasm(bytes, state.startAddress);
    const mapData = disasmEditorBuildInstructionMap(disasmResult);

    state.instructionBoundaries = mapData.boundaries;
    state.byteToInstrMap = mapData.byteToInstrMap;

    disasmEditorRenderDisassemblyEditMode(disasmResult, bytes, state.startAddress);

    $('.disasm-col-bytes').addClass('edit-mode');
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
// INSTRUCTION MAPPING
// ============================================================================

/**
 * Build instruction boundary map from disassembly result
 * Filters out undefined bytes and builds mapping tables
 * @param {Array} disasmResult - Disassembly result from 6502-reasm
 * @returns {Object} { validBytes, boundaries, byteToInstrMap }
 */
function disasmEditorBuildInstructionMap(disasmResult) {
    const validBytes = [];
    const boundaries = [];
    const byteToInstrMap = [];

    let byteOffset = 0;

    for (let instrIdx = 0; instrIdx < disasmResult.length; instrIdx++) {
        const instr = disasmResult[instrIdx];
        const bytes = instr.bytes || [];
        let validInInstr = 0;

        for (let j = 0; j < bytes.length; j++) {
            const b = bytes[j];
            if (b !== undefined) {
                validBytes.push(b);
                byteToInstrMap.push(boundaries.length);
                validInInstr++;
            }
        }

        if (validInInstr > 0) {
            boundaries.push({
                byteOffset: validBytes.length - validInInstr,
                byteLength: validInInstr
            });
        }
    }

    return {
        validBytes: new Uint8Array(validBytes),
        boundaries,
        byteToInstrMap
    };
}

/**
 * Re-disassemble and reposition cursor after modification
 * @param {number} targetByteIndex - Target byte index
 * @param {number} targetNibble - Target nibble (0 or 1)
 */
function disasmEditorReassemble(targetByteIndex, targetNibble) {
    const state = disasmEditorState;

    const bytes = Array.from(state.currentData);
    const disasmResult = window.reasm6502.disasm(bytes, state.startAddress);

    const mapData = disasmEditorBuildInstructionMap(disasmResult);
    state.instructionBoundaries = mapData.boundaries;
    state.byteToInstrMap = mapData.byteToInstrMap;

    targetByteIndex = Math.min(targetByteIndex, state.currentData.length - 1);
    if (targetByteIndex * 2 + targetNibble >= state.currentData.length * 2) {
        targetNibble = 1;
    }

    disasmEditorRenderDisassemblyEditMode(disasmResult, bytes, state.startAddress);

    state.cursor = { byteIndex: targetByteIndex, nibble: targetNibble };
    disasmEditorApplyCursor();

    $('.disasm-col-bytes').addClass('edit-mode');
}

// ============================================================================
// EDIT MODE
// ============================================================================

/**
 * Enter edit mode
 */
function disasmEditorEnterEditMode() {
    const state = disasmEditorState;
    state.editMode = true;

    const length = state.currentLength;

    readMemory(state.startAddress, length,
        function(arrayBuffer) {
            const rawBytes = Array.from(new Uint8Array(arrayBuffer));
            const disasmResult = window.reasm6502.disasm(rawBytes, state.startAddress);
            const mapData = disasmEditorBuildInstructionMap(disasmResult);

            state.originalData = mapData.validBytes;
            state.currentData = new Uint8Array(mapData.validBytes);
            state.editableLength = mapData.validBytes.length;
            state.instructionBoundaries = mapData.boundaries;
            state.byteToInstrMap = mapData.byteToInstrMap;

            state.cursor = { byteIndex: 0, nibble: 0 };
            state.selection = { active: false, anchorNibble: 0, endNibble: 0 };

            disasmEditorRenderDisassemblyEditMode(disasmResult, Array.from(state.currentData), state.startAddress);

            $('.disasm-col-bytes').addClass('edit-mode');
            $('.disasm-display').addClass('no-select');
            $('.mem-header').addClass('input-disabled');
            $('#refreshBtn').addClass('input-disabled');

            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }

            disasmEditorApplyCursor();
            disasmEditorStartCursorBlink();

            console.log('DisasmEditor: Entered edit mode');
        },
        function(errorMsg) {
            showError('Error reading memory for edit: ' + errorMsg);
            state.editMode = false;
        }
    );
}

/**
 * Exit edit mode
 * @param {boolean} save - True to keep changes, false to discard
 * @param {boolean} skipReload - True to skip API call (for tab switches)
 */
function disasmEditorExitEditMode(save, skipReload) {
    const state = disasmEditorState;

    if (!save) {
        state.currentData = new Uint8Array(state.originalData);
    } else {
        state.originalData = new Uint8Array(state.currentData);
    }

    state.editMode = false;
    state.selection.active = false;

    disasmEditorStopCursorBlink();

    $('.disasm-col-bytes').removeClass('edit-mode');
    $('.disasm-display').removeClass('no-select');
    $('.mem-header').removeClass('input-disabled');
    $('#refreshBtn').removeClass('input-disabled');

    if (!skipReload) {
        disasmEditorLoadAndDisassemble();
    }

    console.log('DisasmEditor: Exited edit mode, save=' + save + ', skipReload=' + skipReload);

    // Call UI callback if set
    if (disasmEditorExitEditModeCallback) {
        disasmEditorExitEditModeCallback(save);
    }
}

/**
 * Check if data has been modified
 * @returns {boolean} True if modified
 */
function disasmEditorIsModified() {
    const state = disasmEditorState;
    if (!state.originalData || !state.currentData) return false;

    for (let i = 0; i < state.currentData.length; i++) {
        if (state.currentData[i] !== state.originalData[i]) {
            return true;
        }
    }
    return false;
}

// ============================================================================
// CURSOR MANAGEMENT
// ============================================================================

/**
 * Start cursor blinking (C64-style: 400ms on, 400ms off)
 */
function disasmEditorStartCursorBlink() {
    disasmEditorStopCursorBlink();

    $('.disasm-nibble-cursor').addClass('disasm-cursor-visible');

    disasmEditorState.cursorBlinkInterval = setInterval(function() {
        $('.disasm-nibble-cursor').toggleClass('disasm-cursor-visible');
    }, 400);
}

/**
 * Stop cursor blinking
 */
function disasmEditorStopCursorBlink() {
    const state = disasmEditorState;
    if (state.cursorBlinkInterval) {
        clearInterval(state.cursorBlinkInterval);
        state.cursorBlinkInterval = null;
    }
    $('.disasm-nibble-cursor').removeClass('disasm-cursor-visible');
}

/**
 * Apply cursor visual
 */
function disasmEditorApplyCursor() {
    $('.disasm-nibble').removeClass('disasm-nibble-cursor disasm-cursor-visible');

    const state = disasmEditorState;
    const nibbleIndex = state.cursor.byteIndex * 2 + state.cursor.nibble;

    $(`.disasm-nibble[data-nibble="${nibbleIndex}"]`).addClass('disasm-nibble-cursor');

    if (state.editMode) {
        disasmEditorStartCursorBlink();
    }
}

/**
 * Clear cursor visual
 */
function disasmEditorClearCursor() {
    $('.disasm-nibble').removeClass('disasm-nibble-cursor');
}

/**
 * Move cursor to specific position
 * @param {number} byteIndex - Byte index
 * @param {number} nibble - Nibble (0 or 1)
 */
function disasmEditorSetCursor(byteIndex, nibble) {
    const state = disasmEditorState;
    const maxByteIndex = state.currentData.length - 1;
    byteIndex = Math.max(0, Math.min(byteIndex, maxByteIndex));
    nibble = Math.max(0, Math.min(nibble, 1));

    state.cursor.byteIndex = byteIndex;
    state.cursor.nibble = nibble;

    if (state.editMode) {
        disasmEditorApplyCursor();
    }
}

/**
 * Get current cursor position as absolute nibble index
 * @returns {number} Absolute nibble index
 */
function disasmEditorGetCursorNibble() {
    const state = disasmEditorState;
    return state.cursor.byteIndex * 2 + state.cursor.nibble;
}

// ============================================================================
// NAVIGATION IN EDIT MODE
// ============================================================================

/**
 * Move cursor (with optional selection)
 * @param {number} deltaCol - Column delta (-1, 0, 1)
 * @param {number} deltaRow - Row delta (-1, 0, 1, -8, 8)
 * @param {boolean} extend - Extend selection
 */
function disasmEditorMoveCursor(deltaCol, deltaRow, extend) {
    const state = disasmEditorState;
    const boundaries = state.instructionBoundaries;
    const byteToInstr = state.byteToInstrMap;

    if (extend && !state.selection.active) {
        state.selection.active = true;
        state.selection.anchorNibble = disasmEditorGetCursorNibble();
    }

    let byteIndex = state.cursor.byteIndex;
    let nibble = state.cursor.nibble;

    if (deltaCol !== 0) {
        let nibbleIndex = byteIndex * 2 + nibble + deltaCol;
        const maxNibble = state.currentData.length * 2 - 1;
        nibbleIndex = Math.max(0, Math.min(nibbleIndex, maxNibble));
        byteIndex = Math.floor(nibbleIndex / 2);
        nibble = nibbleIndex % 2;
    }

    if (deltaRow !== 0) {
        if (byteToInstr.length === 0) return;

        const currentInstrIdx = byteToInstr[byteIndex];

        if (deltaRow < 0) {
            if (currentInstrIdx > 0) {
                const prevInstr = boundaries[currentInstrIdx - 1];
                const offsetInCurrent = byteIndex - boundaries[currentInstrIdx].byteOffset;

                if (offsetInCurrent < prevInstr.byteLength) {
                    byteIndex = prevInstr.byteOffset + offsetInCurrent;
                } else {
                    byteIndex = prevInstr.byteOffset + prevInstr.byteLength - 1;
                    nibble = 1;
                }
            }
        } else {
            if (currentInstrIdx < boundaries.length - 1) {
                const nextInstr = boundaries[currentInstrIdx + 1];
                const offsetInCurrent = byteIndex - boundaries[currentInstrIdx].byteOffset;

                if (offsetInCurrent < nextInstr.byteLength) {
                    byteIndex = nextInstr.byteOffset + offsetInCurrent;
                } else {
                    byteIndex = nextInstr.byteOffset + nextInstr.byteLength - 1;
                    nibble = 1;
                }
            }
        }
    }

    disasmEditorSetCursor(byteIndex, nibble);

    if (extend) {
        state.selection.endNibble = disasmEditorGetCursorNibble();
        disasmEditorRenderSelection();
    } else {
        disasmEditorClearSelection();
    }
}

/**
 * Move to start of current instruction
 * @param {boolean} extend - Extend selection
 */
function disasmEditorMoveHome(extend) {
    const state = disasmEditorState;
    const boundaries = state.instructionBoundaries;
    const byteToInstr = state.byteToInstrMap;

    if (byteToInstr.length === 0) return;

    if (extend && !state.selection.active) {
        state.selection.active = true;
        state.selection.anchorNibble = disasmEditorGetCursorNibble();
    }

    const instrIdx = byteToInstr[state.cursor.byteIndex];
    const instr = boundaries[instrIdx];
    disasmEditorSetCursor(instr.byteOffset, 0);

    if (extend) {
        state.selection.endNibble = disasmEditorGetCursorNibble();
        disasmEditorRenderSelection();
    } else {
        disasmEditorClearSelection();
    }
}

/**
 * Move to end of current instruction
 * @param {boolean} extend - Extend selection
 */
function disasmEditorMoveEnd(extend) {
    const state = disasmEditorState;
    const boundaries = state.instructionBoundaries;
    const byteToInstr = state.byteToInstrMap;

    if (byteToInstr.length === 0) return;

    if (extend && !state.selection.active) {
        state.selection.active = true;
        state.selection.anchorNibble = disasmEditorGetCursorNibble();
    }

    const instrIdx = byteToInstr[state.cursor.byteIndex];
    const instr = boundaries[instrIdx];
    const lastByteIdx = instr.byteOffset + instr.byteLength - 1;
    const nibble = extend ? 1 : 0;

    disasmEditorSetCursor(lastByteIdx, nibble);

    if (extend) {
        state.selection.endNibble = disasmEditorGetCursorNibble();
        disasmEditorRenderSelection();
    } else {
        disasmEditorClearSelection();
    }
}

/**
 * Move by Tab (to next/prev byte)
 * @param {boolean} backward - Shift+Tab (backward)
 */
function disasmEditorMoveTab(backward) {
    disasmEditorClearSelection();

    const state = disasmEditorState;
    let byteIndex = state.cursor.byteIndex;

    if (backward) {
        if (state.cursor.nibble === 1) {
            disasmEditorSetCursor(byteIndex, 0);
        } else if (byteIndex > 0) {
            disasmEditorSetCursor(byteIndex - 1, 0);
        }
    } else {
        if (byteIndex < state.currentData.length - 1) {
            disasmEditorSetCursor(byteIndex + 1, 0);
        }
    }
}

/**
 * Move to next instruction (Enter key)
 */
function disasmEditorMoveEnter() {
    disasmEditorClearSelection();

    const state = disasmEditorState;
    const boundaries = state.instructionBoundaries;
    const byteToInstr = state.byteToInstrMap;

    if (byteToInstr.length === 0) return;

    const currentInstrIdx = byteToInstr[state.cursor.byteIndex];
    if (currentInstrIdx < boundaries.length - 1) {
        const nextInstr = boundaries[currentInstrIdx + 1];
        disasmEditorSetCursor(nextInstr.byteOffset, 0);
    }
}

/**
 * Move by page (8 instructions)
 * @param {number} delta - Number of instructions to move (+8 or -8)
 * @param {boolean} extend - Extend selection
 */
function disasmEditorMovePage(delta, extend) {
    const state = disasmEditorState;
    const boundaries = state.instructionBoundaries;
    const byteToInstr = state.byteToInstrMap;

    if (byteToInstr.length === 0) return;

    if (extend && !state.selection.active) {
        state.selection.active = true;
        state.selection.anchorNibble = disasmEditorGetCursorNibble();
    }

    const currentInstrIdx = byteToInstr[state.cursor.byteIndex];
    let targetInstrIdx = currentInstrIdx + delta;
    targetInstrIdx = Math.max(0, Math.min(targetInstrIdx, boundaries.length - 1));

    const targetInstr = boundaries[targetInstrIdx];
    disasmEditorSetCursor(targetInstr.byteOffset, 0);

    if (extend) {
        state.selection.endNibble = disasmEditorGetCursorNibble();
        disasmEditorRenderSelection();
    } else {
        disasmEditorClearSelection();
    }
}

// ============================================================================
// INPUT HANDLING
// ============================================================================

/**
 * Handle Escape key (clear selection or exit edit mode)
 */
function disasmEditorHandleEscape() {
    const state = disasmEditorState;
    if (state.selection.active) {
        disasmEditorClearSelection();
    } else {
        if (disasmEditorIsModified()) {
            if (!confirm('Discard all changes?')) {
                return;
            }
        }

        disasmEditorExitEditMode(false, false);
        // UI callback will handle button updates
    }
}

/**
 * Type a hex character
 * @param {string} char - Hex character (0-9, A-F)
 */
function disasmEditorTypeChar(char) {
    const state = disasmEditorState;

    if (state.selection.active) {
        disasmEditorReplaceSelection(char);
        return;
    }

    const byteIndex = state.cursor.byteIndex;
    const nibble = state.cursor.nibble;

    let byte = state.currentData[byteIndex];
    const nibbleValue = parseInt(char, 16);

    if (nibble === 0) {
        byte = (nibbleValue << 4) | (byte & 0x0F);
    } else {
        byte = (byte & 0xF0) | nibbleValue;
    }

    state.currentData[byteIndex] = byte;

    const nibbleIndex = byteIndex * 2 + nibble;
    const maxNibble = state.currentData.length * 2 - 1;

    if (nibbleIndex >= maxNibble) {
        disasmEditorRenderDisassemblyFromData();
        return;
    }

    const nextNibbleIndex = nibbleIndex + 1;
    const targetByte = Math.floor(nextNibbleIndex / 2);
    const targetNibble = nextNibbleIndex % 2;

    disasmEditorReassemble(targetByte, targetNibble);
}

/**
 * Backspace - restore original nibble and move back
 */
function disasmEditorBackspace() {
    const state = disasmEditorState;
    const byteIndex = state.cursor.byteIndex;
    const nibble = state.cursor.nibble;
    const nibbleIndex = byteIndex * 2 + nibble;

    if (nibbleIndex === 0) return;

    const prevNibbleIndex = nibbleIndex - 1;
    const prevByteIndex = Math.floor(prevNibbleIndex / 2);
    const prevNibble = prevNibbleIndex % 2;

    const originalByte = state.originalData[prevByteIndex];
    let currentByte = state.currentData[prevByteIndex];

    if (prevNibble === 0) {
        currentByte = (originalByte & 0xF0) | (currentByte & 0x0F);
    } else {
        currentByte = (currentByte & 0xF0) | (originalByte & 0x0F);
    }

    state.currentData[prevByteIndex] = currentByte;

    disasmEditorReassemble(prevByteIndex, prevNibble);
}

/**
 * Delete - restore original byte under cursor if modified
 */
function disasmEditorDelete() {
    const state = disasmEditorState;
    const byteIndex = state.cursor.byteIndex;

    if (state.currentData[byteIndex] !== state.originalData[byteIndex]) {
        state.currentData[byteIndex] = state.originalData[byteIndex];
        disasmEditorReassemble(state.cursor.byteIndex, state.cursor.nibble);
    }
}

// ============================================================================
// SELECTION
// ============================================================================

/**
 * Clear selection
 */
function disasmEditorClearSelection() {
    disasmEditorState.selection.active = false;
    $('.disasm-nibble').removeClass('disasm-nibble-selected');
}

/**
 * Render selection visual
 */
function disasmEditorRenderSelection() {
    $('.disasm-nibble').removeClass('disasm-nibble-selected');

    const state = disasmEditorState;
    if (!state.selection.active) return;

    const start = Math.min(state.selection.anchorNibble, state.selection.endNibble);
    const end = Math.max(state.selection.anchorNibble, state.selection.endNibble);

    for (let i = start; i <= end; i++) {
        $(`.disasm-nibble[data-nibble="${i}"]`).addClass('disasm-nibble-selected');
    }
}

/**
 * Select all data
 */
function disasmEditorSelectAll() {
    const state = disasmEditorState;
    state.selection.active = true;
    state.selection.anchorNibble = 0;
    state.selection.endNibble = state.currentData.length * 2 - 1;

    disasmEditorRenderSelection();
}

/**
 * Replace all selected nibbles with a character
 * @param {string} char - Hex character
 */
function disasmEditorReplaceSelection(char) {
    const state = disasmEditorState;
    const start = Math.min(state.selection.anchorNibble, state.selection.endNibble);
    const end = Math.max(state.selection.anchorNibble, state.selection.endNibble);

    const nibbleValue = parseInt(char, 16);

    for (let nibbleIndex = start; nibbleIndex <= end; nibbleIndex++) {
        const byteIndex = Math.floor(nibbleIndex / 2);
        const nibble = nibbleIndex % 2;
        let byte = state.currentData[byteIndex];

        if (nibble === 0) {
            byte = (nibbleValue << 4) | (byte & 0x0F);
        } else {
            byte = (byte & 0xF0) | nibbleValue;
        }

        state.currentData[byteIndex] = byte;
    }

    disasmEditorSetCursor(Math.floor(end / 2), end % 2);
    disasmEditorClearSelection();

    disasmEditorReassemble(state.cursor.byteIndex, state.cursor.nibble);
}

// ============================================================================
// CLIPBOARD OPERATIONS
// ============================================================================

/**
 * Copy selected bytes (or current byte) to clipboard
 */
function disasmEditorCopy() {
    const state = disasmEditorState;
    let bytes = [];

    if (state.selection.active) {
        const start = Math.min(state.selection.anchorNibble, state.selection.endNibble);
        const end = Math.max(state.selection.anchorNibble, state.selection.endNibble);

        const startByte = Math.floor(start / 2);
        const endByte = Math.floor(end / 2);

        for (let i = startByte; i <= endByte; i++) {
            bytes.push(state.currentData[i]);
        }
    } else {
        bytes.push(state.currentData[state.cursor.byteIndex]);
    }

    const hexString = bytes.map(b => formatHexByte(b)).join(' ');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(hexString).then(() => {
            console.log('DisasmEditor: Copied to clipboard:', hexString);
        }).catch(err => {
            console.error('DisasmEditor: Failed to copy:', err);
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = hexString;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            console.log('DisasmEditor: Copied to clipboard (fallback):', hexString);
        } catch (err) {
            console.error('DisasmEditor: Failed to copy (fallback):', err);
        }
        document.body.removeChild(textarea);
    }
}

/**
 * Paste hex data from clipboard
 */
function disasmEditorPaste() {
    function processPaste(text) {
        const bytes = disasmEditorParseHexString(text);
        if (bytes.length === 0) {
            console.warn('DisasmEditor: No valid hex data in clipboard');
            return;
        }

        const state = disasmEditorState;
        let byteIndex, maxBytes;
        let keepSelection = false;
        let keepCursor = false;
        let savedCursorByte = state.cursor.byteIndex;
        let savedCursorNibble = state.cursor.nibble;

        if (state.selection.active) {
            const startByteIndex = Math.floor(state.selection.anchorNibble / 2);
            const endByteIndex = Math.floor(state.selection.endNibble / 2);
            const selectionSize = Math.abs(endByteIndex - startByteIndex) + 1;

            byteIndex = Math.min(startByteIndex, endByteIndex);
            maxBytes = Math.min(bytes.length, selectionSize);

            keepSelection = true;
            keepCursor = true;
        } else {
            byteIndex = state.cursor.byteIndex;
            maxBytes = bytes.length;
        }

        for (let i = 0; i < maxBytes && byteIndex < state.currentData.length; i++, byteIndex++) {
            state.currentData[byteIndex] = bytes[i];
        }

        if (keepCursor) {
            disasmEditorSetCursor(savedCursorByte, savedCursorNibble);
        } else {
            disasmEditorSetCursor(Math.min(byteIndex, state.currentData.length - 1), 0);
        }

        if (!keepSelection) {
            disasmEditorClearSelection();
        } else {
            disasmEditorRenderSelection();
        }

        disasmEditorReassemble(state.cursor.byteIndex, state.cursor.nibble);

        console.log('DisasmEditor: Pasted', maxBytes, 'bytes');
    }

    if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
            processPaste(text);
        }).catch(err => {
            console.error('DisasmEditor: Failed to paste:', err);
        });
    } else {
        disasmEditorShowPasteDialog(processPaste);
    }
}

/**
 * Show manual paste dialog (fallback for non-secure contexts)
 * @param {Function} callback - Function to call with pasted text
 */
function disasmEditorShowPasteDialog(callback) {
    disasmEditorState.modalOpen = true;

    showInputDialog({
        title: 'Paste hex data below',
        placeholder: '41 42 43 or 414243',
        submitText: 'Paste',
        onSubmit: (text) => { callback(text); },
        onCancel: () => { disasmEditorState.modalOpen = false; }
    });
}

/**
 * Paste assembly code from clipboard
 */
function disasmEditorPasteAsm() {
    function processAsm(text) {
        try {
            if (typeof window.reasm6502 === 'undefined' || !window.reasm6502.reasm) {
                showError('6502-reasm library not loaded');
                return;
            }

            const bytes = window.reasm6502.reasm(text.toUpperCase());
            if (!bytes || bytes.length === 0) {
                showError('Failed to assemble code');
                return;
            }

            const state = disasmEditorState;
            const startByte = state.cursor.byteIndex;
            const maxBytes = state.currentData.length - startByte;
            const bytesToPaste = bytes.slice(0, maxBytes);

            for (let i = 0; i < bytesToPaste.length; i++) {
                state.currentData[startByte + i] = bytesToPaste[i];
            }

            disasmEditorReassemble(state.cursor.byteIndex, state.cursor.nibble);
            console.log('DisasmEditor: Pasted', bytesToPaste.length, 'bytes from assembly');
        } catch (e) {
            showError('Assembly error: ' + e.message);
        }
    }

    if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(processAsm).catch(() => {
            disasmEditorShowPasteAsmDialog(processAsm);
        });
    } else {
        disasmEditorShowPasteAsmDialog(processAsm);
    }
}

/**
 * Show manual paste assembly dialog
 * @param {Function} callback - Function to call with assembly text
 */
function disasmEditorShowPasteAsmDialog(callback) {
    disasmEditorState.modalOpen = true;

    showInputDialog({
        title: 'Paste assembly code below',
        placeholder: 'LDA #$00\nSTA $0400\nRTS',
        submitText: 'Paste',
        onSubmit: (text) => { callback(text); },
        onCancel: () => { disasmEditorState.modalOpen = false; }
    });
}

/**
 * Parse hex string from clipboard
 * @param {string} text - Text from clipboard
 * @returns {Array<number>} Array of byte values
 */
function disasmEditorParseHexString(text) {
    text = text.replace(/0x/gi, ' ')
               .replace(/\$/g, ' ')
               .replace(/,/g, ' ')
               .replace(/\s+/g, ' ')
               .trim();

    const bytes = [];
    const parts = text.split(' ');

    for (const part of parts) {
        if (part.length === 0) continue;

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
function disasmEditorSetupMouse() {
    const state = disasmEditorState;
    const $container = state.container;

    let isDragging = false;
    let dragStartNibble = null;

    $container.on('mousedown', '.disasm-nibble', function(e) {
        if (!state.editMode) return;
        if (state.modalOpen) return;

        const nibbleIndex = parseInt($(this).data('nibble'));
        const byteIndex = Math.floor(nibbleIndex / 2);
        const nibble = nibbleIndex % 2;

        if (e.shiftKey) {
            if (!state.selection.active) {
                state.selection.active = true;
                state.selection.anchorNibble = disasmEditorGetCursorNibble();
            }
            state.selection.endNibble = nibbleIndex;
            disasmEditorSetCursor(byteIndex, nibble);
            disasmEditorRenderSelection();
        } else {
            isDragging = true;
            dragStartNibble = nibbleIndex;
            disasmEditorClearSelection();
            disasmEditorSetCursor(byteIndex, nibble);
        }

        e.preventDefault();
    });

    $container.on('mousemove', '.disasm-nibble', function(e) {
        if (!state.editMode || !isDragging) return;
        if (state.modalOpen) return;

        const nibbleIndex = parseInt($(this).data('nibble'));
        const byteIndex = Math.floor(nibbleIndex / 2);
        const nibble = nibbleIndex % 2;

        if (!state.selection.active) {
            state.selection.active = true;
            state.selection.anchorNibble = dragStartNibble;
        }

        state.selection.endNibble = nibbleIndex;
        disasmEditorSetCursor(byteIndex, nibble);
        disasmEditorRenderSelection();
    });

    $(document).on('mouseup.disasmeditor', function(e) {
        if (isDragging) {
            isDragging = false;
            dragStartNibble = null;
        }
    });

    function findNibbleToLeft(clickX, $cont) {
        const $nibbles = $cont.find('.disasm-nibble');
        if ($nibbles.length === 0) return null;

        let leftmostNibble = null;
        let maxLeftX = -Infinity;

        $nibbles.each(function() {
            const $nibble = $(this);
            const offset = $nibble.offset();
            const rightX = offset.left + $nibble.outerWidth();

            if (rightX <= clickX && rightX > maxLeftX) {
                maxLeftX = rightX;
                leftmostNibble = $nibble;
            }
        });

        return leftmostNibble;
    }

    $container.on('mousedown', '.disasm-col-bytes', function(e) {
        if (!state.editMode) return;
        if (state.modalOpen) return;
        if (e.target !== this) return;

        const leftNibble = findNibbleToLeft(e.pageX, $(this));
        if (!leftNibble) return;

        const nibbleIndex = parseInt(leftNibble.data('nibble'));
        const nextNibbleIndex = nibbleIndex + 1;
        const maxNibbleIndex = state.currentData.length * 2 - 1;

        if (nextNibbleIndex <= maxNibbleIndex) {
            const byteIndex = Math.floor(nextNibbleIndex / 2);
            const nibble = nextNibbleIndex % 2;

            if (e.shiftKey) {
                if (!state.selection.active) {
                    state.selection.active = true;
                    state.selection.anchorNibble = disasmEditorGetCursorNibble();
                }
                state.selection.endNibble = nextNibbleIndex;
                disasmEditorSetCursor(byteIndex, nibble);
                disasmEditorRenderSelection();
            } else {
                isDragging = true;
                dragStartNibble = nextNibbleIndex;
                disasmEditorClearSelection();
                disasmEditorSetCursor(byteIndex, nibble);
            }

            e.preventDefault();
        }
    });

    $container.on('mousemove', '.disasm-col-bytes', function(e) {
        if (!state.editMode || !isDragging) return;
        if (state.modalOpen) return;
        if (e.target !== this) return;

        const leftNibble = findNibbleToLeft(e.pageX, $(this));
        if (!leftNibble) return;

        const nibbleIndex = parseInt(leftNibble.data('nibble'));
        const nextNibbleIndex = nibbleIndex + 1;
        const maxNibbleIndex = state.currentData.length * 2 - 1;

        if (nextNibbleIndex <= maxNibbleIndex) {
            const byteIndex = Math.floor(nextNibbleIndex / 2);
            const nibble = nextNibbleIndex % 2;

            if (!state.selection.active) {
                state.selection.active = true;
                state.selection.anchorNibble = dragStartNibble;
            }

            state.selection.endNibble = nextNibbleIndex;
            disasmEditorSetCursor(byteIndex, nibble);
            disasmEditorRenderSelection();
        }
    });
}

// ============================================================================
// DATA ACCESS AND SAVE
// ============================================================================

/**
 * Get modified bytes
 * @returns {Array<{address: number, value: number}>} Modified bytes
 */
function disasmEditorGetChanges() {
    const state = disasmEditorState;
    const changes = [];

    for (let i = 0; i < state.currentData.length; i++) {
        if (state.currentData[i] !== state.originalData[i]) {
            changes.push({
                address: state.startAddress + i,
                value: state.currentData[i]
            });
        }
    }
    return changes;
}

/**
 * Save changes to C64 memory
 * @param {function} callback - Success callback
 * @param {function} errorCallback - Error callback
 */
function disasmEditorSaveChanges(callback, errorCallback) {
    const changes = disasmEditorGetChanges();

    if (changes.length === 0) {
        console.log('DisasmEditor: No changes to save');
        if (callback) callback();
        return;
    }

    const firstChange = changes[0];
    const lastChange = changes[changes.length - 1];
    const startAddress = firstChange.address;
    const endAddress = lastChange.address;
    const length = endAddress - startAddress + 1;

    const dataToWrite = [];
    for (let i = 0; i < length; i++) {
        const byteIndex = (startAddress - disasmEditorState.startAddress) + i;
        dataToWrite.push(disasmEditorState.currentData[byteIndex]);
    }

    console.log(`DisasmEditor: Writing ${length} bytes from $${formatHexWord(startAddress)} to $${formatHexWord(endAddress)}`);

    writeMemory(startAddress, dataToWrite,
        function() {
            console.log('DisasmEditor: Save successful');
            if (callback) callback();
        },
        function(errorMsg) {
            console.error('DisasmEditor: Save failed:', errorMsg);
            if (errorCallback) errorCallback(errorMsg);
        }
    );
}

// ============================================================================
// KEYBOARD HANDLING
// ============================================================================

let disasmEditorEnterEditModeCallback = null;
let disasmEditorSaveCallback = null;

let disasmEditorNavigationCallback = null;

function disasmEditorSetNavigationCallback(callback) {
    disasmEditorNavigationCallback = callback;
}

function disasmEditorSetEnterEditModeCallback(callback) {
    disasmEditorEnterEditModeCallback = callback;
}

function disasmEditorSetSaveCallback(callback) {
    disasmEditorSaveCallback = callback;
}

let disasmEditorExitEditModeCallback = null;

function disasmEditorSetExitEditModeCallback(callback) {
    disasmEditorExitEditModeCallback = callback;
}

/**
 * Main keyboard event handler
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} True if handled
 */
function disasmEditorHandleKey(e) {
    const state = disasmEditorState;

    if (e.key === 's' && e.ctrlKey) {
        if (state.editMode && !state.modalOpen && disasmEditorSaveCallback) {
            disasmEditorSaveCallback();
        }
        return true;
    }

    if (state.modalOpen) {
        return false;
    }

    if (state.editMode) {
        return disasmEditorHandleEditModeKey(e);
    } else {
        return disasmEditorHandleBrowseModeKey(e);
    }
}

/**
 * Handle keyboard events in edit mode
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} True if handled
 */
function disasmEditorHandleEditModeKey(e) {
    const key = e.key;
    const shift = e.shiftKey;
    const ctrl = e.ctrlKey;

    if (ctrl && key === 'c') {
        disasmEditorCopy();
        return true;
    }
    if (ctrl && key === 'v') {
        disasmEditorPaste();
        return true;
    }
    if (shift && ctrl && key.toLowerCase() === 'v') {
        disasmEditorPasteAsm();
        return true;
    }
    if (ctrl && key === 'a') {
        disasmEditorSelectAll();
        return true;
    }

    if (e.ctrlKey || e.altKey) {
        return false;
    }

    if (key === 'Escape') {
        disasmEditorHandleEscape();
        return true;
    } else if (key === 'ArrowLeft') {
        disasmEditorMoveCursor(-1, 0, shift);
        return true;
    } else if (key === 'ArrowRight') {
        disasmEditorMoveCursor(1, 0, shift);
        return true;
    } else if (key === 'ArrowUp') {
        disasmEditorMoveCursor(0, -1, shift);
        return true;
    } else if (key === 'ArrowDown') {
        disasmEditorMoveCursor(0, 1, shift);
        return true;
    } else if (key === 'Home') {
        disasmEditorMoveHome(shift);
        return true;
    } else if (key === 'End') {
        disasmEditorMoveEnd(shift);
        return true;
    } else if (key === 'PageUp') {
        disasmEditorMovePage(-8, shift);
        return true;
    } else if (key === 'PageDown') {
        disasmEditorMovePage(8, shift);
        return true;
    } else if (key === 'Tab') {
        disasmEditorMoveTab(shift);
        return true;
    } else if (key === 'Enter') {
        disasmEditorMoveEnter();
        return true;
    } else if (key === 'Backspace') {
        disasmEditorBackspace();
        return true;
    } else if (key === 'Delete') {
        disasmEditorDelete();
        return true;
    } else if (/^[0-9A-Fa-f]$/.test(key)) {
        disasmEditorTypeChar(key.toUpperCase());
        return true;
    }

    return false;
}

/**
 * Handle browse mode keyboard navigation
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} True if handled
 */
function disasmEditorHandleBrowseModeKey(e) {
    const inInputField = $(e.target).is('input, textarea, select');
    if (inInputField) {
        return false;
    }

    if (isApiBusy()) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'r', 'R'].includes(e.key)) {
            return true;
        }
        return false;
    }

    if (e.ctrlKey || e.shiftKey || e.altKey) {
        return false;
    }

    if (e.key === 'e' || e.key === 'E') {
        if (disasmEditorEnterEditModeCallback) {
            disasmEditorEnterEditModeCallback();
        }
        return true;
    }

    if (e.key === 'a' || e.key === 'A') {
        const addressInput = $('#disasm-address')[0];
        if (addressInput) {
            addressInput.focus();
            addressInput.select();
        }
        return true;
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
    }

    return false;
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
    if (disasmEditorState.editMode) {
        console.warn('DisasmEditor: Cannot navigate while in edit mode');
        return;
    }

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
