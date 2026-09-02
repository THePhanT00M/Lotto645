"use client"

import { Camera, Loader2, Trash2, User } from "lucide-react"
import ImageCropDialog from "@/components/account/image-crop-dialog"
import { useImageFile } from "@/hooks/use-image-file"
import { useProfileImage } from "@/hooks/use-profile-image"
import { profileColor } from "@/lib/profile/colors"
import { cn } from "@/lib/utils"

/** 저장할 아바타 크기. 화면에 80px 로 보이므로 고해상도 화면까지 덮는다. */
const OUTPUT_WIDTH = 512

interface AvatarPickerProps {
  url: string | null
  /** 사진이 없을 때 채울 색을 정하는 값. 회원 id 를 넘긴다. */
  seed: string | null
  onChange: (avatarUrl: string | null) => void
}

/**
 * 아바타 보기·바꾸기
 *
 * 사진을 누르면 파일을 고르고, 쓸 영역을 정한 뒤 올린다. 올리기와 지우기 모두
 * 서버를 거치므로 스토리지 쓰기 권한을 브라우저에 열어 줄 필요가 없다.
 */
export default function AvatarPicker({ url, seed, onChange }: AvatarPickerProps) {
  const { file, clear, open, input } = useImageFile()
  const { isSaving, upload, remove } = useProfileImage("avatar", onChange)

  const apply = async (image: Blob) => {
    await upload(image)
    clear()
  }

  return (
      <div className="relative h-20 w-20 shrink-0">
        <button
            type="button"
            onClick={open}
            disabled={isSaving}
            aria-label="프로필 사진 바꾸기"
            className="group bg-surface border-line ring-panel absolute inset-0 overflow-hidden rounded-full border ring-4 disabled:cursor-not-allowed"
        >
          {url ? (
              <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
              <span
                  className="flex h-full w-full items-center justify-center"
                  style={{ backgroundColor: profileColor(seed) }}
              >
                <User className="h-8 w-8 text-white/90" />
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

        {/* 사진을 바꾸는 것은 원을 누르면 되므로, 따로 표시를 두지 않는다.
            지우기만 겹치지 않는 자리를 따로 갖는다. */}
        {url && (
            <button
                type="button"
                aria-label="프로필 사진 삭제"
                disabled={isSaving}
                onClick={() => void remove()}
                className="border-panel absolute right-0 bottom-0 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-black/70 text-white transition-colors hover:bg-black disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
            </button>
        )}

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
