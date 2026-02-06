/** 秒を HH:MM:SS 文字列に変換 */
export function secToHms(sec: number): string {
  const h = Math.floor(sec / 3600)
    .toString()
    .padStart(2, "0")
  const m = Math.floor((sec % 3600) / 60)
    .toString()
    .padStart(2, "0")
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0")
  return `${h}:${m}:${s}`
}

export interface ApiSegment {
  start: number
  end: number
  text: string
}

export interface TranscribeResponse {
  segments: ApiSegment[]
  text: string
  durationMs: number
  sessionId: string
}

export async function transcribe(file: File): Promise<TranscribeResponse> {
  const formData = new FormData()
  formData.append("media", file)

  let res: Response
  try {
    res = await fetch("/transcribe", {
      method: "POST",
      body: formData,
    })
  } catch (e) {
    // ネットワークエラー（サーバー未起動など）
    throw new Error(
      "サーバーに接続できません。npm run dev または make dev でサーバーが起動しているか確認し、http://localhost:5173 で開き直してください。"
    )
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || `サーバーエラー: ${res.status}`)
  }

  return res.json()
}
