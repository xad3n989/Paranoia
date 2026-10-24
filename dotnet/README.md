# PARANOIA — C# .NET 8.0 Windows Application (win-x64)

Native Windows system-wide Tor transparent router with zero-leak Windows Firewall killswitch, real-time speed & latency telemetry, and dynamic exit node routing.

## Project Structure
```
/dotnet/
  ├── Paranoia.sln                   # Visual Studio 2022 Solution
  ├── build.cmd                      # 1-Click compiler for standalone Paranoia.exe
  └── Paranoia/
      ├── Paranoia.csproj            # .NET 8.0 Windows Executable Project
      ├── app.manifest               # UAC Elevation manifest (requireAdministrator)
      ├── Program.cs                 # Main terminal HUD & interactive command loop
      ├── WindowsProxy.cs            # Native WinINet & WinHTTP proxy configuration
      ├── TorEngine.cs               # Tor daemon controller & ControlPort socket
      └── FirewallKillswitch.cs      # Netsh AdvFirewall zero-leak failsafe rules
```

## How to Build Standalone Paranoia.exe
### Option A: 1-Click Script
Double-click `build.cmd` on any Windows computer with [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0).

### Option B: Visual Studio 2022
1. Open `Paranoia.sln` in Visual Studio 2022.
2. Select **Release | x64**.
3. Right-click `Paranoia` project -> **Publish** (or Build -> Build Solution).

### Option C: .NET CLI
```cmd
cd dotnet
dotnet publish Paranoia\Paranoia.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o .\bin\publish
```

The output binary is a single standalone executable:
`.\bin\publish\Paranoia.exe` (no runtime installation required).

## Running Paranoia
1. Right click `Paranoia.exe` -> **Run as administrator**.
2. Press `[1]` to activate transparent Tor routing for all Windows apps.
3. Press `[2]` to arm the Zero-Leak Firewall Killswitch.
4. Press `[3]` to rotate Tor circuit / identity.
5. Press `[8]` to cleanly exit and restore all Windows default network settings.
