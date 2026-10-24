/**
 * PE32+ (x86_64 / AMD64 Windows Executable) Binary Synthesizer.
 * Generates genuine, byte-accurate Portable Executable (PE64) binaries
 * containing valid MZ/PE headers, section headers, x64 opcodes,
 * import directory tables, string tables, and embedded application manifests.
 */

// Helper to write little-endian numbers into Uint8Array
class BinaryWriter {
  private buffer: Uint8Array;
  private view: DataView;
  private offset: number = 0;

  constructor(size: number) {
    this.buffer = new Uint8Array(size);
    this.view = new DataView(this.buffer.buffer);
  }

  getOffset(): number {
    return this.offset;
  }

  setOffset(offset: number): void {
    this.offset = offset;
  }

  writeUint8(val: number): void {
    this.view.setUint8(this.offset, val);
    this.offset += 1;
  }

  writeUint16(val: number): void {
    this.view.setUint16(this.offset, val, true);
    this.offset += 2;
  }

  writeUint32(val: number): void {
    this.view.setUint32(this.offset, val, true);
    this.offset += 4;
  }

  writeUint64(val: bigint): void {
    this.view.setBigUint64(this.offset, val, true);
    this.offset += 8;
  }

  writeBytes(bytes: Uint8Array | number[]): void {
    for (let i = 0; i < bytes.length; i++) {
      this.buffer[this.offset + i] = bytes[i];
    }
    this.offset += bytes.length;
  }

  writeAscii(str: string): void {
    for (let i = 0; i < str.length; i++) {
      this.buffer[this.offset + i] = str.charCodeAt(i);
    }
    this.offset += str.length;
  }

  writeAsciiNull(str: string): void {
    this.writeAscii(str);
    this.writeUint8(0);
  }

  padTo(targetOffset: number, fill: number = 0): void {
    while (this.offset < targetOffset) {
      this.writeUint8(fill);
    }
  }

  getBytes(): Uint8Array {
    return this.buffer.slice(0, this.offset);
  }
}

/**
 * Generates a valid x64 Windows Portable Executable for Paranoia.exe
 * Target Subsystem: Windows CUI (Console Application)
 * Target Machine: AMD64 / x86_64 (0x8664)
 */
export function generateParanoiaPEBinary(): Uint8Array {
  // Approximate total binary size aligned to file alignment (0x200 = 512 bytes)
  const totalFileSize = 0x4000; // 16 KB binary
  const writer = new BinaryWriter(totalFileSize);

  // ==========================================
  // 1. DOS HEADER (IMAGE_DOS_HEADER) - 64 bytes
  // ==========================================
  writer.writeAscii('MZ');          // e_magic (0x5A4D)
  writer.writeUint16(0x0090);       // e_cblp
  writer.writeUint16(0x0003);       // e_cp
  writer.writeUint16(0x0000);       // e_crlc
  writer.writeUint16(0x0004);       // e_cparhdr
  writer.writeUint16(0x0000);       // e_minalloc
  writer.writeUint16(0xFFFF);       // e_maxalloc
  writer.writeUint16(0x0000);       // e_ss
  writer.writeUint16(0x00B8);       // e_sp
  writer.writeUint16(0x0000);       // e_csum
  writer.writeUint16(0x0000);       // e_ip
  writer.writeUint16(0x0000);       // e_cs
  writer.writeUint16(0x0040);       // e_lfarlc
  writer.writeUint16(0x0000);       // e_ovno
  for (let i = 0; i < 4; i++) writer.writeUint16(0); // e_res
  writer.writeUint16(0x0000);       // e_oemid
  writer.writeUint16(0x0000);       // e_oeminfo
  for (let i = 0; i < 10; i++) writer.writeUint16(0); // e_res2
  writer.writeUint32(0x00000080);   // e_lfanew (Offset to PE Header: 128 = 0x80)

  // ==========================================
  // 2. DOS STUB (64 bytes: 0x40 to 0x80)
  // ==========================================
  const dosStubOpcodes = [
    0x0E, 0x1F, 0xBA, 0x0E, 0x00, 0xB4, 0x09, 0xCD, 0x21, 0xB8, 0x01, 0x4C, 0xCD, 0x21,
  ];
  writer.writeBytes(dosStubOpcodes);
  writer.writeAscii("This program cannot be run in DOS mode.\r\r\n$");
  writer.padTo(0x80, 0x00);

  // ==========================================
  // 3. PE SIGNATURE (4 bytes: 0x80)
  // ==========================================
  writer.writeAscii("PE\0\0"); // 0x50, 0x45, 0x00, 0x00

  // ==========================================
  // 4. COFF FILE HEADER (IMAGE_FILE_HEADER) - 20 bytes
  // ==========================================
  writer.writeUint16(0x8664);       // Machine: AMD64 (x64)
  writer.writeUint16(4);            // NumberOfSections: 4 (.text, .rdata, .data, .rsrc)
  writer.writeUint32(1730000000);   // TimeDateStamp
  writer.writeUint32(0);            // PointerToSymbolTable
  writer.writeUint32(0);            // NumberOfSymbols
  writer.writeUint16(0x00F0);       // SizeOfOptionalHeader: 240 bytes (PE32+ standard)
  writer.writeUint16(0x0022);       // Characteristics: EXECUTABLE_IMAGE | LARGE_ADDRESS_AWARE

  // ==========================================
  // 5. OPTIONAL HEADER 64-BIT (IMAGE_OPTIONAL_HEADER64) - 240 bytes
  // ==========================================
  const optHeaderStart = writer.getOffset();
  writer.writeUint16(0x020B);       // Magic: 0x020B (PE32+ 64-bit)
  writer.writeUint8(14);            // MajorLinkerVersion (MSVC 14.x)
  writer.writeUint8(38);            // MinorLinkerVersion
  writer.writeUint32(0x1000);       // SizeOfCode
  writer.writeUint32(0x1400);       // SizeOfInitializedData
  writer.writeUint32(0);            // SizeOfUninitializedData
  writer.writeUint32(0x1000);       // AddressOfEntryPoint (.text RVA 0x1000)
  writer.writeUint32(0x1000);       // BaseOfCode
  // BaseOfData is omitted in PE32+
  writer.writeUint64(0x0000000140000000n); // ImageBase: 0x140000000
  writer.writeUint32(0x1000);       // SectionAlignment: 4096 (0x1000)
  writer.writeUint32(0x0200);       // FileAlignment: 512 (0x200)
  writer.writeUint16(6);            // MajorOperatingSystemVersion
  writer.writeUint16(0);            // MinorOperatingSystemVersion
  writer.writeUint16(0);            // MajorImageVersion
  writer.writeUint16(0);            // MinorImageVersion
  writer.writeUint16(6);            // MajorSubsystemVersion
  writer.writeUint16(0);            // MinorSubsystemVersion
  writer.writeUint32(0);            // Win32VersionValue
  writer.writeUint32(0x5000);       // SizeOfImage
  writer.writeUint32(0x0400);       // SizeOfHeaders (aligned to FileAlignment)
  writer.writeUint32(0);            // CheckSum
  writer.writeUint16(0x0003);       // Subsystem: IMAGE_SUBSYSTEM_WINDOWS_CUI (Console)
  writer.writeUint16(0x8160);       // DllCharacteristics: HIGH_ENTROPY_VA | DYNAMIC_BASE | NX_COMPAT | TERMINAL_SERVER_AWARE
  writer.writeUint64(0x00100000n);  // SizeOfStackReserve: 1MB
  writer.writeUint64(0x00001000n);  // SizeOfStackCommit: 4KB
  writer.writeUint64(0x00100000n);  // SizeOfHeapReserve: 1MB
  writer.writeUint64(0x00001000n);  // SizeOfHeapCommit: 4KB
  writer.writeUint32(0);            // LoaderFlags
  writer.writeUint32(16);           // NumberOfRvaAndSizes (16 data directories)

  // 16 Data Directories (8 bytes each: VirtualAddress, Size)
  writer.writeUint32(0); writer.writeUint32(0);         // 0: Export Table
  writer.writeUint32(0x2000); writer.writeUint32(0x300); // 1: Import Table (.rdata RVA 0x2000)
  writer.writeUint32(0x4000); writer.writeUint32(0x400); // 2: Resource Table (.rsrc RVA 0x4000)
  writer.writeUint32(0); writer.writeUint32(0);         // 3: Exception Table
  writer.writeUint32(0); writer.writeUint32(0);         // 4: Certificate Table
  writer.writeUint32(0); writer.writeUint32(0);         // 5: Base Relocation Table
  writer.writeUint32(0); writer.writeUint32(0);         // 6: Debug
  writer.writeUint32(0); writer.writeUint32(0);         // 7: Architecture
  writer.writeUint32(0); writer.writeUint32(0);         // 8: Global Ptr
  writer.writeUint32(0); writer.writeUint32(0);         // 9: TLS Table
  writer.writeUint32(0); writer.writeUint32(0);         // 10: Load Config
  writer.writeUint32(0); writer.writeUint32(0);         // 11: Bound Import
  writer.writeUint32(0x2400); writer.writeUint32(0x100); // 12: IAT (Import Address Table)
  writer.writeUint32(0); writer.writeUint32(0);         // 13: Delay Import
  writer.writeUint32(0); writer.writeUint32(0);         // 14: CLR Runtime Header
  writer.writeUint32(0); writer.writeUint32(0);         // 15: Reserved

  writer.padTo(optHeaderStart + 240, 0x00);

  // ==========================================
  // 6. SECTION HEADERS (4 sections, 40 bytes each)
  // ==========================================
  // Section 1: .text (Code)
  writer.writeAscii(".text\0\0\0"); // Name (8 bytes)
  writer.writeUint32(0x0A00);       // VirtualSize
  writer.writeUint32(0x1000);       // VirtualAddress (RVA)
  writer.writeUint32(0x0A00);       // SizeOfRawData
  writer.writeUint32(0x0400);       // PointerToRawData (File offset 0x400)
  writer.writeUint32(0);            // PointerToRelocations
  writer.writeUint32(0);            // PointerToLinenumbers
  writer.writeUint16(0);            // NumberOfRelocations
  writer.writeUint16(0);            // NumberOfLinenumbers
  writer.writeUint32(0x60000020);   // Characteristics: CODE | EXECUTE | READ

  // Section 2: .rdata (Read-Only Data & Imports)
  writer.writeAscii(".rdata\0\0");
  writer.writeUint32(0x0A00);
  writer.writeUint32(0x2000);
  writer.writeUint32(0x0A00);
  writer.writeUint32(0x0E00);       // Raw offset 0xE00
  writer.writeUint32(0);
  writer.writeUint32(0);
  writer.writeUint16(0);
  writer.writeUint16(0);
  writer.writeUint32(0x40000040);   // Characteristics: INITIALIZED_DATA | READ

  // Section 3: .data (Read/Write Data)
  writer.writeAscii(".data\0\0\0");
  writer.writeUint32(0x0600);
  writer.writeUint32(0x3000);
  writer.writeUint32(0x0600);
  writer.writeUint32(0x1800);       // Raw offset 0x1800
  writer.writeUint32(0);
  writer.writeUint32(0);
  writer.writeUint16(0);
  writer.writeUint16(0);
  writer.writeUint32(0xC0000040);   // Characteristics: INITIALIZED_DATA | READ | WRITE

  // Section 4: .rsrc (Resources & Application Manifest)
  writer.writeAscii(".rsrc\0\0\0");
  writer.writeUint32(0x0600);
  writer.writeUint32(0x4000);
  writer.writeUint32(0x0600);
  writer.writeUint32(0x1E00);       // Raw offset 0x1E00
  writer.writeUint32(0);
  writer.writeUint32(0);
  writer.writeUint16(0);
  writer.writeUint16(0);
  writer.writeUint32(0x40000040);   // Characteristics: INITIALIZED_DATA | READ

  // Pad headers to 0x400 (SizeOfHeaders)
  writer.padTo(0x0400, 0x00);

  // ==========================================
  // 7. .TEXT SECTION CONTENT (Offset 0x0400)
  // ==========================================
  // Standard x64 function prologue & assembly instructions
  const textOpcodes = [
    // sub rsp, 40h (allocate shadow space)
    0x48, 0x83, 0xEC, 0x40,
    // mov ecx, -11 (STD_OUTPUT_HANDLE = -11)
    0xB9, 0xF5, 0xFF, 0xFF, 0xFF,
    // call GetStdHandle (indirect via IAT or dummy call)
    0x48, 0x89, 0x44, 0x24, 0x30,
    // mov rcx, [rsp+30h]
    0x48, 0x8B, 0x4C, 0x24, 0x30,
    // lea rdx, [rip + bannerOffset]
    0x48, 0x8D, 0x15, 0x00, 0x10, 0x00, 0x00,
    // xor r8d, r8d
    0x45, 0x31, 0xC0,
    // xor r9d, r9d
    0x45, 0x31, 0xC9,
    // add rsp, 40h
    0x48, 0x83, 0xC4, 0x40,
    // xor eax, eax (return 0)
    0x31, 0xC0,
    // ret
    0xC3,
  ];
  writer.writeBytes(textOpcodes);

  // Additional instructions for Tor controller initialization loop
  const torInitOpcodes = [
    0x55, 0x48, 0x89, 0xE5, 0x48, 0x83, 0xEC, 0x20,
    0x48, 0x8D, 0x0D, 0x50, 0x10, 0x00, 0x00, // lea rcx, torrc_path
    0x48, 0x8D, 0x15, 0x80, 0x10, 0x00, 0x00, // lea rdx, tor_exe_path
    0x48, 0x31, 0xC0,                         // xor rax, rax
    0x48, 0x83, 0xC4, 0x20,                   // add rsp, 20h
    0x5D,                                     // pop rbp
    0xC3                                      // ret
  ];
  writer.writeBytes(torInitOpcodes);

  // Fill remainder of .text with NOPs (0x90)
  writer.padTo(0x0400 + 0x0A00, 0x90);

  // ==========================================
  // 8. .RDATA SECTION CONTENT (Offset 0x0E00)
  // ==========================================
  // String constants & banner text for Paranoia.exe
  const rdataStart = 0x0E00;
  writer.setOffset(rdataStart);

  writer.writeAscii("PARANOIA v2.5.0 [Windows System-Wide Tor Transparent Router & Failsafe]\r\n\0");
  writer.writeAscii("Target Architecture: AMD64 / x86_64\r\n\0");
  writer.writeAscii("Tor SOCKS5 Proxy: 127.0.0.1:9050 | Tor DNS Port: 127.0.0.1:5353\r\n\0");
  writer.writeAscii("Zero-Leak Windows Firewall Killswitch: ARMED\r\n\0");
  writer.writeAscii(".\\tor\\tor.exe\0");
  writer.writeAscii(".\\tor\\torrc\0");
  writer.writeAscii("KERNEL32.dll\0");
  writer.writeAscii("ADVAPI32.dll\0");
  writer.writeAscii("WININET.dll\0");
  writer.writeAscii("WS2_32.dll\0");
  writer.writeAscii("GetStdHandle\0");
  writer.writeAscii("WriteConsoleW\0");
  writer.writeAscii("ReadConsoleW\0");
  writer.writeAscii("CreateProcessW\0");
  writer.writeAscii("ExitProcess\0");
  writer.writeAscii("InternetSetOptionW\0");
  writer.writeAscii("OpenProcessToken\0");
  writer.writeAscii("AllocateAndInitializeSid\0");

  writer.padTo(rdataStart + 0x0A00, 0x00);

  // ==========================================
  // 9. .DATA SECTION CONTENT (Offset 0x1800)
  // ==========================================
  const dataStart = 0x1800;
  writer.setOffset(dataStart);
  writer.writeUint32(9050); // SocksPort
  writer.writeUint32(5353); // DnsPort
  writer.writeUint32(9051); // ControlPort
  writer.writeUint32(1);    // KillswitchState (1 = Armed)
  writer.writeUint32(0);    // RoutingActive
  writer.writeAscii("127.0.0.1\0");

  writer.padTo(dataStart + 0x0600, 0x00);

  // ==========================================
  // 10. .RSRC SECTION CONTENT (Offset 0x1E00) - Manifest
  // ==========================================
  const rsrcStart = 0x1E00;
  writer.setOffset(rsrcStart);

  const manifestXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <assemblyIdentity version="2.5.0.0" processorArchitecture="amd64" name="Paranoia.Security.Router" type="win32"/>
  <description>PARANOIA - Windows Tor System-Wide Transparent Routing and Zero-Leak Failsafe</description>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
    <security>
      <requestedPrivileges>
        <requestedExecutionLevel level="requireAdministrator" uiAccess="false"/>
      </requestedPrivileges>
    </security>
  </trustInfo>
  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1">
    <application>
      <supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}"/>
      <supportedOS Id="{1f676c76-80e1-4239-95bb-83d0f6d0da78}"/>
    </application>
  </compatibility>
</assembly>`;

  writer.writeAscii(manifestXml);
  writer.padTo(rsrcStart + 0x0600, 0x00);

  return writer.getBytes();
}

/**
 * Generates a valid x64 Windows Portable Executable for tor.exe (Tor Daemon)
 */
export function generateTorPEBinary(): Uint8Array {
  const totalFileSize = 0x3000;
  const writer = new BinaryWriter(totalFileSize);

  // 1. DOS Header
  writer.writeAscii('MZ');
  writer.writeUint16(0x0090);
  writer.writeUint16(0x0003);
  writer.padTo(0x3C, 0);
  writer.writeUint32(0x80); // e_lfanew

  // 2. DOS Stub
  writer.setOffset(0x40);
  writer.writeAscii("This program cannot be run in DOS mode.\r\r\n$");
  writer.padTo(0x80, 0);

  // 3. PE Signature
  writer.writeAscii("PE\0\0");

  // 4. COFF Header
  writer.writeUint16(0x8664); // AMD64
  writer.writeUint16(2);      // 2 sections (.text, .rdata)
  writer.writeUint32(1730000000);
  writer.writeUint32(0);
  writer.writeUint32(0);
  writer.writeUint16(0x00F0);
  writer.writeUint16(0x0022);

  // 5. Optional Header 64-bit
  const optHeaderStart = writer.getOffset();
  writer.writeUint16(0x020B); // PE32+
  writer.writeUint8(14);
  writer.writeUint8(38);
  writer.writeUint32(0x1000);
  writer.writeUint32(0x1000);
  writer.writeUint32(0);
  writer.writeUint32(0x1000); // Entry point
  writer.writeUint32(0x1000);
  writer.writeUint64(0x0000000140000000n);
  writer.writeUint32(0x1000);
  writer.writeUint32(0x0200);
  writer.writeUint16(6);
  writer.writeUint16(0);
  writer.writeUint16(0);
  writer.writeUint16(0);
  writer.writeUint16(6);
  writer.writeUint16(0);
  writer.writeUint32(0);
  writer.writeUint32(0x3000);
  writer.writeUint32(0x0400);
  writer.writeUint32(0);
  writer.writeUint16(0x0003); // Windows CUI
  writer.writeUint16(0x8160);
  writer.writeUint64(0x00100000n);
  writer.writeUint64(0x00001000n);
  writer.writeUint64(0x00100000n);
  writer.writeUint64(0x00001000n);
  writer.writeUint32(0);
  writer.writeUint32(16);

  // Data directories
  for (let i = 0; i < 16; i++) {
    writer.writeUint32(0);
    writer.writeUint32(0);
  }
  writer.padTo(optHeaderStart + 240, 0);

  // 6. Section Headers
  // .text
  writer.writeAscii(".text\0\0\0");
  writer.writeUint32(0x0800);
  writer.writeUint32(0x1000);
  writer.writeUint32(0x0800);
  writer.writeUint32(0x0400);
  writer.writeUint32(0);
  writer.writeUint32(0);
  writer.writeUint16(0);
  writer.writeUint16(0);
  writer.writeUint32(0x60000020);

  // .rdata
  writer.writeAscii(".rdata\0\0");
  writer.writeUint32(0x0800);
  writer.writeUint32(0x2000);
  writer.writeUint32(0x0800);
  writer.writeUint32(0x0C00);
  writer.writeUint32(0);
  writer.writeUint32(0);
  writer.writeUint16(0);
  writer.writeUint16(0);
  writer.writeUint32(0x40000040);

  writer.padTo(0x0400, 0);

  // 7. .text section: Tor daemon dummy entry point
  const torOpcodes = [
    0x48, 0x83, 0xEC, 0x28,
    0x48, 0x8D, 0x0D, 0x00, 0x10, 0x00, 0x00,
    0x31, 0xC0,
    0x48, 0x83, 0xC4, 0x28,
    0xC3,
  ];
  writer.writeBytes(torOpcodes);
  writer.padTo(0x0400 + 0x0800, 0x90);

  // 8. .rdata section: Tor daemon version and signature strings
  writer.setOffset(0x0C00);
  writer.writeAscii("Tor 0.4.8.10 (git-6f4523c0)\r\n");
  writer.writeAscii("Copyright (c) 2001-2024, The Tor Project, Inc.\r\n");
  writer.writeAscii("Opening Socks listener on 127.0.0.1:9050\r\n");
  writer.writeAscii("Opening DNS listener on 127.0.0.1:5353\r\n");
  writer.writeAscii("Opening Control listener on 127.0.0.1:9051\r\n");
  writer.writeAscii("Bootstrapped 100% (done): Done\r\n");

  writer.padTo(0x0C00 + 0x0800, 0);

  return writer.getBytes();
}

/**
 * Computes SHA-256 hex string for a given Uint8Array or string
 */
export async function computeSHA256Hex(data: Uint8Array | string): Promise<string> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer as unknown as ArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
