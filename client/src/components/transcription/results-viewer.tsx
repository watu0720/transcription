import { Copy, Check, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useCallback } from "react"

export interface TranscriptionSegment {
  start: string
  end: string
  text: string
}

/** ファイル名用にサニタイズ（禁則文字・長さ制限） */
function sanitizeForFilename(text: string, maxLen = 30): string {
  if (!text.trim()) return ""
  const replaced = text.replace(/[\\/:*?"<>|\n\r\t]+/g, " ").trim()
  return replaced.length <= maxLen ? replaced : replaced.slice(0, maxLen)
}

interface ResultsViewerProps {
  segments: TranscriptionSegment[]
  sessionId: string | null
}

export function ResultsViewer({ segments, sessionId }: ResultsViewerProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [segmentError, setSegmentError] = useState<string | null>(null)

  const copySegment = useCallback((text: string, index: number) => {
    setCopyError(null)
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
      },
      () => {
        setCopyError("コピーに失敗しました。対策: ブラウザの権限（クリップボード）を許可するか、テキストを手動で選択してコピーしてください。")
        setTimeout(() => setCopyError(null), 3000)
      }
    )
  }, [])

  const copyAll = useCallback(() => {
    setCopyError(null)
    const fullText = segments
      .map((s) => `[${s.start} - ${s.end}] ${s.text}`)
      .join("\n")
    navigator.clipboard.writeText(fullText).then(
      () => {
        setCopiedIndex(-1)
        setTimeout(() => setCopiedIndex(null), 2000)
      },
      () => {
        setCopyError("コピーに失敗しました。対策: ブラウザの権限（クリップボード）を許可するか、テキストを手動で選択してコピーしてください。")
        setTimeout(() => setCopyError(null), 3000)
      }
    )
  }, [segments])

  const downloadSegmentWav = useCallback(
    async (index: number, downloadName: string) => {
      if (sessionId == null) return
      setSegmentError(null)
      try {
        const res = await fetch(`/segment/${sessionId}/${index}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || `ダウンロードに失敗しました (${res.status})`)
        }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = downloadName
        a.click()
        URL.revokeObjectURL(url)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "WAV のダウンロードに失敗しました。対策: もう一度お試しください。"
        setSegmentError(msg.includes("対策:") ? msg : `${msg} 対策: もう一度お試しください。`)
        setTimeout(() => setSegmentError(null), 4000)
      }
    },
    [sessionId]
  )

  return (
    <div className="rounded-xl border border-border bg-card">
      {(copyError != null || segmentError != null) && (
        <div className="flex flex-col gap-1.5 border-b border-border px-5 py-2.5">
          {copyError != null && (
            <p className="text-sm text-destructive" role="alert">{copyError}</p>
          )}
          {segmentError != null && (
            <p className="text-sm text-destructive" role="alert">{segmentError}</p>
          )}
        </div>
      )}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            文字起こし結果
          </h2>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {segments.length} セグメント
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyAll}
          className={`gap-1.5 text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground ${
            copiedIndex === -1 ? "!bg-accent !text-white" : ""
          }`}
        >
          {copiedIndex === -1 ? (
            <Check className="h-3.5 w-3.5 text-white" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          全てコピー
        </Button>
      </div>
      <div>
        {segments.map((segment, index) => (
          <div
            key={index}
            className="group flex items-start gap-3 border-b border-border/50 px-5 py-1.5 transition-colors last:border-0 hover:bg-muted/50"
          >
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {segment.start}
            </span>
            <p className="flex-1 text-sm leading-snug text-foreground">
              {segment.text}
            </p>
            <div className="flex shrink-0 items-center gap-0.5">
              {sessionId != null && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-muted/40 dark:hover:bg-accent dark:hover:text-accent-foreground"
                  title="WAV でダウンロード"
                  onClick={() => {
                    const serif = sanitizeForFilename(segment.text)
                    const name = serif
                      ? `${String(index + 1).padStart(3, "0")}_${serif}.wav`
                      : `${String(index + 1).padStart(3, "0")}.wav`
                    downloadSegmentWav(index, name)
                  }}
                >
                  <Download className="h-3.5 w-3.5 text-muted-foreground dark:text-white" />
                  <span className="sr-only">WAV ダウンロード</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 hover:bg-muted/40 dark:hover:bg-accent dark:hover:text-accent-foreground ${
                  copiedIndex === index ? "!bg-accent !text-white" : ""
                }`}
                onClick={() => copySegment(segment.text, index)}
              >
                {copiedIndex === index ? (
                  <Check className="h-3.5 w-3.5 text-white" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground dark:text-white" />
                )}
                <span className="sr-only">コピー</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
