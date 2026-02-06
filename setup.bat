@echo off
chcp 65001 > nul
rem =============================================
rem setup.bat - Initial setup script
rem - Deletes old dependencies and performs a clean install
rem - Creates .env from env.example if it doesn't exist
rem =============================================

cd /d "%~dp0"

rem --- Clean up old dependencies ---
echo [INFO] Cleaning up old dependencies to ensure compatibility...
if exist "node_modules" (
  rmdir /s /q node_modules
)
if exist "package-lock.json" (
  del package-lock.json
)

rem Create .env from template if it doesn't exist
if not exist .env (
  if exist env.example (
    copy /Y env.example .env >nul
    echo [INFO] .env has been created from env.example.
    echo Please edit .env and set your OPENAI_API_KEY.
  ) else (
    echo [WARN] env.example was not found. Please create .env manually.
  )
)

rem Install dependencies
echo [INFO] Installing npm dependencies (root)...
call npm.cmd install --no-audit --progress=false
if %errorlevel% neq 0 (
  echo [ERROR] npm install failed. Please check if Node.js and npm are installed correctly.
  pause
  exit /b 1
)

rem Install and build client (React)
echo [INFO] Installing client dependencies and building React app...
cd client
call npm.cmd install --no-audit --progress=false
if %errorlevel% neq 0 (
  echo [ERROR] Client npm install failed.
  cd ..
  pause
  exit /b 1
)
call npm.cmd run build
if %errorlevel% neq 0 (
  echo [ERROR] Client build failed.
  cd ..
  pause
  exit /b 1
)
cd ..

echo.
echo [SUCCESS] Setup complete.
echo Please edit the OPENAI_API_KEY in the .env file, then run launch.bat
pause
exit /b 0 