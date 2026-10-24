# Changelog

All notable changes to the PARANOIA Windows Tor Transparent Proxy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v2.5.0] - 2026-10-23

### Added
- **Automated GitHub Release Bundle Generator**: Added client-side and CI/CD ZIP distribution packing (`paranoia-v2.5.0-windows-x64.zip`) with SHA-256 integrity checksums.
- **One-Click Windows Setup (`setup.bat`)**: Automated detection and extraction of the Tor Windows Expert Bundle with automated desktop shortcut generation.
- **Dynamic Real-Time Speed & Latency Meters**: Added continuous downstream/upstream bandwidth telemetry and 3-hop latency monitors with jitter analysis.
- **StrictNodes & Preferred Exit Nodes Engine**: Added GUI and configuration parser for pinned relay fingerprints and country ISO codes (`{ch}`, `{is}`, `{nl}`, etc.).
- **Fail-Safe Windows Firewall Killswitch**: Integrated `netsh advfirewall` rule generator to automatically drop outbound packets on circuit interruption.
- **Interactive Web Terminal & Console**: React-based CMD shell emulator with history, tab completion, sound effects, and color switching.

### Changed
- Upgraded Tor configuration baseline to support `AutomapHostsOnResolve 1` and `VirtualAddrNetworkIPv4 10.192.0.0/10`.
- Enhanced emergency restore routines to reset WinHTTP, Winsock catalog, and adapter DHCP simultaneously.

### Security
- Verified zero DNS leak on port 53 by enforcing loopback resolver `127.0.0.1:5353`.
- Added WebRTC ICE candidate leak mitigation instructions and registry shields.

---

## [v2.4.9] - 2026-10-22
- Initial architecture release for Windows 10/11 system proxy interception.
- Basic batch script menu and circuit negotiation prototypes.
