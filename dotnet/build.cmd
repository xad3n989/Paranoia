@echo off
setlocal enabledelayedexpansion
title PARANOIA - C# .NET 8.0 Windows Application Builder
color 0C

echo ===============================================================================
echo        PARANOIA v2.5.0 - NATIVE C# .NET 8.0 STANDALONE EXECUTABLE BUILDER
echo ===============================================================================
echo.

where dotnet >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] ERROR: Microsoft .NET SDK was not found in your PATH.
    echo [*] Please install .NET 8.0 SDK from: https://dotnet.microsoft.com/download/dotnet/8.0
    echo.
    pause
    exit /b 1
)

echo [*] Target Project: Paranoia\Paranoia.csproj
echo [*] Architecture:   Windows x64 (win-x64)
echo [*] Configuration:  Release
echo [*] SingleFile:     Enabled (Bundled into standalone Paranoia.exe)
echo [*] SelfContained:  Enabled (Runs on ANY Windows machine without installing .NET runtime)
echo.
echo [*] Building and publishing standalone Windows executable...
echo.

cd /d "%~dp0"
dotnet publish Paranoia\Paranoia.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o .\bin\publish

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo  [+] SUCCESS: Paranoia.exe compiled successfully!
    echo ===============================================================================
    echo  Binary Location: %~dp0bin\publish\Paranoia.exe
    echo.
    echo  To launch Paranoia:
    echo    1. Right-click '%~dp0bin\publish\Paranoia.exe'
    echo    2. Select 'Run as administrator'
    echo ===============================================================================
    echo.
) else (
    echo.
    echo [!] Compilation failed. Please check build errors above.
    echo.
)

pause
