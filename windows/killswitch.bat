@echo off
:: ==============================================================================
::  PARANOIA FIREWALL KILLSWITCH - ZERO LEAK ENFORCEMENT
:: ==============================================================================
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Administrator privileges required. Run as Admin.
    pause
    exit /b
)
echo [*] Locking down Windows Firewall for Tor-only outbound traffic...
netsh advfirewall firewall add rule name="PARANOIA_BLOCK_ALL" dir=out action=block protocol=ANY enable=yes
netsh advfirewall firewall add rule name="PARANOIA_ALLOW_TOR" dir=out action=allow program="%~dp0tor\tor.exe" enable=yes
netsh advfirewall firewall add rule name="PARANOIA_ALLOW_LOOPBACK" dir=out action=allow remoteip=127.0.0.1 enable=yes
echo [OK] Windows Firewall Killswitch Activated. Non-Tor traffic is dropped.
pause
