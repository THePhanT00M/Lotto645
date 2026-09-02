"use client"

import { Camera, Loader2, Trash2 } from "lucide-react"
import ImageCropDialog from "@/components/account/image-crop-dialog"
import { useImageFile } from "@/hooks/use-image-file"
import { useProfileImage } from "@/hooks/use-profile-image"
import { profileGradient } from "@/lib/profile/colors"

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
  /** 기본 그라데이션을 정하는 값. 회원 id 를 넘긴다. */
  seed: string | null
  onChange: (bannerUrl: string | null) => void
}

/**
 * 배너 보기·바꾸기
 *
 * 올린 그림이 없으면 기본 그라데이션을 보여 준다. 띠를 누르면 파일을 고르고,
 * 쓸 영역을 정한 뒤 올린다.
 */
export default function BannerPicker({ url, seed, onChange }: BannerPickerProps) {
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
            <div className="absolute inset-0" style={{ backgroundImage: profileGradient(seed) }} />
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

        {/* 배너를 바꾸는 것은 띠를 누르면 되므로 따로 표시하지 않는다.
            지우기는 같은 자리를 눌러 되지 않으니 제 자리를 갖는다. */}
        {url && (
            <button
                type="button"
                aria-label="배너 삭제"
                onClick={() => void remove()}
                disabled={isSaving}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/45 text-white transition-colors hover:bg-black/65 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
        )}

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
