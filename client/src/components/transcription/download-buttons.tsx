import { useState } from "react"
import { Download, FileJson, FileText, FileArchive } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TranscriptionSegment } from "./results-viewer"

interface DownloadButtonsProps {
  segments: TranscriptionSegment[]
  fileName: string
  sessionId: string | null
}

export function DownloadButtons({
  segments,
  fileName,
  sessionId,
}: DownloadButtonsProps) {
  const baseName = fileName.replace(/\.[^.]+$/, "")
  const [zipLoading, setZipLoading] = useState(false)

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

  const downloadZIP = async () => {
    if (sessionId == null) return
    setZipLoading(true)
    try {
      const res = await fetch(`/segment/${sessionId}/zip`)
      if (!res.ok) throw new Error("ZIP の取得に失敗しました")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${baseName}_segments.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    } finally {
      setZipLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={downloadJSON}
        variant="outlineCard"
        className="flex-1 gap-2 border-border"
      >
        <FileJson className="h-4 w-4 text-primary" />
        <span>JSON ダウンロード</span>
        <Download className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
      </Button>
      <Button
        onClick={downloadTXT}
        variant="outlineCard"
        className="flex-1 gap-2 border-border min-w-[140px]"
      >
        <FileText className="h-4 w-4 text-accent" />
        <span>TXT ダウンロード</span>
        <Download className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
      </Button>
      {sessionId != null && (
        <Button
          onClick={downloadZIP}
          disabled={zipLoading}
          variant="outlineCard"
          className="flex-1 gap-2 border-border min-w-[140px]"
        >
          <FileArchive className="h-4 w-4 text-primary" />
          <span>{zipLoading ? "作成中..." : "ZIP 一括ダウンロード"}</span>
          <Download className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}
