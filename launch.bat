@echo off
chcp 65001 > nul
rem =============================================
rem launch.bat - Whisper Transcription Tool Launcher
rem =============================================

rem Change directory to the script's location
cd /d "%~dp0"

rem Start the server directly in this window to show logs
echo [INFO] Starting the server...
echo [INFO] This window will now act as the server. Keep it open while using the app.
echo -------------------------------------------------------------------

node server.js

rem If the server exits, check the errorlevel
if %errorlevel% equ 0 (
    rem Normal exit (from /shutdown), so just exit the batch
    exit /b 0
) else (
    rem Abnormal exit, so pause to show error
    echo.
    echo [ERROR] The server process stopped unexpectedly.
    pause
    exit /b 1
) 