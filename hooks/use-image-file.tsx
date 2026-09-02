"use client"

import { useRef, useState } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"
import { useToast } from "@/hooks/use-toast"
import { ACCEPTED_TYPES, MAX_SOURCE_BYTES } from "@/lib/profile/constants"

/**
 * 이미지 파일 고르기
 *
 * 숨은 input 과 형식·크기 검사를 한곳에 둔다. 아바타와 배너가 같은 방식으로
 * 파일을 받으므로 화면마다 다시 쓰지 않는다.
 */
export function useImageFile() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  const reject = (title: string) => toast({ variant: "destructive", title })

  /** 화면에 놓아야 파일 선택 창이 열린다. */
  const input = (
      <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(event) => {
            const picked = event.target.files?.[0]
            // 같은 파일을 다시 골라도 change 가 일어나도록 값을 비운다.
            event.target.value = ""

            if (!picked) return
            if (!ACCEPTED_TYPES.includes(picked.type)) return reject(t.image.wrongType)
            if (picked.size > MAX_SOURCE_BYTES) return reject(t.image.tooLarge)

            setFile(picked)
          }}
      />
  )

  return { file, clear: () => setFile(null), open: () => inputRef.current?.click(), input }
}
