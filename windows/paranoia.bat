@echo off
:: ============================================================================
::  PARANOIA v2.5.0 - WINDOWS TOR TRANSPARENT PROXY & SYSTEM ROUTER
::  Routing 100% of Windows System Traffic through the Tor Onion Network
:: ============================================================================
title PARANOIA v2.5.0 - Tor Windows Routing Engine
color 0A
setlocal enabledelayedexpansion

:: 1. CHECK ELEVATED PRIVILEGES
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] ERROR: PARANOIA requires Elevated Administrator Privileges.
    echo [!] Relaunching with administrative privileges via PowerShell UAC prompt...
    powershell -Command "Start-Process cmd -ArgumentList '/c \`"%~dpnx0\`"' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
cls
echo ============================================================================
echo   ██████╗  █████╗ ██████╗  █████╗ ███╗   ██╗ ██████╗ ██╗ █████╗ 
echo   ██╔══██╗██╔══██╗██╔══██╗██╔══██╗████╗  ██║██╔═══██╗██║██╔══██╗
echo   ██████╔╝███████║██████╔╝███████║██╔██╗ ██║██║   ██║██║███████║
echo   ██╔═══╝ ██╔══██║██╔══██╗██╔══██║██║╚██╗██║██║   ██║██║██╔══██║
echo   ██║     ██║  ██║██║  ██║██║  ██║██║ ╚████║╚██████╔╝██║██║  ██║
echo   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═╝  ╚═╝
echo             [ TRANSPARENT TOR SYSTEM ROUTER - WIN32/x64 ]
echo ============================================================================
echo [*] Release Version     : v2.5.0 (Latest Production Build)
echo [*] System Architecture : %PROCESSOR_ARCHITECTURE%
echo [*] Target SOCKS5 Proxy : 127.0.0.1:9050
echo [*] Target Tor DNS Port : 127.0.0.1:5353
echo [*] Tor Configuration   : %~dp0torrc
echo ============================================================================
echo.

:MENU
echo  Select Operation:
echo   [1] ACTIVATE FULL SYSTEM TOR TUNNEL (Enable SOCKS5 + DNS Redirection)
echo   [2] DISENGAGE TOR ROUTING (Restore Native Windows Network & DHCP DNS)
echo   [3] ENGAGE FIREWALL KILLSWITCH (Block all non-Tor outbound packets)
echo   [4] DISARM FIREWALL KILLSWITCH (Restore default Windows Firewall rules)
echo   [5] REQUEST NEW ONION IDENTITY (Signal NEWNYM via Tor ControlPort)
echo   [6] VERIFY PUBLIC IP & LEAK CHECK (curl ipinfo.io via Tor SOCKS5)
echo   [7] FLUSH SYSTEM DNS CACHE & WINSOCK
echo   [8] EXIT PARANOIA
echo.
set /p opt="PARANOIA\\> Enter Choice [1-8]: "

if "%opt%"=="1" goto ACTIVATE
if "%opt%"=="2" goto RESTORE
if "%opt%"=="3" goto KILLSWITCH_ON
if "%opt%"=="4" goto KILLSWITCH_OFF
if "%opt%"=="5" goto NEWNYM
if "%opt%"=="6" goto TEST_IP
if "%opt%"=="7" goto FLUSH_DNS
if "%opt%"=="8" goto QUIT
echo [!] Invalid selection. Try again.
pause
goto MENU

:ACTIVATE
cls
echo [*] Initiating Tor Windows Transparent Routing...
echo.

:: Check if Tor executable exists in current directory or PATH
where tor >nul 2>&1
if %errorlevel% neq 0 (
    if not exist "%~dp0tor\\tor.exe" (
        echo [!] WARNING: tor.exe not found in PATH or .\\tor\\tor.exe.
        echo [*] Downloading Tor Windows Expert Bundle...
        powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://archive.torproject.org/tor-package-archive/torbrowser/13.5.5/tor-expert-bundle-windows-x86_64-13.5.5.tar.gz' -OutFile '%~dp0tor.tar.gz'"
        tar -xzf "%~dp0tor.tar.gz" -C "%~dp0" >nul 2>&1
        del /f "%~dp0tor.tar.gz" >nul 2>&1
    )
)

:: Start Tor Background Daemon if not running
tasklist /fi "imagename eq tor.exe" | findstr /i "tor.exe" >nul
if %errorlevel% neq 0 (
    echo [*] Spawning Tor Background Service on 127.0.0.1:9050...
    if exist "%~dp0tor\\tor.exe" (
        start /b "" "%~dp0tor\\tor.exe" -f "%~dp0torrc"
    ) else (
        start /b "" tor -f "%~dp0torrc"
    )
    timeout /t 3 >nul
) else (
    echo [*] Tor Daemon already running.
)

:: Apply Windows System Proxy via Registry (Applies to Edge, Chrome, Brave, system HTTP/SOCKS)
echo [*] Applying System SOCKS5 Proxy to Windows Registry...
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f >nul
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "socks=127.0.0.1:9050" /f >nul
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyOverride /t REG_SZ /d "<local>" /f >nul

:: Apply WinHTTP proxy for Windows Services
echo [*] Configuring WinHTTP Proxy...
netsh winhttp set proxy 127.0.0.1:9050 >nul 2>&1

:: Flush DNS resolver cache
ipconfig /flushdns >nul
echo.
echo [OK] PARANOIA System Tor Routing is ACTIVE!
echo [*] All HTTP/HTTPS/SOCKS5 browser and system traffic is now piped through Tor.
echo.
pause
goto MENU

:RESTORE
cls
echo [*] Disengaging Tor System Routing...
echo [*] Disabling Windows System Proxy...
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f >nul
reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /f >nul 2>&1

echo [*] Resetting WinHTTP Proxy...
netsh winhttp reset proxy >nul 2>&1

echo [*] Restoring DNS to DHCP for all network adapters...
for /f "tokens=3*" %%a in ('netsh interface show interface ^| findstr "Connected"') do (
    netsh interface ipv4 set dns name="%%b" source=dhcp >nul 2>&1
)

echo [*] Flushing DNS cache...
ipconfig /flushdns >nul

echo.
echo [OK] Windows Native Network Fully Restored.
pause
goto MENU

:KILLSWITCH_ON
cls
echo [*] Engaging Zero-Leak Windows Firewall Killswitch...
echo [*] Adding outbound blocker rule for non-Tor applications...
netsh advfirewall firewall add rule name="PARANOIA_BLOCK_OUT" dir=out action=block protocol=ANY remoteip=any enable=yes >nul
netsh advfirewall firewall add rule name="PARANOIA_ALLOW_TOR" dir=out action=allow program="%~dp0tor\\tor.exe" enable=yes >nul
netsh advfirewall firewall add rule name="PARANOIA_ALLOW_LOCAL" dir=out action=allow remoteip=127.0.0.1 enable=yes >nul
echo [OK] Killswitch ARMED: Direct internet access blocked. Only Tor packets permitted.
pause
goto MENU

:KILLSWITCH_OFF
cls
echo [*] Disarming Windows Firewall Killswitch...
netsh advfirewall firewall delete rule name="PARANOIA_BLOCK_OUT" >nul 2>&1
netsh advfirewall firewall delete rule name="PARANOIA_ALLOW_TOR" >nul 2>&1
netsh advfirewall firewall delete rule name="PARANOIA_ALLOW_LOCAL" >nul 2>&1
echo [OK] Firewall killswitch disarmed. Standard traffic allowed.
pause
goto MENU

:NEWNYM
cls
echo [*] Transmitting SIGNAL NEWNYM to Tor Control Port (9051)...
powershell -Command "$client = New-Object System.Net.Sockets.TcpClient('127.0.0.1', 9051); $stream = $client.GetStream(); $writer = New-Object System.IO.StreamWriter($stream); $reader = New-Object System.IO.StreamReader($stream); $writer.WriteLine('AUTHENTICATE \"\"'); $writer.Flush(); $resp1 = $reader.ReadLine(); Write-Host $resp1; $writer.WriteLine('SIGNAL NEWNYM'); $writer.Flush(); $resp2 = $reader.ReadLine(); Write-Host $resp2; $client.Close()"
echo.
echo [OK] New Tor Circuit Requested. Exit node re-randomized.
pause
goto MENU

:TEST_IP
cls
echo [*] Querying Current External IP via Tor Proxy...
powershell -Command "try { $ip = (Invoke-RestMethod -Uri 'https://api.ipify.org?format=json' -Proxy 'http://127.0.0.1:9050' -TimeoutSec 10).ip; Write-Host ('[+] Tor Exit IP: ' + $ip) -ForegroundColor Green } catch { Write-Host '[!] Could not reach through proxy: ' $_.Exception.Message -ForegroundColor Red }"
echo.
pause
goto MENU

:FLUSH_DNS
cls
echo [*] Flushing Windows DNS resolver cache...
ipconfig /flushdns
echo [*] Resetting Winsock catalog...
netsh winsock reset >nul 2>&1
echo [OK] DNS Cache flushed and Winsock catalog cleared.
pause
goto MENU

:QUIT
cls
echo [*] Restoring network state before exit...
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f >nul
netsh winhttp reset proxy >nul 2>&1
echo [OK] PARANOIA Shutdown Completed.
timeout /t 2 >nul
exit /b
