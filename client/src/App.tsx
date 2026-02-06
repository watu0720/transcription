import { useState, useCallback, useEffect, useRef } from "react"
import { Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TranscriptionHeader } from "@/components/transcription/header"
import { SpecCards } from "@/components/transcription/spec-cards"
import { FileUpload } from "@/components/transcription/file-upload"
import { StatusBar } from "@/components/transcription/status-bar"
import { ResultsViewer } from "@/components/transcription/results-viewer"
import { DownloadButtons } from "@/components/transcription/download-buttons"
import type { TranscriptionSegment } from "@/components/transcription/results-viewer"
import { transcribe, secToHms } from "@/lib/transcribe"

type Status = "idle" | "processing" | "complete" | "error"

/** ファイルサイズと拡張子からおおよその再生時間（秒）を推定。プログレスバーの進み方に使用 */
function estimateDurationSeconds(file: File): number {
  const mb = file.size / (1024 * 1024)
  const ext = (file.name.split(".").pop() ?? "").toLowerCase()
  // 圧縮形式: 1MB ≒ 1分, 非圧縮WAV: 1MB ≒ 数秒
  const secPerMb = /\.(wav|avi)$/i.test(file.name) ? 12 : 60
  const estimated = mb * secPerMb
  return Math.max(10, Math.min(600, Math.round(estimated))) // 10秒〜10分にクランプ
}

export default function App() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [segments, setSegments] = useState<TranscriptionSegment[]>([])
  const [elapsedTime, setElapsedTime] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [progressPercent, setProgressPercent] = useState(0)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status !== "processing" || !file) return
    setProgressPercent(0)
    const estimatedSeconds = estimateDurationSeconds(file)
    const totalSteps = 45 // 0% → 90% を 2% 刻みで 45 ステップ
    const intervalMs = (estimatedSeconds * 1000) / totalSteps
    const interval = setInterval(() => {
      setProgressPercent((p) => {
        if (p >= 90) return 90
        return p + 2
      })
    }, Math.max(200, intervalMs)) // 最低 200ms 間隔で滑らかに
    progressIntervalRef.current = interval
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [status, file])

  const handleStart = useCallback(() => {
    if (!file) return
    setStatus("processing")
    setSegments([])
    setElapsedTime(null)
    setErrorMessage("")
    setProgressPercent(0)

    transcribe(file)
      .then((data) => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
        setProgressPercent(100)
        const displaySegments: TranscriptionSegment[] = data.segments.map(
          (s) => ({
            start: secToHms(s.start),
            end: secToHms(s.end),
            text: s.text,
          })
        )
        setSegments(displaySegments)
        setElapsedTime(data.durationMs / 1000)
        setStatus("complete")
      })
      .catch((err) => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
        setErrorMessage(err instanceof Error ? err.message : "エラーが発生しました")
        setStatus("error")
      })
  }, [file])

  const handleReset = useCallback(() => {
    setFile(null)
    setStatus("idle")
    setSegments([])
    setElapsedTime(null)
    setErrorMessage("")
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 lg:py-16">
        <div className="flex flex-col gap-6">
          <TranscriptionHeader />

          <SpecCards />

          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <FileUpload file={file} onFileChange={setFile} />

            <div className="flex gap-3">
              <Button
                onClick={handleStart}
                disabled={!file || status === "processing"}
                className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
              >
                {status === "processing" ? (
                  <>
                    <Square className="h-4 w-4" />
                    処理中...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    文字起こし開始
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="border-border bg-transparent text-foreground hover:bg-muted"
              >
                リセット
              </Button>
            </div>
          </div>

          <StatusBar
            status={status}
            elapsedTime={elapsedTime}
            error={errorMessage}
            progressPercent={progressPercent}
          />

          {segments.length > 0 && (
            <>
              <ResultsViewer segments={segments} />
              <DownloadButtons
                segments={segments}
                fileName={file?.name || "transcription"}
              />
            </>
          )}
        </div>
      </div>
    </main>
  )
}
