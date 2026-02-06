import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface VersionModalProps {
  open: boolean
  onClose: () => void
}

interface VersionResponse {
  version: string
  history: string
}

export function VersionModal({ open, onClose }: VersionModalProps) {
  const [data, setData] = useState<VersionResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch("/api/version")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => setData({ version: "—", history: "" }))
      .finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-modal-title"
    >
      <div
        className="max-h-[80vh] w-full max-w-lg rounded-xl border border-border bg-card shadow-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="version-modal-title" className="text-lg font-semibold text-foreground">
            バージョン情報
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
            <span className="sr-only">閉じる</span>
          </Button>
        </div>
        <div className="overflow-y-auto px-4 py-4 flex-1 min-h-0">
          {loading ? (
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          ) : data ? (
            <>
              <p className="text-sm font-medium text-foreground mb-2">
                バージョン: {data.version}
              </p>
              {data.history ? (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans border border-border rounded-lg p-3 bg-muted/30 max-h-[50vh] overflow-y-auto">
                  {data.history}
                </pre>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">取得できませんでした。</p>
          )}
        </div>
      </div>
    </div>
  )
}
