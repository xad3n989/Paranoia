@echo off
:: ==============================================================================
::  PARANOIA EMERGENCY RESTORE - RESET ALL NETWORK SETTINGS
:: ==============================================================================
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Administrator privileges required. Run as Admin.
    pause
    exit /b
)
echo [*] Restoring Windows Network Stack to Native Defaults...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f >nul
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer /f >nul 2>&1
netsh winhttp reset proxy >nul 2>&1
netsh advfirewall firewall delete rule name="PARANOIA_BLOCK_ALL" >nul 2>&1
netsh advfirewall firewall delete rule name="PARANOIA_BLOCK_OUT" >nul 2>&1
netsh advfirewall firewall delete rule name="PARANOIA_FAILSAFE_BLOCK" >nul 2>&1
netsh advfirewall firewall delete rule name="PARANOIA_ALLOW_TOR" >nul 2>&1
netsh advfirewall firewall delete rule name="PARANOIA_ALLOW_LOCAL" >nul 2>&1
netsh advfirewall firewall delete rule name="PARANOIA_ALLOW_LOOPBACK" >nul 2>&1
for /f "tokens=3*" %%a in ('netsh interface show interface ^| findstr "Connected"') do (
    netsh interface ipv4 set dns name="%%b" source=dhcp >nul 2>&1
)
ipconfig /flushdns >nul
netsh winsock reset >nul 2>&1
echo [OK] All network adapters, proxy keys, and firewall rules restored.
pause
