@echo off
setlocal
cd /d "%~dp0"
title Backrooms M.E.G. - Servidor Expo

set "PATH=C:\Program Files\nodejs;%PATH%"

:: Asegurar que CI no este activo para mostrar el codigo QR interactivo
set "CI="

echo ========================================================
echo       M.E.G. - SISTEMA DE DESPLIEGUE EXPO GO
echo ========================================================
echo.

echo [*] Limpiando procesos previos (puerto 8081 y tuneles ngrok)...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :8081') do (
    taskkill /F /PID %%a >nul 2>&1
)
taskkill /F /IM ngrok.exe >nul 2>&1

:: Detectar IP LAN real para evitar IPs virtuales de Tailscale/VPN (como 169.254.x.x)
for /f "usebackq tokens=*" %%i in (`node -e "const os = require('os'); const ifaces = os.networkInterfaces(); let ip = ''; for (const n of Object.keys(ifaces)) { if (/tailscale|vpn|virtual|wsl|hyper-v|vmware/i.test(n)) continue; for (const net of ifaces[n]) { if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) { ip = net.address; break; } } if (ip) break; } console.log(ip);" 2^>nul`) do (
    set "DETECTED_LAN_IP=%%i"
)

set "EXPO_BIN=%~dp0node_modules\.bin\expo.cmd"
if not exist "%EXPO_BIN%" set "EXPO_BIN=npx.cmd expo"

echo.
echo Selecciona el modo de conexion:
echo  1 - MODO TUNEL GLOBAL (RECOMENDADO para DATOS MOVILES / 4G / 5G / Wi-Fi remota):
echo      Permite conectar tu movil directamente usando conexion de datos o cualquier red.
echo.
echo  2 - MODO LAN DIRECTO (Solo si movil y PC estan en la misma red Wi-Fi local):
echo      IP detectada: %DETECTED_LAN_IP%
echo.
set "MODO=1"
set /p "MODO=Elige una opcion [1 o 2, por defecto 1 (Tunel)]: "

if "%MODO%"=="2" goto :modo_lan
goto :modo_tunel

:modo_tunel
echo.
echo [*] Configurando Modo Tunel Global (ngrok)...
:: En modo tunel REACT_NATIVE_PACKAGER_HOSTNAME debe estar vacio para que Metro
:: asigne las URLs publicas seguras de ngrok y no una IP privada LAN inaccesible desde datos moviles.
set "REACT_NATIVE_PACKAGER_HOSTNAME="
echo [*] Conectando Tunel Global ngrok...
echo [*] Espera unos segundos a que aparezca el codigo QR para escanear con Expo Go...
echo.
call "%EXPO_BIN%" start --go --tunnel -c
goto :fin

:modo_lan
echo.
if not "%DETECTED_LAN_IP%"=="" (
    set "REACT_NATIVE_PACKAGER_HOSTNAME=%DETECTED_LAN_IP%"
    echo [*] Interfaz LAN asignada: %DETECTED_LAN_IP%
)
echo [*] Iniciando Expo Go en Modo LAN...
echo [*] NOTA: Requiere que movil y PC esten en la misma Wi-Fi (no datos moviles).
echo.
call "%EXPO_BIN%" start --go --lan -c
goto :fin

:fin
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Hubo un problema al arrancar Expo. Intentando npx alternativo...
    if "%MODO%"=="2" (
        call npx.cmd expo start --go --lan
    ) else (
        set "REACT_NATIVE_PACKAGER_HOSTNAME="
        call npx.cmd expo start --go --tunnel
    )
)

echo.
echo Presiona una tecla para cerrar la ventana...
pause >nul
