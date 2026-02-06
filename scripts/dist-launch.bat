@echo off
chcp 65001 > nul
rem 配布用ランチャー（フォルダの置き場所に依存しません）
cd /d "%~dp0"

rem node_modules がない、または dotenv が入っていない（別PCでコピーした等）場合は npm install を実行
set "NEED_INSTALL=0"
if not exist "node_modules" set "NEED_INSTALL=1"
if not exist "node_modules\dotenv" set "NEED_INSTALL=1"
if "%NEED_INSTALL%"=="1" (
  echo [INFO] 依存関係をインストールしています（初回または修復）...
  echo [INFO] このPCに Node.js がインストールされている必要があります。https://nodejs.org/ja/
  call npm install --omit=dev --no-audit
  if errorlevel 1 (
    echo [ERROR] npm install に失敗しました。Node.js をインストールしてから再度 launch.bat を実行してください。
    pause
    exit /b 1
  )
  echo.
)

echo [INFO] サーバーを起動しています。このウィンドウを閉じないでください。
echo [INFO] ブラウザが自動で開きます。
echo -------------------------------------------------------------------
node server.js

if %errorlevel% equ 0 (
  exit /b 0
) else (
  echo.
  echo [ERROR] サーバーが異常終了しました。
  pause
  exit /b 1
)
