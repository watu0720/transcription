import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

type Status = "idle" | "processing" | "complete" | "error"

interface StatusBarProps {
  status: Status
  elapsedTime: number | null
  error?: string
}

export function StatusBar({
  status,
  elapsedTime,
  error,
}: StatusBarProps) {
  if (status === "idle") return null

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
          <p className="text-sm font-medium text-foreground">
            文字起こし中...
          </p>
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
          <AlertCircle className="h-6 w-6 shrink-0 text-destructive" />
          <p className="text-sm font-medium text-destructive">
            {error || "エラーが発生しました"}
          </p>
        </>
      )}
    </div>
  )
}
