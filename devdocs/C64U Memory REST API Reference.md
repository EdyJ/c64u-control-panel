# C64U Memory REST API Reference

**Purpose:** This document serves as the definitive reference for reading and writing C64 memory via the C64U REST API. Use this whenever developing tools that need to access C64 memory.
**Last Updated:** February 4, 2026
**REST API Calls Guide:** `C64U REST API Guide.md`
**Full REST API Reference:** `C64U REST API Reference.md`

---

## Critical Rules

1. **Address Format:** MUST be 4-digit uppercase hexadecimal WITHOUT prefix
  - ✅ Correct: `0400`, `C000`, `D020`
  - ❌ Wrong: `400`, `$0400`, `0x0400`, `c000`  
2. **Parameter Names:** Use `address` and `length` (NOT `addr` or `count`)
3. **Data Format:** Uppercase hexadecimal string for PUT method
4. **Authentication:** Use `X-Password` header

---

## Read Memory

### Endpoint

```
GET /v1/machine:readmem
```

### Parameters

- `address` (required): 4-digit hex address (e.g., `0400`)
- `length` (required): Decimal number of bytes to read (e.g., `256`)

### Headers

```
X-Password: <your-password>
```

### Response

- **Success (200):** Binary data (ArrayBuffer)
- **Error (4xx/5xx):** Error message (may be text or ArrayBuffer)

### Examples

**Read 256 bytes from screen memory ($0400):**

```
GET /v1/machine:readmem?address=0400&length=256
```

**Read 16 bytes from BASIC ROM ($C000):**

```
GET /v1/machine:readmem?address=C000&length=16
```

**Read 1 byte from border color ($D020):**

```
GET /v1/machine:readmem?address=D020&length=1
```

### JavaScript Implementation

```javascript
function readMemory(address, length, callback, errorCallback) {
    const password = $('#apiPassword').val();

    // Convert address to 4-digit uppercase hex without prefix
    const hexAddr = address.toString(16).padStart(4, '0').toUpperCase();

    $.ajax({
        url: `/v1/machine:readmem?address=${hexAddr}&length=${length}`,
        method: 'GET',
        headers: { "X-Password": password },
        xhrFields: { responseType: 'arraybuffer' },
        success: function(data) {
            callback(data);  // data is ArrayBuffer
        },
        error: function(jqXHR) {
            let msg = jqXHR.statusText;
            if (jqXHR.responseText) {
                msg = jqXHR.responseText;
            } else if (jqXHR.responseType === 'arraybuffer' && jqXHR.response) {
                msg = new TextDecoder().decode(jqXHR.response);
            }
            if (errorCallback) errorCallback(msg);
        }
    });
}
```

### Usage Example

```javascript
// Read screen memory
readMemory(0x0400, 256, (data) => {
    const bytes = new Uint8Array(data);
    console.log('First byte:', bytes[0].toString(16));
}, (error) => {
    console.error('Read failed:', error);
});
```

---

## Write Memory (Small - Up to 128 bytes)

### Endpoint

```
PUT /v1/machine:writemem
```

### Parameters

- `address` (required): 4-digit hex address (e.g., `D020`)
- `data` (required): Hex string of bytes to write (e.g., `0504`)

### Headers

```
X-Password: <your-password>
```

### Response

- **Success (200):** Empty or success message
- **Error (4xx/5xx):** Error message

### Examples

**Write single byte $05 to border color ($D020):**

```
PUT /v1/machine:writemem?address=D020&data=05
```

**Write two bytes to $D020 and $D021:**

```
PUT /v1/machine:writemem?address=D020&data=0504
```

- Writes `05` to `$D020` (border color)
- Writes `04` to `$D021` (background color)

**Write "HELLO" to screen memory ($0400):**

```
PUT /v1/machine:writemem?address=0400&data=0805121215
```

- `08` = H, `05` = E, `12` = L, `12` = L, `15` = O (PETSCII screen codes)

### JavaScript Implementation

```javascript
function writeMemory(address, dataArray, callback, errorCallback) {
    const password = $('#apiPassword').val();

    // Convert address to 4-digit uppercase hex without prefix
    const hexAddr = address.toString(16).padStart(4, '0').toUpperCase();

    if (dataArray.length <= 128) {
        // PUT method with hex string as query parameter
        const hexString = dataArray.map(b =>
            b.toString(16).padStart(2, '0').toUpperCase()
        ).join('');

        $.ajax({
            url: `/v1/machine:writemem?address=${hexAddr}&data=${hexString}`,
            method: 'PUT',
            headers: { "X-Password": password },
            success: function() {
                if (callback) callback();
            },
            error: function(jqXHR) {
                let msg = jqXHR.statusText;
                if (jqXHR.responseText) {
                    msg = jqXHR.responseText;
                }
                if (errorCallback) errorCallback(msg);
            }
        });
    } else {
        // Use POST method for >128 bytes (see below)
    }
}
```

### Usage Example

```javascript
// Write single byte
writeMemory(0xD020, [0x05], () => {
    console.log('Border color changed to red');
}, (error) => {
    console.error('Write failed:', error);
});

// Write multiple bytes
writeMemory(0xD020, [0x05, 0x04], () => {
    console.log('Colors changed');
});
```

---

## Write Memory (Large - More than 128 bytes)

### Endpoint

```
POST /v1/machine:writemem
```

### Parameters

- `address` (required): 4-digit hex address (e.g., `0400`)

### Headers

```
X-Password: <your-password>
Content-Type: application/octet-stream
```

### Body

Binary data (Blob or ArrayBuffer)

### Response

- **Success (200):** Empty or success message
- **Error (4xx/5xx):** Error message

### Examples

**Fill screen with spaces (256 bytes):**

```
POST /v1/machine:writemem?address=0400
Content-Type: application/octet-stream
Body: [256 bytes of 0x20]
```

### JavaScript Implementation

```javascript
function writeMemoryLarge(address, dataArray, callback, errorCallback) {
    const password = $('#apiPassword').val();

    // Convert address to 4-digit uppercase hex without prefix
    const hexAddr = address.toString(16).padStart(4, '0').toUpperCase();

    const blob = new Blob([new Uint8Array(dataArray)]);

    $.ajax({
        url: `/v1/machine:writemem?address=${hexAddr}`,
        method: 'POST',
        headers: { "X-Password": password },
        data: blob,
        processData: false,
        contentType: 'application/octet-stream',
        success: function() {
            if (callback) callback();
        },
        error: function(jqXHR) {
            let msg = jqXHR.statusText;
            if (jqXHR.responseText) {
                msg = jqXHR.responseText;
            }
            if (errorCallback) errorCallback(msg);
        }
    });
}
```

### Usage Example

```javascript
// Clear screen (fill with spaces)
const screenData = new Array(1000).fill(0x20);
writeMemoryLarge(0x0400, screenData, () => {
    console.log('Screen cleared');
});
```

---

## Address Conversion Reference

### JavaScript: Integer to 4-digit Hex

```javascript
const address = 1024;
const hexAddr = address.toString(16).padStart(4, '0').toUpperCase();
// Result: "0400"
```

### Common C64 Memory Addresses

| Address (Hex) | Address (Dec) | Description |
| --- | --- | --- |
| `0400` | 1024 | Screen memory start |
| `07E7` | 2023 | Screen memory end |
| `0800` | 2048 | BASIC program start |
| `A000` | 40960 | BASIC ROM |
| `C000` | 49152 | Common user program area |
| `D000` | 53248 | I/O area start |
| `D020` | 53280 | Border color |
| `D021` | 53281 | Background color |
| `D800` | 55296 | Character color memory |
| `E000` | 57344 | Kernal ROM |

### Conversion Examples

| Integer Input | Hex Output | URL Parameter |
| --- | --- | --- |
| `1024` | `0400` | `address=0400` |
| `49152` | `C000` | `address=C000` |
| `53280` | `D020` | `address=D020` |
| `255` | `00FF` | `address=00FF` |
| `0` | `0000` | `address=0000` |
| `65535` | `FFFF` | `address=FFFF` |

---

## Error Handling Best Practices

### Handling ArrayBuffer Error Responses

Some error responses may come as ArrayBuffer instead of text. Always handle both:

```javascript
error: function(jqXHR) {
    let msg = jqXHR.statusText;
    if (jqXHR.responseText) {
        msg = jqXHR.responseText;
    } else if (jqXHR.responseType === 'arraybuffer' && jqXHR.response) {
        msg = new TextDecoder().decode(jqXHR.response);
    }
    console.error('API Error:', msg);
}
```

### Common Error Codes

- **400 Bad Request:** Invalid parameters (wrong address format, missing data)
- **401 Unauthorized:** Invalid or missing password
- **404 Not Found:** Endpoint doesn't exist
- **500 Internal Server Error:** C64U device error

---

## Complete Working Example

```javascript
// Complete implementation with both read and write
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
            error: function(jqXHR) {
                let msg = jqXHR.statusText;
                if (jqXHR.responseText) {
                    msg = jqXHR.responseText;
                } else if (jqXHR.responseType === 'arraybuffer' && jqXHR.response) {
                    msg = new TextDecoder().decode(jqXHR.response);
                }
                if (errorCallback) errorCallback(msg);
            }
        });
    }

    function writeMemory(address, dataArray, callback, errorCallback) {
        const hexAddr = address.toString(16).padStart(4, '0').toUpperCase();

        if (dataArray.length <= 128) {
            const hexString = dataArray.map(b =>
                b.toString(16).padStart(2, '0').toUpperCase()
            ).join('');

            $.ajax({
                url: `/v1/machine:writemem?address=${hexAddr}&data=${hexString}`,
                method: 'PUT',
                headers: { "X-Password": password },
                success: callback,
                error: function(jqXHR) {
                    let msg = jqXHR.statusText;
                    if (jqXHR.responseText) msg = jqXHR.responseText;
                    if (errorCallback) errorCallback(msg);
                }
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
                success: callback,
                error: function(jqXHR) {
                    let msg = jqXHR.statusText;
                    if (jqXHR.responseText) msg = jqXHR.responseText;
                    if (errorCallback) errorCallback(msg);
                }
            });
        }
    }

    return { readMemory, writeMemory };
}

// Usage
const api = c64MemoryAPI();

// Read border color
api.readMemory(0xD020, 1, (data) => {
    const color = new Uint8Array(data)[0];
    console.log('Border color:', color);
});

// Change border color to red
api.writeMemory(0xD020, [0x02], () => {
    console.log('Border color changed');
});
```

---

## Quick Checklist

When implementing C64 memory access:

- [ ] Address converted to 4-digit hex with `padStart(4, '0')`
- [ ] Address is uppercase with `.toUpperCase()`
- [ ] Using `address` parameter (not `addr`)
- [ ] Using `length` parameter for reads (not `count`)
- [ ] Using `data` query parameter for PUT writes
- [ ] Data bytes padded to 2 digits with `padStart(2, '0')`
- [ ] Data is uppercase
- [ ] Using POST for writes >128 bytes
- [ ] Handling ArrayBuffer error responses
- [ ] Using `X-Password` header
- [ ] Using relative URLs (no hostname)

---

## Notes

- The API is hosted on the C64U device itself
- Always use relative URLs (e.g., `/v1/machine:readmem`)
- The HTML file should be deployed on the C64U device to avoid CORS issues
- Memory addresses are 16-bit (0000-FFFF)
- Write operations are immediate and affect the running C64

