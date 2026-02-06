import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

type Status = "idle" | "processing" | "complete" | "error"

interface StatusBarProps {
  status: Status
  elapsedTime: number | null
  error?: string
  /** 0–100。processing 時に左から右へ進む進捗（未指定時は従来の固定表示） */
  progressPercent?: number
}

export function StatusBar({
  status,
  elapsedTime,
  error,
  progressPercent = 0,
}: StatusBarProps) {
  if (status === "idle") return null

  const percent =
    status === "complete" ? 100 : Math.min(100, Math.max(0, progressPercent))

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-5 py-3.5 ${
        status === "processing"
          ? "border-primary/30 bg-primary/5"
          : status === "complete"
            ? "border-accent/30 bg-accent/5"
            : "border-destructive/30 bg-destructive/5"
      }`}
    >
      {status === "processing" && (
        <>
          <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              文字起こし中...
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/60 transition-[width] duration-300 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </>
      )}
      {status === "complete" && (
        <>
          <CheckCircle2 className="h-4.5 w-4.5 text-accent" />
          <p className="text-sm font-medium text-foreground">
            完了
            {elapsedTime !== null && (
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                ({elapsedTime.toFixed(2)}s)
              </span>
            )}
          </p>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-4.5 w-4.5 text-destructive" />
          <p className="text-sm font-medium text-destructive">
            {error || "エラーが発生しました"}
          </p>
        </>
      )}
    </div>
  )
}
