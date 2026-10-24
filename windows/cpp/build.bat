@echo off
:: ==============================================================================
::  PARANOIA C++ NATIVE ENGINE - COMPILATION SCRIPT
::  Builds paranoia.exe using Microsoft Visual C++ (cl.exe) or MinGW (g++)
:: ==============================================================================
title PARANOIA C++ Native Compiler
color 0A
setlocal enabledelayedexpansion

echo ==============================================================================
echo   BUILDING PARANOIA NATIVE C++ WINDOWS ROUTER (paranoia.exe)
echo ==============================================================================
cd /d "%~dp0"

:: 1. CHECK FOR MICROSOFT VISUAL C++ COMPILER (cl.exe)
where cl >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] Microsoft Visual C++ compiler (cl.exe) detected.
    echo [*] Compiling optimized release binary...
    cl.exe /O2 /EHsc /W3 /D_CRT_SECURE_NO_WARNINGS paranoia.cpp wininet.lib ws2_32.lib iphlpapi.lib advapi32.lib shell32.lib /Fe:paranoia.exe
    if %errorlevel% equ 0 (
        echo.
        echo [OK] Successfully built paranoia.exe!
        del /f paranoia.obj >nul 2>&1
        echo [*] To run: paranoia.exe
        pause
        exit /b 0
    ) else (
        echo [!] MSVC compilation failed. Trying MinGW...
    )
)

:: 2. CHECK FOR MINGW G++ COMPILER (g++.exe)
where g++ >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] MinGW GNU C++ compiler (g++.exe) detected.
    echo [*] Compiling release binary with static linkage...
    g++ -O3 paranoia.cpp -o paranoia.exe -lwininet -lws2_32 -liphlpapi -ladvapi32 -lshell32 -static-libgcc -static-libstdc++
    if %errorlevel% equ 0 (
        echo.
        echo [OK] Successfully built paranoia.exe!
        echo [*] To run: paranoia.exe
        pause
        exit /b 0
    )
)

:: 3. IF NEITHER FOUND, PRINT INSTRUCTIONS
echo.
echo [!] Neither MSVC (cl.exe) nor MinGW (g++.exe) was found in your PATH.
echo.
echo TO COMPILE WITH VISUAL STUDIO:
echo   1. Open 'Developer Command Prompt for VS 2022' (or VS 2019)
echo   2. Navigate to this folder: cd %~dp0
echo   3. Run:
echo      cl.exe /O2 /EHsc paranoia.cpp wininet.lib ws2_32.lib iphlpapi.lib advapi32.lib /Fe:paranoia.exe
echo.
echo TO COMPILE WITH MINGW (g++):
echo   g++ -O3 paranoia.cpp -o paranoia.exe -lwininet -lws2_32 -liphlpapi -ladvapi32
echo.
pause
exit /b 1
