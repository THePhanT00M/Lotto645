"use client"

import { Camera, Loader2, User } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { authorizedFetch } from "@/lib/auth/client"
import { emitAvatarChanged } from "@/lib/auth/profile-events"
import { cn } from "@/lib/utils"

/** 서버와 같은 제한. 올리기 전에 걸러 헛걸음을 줄인다. */
const MAX_BYTES = 2 * 1024 * 1024
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"]

interface AvatarPickerProps {
  url: string | null
  onChange: (avatarUrl: string | null) => void
}

/**
 * 아바타 보기·바꾸기
 *
 * 사진을 누르면 파일 선택이 열린다. 올리기와 지우기 모두 서버를 거치므로
 * 스토리지 쓰기 권한을 브라우저에 열어 줄 필요가 없다.
 */
export default function AvatarPicker({ url, onChange }: AvatarPickerProps) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isBusy, setIsBusy] = useState(false)

  const send = async (init: RequestInit, done: string) => {
    setIsBusy(true)

    try {
      const response = await authorizedFetch("/api/profile/avatar", init)
      const data = await response.json()

      if (!data.success) throw new Error(data.message)

      const next: string | null = data.avatarUrl ?? null
      onChange(next)
      emitAvatarChanged(next)
      toast({ title: done })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "사진을 바꾸지 못했습니다",
        description: error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.",
      })
    } finally {
      setIsBusy(false)
    }
  }

  const upload = (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast({ variant: "destructive", title: "PNG·JPG·WEBP·GIF 형식만 올릴 수 있습니다." })
      return
    }

    if (file.size > MAX_BYTES) {
      toast({ variant: "destructive", title: "이미지는 2MB 이하만 올릴 수 있습니다." })
      return
    }

    const body = new FormData()
    body.append("file", file)

    void send({ method: "POST", body }, "사진을 바꿨습니다.")
  }

  return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isBusy}
              aria-label="프로필 사진 바꾸기"
              className="group bg-surface border-line ring-panel relative block h-20 w-20 overflow-hidden rounded-full border ring-4 disabled:cursor-not-allowed"
          >
            {url ? (
                <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <User className="text-ink-muted h-8 w-8" />
                </span>
            )}

            <span
                className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity",
                    isBusy ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
            >
              {isBusy ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                  <Camera className="h-5 w-5 text-white" />
              )}
            </span>
          </button>

          {/* 손가락으로 쓰는 화면에는 hover가 없어, 누를 수 있다는 표시를 따로 둔다. */}
          <span className="border-panel pointer-events-none absolute right-0 bottom-0 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-blue-600">
            <Camera className="h-3 w-3 text-white" />
          </span>
        </div>

        {/* 사진이 없을 때도 자리를 비워 두어 삭제 버튼이 나타나도 배치가 흔들리지 않는다. */}
        <div className="flex h-6 items-center">
          {url && (
              <Button
                  type="button"
                  variant="ghost"
                  size="custom"
                  disabled={isBusy}
                  onClick={() => void send({ method: "DELETE" }, "사진을 지웠습니다.")}
                  className="text-ink-muted hover:text-danger h-6 px-2 text-xs"
              >
                삭제
              </Button>
          )}
        </div>

        <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              // 같은 파일을 다시 골라도 change가 일어나도록 값을 비운다.
              event.target.value = ""
              if (file) upload(file)
            }}
        />
      </div>
  )
}
