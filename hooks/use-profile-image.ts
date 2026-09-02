"use client"

import { useState } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"
import { useToast } from "@/hooks/use-toast"
import { authorizedFetch } from "@/lib/auth/client"
import { emitAvatarChanged } from "@/lib/auth/profile-events"
import type { ProfileImageKind } from "@/lib/profile/constants"

/** 종류별 엔드포인트와 응답 필드 */
const ENDPOINTS = {
  avatar: { path: "/api/profile/avatar", field: "avatarUrl" },
  banner: { path: "/api/profile/banner", field: "bannerUrl" },
} as const

/** 관리자가 남의 사진을 다룰 때 쓰는 경로 */
const ADMIN_AVATAR_PATH = "/api/admin/members/avatar"

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
export function useProfileImage(
    kind: ProfileImageKind,
    onChange: (url: string | null) => void,
    /** 관리자가 다른 회원의 사진을 다룰 때만 넘긴다. 없으면 자기 것이다. */
    targetUserId?: string,
) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const { field } = ENDPOINTS[kind]
  const label = kind === "avatar" ? t.image.avatarLabel : t.image.bannerLabel
  const path = targetUserId ? ADMIN_AVATAR_PATH : ENDPOINTS[kind].path

  const send = async (init: RequestInit, done: string, query = "") => {
    setIsSaving(true)

    try {
      const response = await authorizedFetch(`${path}${query}`, init)
      const data = await response.json()

      if (!data.success) throw new Error(data.message)

      const next: string | null = data[field] ?? null
      onChange(next)
      // 헤더가 들고 있는 것은 내 사진뿐이라, 남의 것을 바꿀 때는 알리지 않는다.
      if (kind === "avatar" && !targetUserId) emitAvatarChanged(next)

      toast({ title: done })
    } catch (error) {
      toast({
        variant: "destructive",
        title: t.image.failed(label),
        description: error instanceof Error ? error.message : t.auth.errors.unknown,
      })
    } finally {
      setIsSaving(false)
    }
  }

  /** 잘라 낸 이미지를 올린다. */
  const upload = (image: Blob) => {
    const body = new FormData()
    body.append("file", image, `${kind}.${FILE_EXTENSIONS[image.type] ?? "jpg"}`)
    if (targetUserId) body.append("userId", targetUserId)

    return send({ method: "POST", body }, t.image.changed(label))
  }

  const remove = () =>
      send({ method: "DELETE" }, t.image.removed(label), targetUserId ? `?userId=${targetUserId}` : "")

  return { isSaving, upload, remove }
}
