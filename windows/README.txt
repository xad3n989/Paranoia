================================================================================
PARANOIA v2.5.0 - WINDOWS TOR TRANSPARENT SYSTEM ROUTER
================================================================================

QUICK INSTRUCTIONS:
1. Double-click setup.bat (or right-click paranoia.bat -> Run as Administrator).
2. Follow on-screen menu:
   [1] ACTIVATE FULL SYSTEM TOR TUNNEL
   [2] DISENGAGE TOR ROUTING
   [3] ENGAGE FIREWALL KILLSWITCH
   [4] DISARM FIREWALL KILLSWITCH
   [5] REQUEST NEW ONION IDENTITY
   [6] VERIFY PUBLIC IP & LEAK CHECK
   [7] FLUSH SYSTEM DNS CACHE & WINSOCK
   [8] EXIT PARANOIA

FILES INCLUDED:
- paranoia.bat         : Main console engine
- torrc                : Tor configuration file (SocksPort 9050, DNSPort 5353)
- paranoia.ps1         : PowerShell network adapter hook
- killswitch.bat       : Dedicated Windows Firewall lockdown tool
- emergency_restore.bat: Network restore & DHCP reset
- setup.bat            : One-click installer & dependency fetcher

Zero-Leak Guarantee:
When Killswitch is engaged, non-Tor packets are dropped via Windows Firewall.
All DNS queries are encrypted through Tor DNSPort 5353.
================================================================================
