# C64U Memory REST API Reference

**Purpose:** This document serves as the definitive reference for reading and writing C64 memory via the C64U REST API. Use this whenever developing tools that need to access C64 memory.
**Last Updated:** February 6, 2026
**REST API Reference:** `C64U REST API.md`

---

## Critical Rules

1.  **Address Format:** MUST be 4-digit uppercase hexadecimal WITHOUT prefix
    - ✅ Correct: `0400`, `C000`, `D020`
    - ❌ Wrong: `400`, `$0400`, `0x0400`, `c000`
2.  **Parameter Names:** Use `address` and `length` (NOT `addr` or `count`)
3.  **Data Format:** Uppercase hexadecimal string for PUT method
4.  **Authentication:** Use `X-Password` header

---

## Reusable API Error Handler

To avoid code repetition and ensure consistent error handling, the following reusable function should be included in your `api_client.js` file. It correctly handles all error scenarios, including HTTP 4xx/5xx responses that may contain a JSON body with a specific `errors` array. The function's logic is to always try parsing a JSON error message first, and only fall back to the generic HTTP status if that fails.

```javascript
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
```

---

## Read Memory

### Endpoint

`GET /v1/machine:readmem`

### Parameters

-   `address` (required): 4-digit hex address (e.g., `0400`)
-   `length` (required): Decimal number of bytes to read (e.g., `256`)

### Headers

`X-Password: <your-password>`

### Response

-   **Success (200):** Binary data (`ArrayBuffer`)
-   **Error (4xx/5xx):** JSON object with a non-empty `errors` array, or an HTTP error without a JSON body.

### JavaScript Implementation

```javascript
function readMemory(address, length, callback, errorCallback) {
    const password = $('#apiPassword').val();
    const hexAddr = address.toString(16).padStart(4, '0').toUpperCase();

    $.ajax({
        url: `/v1/machine:readmem?address=${hexAddr}&length=${length}`,
        method: 'GET',
        headers: { "X-Password": password },
        xhrFields: { responseType: 'arraybuffer' },
        success: function(data) {
            // On success, the raw ArrayBuffer is passed to the callback.
            if (callback) callback(data);
        },
        error: function(jqXHR) {
            // Use the reusable parser for all errors.
            if (errorCallback) errorCallback(parseApiError(jqXHR));
        }
    });
}
```

---

## Write Memory

### Endpoint

-   `PUT /v1/machine:writemem` (for up to 128 bytes)
-   `POST /v1/machine:writemem` (for over 128 bytes)

### Parameters

-   `address` (required): 4-digit hex address
-   `data` (required for PUT): Hex string of bytes

### Headers

-   `X-Password: <your-password>`
-   `Content-Type: application/octet-stream` (for POST)

### Response

-   **Success (200):** JSON object with an empty `errors` array (e.g., `{"errors": []}`)
-   **Error (200 with content or 4xx/5xx):** JSON object with a non-empty `errors` array, or an HTTP error without a JSON body.

### JavaScript Implementation

This single function handles both small (PUT) and large (POST) writes.

```javascript
function writeMemory(address, dataArray, callback, errorCallback) {
    const password = $('#apiPassword').val();
    const hexAddr = address.toString(16).padStart(4, '0').toUpperCase();

    const handleSuccess = (response) => {
        // A successful write can return an empty body or a JSON object.
        // If it's JSON, we must check the 'errors' array.
        if (response && response.errors && response.errors.length > 0) {
            if (errorCallback) errorCallback(response.errors.join('; '));
        } else {
            if (callback) callback();
        }
    };

    const handleError = (jqXHR) => {
        if (errorCallback) errorCallback(parseApiError(jqXHR));
    };

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
```

---

## Complete Working Example

This example demonstrates how the functions work together with the reusable error handler.

```javascript
/**
 * Parses any error response from the C64U REST API, regardless of HTTP status.
 * It prioritizes a JSON `errors` array over the HTTP status text.
 * @param {jqXHR} jqXHR - The jQuery XHR object from an error callback.
 * @returns {string} A semicolon-separated string of error messages.
 */
function parseApiError(jqXHR) {
    let errorMessages = [];
    let responseText = jqXHR.responseText;
    if (!responseText && jqXHR.response instanceof ArrayBuffer) {
        try { responseText = new TextDecoder().decode(jqXHR.response); } catch (e) {}
    }
    if (responseText) {
        try {
            const response = JSON.parse(responseText);
            if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
                errorMessages = response.errors;
            }
        } catch (e) {}
    }
    if (errorMessages.length === 0) {
        const statusText = jqXHR.statusText || 'Unknown error';
        errorMessages.push(`HTTP ${jqXHR.status}: ${statusText}`);
    }
    return errorMessages.join('; ');
}

// API client that encapsulates memory operations
function c64MemoryAPI() {
    const password = $('#apiPassword').val();

    function readMemory(address, length, callback, errorCallback) {
        const hexAddr = address.toString(16).padStart(4, '0').toUpperCase();
        $.ajax({
            url: `/v1/machine:readmem?address=${hexAddr}&length=${length}`,
            method: 'GET',
            headers: { "X-Password": password },
            xhrFields: { responseType: 'arraybuffer' },
            success: callback,
            error: (jqXHR) => errorCallback(parseApiError(jqXHR))
        });
    }

    function writeMemory(address, dataArray, callback, errorCallback) {
        const hexAddr = address.toString(16).padStart(4, '0').toUpperCase();
        const handleSuccess = (response) => {
            if (response && response.errors && response.errors.length > 0) {
                if (errorCallback) errorCallback(response.errors.join('; '));
            } else {
                if (callback) callback();
            }
        };
        const handleError = (jqXHR) => errorCallback(parseApiError(jqXHR));

        if (dataArray.length <= 128) {
            const hexString = dataArray.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
            $.ajax({
                url: `/v1/machine:writemem?address=${hexAddr}&data=${hexString}`,
                method: 'PUT',
                headers: { "X-Password": password },
                success: handleSuccess,
                error: handleError
            });
        } else {
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

    return { readMemory, writeMemory };
}

// --- Usage Example ---
const api = c64MemoryAPI();

// Read border color
api.readMemory(0xD020, 1, (data) => {
    const color = new Uint8Array(data)[0];
    console.log('Border color:', color);
}, (error) => {
    console.error('Read failed:', error);
});

// Change border color to red
api.writeMemory(0xD020, [0x02], () => {
    console.log('Border color changed');
}, (error) => {
    console.error('Write failed:', error);
});
```

---

## Quick Checklist

- [ ] Address converted to 4-digit hex with `padStart(4, '0')`
- [ ] Address is uppercase with `.toUpperCase()`
- [ ] Using `address` and `length` parameters
- [ ] Using `data` query parameter for PUT writes
- [ ] Using POST for writes >128 bytes
- [ ] Using the reusable `parseApiError` function for all error handling
- [ ] Checking `errors` array even in success callbacks for write operations
- [ ] Using `X-Password` header
- [ ] Using relative URLs (no hostname)

---

## Notes

-   The API is hosted on the C64U device itself.
-   Always use relative URLs (e.g., `/v1/machine:readmem`).
-   The HTML file using this code should be deployed on the C64U device to avoid CORS issues.
-   Memory addresses are 16-bit (0000-FFFF).
-   Write operations are immediate and affect the running C64.
