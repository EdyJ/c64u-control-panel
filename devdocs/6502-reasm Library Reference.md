# 6502-reasm Library Reference

This document provides a concise reference for using the `6502-reasm` JavaScript library to disassemble and reassemble 6502 machine code. The information is based on an investigation of the library's functionality and its usage in a browser environment.

## Overview

The `6502-reasm` library is a tool for converting 6502 machine code, represented as a sequence of hexadecimal bytes, into human-readable assembly language, and vice-versa. A key feature of this library is its round-trip capability, which guarantees that reassembling a previously disassembled output will result in the original byte sequence. This makes it particularly useful for tasks such as patching and analyzing C64 memory or ROMs.

## Browser Integration

The library is distributed as a CommonJS module, which is not directly compatible with browser environments that lack the `module.exports` object. To use the library from a CDN in a standard HTML page, a simple shim must be implemented before the library script is loaded. This shim creates a `module` object that the library can attach its exports to.

```html
<!-- Create a shim for CommonJS module compatibility -->
<script>
    var module = { exports: {} };
</script>

<!-- Load the library from the CDN -->
<script src="https://cdn.jsdelivr.net/npm/6502-reasm@1.0.0/6502.min.js"></script>

<!-- Make the library functions globally accessible -->
<script>
    window.reasm6502 = module.exports;
</script>
```

After this setup, the library's functions will be available on the `window.reasm6502` object.

## API Reference

The library exports three main functions for disassembly and reassembly.

### `disasm(bytes, [startAddress])`

This function disassembles an array of bytes into an array of instruction objects.

| Parameter | Type | Description |
|---|---|---|
| `bytes` | `Array<number>` | An array of numbers representing the hexadecimal bytes of the 6502 machine code. |
| `startAddress` | `number` | (Optional) The starting memory address for the disassembly. Defaults to `0`. |

**Returns:** `Array<Object>`

Each object in the returned array represents a single disassembled instruction and has the following structure:

| Key | Type | Description |
|---|---|---|
| `address` | `number` | The memory address of the instruction. |
| `assembly` | `string` | The textual representation of the assembly instruction (e.g., `"LDA #$10"`). |
| `bytes` | `Array<number>` | An array containing the raw bytes for this instruction. |

### `formatDisasm(disassemblyArray)`

This function takes the output from the `disasm` function and formats it into a human-readable string, similar to a traditional disassembly listing.

| Parameter | Type | Description |
|---|---|---|
| `disassemblyArray` | `Array<Object>` | An array of instruction objects, as returned by the `disasm` function. |

**Returns:** `string`

A formatted string where each line contains the address, hex bytes, and assembly instruction.

**Example Output:**
```
0000c000    78           SEI
0000c001    d8           CLD
0000c002    a9 10        LDA #$10
```

### `reasm(assemblyText)`

This function assembles a string of assembly language text back into an array of bytes.

| Parameter | Type | Description |
|---|---|---|
| `assemblyText` | `string` | A string containing 6502 assembly code. It can be either a simple list of instructions (one per line) or the formatted output from `formatDisasm`. |

**Returns:** `Array<number>`

An array of numbers representing the machine code bytes.

## Practical Example: Disassembling C64 Memory

Here is a complete example demonstrating how to use the library to disassemble a snippet of C64 memory, starting at address `$C000`.

```javascript
// Ensure the library is loaded via the browser shim as described above

// 1. Define the C64 memory bytes to be disassembled
const memoryBytes = [0x78, 0xd8, 0xa9, 0x10, 0x8d, 0x00, 0x20, 0xa2, 0xff, 0x9a];
const startAddress = 0xc000; // Starting address in hex

// 2. Disassemble the bytes
const disassembledCode = window.reasm6502.disasm(memoryBytes, startAddress);

// 3. Log the structured output
console.log("Disassembled Objects:");
console.log(disassembledCode);

// 4. Format the disassembly for display
const formattedAssembly = window.reasm6502.formatDisasm(disassembledCode);

console.log("\nFormatted Assembly:");
console.log(formattedAssembly);

// 5. Reassemble the formatted text to verify the round-trip
const reassembledBytes = window.reasm6502.reasm(formattedAssembly);
console.log("\nReassembled Bytes:");
console.log(reassembledBytes);

// Verify that the reassembled bytes match the original
const isMatch = JSON.stringify(memoryBytes) === JSON.stringify(reassembledBytes);
console.log("\nRound-trip successful:", isMatch);
```

This example illustrates the full round-trip process, from a byte array to formatted assembly and back to the original byte array, confirming the library's core functionality.

## References

[1] 6502-reasm on npm. [https://www.npmjs.com/package/6502-reasm](https://www.npmjs.com/package/6502-reasm)
[2] 6502-reasm on jsDelivr CDN. [https://cdn.jsdelivr.net/npm/6502-reasm@1.0.0/6502.min.js](https://cdn.jsdelivr.net/npm/6502-reasm@1.0.0/6502.min.js)
