import React, { useCallback, useState } from "react"
import { Upload, FileAudio, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  file: File | null
  onFileChange: (file: File | null) => void
}

export function FileUpload({ file, onFileChange }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        onFileChange(droppedFile)
      }
    },
    [onFileChange]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        onFileChange(selectedFile)
      }
    },
    [onFileChange]
  )

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
        isDragging
          ? "border-primary bg-primary/10"
          : file
            ? "border-accent/50 bg-accent/5"
            : "border-border bg-card hover:border-muted-foreground/30"
      }`}
    >
      {file ? (
        <div className="flex w-full items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <FileAudio className="h-6 w-6 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onFileChange(null)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">ファイルを削除</span>
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              ファイルをドラッグ&ドロップ
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              またはクリックして選択 (wav, mp3, ogg, flac)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".wav,.mp3,.ogg,.flac"
            onChange={handleFileInput}
          />
        </label>
      )}
    </div>
  )
}
