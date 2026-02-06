# Whisper 文字起こしシステム - Makefile
# Windows では Git Bash または WSL で make を実行してください。

.PHONY: install build start dev clean setup help

# ルートと client の依存関係をインストール
install:
	npm install
	cd client && npm install

# クライアントをビルド（public/ に出力）
build:
	npm run build

# 本番サーバー起動（ビルド済みの public/ を配信）
start:
	npm start

# 開発モード: サーバー(3000) + Vite(5173) を同時起動
# ブラウザで http://localhost:5173 を開いて動作確認
dev:
	npm run dev

# node_modules とビルド成果物を削除
clean:
	rm -rf node_modules
	rm -rf client/node_modules
	rm -rf public/assets
	rm -f public/index.html

# 初回セットアップ: 依存関係インストール + クライアントビルド
setup: install build

help:
	@echo "Whisper 文字起こしシステム"
	@echo ""
	@echo "  make install  - 依存関係をインストール（ルート + client）"
	@echo "  make build   - クライアントをビルド（public/ に出力）"
	@echo "  make start   - 本番サーバー起動 (http://localhost:3000)"
	@echo "  make dev     - 開発モード（サーバー + Vite、http://localhost:5173 で確認）"
	@echo "  make clean   - node_modules とビルド成果物を削除"
	@echo "  make setup   - install + build（初回セットアップ）"
	@echo "  make help    - このヘルプを表示"
