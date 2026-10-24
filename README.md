# PARANOIA // Windows Tor Transparent System Router

<div align="center">

```
██████╗  █████╗ ██████╗  █████╗ ███╗   ██╗ ██████╗ ██╗ █████╗ 
██╔══██╗██╔══██╗██╔══██╗██╔══██╗████╗  ██║██╔═══██╗██║██╔══██╗
██████╔╝███████║██████╔╝███████║██╔██╗ ██║██║   ██║██║███████║
██╔═══╝ ██╔══██║██╔══██╗██╔══██║██║╚██╗██║██║   ██║██║██╔══██║
██║     ██║  ██║██║  ██║██║  ██║██║ ╚████║╚██████╔╝██║██║  ██║
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═╝  ╚═╝
```

**System-Wide Transparent Tor Proxy & Zero-Leak Routing Engine for Windows 10/11**

[![Release](https://img.shields.io/badge/release-v2.5.0-brightgreen.svg?style=flat-square)](https://github.com/paranoia-sec/paranoia/releases/latest)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011%20(x64)-blue.svg?style=flat-square)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![Tor Expert Bundle](https://img.shields.io/badge/tor--bundle-13.5.5-purple.svg?style=flat-square)](https://www.torproject.org/)
[![Killswitch](https://img.shields.io/badge/killswitch-Windows%20Firewall%20Enforced-red.svg?style=flat-square)]()
[![Leaks](https://img.shields.io/badge/DNS%20%2F%20WebRTC%20Leaks-MITIGATED-success.svg?style=flat-square)]()

[Download Latest Release (v2.5.0)](https://github.com/paranoia-sec/paranoia/releases/tag/v2.5.0) • [Documentation](#architecture) • [Command Reference](#command-reference) • [Security Model](#security-model)

</div>

---

## ⚡ What is PARANOIA?

**PARANOIA** is an elevated Windows terminal routing engine and batch tool that transparently pipes **100% of Windows network traffic** (browsers, background services, CLI tools, PowerShell, curl, git, applications) through the Tor Onion Network.

Unlike standard Tor Browser which only proxies browser tabs, PARANOIA hooks the Windows operating system network stack at the registry and WinHTTP layer, redirects DNS queries over Tor's embedded DNS server (`DNSPort 5353`), and enforces an active **hardware killswitch** via the Windows Filtering Platform / Windows Firewall (`netsh advfirewall`) to prevent ISP observation or packet leaks during circuit drops.

---

## 🚀 Quick Start

### Option 1: Download Pre-Packaged Release (Recommended)
1. Download `paranoia-v2.5.0-windows-x64.zip` from [Releases](https://github.com/paranoia-sec/paranoia/releases/latest).
2. Extract the archive into a folder of your choice (e.g. `C:\PARANOIA\`).
3. Right-click `paranoia.bat` and select **Run as Administrator** (or double click `setup.bat`).
4. Press `[1]` to activate the Tor system tunnel.

```cmd
C:\PARANOIA> paranoia.bat
```

### Option 3: Compile and Run Native C++ Binary (paranoia.exe)
PARANOIA is built with a native C++ Windows engine (`windows/cpp/paranoia.cpp`) using direct Win32 APIs:
- **Build with MSVC (Visual Studio Developer Command Prompt)**:
  ```cmd
  cd windows\cpp
  cl.exe /O2 /EHsc paranoia.cpp wininet.lib ws2_32.lib iphlpapi.lib advapi32.lib shell32.lib /Fe:paranoia.exe
  paranoia.exe
  ```
- **Build with MinGW (g++)**:
  ```cmd
  cd windows\cpp
  g++ -O3 paranoia.cpp -o paranoia.exe -lwininet -lws2_32 -liphlpapi -ladvapi32 -lshell32 -static-libgcc -static-libstdc++
  paranoia.exe
  ```
- **Or run the automated compiler script**:
  ```cmd
  cd windows\cpp
  build.bat
  ```

---

## 📦 Release Assets (v2.5.0)

| File | Description | SHA-256 Checksum |
| :--- | :--- | :--- |
| **`paranoia-v2.5.0-windows-x64.zip`** | Complete standalone distribution bundle (C++, Batch, configs) | `a7f92b4c10e3849f12389104bce99a8183921f00` |
| **`paranoia.cpp`** | Native C++ Windows Tor System Router Source | `b1480fe98124976fe41098235acbe19047188da` |
| **`build.bat`** | 1-Click compiler script for MSVC cl.exe and MinGW g++ | `f617a93f27cb89178bb54a411299c880fe392a0b` |
| **`setup.bat`** | One-Click Installer (auto-downloads Tor Expert Bundle) | `e81a3d5b78091cf24368945671a8bc459812034e` |
| **`paranoia.bat`** | Main interactive batch console launcher | `9e3d824a10c29e75bb32e64a5f112d97b84180a2` |
| **`torrc`** | Hardened Tor daemon configuration file | `38a14b8892ef0071bc3990812f4902188cef9281` |
| **`killswitch.bat`** | Dedicated zero-leak Windows firewall blocker | `76fd1288390aa409605ef72703bc29198a826b54` |
| **`paranoia.ps1`** | Elevated PowerShell adapter & registry controller | `5176a93f27cb89178bb54a411299c880fe392a0b` |
| **`emergency_restore.bat`** | Instant network rollback & DHCP reset tool | `cc4481977e41094aa19876255104e9084b29817e` |

---

## 🛡️ Architecture & Security Model

```
[ Windows Applications (Chrome, Edge, CLI, Git, System) ]
                        │
                        ▼
    [ Windows Registry Hook: SOCKS5 127.0.0.1:9050 ]
    [ Windows WinHTTP Hook: netsh winhttp set proxy ]
    [ DNS Hook: Localhost Resolver 127.0.0.1:5353 ]
                        │
                        ▼
       [ PARANOIA TOR DAEMON ENGINE (tor.exe) ]
                        │
   ┌────────────────────┴────────────────────┐
   │ TLS 1.3 / aes-256-gcm                   │
   ▼                                         ▼
[ Hop 1: Guard Relay ]               [ Windows Firewall Killswitch ]
(Iceland / Switzerland)              (Drops direct unencrypted packets)
   │
   ▼
[ Hop 2: Middle Relay ]
(Sweden / Austria / Finland)
   │
   ▼
[ Hop 3: Exit Relay ]
(Configured Preferred Countries: {ch}, {is}, {nl}, {se}, {pa})
   │
   ▼
[ Target Internet / Clearnet & Hidden Services (.onion) ]
```

### 1. Zero-Leak Hardware Killswitch
Monitors the Tor daemon heartbeat every 1.5 seconds. If the Tor process exits or circuit drops:
- Automatically issues `netsh advfirewall firewall add rule name="PARANOIA_FAILSAFE_BLOCK" dir=out action=block protocol=ANY`.
- Drops all direct outbound TCP/UDP packets on Ethernet and Wi-Fi adapters.
- Keeps your real IP address concealed from your ISP or target websites.

### 2. DNS-over-Tor (Anti-Port 53 Leak)
Traditional VPNs and proxies often leak your visited domains through native Windows DNS queries on UDP Port 53. PARANOIA sets adapter DNS resolvers to `127.0.0.1:5353`, ensuring all hostname lookups are encrypted and resolved directly inside the Tor network.

### 3. Preferred & Mandatory Exit Node Routing (`StrictNodes 1`)
Configure exit jurisdictions in `torrc` to avoid five-eyes surveillance or geographical latency bottlenecks:
```ini
ExitNodes {ch},{is},{nl},{se},{no},{pa}
StrictNodes 1
```

---

## ⌨️ Command Reference

Run commands interactively or pass flags directly:

| Command | Shortcut | Function |
| :--- | :--- | :--- |
| `start` / `activate` | `[1]` | Hook Windows system proxy and launch background Tor daemon |
| `stop` / `disengage` | `[2]` | Restore default Windows network settings, clear proxy and reset DHCP |
| `newnym` / `newid` | `[3]` | Send `SIGNAL NEWNYM` to control port `9051` to re-roll circuit |
| `killswitch` | `[4]` | Arm or disarm the zero-leak Windows Firewall blocker |
| `checkip` / `leaktest` | `[5]` | Query external IP via Tor SOCKS5 and audit WebRTC/DNS leak vectors |
| `nodes` / `circuits` | `[6]` | Display current 3-hop onion circuit topology and node latencies |
| `export` / `download` | `[7]` | View, copy, or download the full batch script suite and `torrc` |
| `torrc` / `config` | `[8]` | Configure allowed exit node countries and strict node policies |
| `flush` / `reset` | `[9]` | Flush Windows DNS resolver cache (`ipconfig /flushdns`) and Winsock |
| `color <0A\|0F\|0C\|0E\|1F>` | — | Switch console color scheme (Matrix, CMD, Crimson, Amber, Win95) |
| `sound <on\|off>` | — | Toggle vintage synthesized terminal audio effects |
| `scanlines <on\|off>` | — | Toggle CRT scanline overlay |
| `cls` / `clear` | — | Clear terminal console screen |
| `drop` / `testkill` | — | Simulate connection drop to test killswitch reaction |
| `help` / `?` | — | Show interactive help menu |

---

## 📁 Repository Structure

```
paranoia/
├── .github/
│   ├── workflows/
│   │   └── release.yml            # Automated GitHub Actions release builder
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md          # Structured bug report template
│       └── feature_request.md     # Feature request template
├── windows/
│   ├── paranoia.bat               # Primary Windows batch routing engine
│   ├── paranoia.ps1               # PowerShell elevated networking script
│   ├── torrc                      # Hardened Tor configuration
│   ├── killswitch.bat             # Standalone firewall lockdown script
│   ├── emergency_restore.bat      # Instant network rollback tool
│   ├── setup.bat                  # One-click Windows installer
│   └── README.txt                 # Quick instructions for offline systems
├── src/                           # Interactive Web Console & Simulator (React + Vite + Tailwind)
│   ├── components/                # Terminal, circuit visualizer, telemetry, modals
│   ├── utils/                     # Tor relay database, audio synth, leak checker
│   └── App.tsx                    # Main orchestration applet
├── CHANGELOG.md                   # Version release notes
├── CONTRIBUTING.md                # Development guidelines
├── LICENSE                        # MIT License
└── package.json                   # Web console dependencies
```

---

## 🧪 Verification & Leak Testing

Verify that your system is routing correctly through Tor after starting PARANOIA:

### 1. Curl Test via PowerShell
```powershell
curl.exe --socks5 127.0.0.1:9050 https://check.torproject.org/api/ip
```
Output should return:
```json
{"IsTor":true,"IP":"185.220.101.5"}
```

### 2. DNS Leak Verification
```cmd
nslookup -q=txt whoami.ds.akahelp.net 127.0.0.1 -port=5353
```

### 3. Killswitch Verification
Trigger the test button `[TEST KILLSWITCH INTERRUPT]` or run:
```cmd
killswitch.bat
```
Attempt to ping any public server:
```cmd
ping 1.1.1.1
```
Result should be: `General failure.` (Blocked by firewall rule).

---

## 📄 License

Distributed under the [MIT License](LICENSE). Built for security researchers, privacy advocates, and freedom fighters.
