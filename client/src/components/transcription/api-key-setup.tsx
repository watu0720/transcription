import { useState } from "react"
import { Button } from "@/components/ui/button"
import { KeyRound } from "lucide-react"

interface ApiKeySetupProps {
  onSuccess: () => void
  title?: string
  subtitle?: string
  /** 設定画面から開いた場合（キャンセル可能） */
  allowCancel?: boolean
  onCancel?: () => void
}

export function ApiKeySetup({
  onSuccess,
  title = "OpenAI API キーを設定",
  subtitle = "文字起こしには OpenAI の API キーが必要です。未設定の場合は入力して保存してください。",
  allowCancel = false,
  onCancel,
}: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const key = apiKey.trim()
    if (!key) {
      setError("API キーを入力してください。")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/config/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || "保存に失敗しました。")
        return
      }
      if (data.ok) {
        setApiKey("")
        onSuccess()
      } else {
        setError(data.message || "保存に失敗しました。")
      }
    } catch (err) {
      setError("サーバーに接続できません。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-8 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="api-key" className="block text-sm font-medium text-foreground mb-1.5">
            OpenAI API キー
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoComplete="off"
            disabled={loading}
          />
        </div>
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "保存中..." : "保存"}
          </Button>
          {allowCancel && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
