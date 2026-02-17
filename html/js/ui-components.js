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
    $('#errorBox').text(message).fadeIn();
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
    // Remove non-hex characters
    const cleaned = addressStr.replace(/[^0-9A-Fa-f]/g, '');
    // Parse and validate
    const address = parseInt(cleaned, 16);
    if (isNaN(address) || address < 0 || address > 0xFFFF) {
        return null;
    }
    // Return 4-digit hex string
    return address.toString(16).padStart(4, '0').toUpperCase();
}
