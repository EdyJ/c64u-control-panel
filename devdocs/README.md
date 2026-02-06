# Commodore 64 Ultimate Web-based Control Panel

## Project Overview

A comprehensive web-based control panel and toolset for the Commodore 64 Ultimate (C64U) devices, providing remote access to system management, configuration, drive control, and more through a web browser on any device.

The control panel consists on a lander page (index.html) with information, essential features, and links to specialized tools on their own pages. Each tool includes a backlink in the header to the lander page. The web control panel is intended to be accessed via local network to the IP of the device.

The scope of the project is controlling some of the C64 features using the REST API calls exposed by the device, and excludes the following topics:

- SoftIEC Drives, partitions, DOS emulation.
- Data Streams Protocol. We just invoke the API calls that enable or disable them.
- The meaning and purpose of the configuration items. We just make them available to the user as the API exposes them. It's up to the user to modify the options they specifically know about.
- File manipulation.
- User documentation. This project is intended to cover basic features for expert users.
- A full coverage of the available API.
- Troubleshooting.
- Memory Map Details. We just provide the users a way to read and write to the memory, regardless of the address or configuration of that memory. We don't check if its configured as ROM, I/O registers or cartridges. We just issue the API call.

Refer to the **DEVELOPMENT.md** document for development reference.

## Quick Start

1. Enable **FTP File Service** and **Web Remote Control Service** in the C64 Ultimate.
2. Connect to the C64U file system via ftp, for example ftp://192.168.0.64 (replace with the actual IP)
3. Navigate to the folder `flash/html`. Optional: backup or rename the existing `index.html` file.
4. Copy the files of the C64 Ultimate Web-based Control Panel to this folder `flash/html`.

The Control Panel can now be accessed from the browser via http, for example:

http://192.168.0.64 (replace with the actual IP)

## Deployment & Hosting

The C64U device has a built-in web server in the folder `/flash/html`, where the HTML files are hosted. Files are deployed to the device by uploading it via anonymous ftp, which gives access to the root `/` folder.

## File System Structure

The internal file system is as follows:
```
/
    /Flash
        /carts
        /html     -> Web server
        /roms
    /SD           -> Access to internal SD card, if present
    /Temp
    /USB0         -> Access to first external USB drive, if present
    /USB1         -> Access to second external USB drive, if present
```

Disk images are typically stored in the SD or the external USB drives. Installing an internal SD requires disassembling and re-assembling the device, so we assume the most common location for disk images is /USB0.

Path convention uses forward slash `/`. Paths are not case sensitive.

## Version Compatibility

The web-based control panel works with any Commodore 64 Ultimate edition.
