/**
 * screen-editor.js
 * Screen Viewer Component
 *
 * Displays C64 screen memory (40x25 characters) with color support.
 *
 * Pattern: Function-based with global state (matches codebase standard)
 *
 * Version: 1.0
 * Date: February 18, 2026
 */

// ============================================================================
// GLOBAL STATE
// ============================================================================

const SCREEN_WIDTH = 40;
const SCREEN_HEIGHT = 25;
const SCREEN_SIZE = SCREEN_WIDTH * SCREEN_HEIGHT; // 1000

let screenViewerState = {
    container: null,
    address: 0x0400,
    charsetPuaBase: 0xEE00,
    startColorAddress: 0xD800,
    backgroundColorAddress: 0xD021,
    borderColorAddress: 0xD020,
    screenData: null,
    colorData: null,
    backgroundColor: C64_COLOR_PALETTE[14],
    borderColor: C64_COLOR_PALETTE[14]
};

// ============================================================================
// CALLBACKS
// ============================================================================

let screenViewerNavigationCallback = null;

function screenViewerSetNavigationCallback(callback) {
    screenViewerNavigationCallback = callback;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the screen viewer with an empty grid
 * @param {jQuery} container - Container element
 */
function screenViewerInit(container) {
    screenViewerState.container = container;
    screenViewerState.address = 0x0400;
    screenViewerState.charsetPuaBase = 0xEE00;
    screenViewerState.startColorAddress = 0xD800;
    screenViewerState.backgroundColorAddress = 0xD021;
    screenViewerState.borderColorAddress = 0xD020;
    screenViewerState.screenData = null;
    screenViewerState.colorData = null;

    // Initialize with color 14 (light blue) - C64 boot color
    const defaultColor = getC64Color(14);
    screenViewerState.backgroundColor = defaultColor;
    screenViewerState.borderColor = defaultColor;

    screenViewerRender();

    console.log('ScreenViewer: Initialized at address', screenViewerState.address.toString(16).toUpperCase());
}

// ============================================================================
// RENDERING
// ============================================================================

/**
 * Render the entire screen display
 */
function screenViewerRender() {
    const container = screenViewerState.container;
    const borderColor = screenViewerState.borderColor;
    const backgroundColor = screenViewerState.backgroundColor;

    let html = `<div class="screen-border" style="background-color: ${backgroundColor}; border-color: ${borderColor};">`;
    html += '<div class="screen-grid">';

    // Render 25 rows of 40 characters
    for (let row = 0; row < SCREEN_HEIGHT; row++) {
        html += '<div class="screen-row">';

        for (let col = 0; col < SCREEN_WIDTH; col++) {
            const index = row * SCREEN_WIDTH + col;
            const char = screenViewerGetCharAt(index);
            const color = screenViewerState.colorData 
                ? getC64Color(screenViewerState.colorData[index])
                : C64_COLOR_PALETTE[14]; // Default light blue

            html += `<span class="screen-char" style="color: ${color};">${char}</span>`;
        }

        html += '</div>';
    }

    html += '</div></div>';

    container.html(html);
}

/**
 * Get character at screen index
 * @param {number} index - Screen position (0-999)
 * @returns {string} Character to display
 */
function screenViewerGetCharAt(index) {
    if (!screenViewerState.screenData || index >= screenViewerState.screenData.length) {
        return translateByteToChar(0x20, screenViewerState.charsetPuaBase); // Space
    }

    const byte = screenViewerState.screenData[index];
    return translateByteToChar(byte, screenViewerState.charsetPuaBase);
}

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Navigate to a specific address
 * @param {number} address - Target address
 * @param {Function} callback - Callback function
 */
function screenViewerNavigateToAddress(address, callback) {
    address = screenViewerValidateAddress(address);

    // Read screen memory (1000 bytes)
    readMemory(address, SCREEN_SIZE,
        function(screenArrayBuffer) {
            screenViewerState.screenData = new Uint8Array(screenArrayBuffer);
            screenViewerState.address = address;

            // Read color memory (1000 bytes)
            readMemory(screenViewerState.startColorAddress, SCREEN_SIZE,
                function(colorArrayBuffer) {
                    screenViewerState.colorData = new Uint8Array(colorArrayBuffer);

                    // Read background color
                    readMemory(screenViewerState.backgroundColorAddress, 1,
                        function(bgArrayBuffer) {
                            const bgData = new Uint8Array(bgArrayBuffer);
                            screenViewerState.backgroundColor = getC64Color(bgData[0]);

                            // Read border color
                            readMemory(screenViewerState.borderColorAddress, 1,
                                function(borderArrayBuffer) {
                                    const borderData = new Uint8Array(borderArrayBuffer);
                                    screenViewerState.borderColor = getC64Color(borderData[0]);

                                    // Render everything
                                    screenViewerRender();

                                    if (callback) {
                                        callback();
                                    }
                                },
                                function(err) {
                                    console.error('ScreenViewer: Failed to read border color:', err);
                                    screenViewerState.borderColor = C64_COLOR_PALETTE[14];
                                    screenViewerRender();
                                    if (callback) callback();
                                }
                            );
                        },
                        function(err) {
                            console.error('ScreenViewer: Failed to read background color:', err);
                            screenViewerState.backgroundColor = C64_COLOR_PALETTE[14];
                            screenViewerRender();
                            if (callback) callback();
                        }
                    );
                },
                function(err) {
                    console.error('ScreenViewer: Failed to read color memory:', err);
                    screenViewerState.colorData = new Uint8Array(SCREEN_SIZE);
                    screenViewerRender();
                    if (callback) callback();
                }
            );
        },
        function(err) {
            console.error('ScreenViewer: Failed to read screen memory:', err);
            if (callback) callback();
        }
    );
}

/**
 * Validate and fix address to be within memory boundaries
 * @param {number} address - Address to validate
 * @returns {number} Valid address within boundaries
 */
function screenViewerValidateAddress(address) {
    return validateMemoryAddress(address, SCREEN_SIZE);
}

/**
 * Navigate up (previous row, -40 bytes)
 * @param {Function} callback - Callback function
 */
function screenViewerNavigateUp(callback) {
    const newAddress = screenViewerState.address - SCREEN_WIDTH;
    screenViewerNavigateToAddress(newAddress, callback);
}

/**
 * Navigate down (next row, +40 bytes)
 * @param {Function} callback - Callback function
 */
function screenViewerNavigateDown(callback) {
    const newAddress = screenViewerState.address + SCREEN_WIDTH;
    screenViewerNavigateToAddress(newAddress, callback);
}

/**
 * Navigate left (previous byte, -1)
 * @param {Function} callback - Callback function
 */
function screenViewerNavigateLeft(callback) {
    const newAddress = screenViewerState.address - 1;
    screenViewerNavigateToAddress(newAddress, callback);
}

/**
 * NavigateAddress, callback);
 right (next byte, +1)
 * @param {Function} callback - Callback function
 */
function screenViewerNavigateRight(callback) {
    const newAddress = screenViewerState.address + 1;
    screenViewerNavigateToAddress(newAddress, callback);
}

/**
 * Navigate to previous page (-1024 bytes)
 * @param {Function} callback - Callback function
 */
function screenViewerNavigatePrevPage(callback) {
    const newAddress = screenViewerState.address - 1024;
    screenViewerNavigateToAddress(newAddress, callback);
}

/**
 * Navigate to next page (+1024 bytes)
 * @param {Function} callback - Callback function
 */
function screenViewerNavigateNextPage(callback) {
    const newAddress = screenViewerState.address + 1024;
    screenViewerNavigateToAddress(newAddress, callback);
}

// ============================================================================
// KEYBOARD HANDLING
// ============================================================================

/**
 * Handle keyboard events
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {boolean} True if handled
 */
function screenViewerHandleKey(e) {
    // Don't handle if focus is in an input field
    const inInputField = $(e.target).is('input, textarea, select');
    if (inInputField) {
        return false;
    }

    // Don't navigate if API is busy
    if (isApiBusy()) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'r', 'R'].includes(e.key)) {
            return true;
        }
        return false;
    }

    // Allow browser defaults for modifier keys
    if (e.ctrlKey || e.shiftKey || e.altKey) {
        return false;
    }

    // A key to focus address input
    if (e.key === 'a' || e.key === 'A') {
        const addressInput = $('#screen-address')[0];
        if (addressInput) {
            addressInput.focus();
            addressInput.select();
        }
        return true;
    }

    // R key to refresh
    if (e.key === 'r' || e.key === 'R') {
        const currentAddress = screenViewerState.address;
        screenViewerNavigateToAddress(currentAddress, screenViewerNavigationCallback);
        return true;
    }

    switch(e.key) {
        case 'ArrowUp':
            screenViewerNavigateUp(screenViewerNavigationCallback);
            return true;
        case 'ArrowDown':
            screenViewerNavigateDown(screenViewerNavigationCallback);
            return true;
        case 'ArrowLeft':
            screenViewerNavigateLeft(screenViewerNavigationCallback);
            return true;
        case 'ArrowRight':
            screenViewerNavigateRight(screenViewerNavigationCallback);
            return true;
        case 'PageUp':
            screenViewerNavigatePrevPage(screenViewerNavigationCallback);
            return true;
        case 'PageDown':
            screenViewerNavigateNextPage(screenViewerNavigationCallback);
            return true;
    }

    return false;
}

// ============================================================================
// DATA ACCESS
// ============================================================================

/**
 * Get address range information
 * @returns {object} {startAddress, endAddress, length}
 */
function screenViewerGetAddressRange() {
    return {
        startAddress: screenViewerState.address,
        endAddress: screenViewerState.address + SCREEN_SIZE - 1,
        length: SCREEN_SIZE
    };
}

/**
 * Set charset PUA base for character display
 * @param {number} puaBase - PUA base value (e.g., 0xEF00)
 */
function screenViewerSetCharsetPuaBase(puaBase) {
    screenViewerState.charsetPuaBase = puaBase;
    screenViewerRender();
}
