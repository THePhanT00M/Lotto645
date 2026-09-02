"use client"

import { Camera, Loader2, Trash2 } from "lucide-react"
import ImageCropDialog from "@/components/account/image-crop-dialog"
import { useImageFile } from "@/hooks/use-image-file"
import { useProfileImage } from "@/hooks/use-profile-image"

/**
 * 배너 비율
 *
 * 화면에 보이는 띠와 잘라 저장하는 비율이 같아야, 고른 영역이 그대로 나온다.
 * 어느 폭에서든 어긋나지 않도록 높이를 고정하지 않고 비율로 잡는다.
 */
const ASPECT = 5

/** 저장할 배너 가로 픽셀. 넓은 화면에서도 흐려지지 않을 만큼만 둔다. */
const OUTPUT_WIDTH = 1200

interface BannerPickerProps {
  url: string | null
  onChange: (bannerUrl: string | null) => void
}

/**
 * 배너 보기·바꾸기
 *
 * 올린 그림이 없으면 기본 그라데이션을 보여 준다. 띠를 누르면 파일을 고르고,
 * 쓸 영역을 정한 뒤 올린다.
 */
export default function BannerPicker({ url, onChange }: BannerPickerProps) {
  const { file, clear, open, input } = useImageFile()
  const { isSaving, upload, remove } = useProfileImage("banner", onChange)

  const apply = async (image: Blob) => {
    await upload(image)
    clear()
  }

  return (
      <div className="group relative aspect-[5/1] w-full overflow-hidden">
        {url ? (
            <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-500" />
        )}

        <button
            type="button"
            onClick={open}
            disabled={isSaving}
            aria-label="배너 바꾸기"
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-100"
        >
          {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                <Camera className="h-4 w-4" />
                배너 바꾸기
              </span>
          )}
        </button>

        {/* 손가락으로 쓰는 화면에는 hover 가 없어, 두 동작을 항상 보이게 둔다. */}
        <div className="absolute top-2 right-2 flex gap-1">
          <IconButton label="배너 바꾸기" onClick={open} disabled={isSaving}>
            <Camera className="h-3.5 w-3.5" />
          </IconButton>

          {url && (
              <IconButton label="배너 삭제" onClick={() => void remove()} disabled={isSaving}>
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
          )}
        </div>

        <ImageCropDialog
            file={file}
            title="배너 자르기"
            aspect={ASPECT}
            outputWidth={OUTPUT_WIDTH}
            isSaving={isSaving}
            onCancel={clear}
            onConfirm={(image) => void apply(image)}
        />

        {input}
      </div>
  )
}

function IconButton({
                      label,
                      onClick,
                      disabled,
                      children,
                    }: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
      <button
          type="button"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-black/45 text-white transition-colors hover:bg-black/65 disabled:opacity-50"
      >
        {children}
      </button>
  )
}
