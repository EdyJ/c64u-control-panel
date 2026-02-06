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

What is returned with the request depends on the command. In most cases the command returns a valid JSON message, using the _Content-Type: application/json_ string in the header. The JSON contains at least one entry, called errors. This is a list (array) of strings with things that went wrong during the execution of the command. A complete response could, for instance, look like this:

```
HTTP/1.1 200 OK
Connection: close
Content-Type: application/json
Content-Length: 22

{
  "errors": []
}
```

## Authentication

It is possible to configure a *"Network Password"* in the device. If a non-empty password is set then most network services of the Ultimate require the correct password to be supplied in order to be allowed access.

For the REST API the password must be sent using an additional custom HTTP header: `X-Password: <your-password>`. The header must be included in all requests to all API routes. If the header is missing or has an incorrect password then a HTTP status code of `403 Forbidden` will be returned and no further action taken. Supplying the header when no *"Network Password"* has been set is allowed (the header will be ignored).

## Error handling

Error handling typically involves showing a green checkmark on success, and displaying an error banner with the error message on a failed response. Errors and success messages may be displayed in each tool in different ways, depending on the tool's scope and functionality. For example, some operations in some tools may worth showing a confirmation when the operation is successful.

A successful operation may return additional information. It's up to the specific tool and feature what to do with that information.

```
{
  "address": "0400-0406",
  "errors": []
}
```

An error occurs when the "errors" array is not empty. In such case the contents of the "errors" array should be displayed as error message.

HTML error responses (e.g. 404) won't return any json. In such case, it should display the error code and message.

There's no retry logic: if an operation fails, it shows an error message or banner. The next time an operation succeeds, the error is cleared.

## API Calls reference documents

The memory operations are referenced in the **C64U Memory REST API Reference.md** document.

The full list of REST API calls and specific json results is documented in the **C64U REST API Reference.md** document.
