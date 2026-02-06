import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export interface TranscriptionSegment {
  start: string
  end: string
  text: string
}

interface ResultsViewerProps {
  segments: TranscriptionSegment[]
}

export function ResultsViewer({ segments }: ResultsViewerProps) {
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
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {copiedIndex === -1 ? (
            <Check className="h-3.5 w-3.5 text-accent" />
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
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => copySegment(segment.text, index)}
            >
              {copiedIndex === index ? (
                <Check className="h-3.5 w-3.5 text-accent" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="sr-only">コピー</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
