@echo off
:: ============================================================================
::  PARANOIA v2.5.0 - ONE-CLICK INSTALLER & ENVIRONMENT SETUP
:: ============================================================================
title PARANOIA - Windows Installer & Setup
color 0A
setlocal enabledelayedexpansion

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Administrator privileges required. Elevating...
    powershell -Command "Start-Process cmd -ArgumentList '/c \`"%~dpnx0\`"' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
cls
echo ============================================================================
echo   PARANOIA // WINDOWS TOR TRANSPARENT PROXY SETUP
echo ============================================================================
echo [*] Working Directory: %~dp0
echo.

:: 1. CHECK IF TOR RUNTIME EXISTS
if not exist "%~dp0tor\tor.exe" (
    where tor >nul 2>&1
    if %errorlevel% neq 0 (
        echo [*] Tor executable not found in PATH or .\\tor\\tor.exe.
        echo [*] Downloading Tor Windows Expert Bundle from torproject.org...
        powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Write-Host 'Fetching Tor package...'; Invoke-WebRequest -Uri 'https://archive.torproject.org/tor-package-archive/torbrowser/13.5.5/tor-expert-bundle-windows-x86_64-13.5.5.tar.gz' -OutFile '%~dp0tor-expert.tar.gz'"
        
        if exist "%~dp0tor-expert.tar.gz" (
            echo [*] Extracting Tor runtime...
            tar -xzf "%~dp0tor-expert.tar.gz" -C "%~dp0" >nul 2>&1
            del /f "%~dp0tor-expert.tar.gz" >nul 2>&1
            echo [OK] Tor Expert Bundle installed successfully.
        ) else (
            echo [!] Download failed or offline. Please place tor.exe into %~dp0tor\\tor.exe
        )
    ) else (
        echo [OK] System tor.exe found in PATH.
    )
) else (
    echo [OK] Local tor.exe detected in .\\tor\\tor.exe
)

:: 2. CREATE DESKTOP SHORTCUT (OPTIONAL)
echo [*] Creating Desktop Shortcut for PARANOIA...
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\PARANOIA Tor Router.lnk'); $s.TargetPath = '%~dp0paranoia.bat'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'PARANOIA System Tor Router'; $s.Save()"
echo [OK] Desktop shortcut created.

:: 3. LAUNCH PARANOIA
echo.
echo ============================================================================
echo  Setup complete! Launching PARANOIA Engine...
echo ============================================================================
timeout /t 2 >nul
call "%~dp0paranoia.bat"
exit /b
