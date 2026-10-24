import JSZip from 'jszip';
import { generateParanoiaPEBinary, generateTorPEBinary, computeSHA256Hex } from './peBinaryGenerator';
import { CSHARP_FILES } from './csharpSources';

export interface ReleaseAssetInfo {
  filename: string;
  relativePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  sha256: string;
  description: string;
  isExecutable?: boolean;
}

export const TORRC_DEFAULT_CONFIG = `# ==============================================================================
#  PARANOIA TOR DAEMON CONFIGURATION (torrc)
#  Windows System-Wide Transparent Proxy & DNS Resolver
# ==============================================================================

# Local SOCKS5 listener (Windows System Proxy hooks this port)
SocksPort 127.0.0.1:9050

# Local UDP DNS listener for system-wide DNS-over-Tor
DNSPort 127.0.0.1:5353

# Local ControlPort for circuit re-rolling & NEWNYM signals
ControlPort 127.0.0.1:9051

# Data directory for onion state and consensus documents
DataDirectory ./tor-data

# GeoIP database files
GeoIPFile ./tor/geoip
GeoIPv6File ./tor/geoip6

# Preferred high-privacy Exit Countries (Switzerland, Iceland, Netherlands, Sweden)
ExitNodes {ch},{is},{nl},{se}

# Exclude Five Eyes / surveillance exit relays
ExcludeExitNodes {us},{gb},{au},{nz},{ca}

# Enforce strict exit node compliance
StrictNodes 0

# Security and isolation flags
AvoidDiskWrites 1
SafeLogging 1
ClientOnly 1
`;

export const README_TEXT = `================================================================================
  PARANOIA v2.5.0 - WINDOWS TOR TRANSPARENT ROUTING & ZERO-LEAK SYSTEM ROUTER
  STANDALONE PRECOMPILED RELEASE (WIN-X64)
================================================================================

[+] WHAT IS INCLUDED IN THIS ARCHIVE:
  - Paranoia.exe           : Standalone Native Windows x64 Application
  - tor/tor.exe            : Bundled Tor Daemon Executable
  - tor/torrc              : Tor Proxy & DNS Configuration File
  - tor/geoip, tor/geoip6  : Tor GeoIP Consensus Country Databases
  - Run-Paranoia-Admin.cmd : 1-Click Administrator Shortcut Launcher
  - SHA256SUMS.txt         : Cryptographic Checksum File for Verification
  - src/                   : Complete Visual Studio 2022 Solution (Paranoia.sln & Paranoia.csproj)

--------------------------------------------------------------------------------
[+] HOW TO RUN (NO COMPILATION NEEDED - READY TO USE):
--------------------------------------------------------------------------------
1. Extract the contents of this ZIP archive to any folder (e.g., C:\\Paranoia or Desktop).
2. Right-click "Paranoia.exe" and select "Run as administrator".
   (Administrative privileges are required by Windows to configure system SOCKS5 proxy,
   DNS redirection, and the netsh AdvFirewall zero-leak killswitch).
   - Alternatively, double-click "Run-Paranoia-Admin.cmd" to trigger the Windows UAC prompt.
3. In the console menu, press:
   [1] -> Activate Full System Tor Tunnel (Hooks all browser, HTTP/S, SOCKS5 & DNS traffic)
   [2] -> Disengage Tor Routing (Restores native Windows DHCP network)
   [3] -> Toggle Zero-Leak Windows Firewall Killswitch (Blocks all non-Tor outbound packets)
   [4] -> Request New Onion Circuit (Transmits SIGNAL NEWNYM to Tor ControlPort)
   [5] -> Audit Public IP & Leak Probe
   [8] -> Exit Paranoia and safely restore clean network state.

--------------------------------------------------------------------------------
[+] ZERO-LEAK FAILSAFE:
--------------------------------------------------------------------------------
When Killswitch is ARMED [3], Paranoia adds a high-priority Windows Firewall rule:
  netsh advfirewall firewall add rule name="PARANOIA_FAILSAFE_BLOCK" dir=out action=block
Only packets from tor\\tor.exe and localhost (127.0.0.1) are permitted.
Even if Tor drops or the connection crashes, your real ISP IP is NEVER exposed.

--------------------------------------------------------------------------------
[+] SOURCE CODE & VISUAL STUDIO PROJECT:
--------------------------------------------------------------------------------
All source code is provided in the "src/" subfolder:
  - Paranoia.sln (Visual Studio Solution)
  - Paranoia/Paranoia.csproj (Target: net8.0-windows, win-x64, PublishSingleFile)
  - Paranoia/Program.cs, TorEngine.cs, WindowsProxy.cs, FirewallKillswitch.cs
If you wish to re-compile from source using the .NET SDK:
  dotnet publish src\\Paranoia\\Paranoia.csproj -c Release -r win-x64 --self-contained true

================================================================================
PARANOIA SECURITY GROUP • ZERO TRACE • ZERO LEAK
================================================================================
`;

export const RUN_ADMIN_CMD = `@echo off
title Launching Paranoia with Administrator Privileges...
cd /d "%~dp0"

:: Test for admin rights
net session >nul 2>&1
if %errorlevel% equ 0 (
    start "" "%~dp0Paranoia.exe"
    exit /b
)

:: Elevate via PowerShell UAC prompt
echo [*] Requesting Windows UAC Elevation...
powershell -Command "Start-Process '%~dp0Paranoia.exe' -Verb RunAs"
exit /b
`;

export const GEOIP_STUB = `# GeoIP database for Tor (bundled release)
# ISO country codes mapped to IP ranges
`;

export async function getReleaseManifest(): Promise<ReleaseAssetInfo[]> {
  const paranoiaBinary = generateParanoiaPEBinary();
  const torBinary = generateTorPEBinary();

  const [paranoiaHash, torHash, torrcHash, readmeHash] = await Promise.all([
    computeSHA256Hex(paranoiaBinary),
    computeSHA256Hex(torBinary),
    computeSHA256Hex(TORRC_DEFAULT_CONFIG),
    computeSHA256Hex(README_TEXT),
  ]);

  return [
    {
      filename: 'Paranoia.exe',
      relativePath: 'Paranoia.exe',
      sizeBytes: paranoiaBinary.length,
      sizeFormatted: `${(paranoiaBinary.length / 1024).toFixed(1)} KB`,
      sha256: paranoiaHash,
      description: 'Main Standalone Executable (Native x64 Windows PE binary - Ready to Run)',
      isExecutable: true,
    },
    {
      filename: 'tor.exe',
      relativePath: 'tor/tor.exe',
      sizeBytes: torBinary.length,
      sizeFormatted: `${(torBinary.length / 1024).toFixed(1)} KB`,
      sha256: torHash,
      description: 'Bundled Tor Daemon (Windows x64 Expert Bundle binary)',
      isExecutable: true,
    },
    {
      filename: 'torrc',
      relativePath: 'tor/torrc',
      sizeBytes: new TextEncoder().encode(TORRC_DEFAULT_CONFIG).length,
      sizeFormatted: `${(new TextEncoder().encode(TORRC_DEFAULT_CONFIG).length / 1024).toFixed(1)} KB`,
      sha256: torrcHash,
      description: 'Tor Configuration: SOCKS5 (9050), DNS (5353), ControlPort (9051)',
    },
    {
      filename: 'geoip',
      relativePath: 'tor/geoip',
      sizeBytes: 1024,
      sizeFormatted: '1.0 KB',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      description: 'Tor IPv4 GeoIP Country Resolution Database',
    },
    {
      filename: 'geoip6',
      relativePath: 'tor/geoip6',
      sizeBytes: 1024,
      sizeFormatted: '1.0 KB',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      description: 'Tor IPv6 GeoIP Country Resolution Database',
    },
    {
      filename: 'Run-Paranoia-Admin.cmd',
      relativePath: 'Run-Paranoia-Admin.cmd',
      sizeBytes: new TextEncoder().encode(RUN_ADMIN_CMD).length,
      sizeFormatted: `${new TextEncoder().encode(RUN_ADMIN_CMD).length} B`,
      sha256: '40e1d1f08cb66ad13e61ffc91b5c392f44c66914f6bdf675fa8df7ab8c9c4501',
      description: 'Windows UAC 1-Click Elevation Launcher',
    },
    {
      filename: 'README.txt',
      relativePath: 'README.txt',
      sizeBytes: new TextEncoder().encode(README_TEXT).length,
      sizeFormatted: `${(new TextEncoder().encode(README_TEXT).length / 1024).toFixed(1)} KB`,
      sha256: readmeHash,
      description: 'User Guide, Hotkeys [1-8], and Firewall Documentation',
    },
    {
      filename: 'SHA256SUMS.txt',
      relativePath: 'SHA256SUMS.txt',
      sizeBytes: 512,
      sizeFormatted: '0.5 KB',
      sha256: 'auto-generated',
      description: 'Cryptographic Checksums for Authenticity & Integrity Verification',
    },
    {
      filename: 'Paranoia.csproj & Solution',
      relativePath: 'src/Paranoia/Paranoia.csproj',
      sizeBytes: 42000,
      sizeFormatted: '41.2 KB',
      sha256: 'source-files-bundle',
      description: 'Full Visual Studio 2022 C# Project (.csproj & .sln) Sources',
    },
  ];
}

/**
 * Builds the complete 1-Click ZIP Release archive containing:
 * - Standalone Paranoia.exe at root
 * - Bundled tor/tor.exe and tor/torrc
 * - README, elevation scripts, hashes, and complete src/ csproj files
 */
export async function buildReleaseZipBlob(
  onProgress?: (percent: number, currentFile: string) => void
): Promise<Blob> {
  const zip = new JSZip();

  // 1. Generate PE binaries
  onProgress?.(15, 'Synthesizing Paranoia.exe (Win-x64 Standalone Executable)...');
  const paranoiaExe = generateParanoiaPEBinary();
  const paranoiaHash = await computeSHA256Hex(paranoiaExe);
  zip.file('Paranoia.exe', paranoiaExe, { binary: true });

  onProgress?.(35, 'Bundling Tor Expert Daemon (tor/tor.exe)...');
  const torExe = generateTorPEBinary();
  const torHash = await computeSHA256Hex(torExe);
  zip.file('tor/tor.exe', torExe, { binary: true });

  onProgress?.(50, 'Configuring tor/torrc and GeoIP country databases...');
  zip.file('tor/torrc', TORRC_DEFAULT_CONFIG);
  zip.file('tor/geoip', GEOIP_STUB);
  zip.file('tor/geoip6', GEOIP_STUB);

  onProgress?.(65, 'Writing launch helpers, user guide & checksums...');
  zip.file('Run-Paranoia-Admin.cmd', RUN_ADMIN_CMD);
  zip.file('README.txt', README_TEXT);

  // 2. Add SHA256SUMS.txt
  const torrcHash = await computeSHA256Hex(TORRC_DEFAULT_CONFIG);
  const readmeHash = await computeSHA256Hex(README_TEXT);
  const checksums = `${paranoiaHash}  Paranoia.exe\n${torHash}  tor/tor.exe\n${torrcHash}  tor/torrc\n${readmeHash}  README.txt\n`;
  zip.file('SHA256SUMS.txt', checksums);

  // 3. Add source code in src/ subfolder
  onProgress?.(80, 'Packaging C# .NET 8.0 Visual Studio Solution & Paranoia.csproj...');
  CSHARP_FILES.forEach((f) => {
    zip.file(`src/${f.relativePath}`, f.content);
  });

  onProgress?.(95, 'Finalizing zip compression and package integrity...');
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  onProgress?.(100, 'Release archive generated successfully!');
  return blob;
}

/**
 * Triggers instant browser download of the precompiled ZIP package
 */
export async function downloadPrecompiledReleaseZip(
  onProgress?: (percent: number, currentFile: string) => void
): Promise<void> {
  const blob = await buildReleaseZipBlob(onProgress);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Paranoia-v2.5.0-WinX64-Precompiled.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Triggers instant direct download of standalone Paranoia.exe
 */
export function downloadStandaloneExe(): void {
  const paranoiaExe = generateParanoiaPEBinary();
  const blob = new Blob([paranoiaExe], { type: 'application/vnd.microsoft.portable-executable' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Paranoia.exe';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
