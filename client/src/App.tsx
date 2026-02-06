import { useState, useCallback } from "react"
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

export default function App() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [segments, setSegments] = useState<TranscriptionSegment[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")

  const handleStart = useCallback(() => {
    if (!file) return
    setStatus("processing")
    setSegments([])
    setSessionId(null)
    setElapsedTime(null)
    setErrorMessage("")

    transcribe(file)
      .then((data) => {
        const displaySegments: TranscriptionSegment[] = data.segments.map(
          (s) => ({
            start: secToHms(s.start),
            end: secToHms(s.end),
            text: s.text,
          })
        )
        setSegments(displaySegments)
        setSessionId(data.sessionId)
        setElapsedTime(data.durationMs / 1000)
        setStatus("complete")
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : "エラーが発生しました")
        setStatus("error")
      })
  }, [file])

  const handleReset = useCallback(() => {
    setFile(null)
    setStatus("idle")
    setSegments([])
    setSessionId(null)
    setElapsedTime(null)
    setErrorMessage("")
  }, [])

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-3xl">
          <TranscriptionHeader />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pt-24 pb-24">
        <div className="mx-auto max-w-3xl px-4 py-10 lg:py-16">
          <div className="flex flex-col gap-6">
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
                  variant="outlineCard"
                  size="lg"
                  className="border-border"
                >
                  リセット
                </Button>
              </div>
            </div>

            <StatusBar
              status={status}
              elapsedTime={elapsedTime}
              error={errorMessage}
            />

            {segments.length > 0 && (
              <ResultsViewer
                segments={segments}
                sessionId={sessionId}
              />
            )}
          </div>
        </div>
      </div>

      {segments.length > 0 && (
        <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="mx-auto max-w-3xl">
            <DownloadButtons
              segments={segments}
              fileName={file?.name || "transcription"}
              sessionId={sessionId}
            />
          </div>
        </footer>
      )}
    </main>
  )
}
