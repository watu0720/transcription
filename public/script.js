// script.js
// フロントエンド側の動作を記述
// 1) ファイル選択 2) /transcribe へアップロード 3) 結果表示 & ダウンロード

const fileInput = document.getElementById("file_input");
const transcribeBtn = document.getElementById("transcribe_btn");
const progressSection = document.getElementById("progress");
const statusMsg = document.getElementById("status_msg");
const resultSection = document.getElementById("result");
const resultTextArea = document.getElementById("result_text");
const downloadJsonBtn = document.getElementById("download_json");
const downloadTxtBtn = document.getElementById("download_txt");
const spinner = document.getElementById("spinner");
const closeBtn = document.getElementById("close_btn");

let currentResult = null; // サーバーから受け取った結果を保持

const allowedExt=[".wav",".mp3",".ogg",".flac",".mp4",".avi"]; 

fileInput.addEventListener("change",()=>{
  const file=fileInput.files[0];
  if(!file){transcribeBtn.disabled=true;return;}
  const ext=file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if(!allowedExt.includes(ext)){
    statusMsg.textContent=`対応していないファイル形式です: ${ext}`;
    statusMsg.style.color="red";
    fileInput.value="";
    transcribeBtn.disabled=true;
  }else{
    statusMsg.textContent="";
    statusMsg.style.color="";
    transcribeBtn.disabled=false;
  }
});

// 文字起こし開始
transcribeBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  // UI 更新
  progressSection.classList.remove("hidden");
  spinner.classList.remove("hidden");
  resultSection.classList.add("hidden");
  statusMsg.textContent = "アップロード中...";
  transcribeBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("media", file);

    const res = await fetch("/transcribe", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("サーバーエラー: " + res.status);

    const data = await res.json();
    currentResult = data;

    // 結果表示
    resultTextArea.value = data.text;
    resultSection.classList.remove("hidden");
    if (data.durationMs) {
      const sec = (data.durationMs / 1000).toFixed(2);
      statusMsg.textContent = `完了 (${sec}s)`;
    } else {
      statusMsg.textContent = "完了";
    }
  } catch (err) {
    console.error(err);
    statusMsg.textContent = `エラーが発生しました: ${err.message}`;
  } finally {
    spinner.classList.add("hidden");
    transcribeBtn.disabled = false;
  }
});

// JSON ダウンロード
downloadJsonBtn.addEventListener("click", () => {
  if (!currentResult) return;
  const blob = new Blob([JSON.stringify(currentResult, null, 2)], {
    type: "application/json"
  });
  triggerDownload(blob, "transcription.json");
});

// TXT ダウンロード
downloadTxtBtn.addEventListener("click", () => {
  if (!currentResult) return;
  const blob = new Blob([currentResult.text], { type: "text/plain" });
  triggerDownload(blob, "transcription.txt");
});

/**
 * ブラウザ上でファイルをダウンロードさせるヘルパー
 * @param {Blob} blob
 * @param {string} filename
 */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

closeBtn.addEventListener("click",async()=>{
  if(!confirm("アプリを終了しますか？ (サーバーも停止します)"))return;
  try{await fetch("/shutdown");}catch(_){}
  window.close();
}); 