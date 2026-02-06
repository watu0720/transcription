import { Copy, Check, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

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

  const copySegment = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const copyAll = () => {
    const fullText = segments
      .map((s) => `[${s.start} - ${s.end}] ${s.text}`)
      .join("\n")
    navigator.clipboard.writeText(fullText)
    setCopiedIndex(-1)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="rounded-xl border border-border bg-card">
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
      <div className="max-h-[420px] overflow-y-auto">
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
                  asChild
                >
                  <a
                    href={`/segment/${sessionId}/${index}`}
                    download={
                      (() => {
                        const serif = sanitizeForFilename(segment.text)
                        return serif
                          ? `${String(index + 1).padStart(3, "0")}_${serif}.wav`
                          : `${String(index + 1).padStart(3, "0")}.wav`
                      })()
                    }
                  >
                    <Download className="h-3.5 w-3.5 text-muted-foreground dark:text-white" />
                    <span className="sr-only">WAV ダウンロード</span>
                  </a>
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
