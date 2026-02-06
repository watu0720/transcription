/**
 * リリース配布物を dist/ に作成（Windows / macOS / Linux 共通）
 * make dist または npm run dist から実行
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const srcPath = path.join(src, name);
    const destPath = path.join(dest, name);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 既存の dist を削除
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 単体ファイルをコピー
const files = ["server.js", "package.json", "env.example", "VERSION_HISTORY.md"];
for (const f of files) {
  const src = path.join(rootDir, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, f));
  }
}

// launch.bat
fs.copyFileSync(
  path.join(rootDir, "scripts", "dist-launch.bat"),
  path.join(distDir, "launch.bat")
);

// public/ を dist/public/ にコピー
copyDir(path.join(rootDir, "public"), path.join(distDir, "public"));

// dist 内で npm install --omit=dev
console.log("[INFO] Installing production dependencies in dist/...");
execSync("npm install --omit=dev --no-audit", {
  cwd: distDir,
  stdio: "inherit",
});

console.log("");
console.log("配布物を dist/ に作成しました。dist/ を ZIP 等で配布してください。");
console.log("利用者側: 展開後 launch.bat をダブルクリックで起動（フォルダの場所に依存しません）。");
