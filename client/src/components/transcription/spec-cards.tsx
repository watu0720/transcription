import { FileAudio, Scissors, FileText, Clock } from "lucide-react"

const specs = [
  {
    icon: FileAudio,
    title: "対応形式",
    description: "wav / mp3 / ogg / flac",
  },
  {
    icon: Scissors,
    title: "自動分割",
    description: "最長9分ごとに分割しWhisperへ送信",
  },
  {
    icon: FileText,
    title: "出力形式",
    description: "タイムスタンプ付きテキスト + JSON",
  },
  {
    icon: Clock,
    title: "処理時間",
    description: "文字起こし完了時に処理時間を表示",
  },
]

export function SpecCards() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {specs.map((spec) => (
        <div
          key={spec.title}
          className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <spec.icon className="h-4.5 w-4.5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{spec.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {spec.description}
          </p>
        </div>
      ))}
    </div>
  )
}
