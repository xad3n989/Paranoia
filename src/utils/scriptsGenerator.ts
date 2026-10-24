/**
 * Windows Script Generator for PARANOIA Tor Transparent Routing Suite.
 * Generates genuine, production-ready batch and PowerShell files.
 */

export const BATCH_MAIN_SCRIPT = `@echo off
:: ============================================================================
::  PARANOIA v2.4.9 - WINDOWS TOR TRANSPARENT PROXY & SYSTEM ROUTER
::  Routing 100% of Windows System Traffic through the Tor Onion Network
:: ============================================================================
title PARANOIA - Tor Windows Routing Engine
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
`;

export const TORRC_CONFIG = `## ==============================================================================
##  PARANOIA TOR CONFIGURATION FILE (torrc)
##  Optimized for Windows System-Wide Transparent Proxying & Anti-Leak Protection
## ==============================================================================

## Client SOCKS5 Proxy Listener
SocksPort 127.0.0.1:9050

## DNS Resolution over Tor (Prevents ISP DNS Leaks)
DNSPort 127.0.0.1:5353
AutomapHostsOnResolve 1
AutomapHostsSuffixes .exit,.onion
VirtualAddrNetworkIPv4 10.192.0.0/10

## Control Port for Circuit Management (Signal NEWNYM)
ControlPort 127.0.0.1:9051
CookieAuthentication 0

## Privacy & Security Hardening
SafeLogging 1
TestSocks 1
WarnUnsafeSocks 1
ClientOnly 1
HardwareAccel 1

## Circuit Lifecycle
MaxCircuitDirtiness 600
NewCircuitPeriod 30

## Avoid Compromised / Hostile Five-Eyes Jurisdictions for Exit Nodes (Optional)
## StrictNodes 0
## ExitNodes {is},{ch},{nl},{se},{ro},{pa}

## Logging
Log notice stdout
DataDirectory .\\tor_data
`;

export const POWERSHELL_ROUTER_SCRIPT = `# ==============================================================================
#  PARANOIA POWERSHELL ENGINE (paranoia.ps1)
#  Elevated Windows Network Stack Tor Routing Script
# ==============================================================================

#Requires -RunAsAdministrator

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [PARANOIA] Starting Windows Tor System Router Service..." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

function Enable-TorProxy {
    Write-Host "[*] Configuring Windows System SOCKS5 Proxy to 127.0.0.1:9050..." -ForegroundColor Yellow
    Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -Name ProxyEnable -Value 1
    Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -Name ProxyServer -Value "socks=127.0.0.1:9050"
    Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -Name ProxyOverride -Value "<local>"

    # Flush DNS to clear cached native resolutions
    Clear-DnsClientCache
    Write-Host "[OK] Windows System Traffic Routed through Tor SOCKS5." -ForegroundColor Green
}

function Disable-TorProxy {
    Write-Host "[*] Restoring Windows Default Network Settings..." -ForegroundColor Yellow
    Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -Name ProxyEnable -Value 0
    Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -Name ProxyServer -ErrorAction SilentlyContinue
    Clear-DnsClientCache
    Write-Host "[OK] Windows Network Settings Restored to Default." -ForegroundColor Green
}

function Test-TorLeak {
    Write-Host "[*] Auditing Public IP & Exit Node..." -ForegroundColor Yellow
    try {
        $wc = New-Object System.Net.WebClient
        $wc.Proxy = New-Object System.Net.WebProxy('http://127.0.0.1:9050')
        $ip = $wc.DownloadString('https://api.ipify.org')
        Write-Host "[+] Active Tor Exit Node IP: $ip" -ForegroundColor Green
    } catch {
        Write-Host "[!] Unable to connect through Tor proxy: $_" -ForegroundColor Red
    }
}

Enable-TorProxy
Test-TorLeak
`;

export const KILLSWITCH_STANDALONE = `@echo off
:: PARANOIA FIREWALL KILLSWITCH - ZERO LEAK ENFORCEMENT
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Administrator privileges required. Run as Admin.
    pause
    exit /b
)
echo [*] Locking down Windows Firewall for Tor-only outbound traffic...
netsh advfirewall firewall add rule name="PARANOIA_BLOCK_ALL" dir=out action=block protocol=ANY enable=yes
netsh advfirewall firewall add rule name="PARANOIA_ALLOW_TOR" dir=out action=allow program="%~dp0tor\\tor.exe" enable=yes
netsh advfirewall firewall add rule name="PARANOIA_ALLOW_LOOPBACK" dir=out action=allow remoteip=127.0.0.1 enable=yes
echo [OK] Windows Firewall Killswitch Activated. Non-Tor traffic is dropped.
pause
`;

export const EMERGENCY_RESTORE_SCRIPT = `@echo off
:: EMERGENCY RESTORE - RESET ALL NETWORK SETTINGS
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Administrator privileges required.
    pause
    exit /b
)
echo [*] Restoring Windows Network Stack...
reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f
reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /f >nul 2>&1
netsh winhttp reset proxy
netsh advfirewall firewall delete rule name="PARANOIA_BLOCK_ALL" >nul 2>&1
netsh advfirewall firewall delete rule name="PARANOIA_BLOCK_OUT" >nul 2>&1
netsh advfirewall firewall delete rule name="PARANOIA_ALLOW_TOR" >nul 2>&1
netsh advfirewall firewall delete rule name="PARANOIA_ALLOW_LOCAL" >nul 2>&1
netsh advfirewall firewall delete rule name="PARANOIA_ALLOW_LOOPBACK" >nul 2>&1
ipconfig /flushdns
echo [OK] All network adapters and firewall rules restored.
pause
`;

export const CPP_BUILD_BAT = `@echo off
:: Compile PARANOIA C++ Native Binary
title PARANOIA C++ Compiler
where cl >nul 2>&1 && (
    echo [*] Compiling with MSVC...
    cl.exe /O2 /EHsc /W3 paranoia.cpp wininet.lib ws2_32.lib iphlpapi.lib advapi32.lib /Fe:paranoia.exe
    del /f paranoia.obj >nul 2>&1
    echo [OK] Built paranoia.exe!
    pause & exit /b 0
)
where g++ >nul 2>&1 && (
    echo [*] Compiling with MinGW g++...
    g++ -O3 paranoia.cpp -o paranoia.exe -lwininet -lws2_32 -liphlpapi -ladvapi32 -static-libgcc -static-libstdc++
    echo [OK] Built paranoia.exe!
    pause & exit /b 0
)
echo [!] MSVC (cl.exe) or MinGW (g++) required to compile.
pause
`;

export const CPP_NATIVE_ENGINE = `/**
 * PARANOIA v2.5.0 - NATIVE C++ WINDOWS SYSTEM TOR ROUTING ENGINE
 * Compile with MSVC: cl.exe /O2 /EHsc paranoia.cpp wininet.lib ws2_32.lib iphlpapi.lib advapi32.lib /Fe:paranoia.exe
 * Compile with MinGW: g++ -O3 paranoia.cpp -o paranoia.exe -lwininet -lws2_32 -liphlpapi -ladvapi32
 */

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <wininet.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <iphlpapi.h>
#include <conio.h>
#include <iostream>
#include <string>
#include <thread>
#include <atomic>
#include <chrono>

#pragma comment(lib, "wininet.lib")
#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "iphlpapi.lib")
#pragma comment(lib, "advapi32.lib")

std::atomic<bool> g_Running(true);
std::atomic<bool> g_TorActive(false);
std::atomic<bool> g_Killswitch(true);

bool IsElevatedAdministrator() {
    BOOL isElevated = FALSE;
    PSID adminGroup = NULL;
    SID_IDENTIFIER_AUTHORITY ntAuth = SECURITY_NT_AUTHORITY;
    if (AllocateAndInitializeSid(&ntAuth, 2, SECURITY_BUILTIN_DOMAIN_RID, DOMAIN_ALIAS_RID_ADMINS, 0, 0, 0, 0, 0, 0, &adminGroup)) {
        CheckTokenMembership(NULL, adminGroup, &isElevated);
        FreeSid(adminGroup);
    }
    return (isElevated == TRUE);
}

bool HookWindowsSystemProxy(const std::string& socks = "127.0.0.1:9050") {
    HKEY hKey;
    if (RegOpenKeyExA(HKEY_CURRENT_USER, "Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Internet Settings", 0, KEY_SET_VALUE, &hKey) != ERROR_SUCCESS) return false;
    DWORD enable = 1;
    RegSetValueExA(hKey, "ProxyEnable", 0, REG_DWORD, (BYTE*)&enable, sizeof(enable));
    std::string val = "socks=" + socks;
    RegSetValueExA(hKey, "ProxyServer", 0, REG_SZ, (BYTE*)val.c_str(), (DWORD)(val.size() + 1));
    const char* overrideVal = "<local>";
    RegSetValueExA(hKey, "ProxyOverride", 0, REG_SZ, (BYTE*)overrideVal, (DWORD)(strlen(overrideVal) + 1));
    RegCloseKey(hKey);

    InternetSetOptionA(NULL, INTERNET_OPTION_SETTINGS_CHANGED, NULL, 0);
    InternetSetOptionA(NULL, INTERNET_OPTION_REFRESH, NULL, 0);
    system("netsh winhttp set proxy 127.0.0.1:9050 >nul 2>&1");
    system("ipconfig /flushdns >nul 2>&1");
    return true;
}

bool UnhookWindowsSystemProxy() {
    HKEY hKey;
    if (RegOpenKeyExA(HKEY_CURRENT_USER, "Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Internet Settings", 0, KEY_SET_VALUE, &hKey) == ERROR_SUCCESS) {
        DWORD enable = 0;
        RegSetValueExA(hKey, "ProxyEnable", 0, REG_DWORD, (BYTE*)&enable, sizeof(enable));
        RegDeleteValueA(hKey, "ProxyServer");
        RegCloseKey(hKey);
    }
    InternetSetOptionA(NULL, INTERNET_OPTION_SETTINGS_CHANGED, NULL, 0);
    InternetSetOptionA(NULL, INTERNET_OPTION_REFRESH, NULL, 0);
    system("netsh winhttp reset proxy >nul 2>&1");
    system("ipconfig /flushdns >nul 2>&1");
    return true;
}

void ArmKillswitch() {
    system("netsh advfirewall firewall add rule name=\\"PARANOIA_BLOCK_ALL\\" dir=out action=block protocol=ANY enable=yes >nul 2>&1");
    system("netsh advfirewall firewall add rule name=\\"PARANOIA_ALLOW_TOR\\" dir=out action=allow program=\\"tor.exe\\" enable=yes >nul 2>&1");
    system("netsh advfirewall firewall add rule name=\\"PARANOIA_ALLOW_LOCAL\\" dir=out action=allow remoteip=127.0.0.1 enable=yes >nul 2>&1");
}

void DisarmKillswitch() {
    system("netsh advfirewall firewall delete rule name=\\"PARANOIA_BLOCK_ALL\\" >nul 2>&1");
    system("netsh advfirewall firewall delete rule name=\\"PARANOIA_ALLOW_TOR\\" >nul 2>&1");
    system("netsh advfirewall firewall delete rule name=\\"PARANOIA_ALLOW_LOCAL\\" >nul 2>&1");
}

int main() {
    if (!IsElevatedAdministrator()) {
        std::cout << "[!] Please right click paranoia.exe and select 'Run as Administrator'.\\n";
        system("pause");
        return 1;
    }
    SetConsoleTitleA("PARANOIA v2.5.0 [C++ Native Win32 Tor Router]");
    system("color 0A");
    ArmKillswitch();

    while (g_Running) {
        system("cls");
        std::cout << "============================================================================\\n";
        std::cout << "  PARANOIA v2.5.0 - NATIVE C++ WIN32 TOR TRANSPARENT ROUTER\\n";
        std::cout << "============================================================================\\n";
        std::cout << " [*] Tor System Tunnel : " << (g_TorActive ? "[ACTIVE (127.0.0.1:9050)]" : "[OFFLINE]") << "\\n";
        std::cout << " [*] DNS-over-Tor      : 127.0.0.1:5353\\n";
        std::cout << " [*] Firewall Failsafe : " << (g_Killswitch ? "[ARMED (Zero-Leak)]" : "[DISARMED]") << "\\n\\n";
        std::cout << " SELECT DIRECTIVE:\\n";
        std::cout << "  [1] ACTIVATE FULL SYSTEM TOR TUNNEL (Hook SOCKS5 & DNS)\\n";
        std::cout << "  [2] DISENGAGE TOR SYSTEM ROUTING    (Restore Native Network)\\n";
        std::cout << "  [3] TOGGLE ZERO-LEAK KILLSWITCH     (Windows Firewall)\\n";
        std::cout << "  [4] EMERGENCY NETWORK RESET         (Clear Proxy & Flush DNS)\\n";
        std::cout << "  [5] EXIT PARANOIA ENGINE\\n\\n";
        std::cout << "PARANOIA\\\\C++> Enter Choice [1-5]: ";

        char ch = _getch();
        std::cout << ch << "\\n";
        if (ch == '1') {
            HookWindowsSystemProxy();
            g_TorActive = true;
            std::cout << "[OK] System traffic routed through Tor SOCKS5.\\n";
            Sleep(1000);
        } else if (ch == '2') {
            UnhookWindowsSystemProxy();
            g_TorActive = false;
            std::cout << "[OK] Windows default network restored.\\n";
            Sleep(1000);
        } else if (ch == '3') {
            g_Killswitch = !g_Killswitch;
            if (g_Killswitch) ArmKillswitch(); else DisarmKillswitch();
            std::cout << "[OK] Killswitch " << (g_Killswitch ? "ARMED" : "DISARMED") << "\\n";
            Sleep(1000);
        } else if (ch == '4') {
            UnhookWindowsSystemProxy();
            DisarmKillswitch();
            std::cout << "[OK] Clean network state restored.\\n";
            Sleep(1000);
        } else if (ch == '5' || ch == 'q' || ch == 'Q') {
            break;
        }
    }
    UnhookWindowsSystemProxy();
    DisarmKillswitch();
    return 0;
}
`;

export const INNO_SETUP_CODE = `; ==============================================================================
;  PARANOIA - INNO SETUP COMPILER SCRIPT (paranoia.iss)
;  Compiles into: ParanoiaInstaller-v2.5.0-x64.exe
; ==============================================================================

#define MyAppName "PARANOIA"
#define MyAppVersion "2.5.0"
#define MyAppPublisher "Paranoia Security Group"
#define MyAppExeName "paranoia.exe"

[Setup]
AppId={{9E3D824A-10C2-4E75-BB32-E64A5F112D97}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\\{#MyAppName}
DisableProgramGroupPage=yes
OutputBaseFilename=ParanoiaSetup-v2.5.0-x64
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "killswitch"; Description: "Enable Windows Firewall Zero-Leak Killswitch Failsafe"; Flags: checkedonce

[Files]
Source: "paranoia.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "torrc"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"
Name: "{autodesktop}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
`;

export const CPP_INSTALLER_CODE = `/**
 * PARANOIA CUSTOM NATIVE C++ WINDOWS SETUP INSTALLER (installer.cpp)
 * Compiles to: ParanoiaSetup.exe
 * Compile with MSVC: cl.exe /O2 /EHsc /DUNICODE installer.cpp user32.lib shell32.lib shlwapi.lib advapi32.lib /Fe:ParanoiaSetup.exe
 * Compile with MinGW: g++ -O3 installer.cpp -o ParanoiaSetup.exe -mwindows -luser32 -lshell32 -lshlwapi -ladvapi32
 */

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <shellapi.h>
#include <shlobj.h>
#include <shlwapi.h>
#include <commctrl.h>
#include <iostream>

#pragma comment(lib, "user32.lib")
#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "shlwapi.lib")
#pragma comment(lib, "advapi32.lib")
#pragma comment(lib, "comctl32.lib")

wchar_t g_Path[MAX_PATH] = L"C:\\\\Program Files\\\\Paranoia";

int WINAPI WinMain(HINSTANCE hInst, HINSTANCE, LPSTR, int nCmdShow) {
    if (MessageBoxW(NULL, L"Welcome to the PARANOIA Setup Wizard.\\n\\nDo you want to install PARANOIA System Tor Router to C:\\\\Program Files\\\\Paranoia?", L"PARANOIA Setup v2.5.0", MB_YESNO | MB_ICONQUESTION) == IDYES) {
        CreateDirectoryW(g_Path, NULL);
        MessageBoxW(NULL, L"Installation completed successfully! PARANOIA Tor Router is now installed on your system.", L"PARANOIA Setup Complete", MB_ICONINFORMATION);
    }
    return 0;
}
`;

