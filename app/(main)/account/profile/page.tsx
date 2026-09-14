"use client"

import { useEffect, useState } from "react"
import ProfileSkeleton from "@/components/account/profile-skeleton"
import ProfileView, { type Profile } from "@/components/account/profile-view"
import { useTranslation } from "@/components/i18n/locale-provider"
import { useToast } from "@/hooks/use-toast"
import { authorizedFetch } from "@/lib/auth/client"

/**
 * 프로필
 *
 * 닉네임과 연락처처럼 본인이 고칠 수 있는 항목만 편집하고,
 * 이메일·등급처럼 계정 관리에 속한 값은 보여주기만 한다.
 */
export default function ProfilePage() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [nickname, setNickname] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await authorizedFetch("/api/profile")
        const data = await response.json()

        if (cancelled) return

        // 실패를 조용히 넘기면 빈 프로필이 그려져, 정보가 사라진 것처럼 보인다.
        if (!data.success) {
          setLoadError(data.message ?? t.auth.errors.unknown)
          return
        }

        setProfile(data.profile)
        setNickname(data.profile.nickname ?? "")
        setPhone(data.profile.phone_number ?? "")
        setAvatarUrl(data.profile.avatar_url ?? null)
        setBannerUrl(data.profile.banner_url ?? null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const save = async () => {
    setIsSaving(true)

    try {
      const response = await authorizedFetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, phone_number: phone }),
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.message)

      toast({ title: t.profile.saved, description: t.profile.savedDescription })
    } catch (error) {
      toast({
        title: t.profile.saveFailed,
        description: error instanceof Error ? error.message : t.auth.errors.unknown,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <ProfileSkeleton />

  return (
      <ProfileView
          profile={profile}
          nickname={nickname}
          phone={phone}
          avatarUrl={avatarUrl}
          bannerUrl={bannerUrl}
          loadError={loadError}
          isSaving={isSaving}
          onNicknameChange={setNickname}
          onPhoneChange={setPhone}
          onAvatarChange={setAvatarUrl}
          onBannerChange={setBannerUrl}
          onSave={() => void save()}
      />
  )
}
