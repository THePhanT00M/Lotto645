"use client"

import { Camera, Loader2, User } from "lucide-react"
import ImageCropDialog from "@/components/account/image-crop-dialog"
import { Button } from "@/components/ui/button"
import { useImageFile } from "@/hooks/use-image-file"
import { useProfileImage } from "@/hooks/use-profile-image"
import { cn } from "@/lib/utils"

/** 저장할 아바타 크기. 화면에 80px 로 보이므로 고해상도 화면까지 덮는다. */
const OUTPUT_WIDTH = 512

interface AvatarPickerProps {
  url: string | null
  onChange: (avatarUrl: string | null) => void
}

/**
 * 아바타 보기·바꾸기
 *
 * 사진을 누르면 파일을 고르고, 쓸 영역을 정한 뒤 올린다. 올리기와 지우기 모두
 * 서버를 거치므로 스토리지 쓰기 권한을 브라우저에 열어 줄 필요가 없다.
 */
export default function AvatarPicker({ url, onChange }: AvatarPickerProps) {
  const { file, clear, open, input } = useImageFile()
  const { isSaving, upload, remove } = useProfileImage("avatar", onChange)

  const apply = async (image: Blob) => {
    await upload(image)
    clear()
  }

  return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          <button
              type="button"
              onClick={open}
              disabled={isSaving}
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
                    isSaving ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
            >
              {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                  <Camera className="h-5 w-5 text-white" />
              )}
            </span>
          </button>

          {/* 손가락으로 쓰는 화면에는 hover 가 없어, 누를 수 있다는 표시를 따로 둔다. */}
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
                  disabled={isSaving}
                  onClick={() => void remove()}
                  className="text-ink-muted hover:text-danger h-6 px-2 text-xs"
              >
                삭제
              </Button>
          )}
        </div>

        <ImageCropDialog
            file={file}
            title="프로필 사진 자르기"
            aspect={1}
            outputWidth={OUTPUT_WIDTH}
            round
            isSaving={isSaving}
            onCancel={clear}
            onConfirm={(image) => void apply(image)}
        />

        {input}
      </div>
  )
}
