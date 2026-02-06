# Whisper 文字起こしシステム  <br/>**Version: v1.0.0**

このプロジェクトは OpenAI Whisper を利用して、動画・音声ファイルを無制限に文字起こしする Web システムです。

## 事前準備 (Prerequisites)

- **Node.js 18 以上** (npm 同梱) をインストール済みであること
- ダウンロードリンク → https://nodejs.org/ja/

- Git が使える環境 (任意)
- OpenAI アカウントとAPIキー(必須)

> ffmpeg は同梱ライブラリ `ffmpeg-static` を使用するため、ローカルにインストール不要です。

---

## クイックスタート

### Windows
1. リポジトリをクローンまたは ZIP 展開します。
2. **`setup.bat` をダブルクリック**し、初回セットアップを行います。
   - **重要**: このスクリプトは、既存の `node_modules` を削除し、現在のOS用に依存関係をクリーンインストールします。OSを切り替えた後や問題が発生した場合は、まずこのファイルを実行してください。
   - `.env` ファイルが `env.example` から自動で作成されます。
3. **`.env` ファイルを開き、`OPENAI_API_KEY` をご自身のキーに書き換え**ます。
4. **`launch.bat` をダブルクリック**します。
   - コマンドプロンプトが開き、そのウィンドウがサーバーとして動作します。
   - サーバーが起動すると、自動でブラウザが開きます。
   - **このウィンドウは、アプリケーションを使用している間、開いたままにしてください。**

> **Note**: `package.json` が更新された場合など、依存関係に変更があった場合は、再度 `setup.bat` を実行してください。

### macOS / Linux
```bash
# 1. リポジトリをクローン
git clone <this-repo-url>
cd whisper-transcriber

# 2. セットアップ & APIキー設定
cp env.example .env
npm install

# 3. .env ファイルを開き、ご自身の OPENAI_API_KEY を設定
# 例: nano .env

# 4. 起動
npm start
```
`npm start` を実行すると、サーバーが起動し、自動でブラウザが開きます。

---

## 使い方

1. ブラウザで `http://localhost:3000` を開きます。
2. 音声または動画ファイルを選択し、`文字起こし開始` ボタンを押します。
3. 処理が完了すると、タイムスタンプ付きのテキスト結果が表示されます。
4. `JSON ダウンロード` / `TXT ダウンロード` ボタンで結果を保存できます。

## 技術ポイント

- **バックエンド**: Express / OpenAI SDK / ffmpeg-static + fluent-ffmpeg
- **フロントエンド**: HTML / CSS / Vanilla JS
- 音声は 9 分(540 秒)毎に分割し、サイズ制限 (25MB) を回避しています。
- Whisper API の `verbose_json` + `timestamp_granularities=[segment]` を使い、開始・終了時刻を取得、チャンクオフセットで補正しています。

### 注意事項

- API キーをクライアントサイドに露出しないよう、必ずサーバー側で保持してください。
- 1 時間以上の長尺動画では処理時間が長くなります。サーバースペックに応じて `splitAudio` の分割秒数を調整してください。

---

## トラブルシューティング (Troubleshooting)

### `launch.bat` を実行してもブラウザが起動しない場合

- `launch.bat` の実行後、プロジェクトフォルダに `launch_log.txt` というファイルが生成されます。
- このファイルに、サーバーの動作記録やエラーメッセージがすべて記録されています。
- 起動に失敗した場合は、このログファイルの内容を確認することで、原因を特定できます。

### 異なるOSで実行すると `ffmpeg` エラーが発生する場合

- **症状**:
  - `Error: spawn ... ffmpeg ENOENT` のようなエラーがターミナルに表示される。
  - 画面上で「サーバーエラー: 500」と表示される。
- **原因**:
  - `npm install` を実行したOSと、現在実行しているOSが異なっているためです。（例: Windowsで `npm install` した `node_modules` フォルダを、そのままUbuntuにコピーして実行した）
  - `ffmpeg-static`ライブラリは、インストール時のOSに合わせた実行ファイルをダウンロードします。そのため、OSが変わると互換性がなくなりエラーとなります。
- **解決策**:
  - 別のOSでプロジェクトを実行する際は、以下のコマンドで依存関係を再構築してください。

  ```bash
  # 1. 古い node_modules と package-lock.json を削除
  rm -rf node_modules
  rm package-lock.json

  # 2. 依存関係を再インストール
  npm install
  ```
  - その後、`npm start` で再度サーバーを起動してください。

---

## OpenAI アカウント & API キー取得ガイド

以下はブラウザ上でのサインアップ〜API キー発行までの一例です。

1. ブラウザで **https://platform.openai.com/** を開き、右上の `Sign up` をクリック (既にアカウントがある場合は `Log in`)。
2. メールアドレス、Google / Microsoft / Apple / 電話番号のいずれかで登録。
3. 名前 (ローマ字可) と生年月日を入力して **Continue**。
4. 「Welcome to OpenAI Platform」と表示されたら `Organization name` に好きな名称 (例: *Personal*) を入力し、用途を選択して **Create organization**。
5. 「Invite your team」は *I'll invite my team later* を選択してスキップしても OK。
6. 「Make your first API call」で
   - `API key name` に分かりやすい名前 (例: *My Test Key*) を入力
   - **Generate API Key** をクリック
   - 表示された **sk-...** から始まるキーをコピー (一度しか表示されません)。
7. プロジェクト直下の `.env` に貼り付けます。
   ```env
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
※クレジット購入画面が表示されます。無料クレジットのみで使う場合は *I'll buy credits later* をクリックして完了。
8. 既に OpenAI にログイン済みでダッシュボードが表示されている場合は、以下の手順でも API キーを発行できます。
   1. 上部メニュー `Dashboard` へ移動。
   2. 左サイドバー最下部の **API keys** をクリック。
   3. 右上の **Create new secret key** を押下。
   4. 任意の名前を入力し **Create secret key**。
   5. ポップアップに表示された **sk-...** をコピーし `.env` に保存。
   6. 画面を閉じるとキーは再表示できないので必ず控えてください。

> 作成したキーは個人情報です。Git など公開リポジトリには絶対に含めないでください。 

### その他の UI 機能

- アップロードできる拡張子を **wav / mp3 / ogg / flac / mp4 / avi** に限定。誤った形式を選ぶとエラーメッセージを表示します。
- 文字起こし完了時には処理時間 (秒) を表示。
- 画面右上(?) の「閉じる」ボタンで:
  1. 確認ダイアログ → OK で `/shutdown` を呼び出しサーバー停止。
  2. ブラウザタブも閉じます。 