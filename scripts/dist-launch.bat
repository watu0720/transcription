@echo off
chcp 65001 > nul
rem 配布用ランチャー（フォルダの置き場所に依存しません）
cd /d "%~dp0"

if not exist node_modules (
  echo [INFO] 初回起動: 依存関係をインストールしています...
  call npm.cmd install --omit=dev --no-audit
  if errorlevel 1 (
    echo [ERROR] npm install に失敗しました。Node.js がインストールされているか確認してください。
    pause
    exit /b 1
  )
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
