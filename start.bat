@echo off
setlocal
cd /d "%~dp0"
title Backrooms M.E.G. - Servidor Expo

set "PATH=C:\Program Files\nodejs;%PATH%"

echo ========================================================
echo       M.E.G. - SISTEMA DE DESPLIEGUE EXPO GO
echo ========================================================
echo.

echo Liberando puerto 8081...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :8081') do (
    taskkill /F /PID %%a >nul 2>&1
)

set "EXPO_BIN=%~dp0node_modules\.bin\expo.cmd"
if not exist "%EXPO_BIN%" set "EXPO_BIN=npx.cmd expo"

echo.
echo Selecciona el modo de conexion:
echo  1 - MODO TUNEL GLOBAL: Datos Moviles 4G/5G y cualquier red
echo  2 - MODO RED LOCAL: Movil y PC en la misma red Wi-Fi
echo.
set "MODO=1"
set /p "MODO=Elige una opcion [1 o 2, por defecto 1]: "

if "%MODO%"=="2" goto :modo_lan
goto :modo_tunel

:modo_lan
echo.
echo [*] Iniciando Expo Go en Modo LAN...
echo.
call "%EXPO_BIN%" start --go --lan -c
goto :fin

:modo_tunel
echo.
echo [*] Conectando Tunel Global ngrok...
echo [*] Por favor espera unos segundos a que aparezca el codigo QR.
echo.
call "%EXPO_BIN%" start --go --tunnel -c
goto :fin

:fin
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Hubo un problema al arrancar Expo. Intentando npx alternativo...
    call npx.cmd expo start --go --tunnel
)

echo.
echo Presiona una tecla para cerrar la ventana...
pause >nul
