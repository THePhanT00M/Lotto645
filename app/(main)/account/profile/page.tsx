"use client"

import { Loader2, Save, User } from "lucide-react"
import { useEffect, useState } from "react"
import AvatarPicker from "@/components/account/avatar-picker"
import BannerPicker from "@/components/account/banner-picker"
import ProfileSkeleton from "@/components/account/profile-skeleton"
import { useTranslation } from "@/components/i18n/locale-provider"
import { Notice } from "@/components/common/notice"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { authorizedFetch } from "@/lib/auth/client"
import { cn } from "@/lib/utils"

interface Profile {
  id: string
  email: string
  nickname: string | null
  phone_number: string | null
  avatar_url: string | null
  banner_url: string | null
  role: string
  level: number
  joinedAt: string | null
}

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
      <div className="space-y-6">
        <div>
          <h1 className="text-ink flex items-center gap-2 text-2xl font-bold">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {t.profile.title}
          </h1>
          <p className="text-ink-muted mt-1 text-sm">{t.profile.description}</p>
        </div>

        {loadError && (
            <Notice title={t.profile.loadFailed} tone="danger">
              <p className="opacity-90">{loadError}</p>
            </Notice>
        )}

        {/* 배너와 겹친 아바타로 이 화면이 '나'를 다루는 곳임을 먼저 보여 준다. */}
        <Panel className="overflow-hidden p-0">
          <BannerPicker url={bannerUrl} seed={profile?.id ?? null} onChange={setBannerUrl} />

          <div className="px-5 pb-5">
            {/* 아바타만 배너에 걸치고 이름은 그 아래로 내린다. 옆에 두면 글자 높이에
                따라 배너를 침범해 잘린 것처럼 보인다. */}
            <div className="-mt-10 flex items-end justify-between gap-3">
              <AvatarPicker url={avatarUrl} seed={profile?.id ?? null} onChange={setAvatarUrl} />

              <div className="flex flex-wrap items-center justify-end gap-1.5 pb-1">
                <Badge>Lv.{profile?.level ?? 0}</Badge>
                {profile?.role === "admin" && <Badge tone="accent">{t.profile.admin}</Badge>}
              </div>
            </div>

            <div className="mt-3 min-w-0">
              <div className="text-ink truncate text-xl font-bold">{nickname || t.profile.noName}</div>
              <div className="text-ink-muted truncate text-sm">{profile?.email}</div>
              {profile?.joinedAt && (
                  <div className="text-ink-muted mt-1 text-xs">
                    {t.profile.joinedAt(new Date(profile.joinedAt).toLocaleDateString())}
                  </div>
              )}
            </div>

            <div className="border-line mt-5 space-y-5 border-t pt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t.profile.nickname} htmlFor="nickname">
                  <Input
                      id="nickname"
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      placeholder={t.profile.nicknamePlaceholder}
                      className="bg-surface border-line"
                  />
                </Field>

                <Field label={t.profile.phone} htmlFor="phone">
                  <Input
                      id="phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value.replace(/[^0-9-]/g, ""))}
                      placeholder={t.profile.phonePlaceholder}
                      className="bg-surface border-line"
                  />
                </Field>
              </div>

              <div className="flex justify-end">
                <Button onClick={save} disabled={isSaving} className="bg-blue-600 text-white hover:bg-blue-700">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {t.common.save}
                </Button>
              </div>
            </div>
          </div>
        </Panel>

      </div>
  )
}

/** 등급·역할처럼 짧게 붙이는 표시 */
function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "accent" }) {
  return (
      <span
          className={cn(
              "rounded-md border px-2 py-0.5 text-xs font-semibold",
              tone === "accent"
                  ? "text-accent bg-accent-soft border-accent-line"
                  : "text-ink-muted bg-surface border-line",
          )}
      >
        {children}
      </span>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
      <div className="space-y-1.5">
        <Label htmlFor={htmlFor} className="text-ink text-sm font-medium">
          {label}
        </Label>
        {children}
      </div>
  )
}
