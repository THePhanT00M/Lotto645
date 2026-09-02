"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { authorizedFetch } from "@/lib/auth/client"
import { emitAvatarChanged } from "@/lib/auth/profile-events"
import type { ProfileImageKind } from "@/lib/profile/constants"

/** 종류별 엔드포인트와 응답 필드 */
const ENDPOINTS = {
  avatar: { path: "/api/profile/avatar", field: "avatarUrl", label: "사진" },
  banner: { path: "/api/profile/banner", field: "bannerUrl", label: "배너" },
} as const

const FILE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
}

/**
 * 프로필 이미지를 올리고 지운다.
 *
 * 아바타와 배너는 담기는 곳만 다르고 흐름이 같아 한곳에 둔다.
 */
export function useProfileImage(kind: ProfileImageKind, onChange: (url: string | null) => void) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const { path, field, label } = ENDPOINTS[kind]

  const send = async (init: RequestInit, done: string) => {
    setIsSaving(true)

    try {
      const response = await authorizedFetch(path, init)
      const data = await response.json()

      if (!data.success) throw new Error(data.message)

      const next: string | null = data[field] ?? null
      onChange(next)
      if (kind === "avatar") emitAvatarChanged(next)

      toast({ title: done })
    } catch (error) {
      toast({
        variant: "destructive",
        title: `${label}을 바꾸지 못했습니다`,
        description: error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  /** 잘라 낸 이미지를 올린다. */
  const upload = (image: Blob) => {
    const body = new FormData()
    body.append("file", image, `${kind}.${FILE_EXTENSIONS[image.type] ?? "jpg"}`)

    return send({ method: "POST", body }, `${label}을 바꿨습니다.`)
  }

  const remove = () => send({ method: "DELETE" }, `${label}을 지웠습니다.`)

  return { isSaving, upload, remove }
}
