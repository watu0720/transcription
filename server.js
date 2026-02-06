// server.js
// Whisper API を利用して動画・音声の文字起こしを行うバックエンドサーバー
// 使用技術: Node.js (Express), OpenAI JavaScript SDK, ffmpeg
// コメントはすべて日本語で記述しています。

import "dotenv/config"; // .env から環境変数を読み込み
import express from "express";
import cors from "cors";
import multer from "multer";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import process from "process";
import open from "open";
import archiver from "archiver";

// __dirname が ES Module で使えないための対応
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OpenAI クライアントの初期化（.env の OPENAI_API_KEY を使用。未設定時は起動しない）
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey || apiKey.startsWith("sk-your-") || apiKey === "sk-your-api-key-here") {
  console.error("[ERROR] .env に有効な OPENAI_API_KEY を設定してください。");
  process.exit(1);
}
const openai = new OpenAI({ apiKey });

// ffmpeg の実行ファイルパスを設定
await (async () => {
  ffmpeg.setFfmpegPath(ffmpegPath);
})();

// アップロードファイルの保存先設定
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// セグメント WAV 用セッション保存先（直近 1 件のみ保持）
const sessionsDir = path.join(__dirname, "sessions");
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}_${file.originalname}`)
});
const upload = multer({ storage });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// フロントエンド(静的ファイル)を配信
app.use(express.static(path.join(__dirname, "public")));

// global error handlers
process.on("uncaughtException",(err)=>{console.error("[UncaughtException]",err)});
process.on("unhandledRejection",(reason)=>{console.error("[UnhandledRejection]",reason)});

/*--------------------------------------
  エンドポイント: /transcribe (POST)
  FormData で "media" フィールドに動画または音声ファイルを指定。
--------------------------------------*/
app.post("/transcribe", upload.single("media"), async (req, res) => {
  const startTime=Date.now();
  // 言語翻訳機能は削除し、日本語文字起こしのみに戻しました。
  if (!req.file) {
    return res.status(400).json({ message: "ファイルが送信されていません。" });
  }

  const uploadedPath = req.file.path; // 例: uploads/uuid_originalname.mp4
  try {
    // 1) 動画の場合は音声だけを抽出し、wav (16kHz Mono) に変換
    const audioPath = await extractAudio(uploadedPath);

    // 2) 音声をサイズ制限に合わせて分割 (デフォルトでは 9 分 / 540 秒ごと)
    const segmentPaths = await splitAudio(audioPath, 540);

    // 3) 各セグメントを Whisper で文字起こし
    const aggregated = await transcribeSegments(segmentPaths);

    // セッション用: 既存セッション削除 → 今回の WAV と segments を保存
    cleanupSessions();
    const sessionId = uuidv4();
    const sessionWav = path.join(sessionsDir, `${sessionId}.wav`);
    fs.renameSync(audioPath, sessionWav);
    fs.writeFileSync(
      path.join(sessionsDir, `${sessionId}.json`),
      JSON.stringify(aggregated.segments),
      "utf8"
    );

    // 後片付け（アップロード元と 9 分分割ファイルのみ。WAV はセッションに移動済み）
    cleanupFiles([uploadedPath, ...segmentPaths]);

    return res.json({
      ...aggregated,
      sessionId,
      durationMs: Date.now() - startTime
    });
  } catch (err) {
    console.error(err);
    cleanupFiles([uploadedPath]);
    return res.status(500).json({ message: "サーバー内部でエラーが発生しました。" });
  }
});

// 全セグメントを ZIP で一括ダウンロード（/:index より先に定義すること）
app.get("/segment/:sessionId/zip", (req, res) => {
  const { sessionId } = req.params;
  const sessionWav = path.join(sessionsDir, `${sessionId}.wav`);
  const sessionJson = path.join(sessionsDir, `${sessionId}.json`);
  if (!fs.existsSync(sessionWav) || !fs.existsSync(sessionJson)) {
    return res.status(404).json({ message: "セッションが見つかりません。" });
  }
  const segments = JSON.parse(fs.readFileSync(sessionJson, "utf8"));
  const archive = archiver("zip", { zlib: { level: 6 } });
  archive.on("error", (err) => {
    console.error(err);
    tempPaths.forEach((p) => { try { fs.unlinkSync(p); } catch (_) {} });
    if (!res.headersSent) res.status(500).json({ message: "ZIP の作成に失敗しました。" });
  });
  res.attachment("segments.zip");
  archive.pipe(res);
  const tempPaths = [];
  (async () => {
    try {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const outPath = path.join(sessionsDir, `_zip_${sessionId}_${i}.wav`);
        tempPaths.push(outPath);
        await extractSegmentWav(sessionWav, seg.start, seg.end, outPath);
        const serif = sanitizeForFilename(seg.text);
        const name = serif
          ? `${String(i + 1).padStart(3, "0")}_${serif}.wav`
          : `${String(i + 1).padStart(3, "0")}.wav`;
        archive.append(fs.createReadStream(outPath), { name });
      }
      archive.finalize();
    } catch (err) {
      console.error(err);
      tempPaths.forEach((p) => { try { fs.unlinkSync(p); } catch (_) {} });
      archive.abort();
    }
  })();
  archive.on("end", () => {
    tempPaths.forEach((p) => { try { fs.unlinkSync(p); } catch (_) {} });
  });
});

// セグメント 1 本を WAV で取得
app.get("/segment/:sessionId/:index", (req, res) => {
  const { sessionId, index: indexStr } = req.params;
  const sessionWav = path.join(sessionsDir, `${sessionId}.wav`);
  const sessionJson = path.join(sessionsDir, `${sessionId}.json`);
  const idx = parseInt(indexStr, 10);
  if (!fs.existsSync(sessionWav) || !fs.existsSync(sessionJson)) {
    return res.status(404).json({ message: "セッションが見つかりません。" });
  }
  const segments = JSON.parse(fs.readFileSync(sessionJson, "utf8"));
  if (!Number.isFinite(idx) || idx < 0 || idx >= segments.length) {
    return res.status(400).json({ message: "無効なセグメント番号です。" });
  }
  const seg = segments[idx];
  const outPath = path.join(sessionsDir, `_seg_${sessionId}_${idx}.wav`);
  const serif = sanitizeForFilename(seg.text);
  const downloadName = serif
    ? `${String(idx + 1).padStart(3, "0")}_${serif}.wav`
    : `${String(idx + 1).padStart(3, "0")}.wav`;
  extractSegmentWav(sessionWav, seg.start, seg.end, outPath)
    .then(() => {
      res.download(outPath, downloadName, (err) => {
        fs.unlink(outPath, () => {});
        if (err && !res.headersSent) res.status(500).end();
      });
    })
    .catch((err) => {
      console.error(err);
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
      res.status(500).json({ message: "セグメントの抽出に失敗しました。" });
    });
});

// graceful shutdown endpoint
app.get("/shutdown", (req,res)=>{
  res.send("shutting down");
  console.log("Shutdown requested by client.");
  setTimeout(()=>process.exit(0),100);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  const url = `http://localhost:${PORT}`;
  console.log(`Application available at: ${url}`);
  // 開発時 (npm run dev) ではブラウザを開かない。Vite (5173) を開く想定
  if (!process.env.SKIP_OPEN_BROWSER) {
    open(url).catch(err => console.error("Failed to open browser:", err));
  } else {
    console.log("Dev mode: open http://localhost:5173 for the app.");
  }
});

/***************************************
 * 音声抽出 & 分割 Helper 関数
 ***************************************/

/**
 * 動画/音声ファイルから 16kHz モノラル WAV に変換。
 * すでに音声ファイルの場合もフォーマットをそろえるために変換を行う。
 * @param {string} inputPath 元ファイルパス
 * @returns {Promise<string>} 変換後のファイルパス
 */
function extractAudio(inputPath) {
  return new Promise((resolve, reject) => {
    const outputPath = `${inputPath}_audio.wav`;
    ffmpeg(inputPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .format("wav")
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

/**
 * ffmpeg で音声を指定秒数ごとに分割。
 * @param {string} inputPath WAV ファイルパス
 * @param {number} segmentTime 分割する秒数
 * @returns {Promise<string[]>} セグメントファイルパス配列 (順序保証)
 */
function splitAudio(inputPath, segmentTime) {
  return new Promise((resolve, reject) => {
    const segmentDir = `${inputPath}_segments`;
    if (!fs.existsSync(segmentDir)) fs.mkdirSync(segmentDir);

    const template = path.join(segmentDir, "segment_%03d.wav");

    ffmpeg(inputPath)
      .outputOptions(["-f segment", `-segment_time ${segmentTime}`, "-c copy"])
      .output(template)
      .on("end", () => {
        // 分割後のファイルをソートして取得
        const files = fs
          .readdirSync(segmentDir)
          .filter((f) => f.startsWith("segment_"))
          .sort()
          .map((f) => path.join(segmentDir, f));
        resolve(files);
      })
      .on("error", reject)
      .run();
  });
}

/**
 * OpenAI Whisper で順番にセグメントを文字起こしし、タイムスタンプをずらして結合。
 * @param {string[]} paths 分割セグメントのパス配列
 * @returns {Promise<Object>} 集約結果 (JSON & プレーンテキスト)
 */
async function transcribeSegments(paths) {
  let offset = 0; // 秒
  /** @type {Array<{start:number, end:number, text:string}>} */
  const segmentsMerged = [];

  for (const p of paths) {
    // Whisper API コール
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: fs.createReadStream(p),
      response_format: "verbose_json",
      timestamp_granularities: ["segment"]
    });

    // 返却地の segments は [ { id, seek, start, end, text, tokens... }, ... ]
    const segs = (transcription.segments || []).map((s) => ({
      start: s.start + offset,
      end: s.end + offset,
      text: s.text.trim()
    }));

    segmentsMerged.push(...segs);

    // オフセットを更新 (最終セグメントの end)
    const last = segs[segs.length - 1];
    if (last) offset = last.end;
  }

  // プレーンテキスト化 ( [hh:mm:ss] セリフ )
  const plainText = segmentsMerged
    .map((s) => `[${secToHms(s.start)} - ${secToHms(s.end)}] ${s.text}`)
    .join("\n");

  return {
    segments: segmentsMerged,
    text: plainText
  };
}

/**
 * セッション用 WAV/JSON を削除（直近 1 件のみ保持するため、新規セッション前に呼ぶ）
 */
function cleanupSessions() {
  try {
    const names = fs.readdirSync(sessionsDir);
    for (const n of names) {
      const p = path.join(sessionsDir, n);
      if (fs.statSync(p).isFile()) fs.unlinkSync(p);
    }
  } catch (_) {}
}

/**
 * 元 WAV の start〜end 秒を切り出して WAV で保存
 * @param {string} inputPath 元 WAV
 * @param {number} start 開始秒
 * @param {number} end 終了秒
 * @param {string} outputPath 出力 WAV パス
 * @returns {Promise<void>}
 */
function extractSegmentWav(inputPath, start, end, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(start)
      .setDuration(Math.max(0.001, end - start))
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });
}

/**
 * 任意のファイル群を安全に削除 (存在しなくても無視)
 * @param {string[]} files
 */
function cleanupFiles(files) {
  for (const f of files) {
    try {
      if (fs.existsSync(f)) {
        if (fs.statSync(f).isDirectory()) {
          fs.rmSync(f, { recursive: true, force: true });
        } else {
          fs.unlinkSync(f);
        }
      }
    } catch (_) {
      // 無視
    }
  }
}

/**
 * ファイル名に使うためにセリフをサニタイズ（禁則文字除去・長さ制限）
 * @param {string} text セグメントのテキスト
 * @param {number} maxLen 最大文字数（省略時 30）
 * @returns {string}
 */
function sanitizeForFilename(text, maxLen = 30) {
  if (!text || typeof text !== "string") return "";
  const replaced = text.replace(/[\\/:*?"<>|\n\r\t]+/g, " ").trim();
  if (replaced.length <= maxLen) return replaced;
  return replaced.slice(0, maxLen);
}

/**
 * 秒を hh:mm:ss 文字列へ変換
 * @param {number} sec
 * @returns {string}
 */
function secToHms(sec) {
  const h = Math.floor(sec / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:${s}`;
} 