import { Download, FileJson, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TranscriptionSegment } from "./results-viewer"

interface DownloadButtonsProps {
  segments: TranscriptionSegment[]
  fileName: string
}

export function DownloadButtons({ segments, fileName }: DownloadButtonsProps) {
  const baseName = fileName.replace(/\.[^.]+$/, "")

  const downloadJSON = () => {
    const data = JSON.stringify(segments, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${baseName}_transcription.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadTXT = () => {
    const text = segments
      .map((s) => `[${s.start} - ${s.end}] ${s.text}`)
      .join("\n")
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${baseName}_transcription.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-3">
      <Button
        onClick={downloadJSON}
        variant="outline"
        className="flex-1 gap-2 border-border bg-card text-foreground hover:bg-muted"
      >
        <FileJson className="h-4 w-4 text-primary" />
        <span>JSON ダウンロード</span>
        <Download className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
      </Button>
      <Button
        onClick={downloadTXT}
        variant="outline"
        className="flex-1 gap-2 border-border bg-card text-foreground hover:bg-muted"
      >
        <FileText className="h-4 w-4 text-accent" />
        <span>TXT ダウンロード</span>
        <Download className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  )
}
