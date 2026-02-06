# REST API Guide for the C64U Web Control Panel

## REST API Calls

The format of the URL is as follows:

```
/v1/<route>/<path>:<command>?<arguments>
```

The ‘verb’ depends on the kind of operation. In general:

| Verb | Meaning|
| ------ | ------ |
| GET  | Retrieves information without changing state |
| PUT  | Sends information, or performs an action, using the information in the URL or in a file referenced by the URL. |
| POST | Perform an action using the information that is attached as binary to the request. |

Always use relative URLs, e.g. `/v1/machine:readmem`.

### Response Formats

The API uses two primary formats for responses: JSON for structured data and binary for raw data.

**1. JSON Responses (application/json)**

Most API calls return a JSON object. **A `200 OK` HTTP status is not a guarantee of success.** The client MUST always inspect the `errors` array within the JSON payload.

-   **Successful Operation:** The `errors` array is present and empty. The response may contain additional data.

    ```json
    {
      "address": "0400-0406",
      "errors": []
    }
    ```

-   **Application-Level Error:** The HTTP status may still be `200 OK`, but the `errors` array contains one or more error message strings. This indicates a logical failure (e.g., invalid parameter).

    ```json
    {
      "errors": ["Invalid address format"]
    }
    ```

**2. Binary Responses (application/octet-stream)**

Some endpoints, like `GET /v1/machine:readmem`, return raw binary data on success. In this case, a `200 OK` status indicates success, and the response body contains the data.

## Authentication

If a "Network Password" is configured on the device, all API requests must include a custom HTTP header:

`X-Password: <your-password>`

If the header is missing or the password is incorrect, the server will respond with an `HTTP 403 Forbidden` status, and the request will be denied.

## Success and Error Handling

Properly handling API responses requires checking both the HTTP status and the content of the response body.

### Client Handling Logic

1.  **Check HTTP Status Code:**
    -   If the status is **not** `200 OK` (e.g., `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`), treat it as a primary error. The response body for these errors **may still be JSON** containing a specific `errors` array. The client should always attempt to parse the response body as JSON first. If that fails, or if no `errors` are found, it should fall back to displaying an error based on the HTTP status code and text.

2.  **Check Content-Type for 200 OK Responses:**
    -   If `Content-Type` is `application/json`, parse the JSON body.
        -   If the `errors` array is **empty**, the operation was successful.
        -   If the `errors` array is **not empty**, the operation failed. Display the contents of the `errors` array to the user.
    -   If `Content-Type` is `application/octet-stream` or another binary type, the operation was successful.

### Summary of Response Handling

| HTTP Status | Content-Type          | `errors` Array        | Result                  | Client Action                                    |
| :---------- | :-------------------- | :-------------------- | :---------------------- | :----------------------------------------------- |
| 200 OK      | `application/json`    | Empty (`[]`)          | **Success**             | Process the data in the response.                |
| 200 OK      | `application/json`    | Not Empty             | **Application Error**   | Display the error messages from the array.       |
| 200 OK      | `application/octet-stream` | N/A              | **Success (Binary)**    | Process the raw binary data.                     |
| 4xx / 5xx   | Any                   | N/A                   | **HTTP/Transport Error**| Display an error based on the HTTP status and json response if available. |

There is no automatic retry logic. If an operation fails, the client should display an error. The next time an operation succeeds, the error indication should be cleared.

## API Calls Reference Documents

The memory operations are referenced in the **C64U Memory REST API Reference.md** document.

The full list of REST API calls and specific json results is documented in the **C64U REST API Reference.md** document.
