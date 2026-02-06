# C64U REST API

This document is the unified reference for the REST API of the Commodore 64 Ultimate (C64U) device. The first part covers the general usage guide (URL format, authentication, error handling). The second part is the complete endpoint catalog.

The memory read/write operations have additional client-side implementation details documented in the **C64U Memory REST API Reference.md** document.

---

## REST API Calls

The format of the URL is as follows:

```
/v1/<route>/<path>:<command>?<arguments>
```

The 'verb' depends on the kind of operation. In general:

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

---

## Endpoints

### About

This section covers endpoints that provide general information about the device and API.

#### Get Version

Retrieves the current version of the REST API.

*   **Endpoint:** `GET /v1/version`
*   **Parameters:** None
*   **Response:**

```json
{
  "version": "0.1",
  "errors": []
}
```

#### Get Device Information

Retrieves basic information about the Ultimate device.

*   **Endpoint:** `GET /v1/info`
*   **Parameters:** None
*   **Response:**

```json
{
  "product": "Ultimate 64",
  "firmware_version": "3.12",
  "fpga_version": "11F",
  "core_version": "143",
  "hostname": "Terakura",
  "unique_id": "8D927F",
  "errors": []
}
```

### Runners

These endpoints are used to run various file types on the device.

#### Play SID File from Path

Plays a SID file from the device's file system.

*   **Endpoint:** `PUT /v1/runners:sidplay`
*   **Parameters:**
    *   `file` (required): The path to the SID file on the device.
    *   `songnr` (optional): The song number to play. If omitted, the default song is played.
*   **Description:** The player will attempt to find and use a corresponding song lengths file in the 'SONGLENGTHS' subdirectory.

#### Play SID File from Upload

Plays a SID file uploaded with the request.

*   **Endpoint:** `POST /v1/runners:sidplay`
*   **Parameters:**
    *   `songnr` (optional): The song number to play.
*   **Request Body:** The primary attachment is the SID file. An optional second attachment can be a file containing the song lengths.

#### Play MOD File from Path

Plays an Amiga MOD file from the device's file system.

*   **Endpoint:** `PUT /v1/runners:modplay`
*   **Parameters:**
    *   `file` (required): The path to the MOD file on the device.

#### Play MOD File from Upload

Plays an Amiga MOD file uploaded with the request.

*   **Endpoint:** `POST /v1/runners:modplay`
*   **Request Body:** The MOD file to be played.

#### Load PRG File from Path

Loads a program file into memory from the device's file system.

*   **Endpoint:** `PUT /v1/runners:load_prg`
*   **Parameters:**
    *   `file` (required): The path to the PRG file on the device.
*   **Description:** The machine resets and loads the program into memory using DMA. It does not automatically run the program.

#### Load PRG File from Upload

Loads a program file into memory from an uploaded file.

*   **Endpoint:** `POST /v1/runners:load_prg`
*   **Request Body:** The PRG file to be loaded.
*   **Description:** The machine resets and loads the program into memory using DMA. It does not automatically run the program.

#### Run PRG File from Path

Loads and runs a program file from the device's file system.

*   **Endpoint:** `PUT /v1/runners:run_prg`
*   **Parameters:**
    *   `file` (required): The path to the PRG file on the device.
*   **Description:** The machine resets, loads the program into memory using DMA, and then automatically runs it.

#### Run PRG File from Upload

Loads and runs a program file from an uploaded file.

*   **Endpoint:** `POST /v1/runners:run_prg`
*   **Request Body:** The PRG file to be loaded and run.
*   **Description:** The machine resets, loads the program into memory using DMA, and then automatically runs it.

#### Run CRT File from Path

Starts a cartridge file from the device's file system.

*   **Endpoint:** `PUT /v1/runners:run_crt`
*   **Parameters:**
    *   `file` (required): The path to the CRT file on the device.
*   **Description:** The machine resets with the specified cartridge active. This does not alter the device's configuration.

#### Run CRT File from Upload

Starts a cartridge file from an uploaded file.

*   **Endpoint:** `POST /v1/runners:run_crt`
*   **Request Body:** The CRT file to be started.
*   **Description:** The machine resets with the attached cartridge active. This does not alter the device's configuration.

### Configuration

These endpoints allow for reading and writing the device's configuration settings.

#### Get Configuration Categories

Obtains a list of all available configuration categories.

*   **Endpoint:** `GET /v1/configs`
*   **Parameters:** None
*   **Response:** A JSON object containing a list of category names.

```json
{
  "categories": [
    "Audio Mixer",
    "SID Sockets Configuration",
    "UltiSID Configuration",
    "SID Addressing",
    "C64 and Cartridge Settings",
    "U64 Specific Settings",
    "Clock Settings",
    "Network settings",
    "WiFi settings",
    "Modem Settings",
    "LED Strip Settings",
    "Data Streams",
    "Software IEC Settings",
    "User Interface Settings",
    "Tape Settings",
    "Drive A Settings",
    "Drive B Settings"
  ],
  "errors": []
}
```

#### Get Configuration Items in a Category

Obtains a list of all configuration items within a specified category. Wildcards (`*`) are allowed in the category name.

*   **Endpoint:** `GET /v1/configs/<category>`
*   **Example:** `GET /v1/configs/drive%20a*`
*   **Response:** A JSON object containing the configuration items for the matching category.

```json
{
  "Drive A Settings": {
    "Drive": "Enabled",
    "Drive Type": "1541",
    "Drive Bus ID": 8,
    "ROM for 1541 mode": "1541.rom",
    "ROM for 1571 mode": "1571.rom",
    "ROM for 1581 mode": "1581.rom",
    "Extra RAM": "Disabled",
    "Disk swap delay": 1,
    "Resets when C64 resets": "Yes",
    "Freezes in menu": "Yes",
    "GCR Save Align Tracks": "Yes",
    "Leave Menu on Mount": "Yes"
  },
  "errors": []
}
```

#### Get Specific Configuration Item

Returns detailed information about one or more specific configuration items. Wildcards (`*`) are allowed in both the category and item names.

*   **Endpoint:** `GET /v1/configs/<category>/<item>`
*   **Example:** `GET /v1/configs/drive%20a*/*bus*`
*   **Response:** A JSON object containing the detailed properties of the matching item(s).

```json
{
  "Drive A Settings": {
    "Drive Bus ID": {
      "current": 8,
      "min": 8,
      "max": 11,
      "format": "%d",
      "default": 8
    }
  },
  "errors": []
}
```

#### Set Configuration Item

Sets the value of a specific configuration item. It is required to specify the full path to the item, though wildcards are allowed.

*   **Endpoint:** `PUT /v1/configs/<category>/<item>`
*   **Parameters:**
    *   `value` (required): The value to set for the item.
*   **Example:** `PUT /v1/configs/drive%20a*/*bus*?value=9`

#### Set Multiple Configuration Items

Sets multiple configuration items at once using a JSON object in the request body. The structure of the JSON should mirror the output of the `GET` requests for categories.

*   **Endpoint:** `POST /v1/configs`
*   **Request Body:** A JSON object containing the categories and items to be updated.

```json
{
  "Drive A Settings": {
    "Drive": "Enabled",
    "Drive Type": "1581",
    "Drive Bus ID": 8
  },
  "Drive B Settings": {
    "Drive": "Disabled"
  }
}
```

#### Load Configuration from Flash

Restores the entire current configuration from the values saved in non-volatile memory.

*   **Endpoint:** `PUT /v1/configs:load_from_flash`
*   **Parameters:** None

#### Save Configuration to Flash

Saves the entire current configuration to non-volatile memory. These settings will be loaded when the machine boots.

*   **Endpoint:** `PUT /v1/configs:save_to_flash`
*   **Parameters:** None

#### Reset Configuration to Default

Resets the current settings to the factory defaults. This does not affect the configuration saved in non-volatile memory.

*   **Endpoint:** `PUT /v1/configs:reset_to_default`
*   **Parameters:** None

### Machine

These endpoints control the state of the C64 machine itself.

#### Reset Machine

Sends a reset signal to the machine without changing the current configuration.

*   **Endpoint:** `PUT /v1/machine:reset`
*   **Parameters:** None

#### Reboot Machine

Restarts the machine, which re-initializes the cartridge configuration and then sends a reset signal.

*   **Endpoint:** `PUT /v1/machine:reboot`
*   **Parameters:** None

#### Pause Machine

Pauses the CPU by pulling the DMA line low at a safe moment. This does not stop timers.

*   **Endpoint:** `PUT /v1/machine:pause`
*   **Parameters:** None

#### Resume Machine

Resumes the machine from a paused state by releasing the DMA line.

*   **Endpoint:** `PUT /v1/machine:resume`
*   **Parameters:** None

#### Power Off Machine

Powers off the machine. This is a U64-only command. You will likely not receive a valid HTTP response.

*   **Endpoint:** `PUT /v1/machine:poweroff`
*   **Parameters:** None

#### Menu Button

Simulates a press of the Menu button, entering or exiting the Ultimate menu system.

*   **Endpoint:** `PUT /v1/machine:menu_button`
*   **Parameters:** None

#### Write to Memory from URL

Writes up to 128 bytes of data to C64 memory via DMA. This cannot write to the I/O registers of the 6510.

*   **Endpoint:** `PUT /v1/machine:writemem`
*   **Parameters:**
    *   `address` (required): The starting memory location in hexadecimal format.
    *   `data` (required): A string of bytes in hexadecimal format.
*   **Example:** `PUT /v1/machine:writemem?address=D020&data=0504` (writes `05` to `$D020` and `04` to `$D021`).

#### Write to Memory from Upload

Writes a larger block of data to C64 memory from a binary file attachment.

*   **Endpoint:** `POST /v1/machine:writemem`
*   **Parameters:**
    *   `address` (required): The starting memory location in hexadecimal format.
*   **Request Body:** The binary data to be written. The data should not wrap around the `$FFFF` address boundary.

#### Read from Memory

Performs a DMA read from the cartridge bus and returns the result as a binary attachment.

*   **Endpoint:** `GET /v1/machine:readmem`
*   **Parameters:**
    *   `address` (required): The starting memory location in hexadecimal format.
    *   `length` (optional): The number of bytes to read. Defaults to 256.

#### Read Debug Register

Reads the debug register (`$D7FF`) and returns its value. This is a U64-only call.

*   **Endpoint:** `GET /v1/machine:debugreg`
*   **Parameters:** None
*   **Response:**
```json
{
  "value": "XX",
  "errors": []
}
```

#### Write Debug Register

Writes a value to the debug register (`$D7FF`) and returns the value read back. This is a U64-only call.

*   **Endpoint:** `PUT /v1/machine:debugreg`
*   **Parameters:**
    *   `value` (required): The value to write in hexadecimal format.
*   **Response:**
```json
{
  "value": "XX",
  "errors": []
}
```

### Floppy Drives

These endpoints manage the internal floppy drives on the IEC bus.

#### Get Drive Information

Retrieves information about all internal drives, including their status and mounted disk images.

*   **Endpoint:** `GET /v1/drives`
*   **Parameters:** None
*   **Response:** A JSON object containing detailed information about each drive.

```json
{
   "drives":[
      {
         "a":{
            "enabled":true,
            "bus_id":8,
            "type":"1581",
            "rom":"1581.rom",
            "image_file":"",
            "image_path":""
         }
      },
      {
         "b":{
            "enabled":false,
            "bus_id":9,
            "type":"1541",
            "rom":"1541.rom",
            "image_file":"",
            "image_path":""
         }
      },
      {
         "softiec":{
            "enabled":false,
            "bus_id":11,
            "type":"DOS emulation",
            "last_error":"73,U64IEC ULTIMATE DOS V1.1,00,00",
            "partitions":[
               {
                  "id":0,
                  "path":"/Temp/"
               }
            ]
         }
      }
   ],
   "errors":[]
}
```

#### Mount Disk Image

Mounts a disk image to a specified drive.

*   **Endpoint:** `PUT /v1/drives/<drive>:mount`
*   **Parameters:**
    *   `<drive>` (required): The target drive (e.g., 'a').
    *   `image` (required): The path to the disk image file on the device's file system.
    *   `type` (optional): The type of the image (`d64`, `g64`, `d71`, `g71`, or `d81`). If omitted, the file extension is used.
    *   `mode` (optional): The mount mode: `readwrite`, `readonly`, or `unlinked`. In `unlinked` mode, changes are not saved back to the image file.

#### Reset Drive

Resets the selected drive.

*   **Endpoint:** `PUT /v1/drives/<drive>:reset`
*   **Parameters:**
    *   `<drive>` (required): The drive to reset.

#### Remove Disk

Removes the mounted disk from the drive.

*   **Endpoint:** `PUT /v1/drives/<drive>:remove`
*   **Parameters:**
    *   `<drive>` (required): The drive from which to remove the disk.

#### Turn Drive On

Turns on the selected drive. If the drive is already on, it is reset.

*   **Endpoint:** `PUT /v1/drives/<drive>:on`
*   **Parameters:**
    *   `<drive>` (required): The drive to turn on.

#### Turn Drive Off

Turns off the selected drive, making it inaccessible on the serial bus.

*   **Endpoint:** `PUT /v1/drives/<drive>:off`
*   **Parameters:**
    *   `<drive>` (required): The drive to turn off.

#### Load Drive ROM from Path

Loads a new drive ROM from the device's file system. This is a temporary action; the default ROM will be reloaded on the next reboot or drive type change.

*   **Endpoint:** `PUT /v1/drives/<drive>:load_rom`
*   **Parameters:**
    *   `<drive>` (required): The drive to load the ROM onto.
    *   `file` (required): The path to the ROM file (must be 16K or 32K depending on drive type).

#### Load Drive ROM from Upload

Loads a new drive ROM from an uploaded file. This is a temporary action.

*   **Endpoint:** `POST /v1/drives/<drive>:load_rom`
*   **Parameters:**
    *   `<drive>` (required): The drive to load the ROM onto.
*   **Request Body:** The ROM file to be loaded (must be 16K or 32K).

#### Set Drive Mode

Changes the drive's emulation mode. This command will also load the corresponding default drive ROM, overwriting any temporary ROM.

*   **Endpoint:** `PUT /v1/drives/<drive>:set_mode`
*   **Parameters:**
    *   `<drive>` (required): The drive to configure.
    *   `mode` (required): The drive mode (`1541`, `1571`, or `1581`).

### Data Streams (U64 only)

The U64 supports streaming video, audio, and debug data over its LAN port. These API commands control the streams.

#### Start Stream

Starts one of the available data streams.

*   **Endpoint:** `PUT /v1/streams/<stream_name>:start`
*   **Parameters:**
    *   `<stream_name>` (required): The name of the stream (`video`, `audio`, or `debug`).
    *   `ip` (required): The destination IP address for the stream. A custom port can be specified using a colon separator (e.g., `192.168.1.100:6789`).
*   **Default Ports:**
    *   Video: 11000
    *   Audio: 11001
    *   Debug: 11002
*   **Note:** Starting the `video` stream will automatically stop the `debug` stream.

#### Stop Stream

Stops a running data stream.

*   **Endpoint:** `PUT /v1/streams/<stream_name>:stop`
*   **Parameters:**
    *   `<stream_name>` (required): The name of the stream to stop (`video`, `audio`, or `debug`).

### File Manipulation

This section lists API commands for file manipulation. Note that this functionality is noted as unfinished in the source documentation.

#### Get File Information

Returns basic information about a file, such as its size and extension. Supports wildcards.

*   **Endpoint:** `GET /v1/files/<path>:info`
*   **Parameters:**
    *   `<path>` (required): The path to the file. Wildcards are supported.

#### Create D64 File

Creates a new `.d64` disk image file.

*   **Endpoint:** `PUT /v1/files/<path>:create_d64`
*   **Parameters:**
    *   `<path>` (required): The full path, including the new filename.
    *   `tracks` (optional): The number of tracks (35 or 40). Defaults to 35.
    *   `diskname` (optional): The name to be used in the disk header. Defaults to the filename.

#### Create D71 File

Creates a new `.d71` disk image file with a fixed 70 tracks.

*   **Endpoint:** `PUT /v1/files/<path>:create_d71`
*   **Parameters:**
    *   `<path>` (required): The full path, including the new filename.
    *   `diskname` (optional): The name to be used in the disk header. Defaults to the filename.

#### Create D81 File

Creates a new `.d81` disk image file with a fixed 160 tracks (80 per side).

*   **Endpoint:** `PUT /v1/files/<path>:create_d81`
*   **Parameters:**
    *   `<path>` (required): The full path, including the new filename.
    *   `diskname` (optional): The name to be used in the disk header. Defaults to the filename.

#### Create DNP File

Creates a new `.dnp` disk image file.

*   **Endpoint:** `PUT /v1/files/<path>:create_dnp`
*   **Parameters:**
    *   `<path>` (required): The full path, including the new filename.
    *   `tracks` (required): The number of tracks (up to 255).
    *   `diskname` (optional): The name to be used in the disk header. Defaults to the filename.
