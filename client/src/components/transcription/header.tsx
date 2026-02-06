import { AudioWaveform, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/contexts/theme"

export function TranscriptionHeader() {
  const isDev = import.meta.env.DEV
  const { theme, setTheme } = useTheme()

  const handleClose = () => {
    if (isDev) {
      // 開発モード（npm run dev）ではサーバーを止めず、タブだけ閉じる
      window.close()
      if (!window.closed) {
        alert("開発モードです。タブを手動で閉じてください。\nサーバーは停止していません。")
      }
      return
    }
    if (window.confirm("アプリを終了してサーバーを停止しますか？")) {
      fetch("/shutdown")
        .then(() => {
          window.close()
        })
        .catch(() => {})
    }
  }

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-xl bg-primary p-2.5">
          <AudioWaveform className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Whisper 文字起こしツール
          </h1>
          <p className="text-sm text-muted-foreground">
            音声ファイルから高精度なタイムスタンプ付きテキストを生成
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9 border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
          title={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClose}
          className="border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
        >
          閉じる (アプリ終了)
        </Button>
      </div>
    </header>
  )
}
