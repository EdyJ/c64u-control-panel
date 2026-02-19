/**
 * api-client.js
 * C64U REST API Interface Layer
 *
 * Provides all methods for interfacing with the C64U REST API.
 * This is the only file that should make direct REST API calls.
 *
 * Version: 1.0
 * Date: February 6, 2026
 */

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Parses any error response from the C64U REST API, regardless of HTTP status.
 * It prioritizes a JSON `errors` array over the HTTP status text.
 * @param {jqXHR} jqXHR - The jQuery XHR object from an error callback.
 * @returns {string} A semicolon-separated string of error messages.
 */
function parseApiError(jqXHR) {
    let errorMessages = [];
    let responseText = jqXHR.responseText;

    // For binary responses (like readmem), the error might be an ArrayBuffer
    // that needs to be decoded to text before parsing as JSON.
    if (!responseText && jqXHR.response instanceof ArrayBuffer) {
        try {
            responseText = new TextDecoder().decode(jqXHR.response);
        } catch (e) {
            // Ignore decoding errors, proceed to fallback.
        }
    }

    // Try to parse the response text as JSON and extract the 'errors' array.
    if (responseText) {
        try {
            const response = JSON.parse(responseText);
            if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
                errorMessages = response.errors;
            }
        } catch (e) {
            // Not a JSON response, proceed to fallback.
        }
    }

    // If no specific errors were found, fall back to the HTTP status.
    if (errorMessages.length === 0) {
        const statusText = jqXHR.statusText || 'Unknown error';
        errorMessages.push(`HTTP ${jqXHR.status}: ${statusText}`);
    }

    return errorMessages.join('; ');
}

// ============================================================================
// BUSY STATE MANAGEMENT
// ============================================================================

let apiClientBusy = false;

/**
 * Check if an API operation is currently in progress
 * @returns {boolean} True if busy, false otherwise
 */
function isApiBusy() {
    return apiClientBusy;
}

/**
 * Set the busy state (internal use only)
 * @param {boolean} busy - True to set busy, false to clear
 */
function setApiBusy(busy) {
    apiClientBusy = busy;
}

// ============================================================================
// MEMORY OPERATIONS
// ============================================================================

/**
 * Read memory from the C64.
 * @param {number} address - Memory address (0x0000-0xFFFF)
 * @param {number} length - Number of bytes to read
 * @param {function} callback - Success callback, receives ArrayBuffer
 * @param {function} errorCallback - Error callback, receives error message string
 */
function readMemory(address, length, callback, errorCallback) {
    const password = $('#apiPassword').val();
    const hexAddr = address.toString(16).padStart(4, '0').toUpperCase();

    if (isApiBusy()) {
        console.warn('readMemory: REST API is already busy!');
    }

    setApiBusy(true);
    showSpinner(true);

    $.ajax({
        url: `/v1/machine:readmem?address=${hexAddr}&length=${length}`,
        method: 'GET',
        headers: { "X-Password": password },
        xhrFields: { responseType: 'arraybuffer' },
        success: function(data) {
            setApiBusy(false);
            showSpinner(false);
            hideError();
            // On success, the raw ArrayBuffer is passed to the callback.
            if (callback) callback(data);
        },
        error: function(jqXHR) {
            setApiBusy(false);
            showSpinner(false);
            // Use the reusable parser for all errors.
            const errorMsg = parseApiError(jqXHR);
            showError(`Read error: ${errorMsg}`);
            if (errorCallback) errorCallback(errorMsg);
        }
    });
}

/**
 * Write memory to the C64.
 * Uses PUT method for ≤128 bytes, POST method for >128 bytes.
 * @param {number} address - Memory address (0x0000-0xFFFF)
 * @param {Array<number>} dataArray - Array of byte values to write
 * @param {function} callback - Success callback
 * @param {function} errorCallback - Error callback, receives error message string
 */
function writeMemory(address, dataArray, callback, errorCallback) {
    const password = $('#apiPassword').val();
    const hexAddr = address.toString(16).padStart(4, '0').toUpperCase();

    const handleSuccess = (response) => {
        setApiBusy(false);
        showSpinner(false);
        hideError();
        // A successful write can return an empty body or a JSON object.
        // If it's JSON, we must check the 'errors' array.
        if (response && response.errors && response.errors.length > 0) {
            const errorMsg = response.errors.join('; ');
            showError(`Write error: ${errorMsg}`);
            if (errorCallback) errorCallback(errorMsg);
        } else {
            if (callback) callback();
        }
    };

    const handleError = (jqXHR) => {
        setApiBusy(false);
        showSpinner(false);
        const errorMsg = parseApiError(jqXHR);
        showError(`Write error: ${errorMsg}`);
        if (errorCallback) errorCallback(errorMsg);
    };

    if (isApiBusy()) {
        console.warn('readMemory: REST API is already busy!');
    }

    setApiBusy(true);
    showSpinner(true);

    if (dataArray.length <= 128) {
        // Use PUT for small writes
        const hexString = dataArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
        $.ajax({
            url: `/v1/machine:writemem?address=${hexAddr}&data=${hexString}`,
            method: 'PUT',
            headers: { "X-Password": password },
            success: handleSuccess,
            error: handleError
        });
    } else {
        // Use POST for large writes
        const blob = new Blob([new Uint8Array(dataArray)]);
        $.ajax({
            url: `/v1/machine:writemem?address=${hexAddr}`,
            method: 'POST',
            headers: { "X-Password": password },
            data: blob,
            processData: false,
            contentType: 'application/octet-stream',
            success: handleSuccess,
            error: handleError
        });
    }
}

// ============================================================================
// ADDRESS VALIDATION
// ============================================================================

/**
 * Validate and fix address to be within memory boundaries (0x0000-0xFFFF).
 * @param {number} address - Address to validate
 * @param {number} pageSize - Optional page size for boundary checking
 * @returns {number} Valid address within boundaries
 */
function validateMemoryAddress(address, pageSize) {
    if (address < 0) {
        address = 0;
    }

    if (pageSize !== undefined && address + pageSize > 0x10000) {
        address = 0x10000 - pageSize;
    }

    if (address > 0xFFFF) {
        address = 0xFFFF;
    }

    return address;
}

// ============================================================================
// C64 CHARACTER AND COLOR UTILITIES
// ============================================================================

/**
 * C64 Color Palette - 16 colors indexed by C64 color code (0-15)
 */
const C64_COLOR_PALETTE = [
    '#000000', // 0: black
    '#FFFFFF', // 1: white
    '#68372B', // 2: red
    '#70A4B2', // 3: cyan
    '#6F3D86', // 4: purple
    '#588D43', // 5: green
    '#352879', // 6: blue
    '#B8C76F', // 7: yellow
    '#6F4F25', // 8: orange
    '#433900', // 9: brown
    '#9A6759', // 10: light red
    '#444444', // 11: dark grey
    '#6C6C6C', // 12: grey
    '#9AD284', // 13: light green
    '#6C5EB5', // 14: light blue
    '#959595'  // 15: light grey
];

/**
 * Get the hex color string for a C64 color index (0-15)
 * @param {number} colorIndex - C64 color code (0-15), uses lower 4 bits
 * @returns {string} Hex color string (e.g., '#FFFFFF')
 */
function getC64Color(colorIndex) {
    const index = colorIndex & 0x0F; // Lower 4 bits
    return C64_COLOR_PALETTE[index] || C64_COLOR_PALETTE[0];
}

/**
 * Translate a memory byte to a C64 character using the specified charset PUA base.
 * @param {number} byte - Memory byte value (0-255)
 * @param {number} charsetPuaBase - PUA base address for the charset (e.g., 0xEE00)
 * @returns {string} Character string rendered using the C64 font
 */
function translateByteToChar(byte, charsetPuaBase) {
    const codepoint = charsetPuaBase + byte;
    return String.fromCodePoint(codepoint);
}
