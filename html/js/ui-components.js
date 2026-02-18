/**
 * ui-components.js
 * UI Utility Functions
 *
 * Provides reusable UI utility functions for common operations.
 * These functions manipulate existing HTML elements and provide
 * formatting/validation helpers.
 *
 * Version: 1.0
 * Date: February 6, 2026
 */

// ============================================================================
// SPINNER CONTROL
// ============================================================================

/**
 * Show or hide the global spinner.
 * @param {boolean} show - True to show spinner, false to hide
 */
function showSpinner(show) {
    if (show) {
        $('#spinner').show();
    } else {
        $('#spinner').hide();
    }
}

// ============================================================================
// ERROR DISPLAY
// ============================================================================

/**
 * Display an error message in the global error box.
 * @param {string} message - The error message to display
 */
function showError(message) {
    const $errorBox = $('#errorBox');

    $errorBox.text(message);

    // Add click handler to hide on click (one-time)
    $errorBox.one('click', hideError);

    if ($errorBox.is(':visible')) {
        return;
    }

    $errorBox.fadeIn();
}

/**
 * Hide the global error box.
 */
function hideError() {
    $('#errorBox').fadeOut();
}

// ============================================================================
// SUCCESS/ERROR STATUS
// ============================================================================

/**
 * Display a success message with checkmark in a specific container.
 * @param {string} containerId - The ID of the container element
 * @param {string} message - The success message to display
 */
function showSuccess(containerId, message) {
    $(`#${containerId}`).html(`<span class="success-message">✓ ${message}</span>`);
}

/**
 * Display an error message with cross in a specific container.
 * @param {string} containerId - The ID of the container element
 * @param {string} message - The error message to display
 */
function showErrorStatus(containerId, message) {
    $(`#${containerId}`).html(`<span class="error-message">✗ ${message}</span>`);
}

// ============================================================================
// ADDRESS FORMATTING
// ============================================================================

/**
 * Format and validate a hex address string.
 * @param {string} addressStr - The address string to format (e.g., "400", "C000", "$D020")
 * @returns {string|null} 4-digit uppercase hex string, or null if invalid
 */
function formatAddress(addressStr) {
    const cleaned = addressStr.replace(/[^0-9A-Fa-f]/g, '');
    const address = parseInt(cleaned, 16);
    if (isNaN(address) || address < 0 || address > 0xFFFF) {
        return null;
    }
    return address.toString(16).padStart(4, '0').toUpperCase();
}

/**
 * Parse and validate address from an input field.
 * Updates input with normalized 4-digit hex value, blurs input, returns address.
 * @param {string} inputId - Input ID (with or without # prefix)
 * @param {number} pageSize - Optional page size for boundary validation
 * @returns {number|null} Validated address, or null if invalid
 */
function parseAddressInput(inputId, pageSize) {
    if (inputId.charAt(0) !== '#') {
        inputId = '#' + inputId;
    }

    const $input = $(inputId);
    let addressStr = $input.val().trim();

    addressStr = addressStr.replace(/[^0-9A-Fa-f]/g, '');

    let address = parseInt(addressStr, 16);

    if (isNaN(address) || address < 0 || address > 0xFFFF) {
        return null;
    }

    if (pageSize !== undefined) {
        address = validateMemoryAddress(address, pageSize);
    }

    const normalizedStr = formatHexWord(address);
    $input.val(normalizedStr);
    $input.blur();

    return address;
}

// ============================================================================
// HEX FORMATTING
// ============================================================================

/**
 * Format a byte value as 2-digit uppercase hex string.
 * @param {number} value - Byte value (0-255)
 * @returns {string} 2-digit uppercase hex string (e.g., "0F")
 */
function formatHexByte(value) {
    return (value & 0xFF).toString(16).padStart(2, '0').toUpperCase();
}

/**
 * Format a word value as 4-digit uppercase hex string.
 * @param {number} value - Word value (0-65535)
 * @returns {string} 4-digit uppercase hex string (e.g., "C000")
 */
function formatHexWord(value) {
    return (value & 0xFFFF).toString(16).padStart(4, '0').toUpperCase();
}

// ============================================================================
// INPUT HANDLING
// ============================================================================

/**
 * Handle input/select/checkbox change with automatic blur.
 * @param {string} inputId - Input ID (with or without #)
 * @param {function} callback - Function to call on change, receives value
 * @returns {jQuery} jQuery object for chaining
 */
function handleInputChange(inputId, callback) {
    if (inputId.charAt(0) !== '#') {
        inputId = '#' + inputId;
    }

    $(inputId).on('change', function() {
        const value = this.type === 'checkbox' ? this.checked : this.value;
        callback(value);
        $(this).blur();
    });

    return $(inputId);
}

/**
 * Handle button click with automatic blur.
 * @param {string} buttonId - Button ID (with or without #)
 * @param {function} callback - Function to call on click
 * @returns {jQuery} jQuery object for chaining
 */
function handleButtonClick(buttonId, callback) {
    if (buttonId.charAt(0) !== '#') {
        buttonId = '#' + buttonId;
    }

    $(buttonId).on('click', function() {
        callback();
        $(this).blur();
    });

    return $(buttonId);
}

// ============================================================================
// MODAL DIALOGS
// ============================================================================

/**
 * Show a modal dialog for text input.
 * @param {Object} options - Dialog options
 * @param {string} options.title - Dialog title/instructions
 * @param {string} options.placeholder - Textarea placeholder text
 * @param {string} options.submitText - Submit button text
 * @param {function} options.onSubmit - Called when user submits (receives text)
 * @param {function} options.onCancel - Called when user cancels
 * @returns {Object} { close: function } - Can be used to close dialog programmatically
 */
function showInputDialog(options) {
    const { title, placeholder, submitText, onSubmit, onCancel } = options;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog';

    const instructions = document.createElement('div');
    instructions.className = 'modal-instructions';
    instructions.textContent = title;

    const textarea = document.createElement('textarea');
    textarea.className = 'modal-textarea';
    textarea.placeholder = placeholder;

    const buttons = document.createElement('div');
    buttons.className = 'modal-buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';

    const submitBtn = document.createElement('button');
    submitBtn.textContent = submitText;

    buttons.appendChild(cancelBtn);
    buttons.appendChild(submitBtn);
    dialog.appendChild(instructions);
    dialog.appendChild(textarea);
    dialog.appendChild(buttons);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    setTimeout(() => textarea.focus(), 100);

    function closeDialog() {
        document.body.removeChild(overlay);
        if (onCancel) onCancel();
    }

    submitBtn.onclick = function() {
        const text = textarea.value.trim();
        if (text && onSubmit) {
            onSubmit(text);
        }
        closeDialog();
    };

    cancelBtn.onclick = closeDialog;

    overlay.onkeydown = function(e) {
        if (e.key === 'Escape') {
            closeDialog();
            e.preventDefault();
            e.stopPropagation();
        }
    };

    textarea.onkeydown = function(e) {
        if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
            submitBtn.click();
            e.preventDefault();
            e.stopPropagation();
        }
    };

    return { close: closeDialog };
}
