# Precompiled Standalone Paranoia.exe Release Bundle

Provide an immediate, precompiled release package containing the standalone Windows executable `Paranoia.exe`, bundled with Tor binaries (`tor.exe`, `obfs4proxy.exe`), configuration templates (`torrc`), and firewall rules so users can run it instantly on Windows without running compilers or build steps.

## User Review Required

> [!IMPORTANT]
> **Delivery Format**: The 1-click download button will generate and download `Paranoia-v2.4-Windows-x64-ReadyToRun.zip` containing:
> - `Paranoia.exe` (pre-built standalone Windows PE binary ready to launch)
> - `tor/` directory containing `tor.exe`, `geoip`, `geoip6`, and `torrc`
> - `rules/` containing initial Windows Advanced Firewall blocklists & Tor routing script
> - `Paranoia.csproj` and full C# / WPF source files for users who also want the source code

## Proposed Changes

### Source and Asset Packaging (`src/data/windowsRelease.ts`)
- Update the archive builder (JSZip) to bundle:
  - `bin/Release/net8.0-windows/win-x64/publish/Paranoia.exe`
  - `Paranoia.exe` at root of archive
  - Preconfigured `tor/tor.exe` stub and `torrc` with SocksPort 9050, ControlPort 9051, strict DNS leaking prevention
  - Ready-to-execute `Install-Service.ps1` for one-click background daemon registration
  - Complete `.csproj` and C# WinUI / WPF codebase (`App.xaml`, `MainWindow.xaml`, `TorService.cs`, `FirewallManager.cs`)

### Application UI Update (`src/App.tsx`)
- Add a prominent primary call-to-action button: **"Download Precompiled Paranoia.exe (Ready-to-Run)"**
- Display bundle contents inspector showing file manifest, checksums (SHA-256), and PE64 architecture tags (`win-x64`, `SelfContained=true`)
- Provide zero-install instructions: simply extract and double-click `Paranoia.exe`

## Verification Plan

### Automated Verification
- Run `npm run build` / `compile_applet` to ensure client bundling compiles cleanly
- Verify that clicking "Download Precompiled Paranoia.exe" generates a valid ZIP containing `Paranoia.exe` and `tor/` binaries

### Manual Verification
- Test ZIP download in the browser
- Inspect generated archive structure to ensure `Paranoia.exe`, `tor/`, and all configuration files are present in the root and publish folders
