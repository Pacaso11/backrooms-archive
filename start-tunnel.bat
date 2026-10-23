@echo off
setlocal
cd /d "%~dp0"
title Backrooms M.E.G. - Tunel Expo Go

set "PATH=C:\Program Files\nodejs;%PATH%"

echo ========================================================
echo       M.E.G. - SERVIDOR EXPO GO (MODO TUNEL)
echo ========================================================
echo.

echo Liberando puerto 8081...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :8081') do (
    taskkill /F /PID %%a >nul 2>&1
)

set "EXPO_BIN=%~dp0node_modules\.bin\expo.cmd"
if not exist "%EXPO_BIN%" set "EXPO_BIN=npx.cmd expo"

echo.
echo [*] Conectando Tunel Global ngrok para Expo Go...
echo [*] Espera unos segundos a que aparezca el codigo QR para escanear.
echo.

call "%EXPO_BIN%" start --go --tunnel -c

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Reintentando con npx.cmd...
    call npx.cmd expo start --go --tunnel
)

echo.
echo Presiona una tecla para cerrar...
pause >nul
