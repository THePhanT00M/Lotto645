"use client"

import { Loader2, Save, User } from "lucide-react"
import type { ReactNode } from "react"
import AvatarPicker from "@/components/account/avatar-picker"
import BannerPicker from "@/components/account/banner-picker"
import { Notice } from "@/components/common/notice"
import { Panel } from "@/components/common/panel"
import { useTranslation } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDate } from "@/lib/datetime"
import { cn } from "@/lib/utils"

export interface Profile {
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

interface ProfileViewProps {
  profile: Profile | null
  nickname: string
  phone: string
  avatarUrl: string | null
  bannerUrl: string | null
  loadError: string | null
  isSaving: boolean
  onNicknameChange: (nickname: string) => void
  onPhoneChange: (phone: string) => void
  onAvatarChange: (avatarUrl: string | null) => void
  onBannerChange: (bannerUrl: string | null) => void
  onSave: () => void
}

/**
 * 프로필 화면 본문
 *
 * 스켈레톤도 이 함수를 자리표시 값으로 부른다(profile-skeleton). 화면을 고치면
 * 자리표시가 저절로 따라오도록, 글자는 모두 <sk-t> 로 감싼다.
 */
export default function ProfileView({
  profile,
  nickname,
  phone,
  avatarUrl,
  bannerUrl,
  loadError,
  isSaving,
  onNicknameChange,
  onPhoneChange,
  onAvatarChange,
  onBannerChange,
  onSave,
}: ProfileViewProps) {
  const { t } = useTranslation()

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-ink flex items-center gap-2 text-2xl font-bold">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <sk-t>{t.profile.title}</sk-t>
          </h1>
          <p className="text-ink-muted mt-1 text-sm"><sk-t>{t.profile.description}</sk-t></p>
        </div>

        {loadError && (
            <Notice title={t.profile.loadFailed} tone="danger">
              <p className="opacity-90">{loadError}</p>
            </Notice>
        )}

        {/* 배너와 겹친 아바타로 이 화면이 '나'를 다루는 곳임을 먼저 보여 준다. */}
        <Panel className="overflow-hidden p-0">
          <BannerPicker url={bannerUrl} seed={profile?.id ?? null} onChange={onBannerChange} />

          <div className="px-5 pb-5">
            {/* 아바타만 배너에 걸치고 이름은 그 아래로 내린다. 옆에 두면 글자 높이에
                따라 배너를 침범해 잘린 것처럼 보인다. */}
            <div className="-mt-10 flex items-end justify-between gap-3">
              <AvatarPicker url={avatarUrl} seed={profile?.id ?? null} onChange={onAvatarChange} />

              <div className="flex flex-wrap items-center justify-end gap-1.5 pb-1">
                <Badge>Lv.{profile?.level ?? 0}</Badge>
                {profile?.role === "admin" && <Badge tone="accent">{t.profile.admin}</Badge>}
              </div>
            </div>

            <div className="mt-3 min-w-0">
              <div className="text-ink truncate text-xl font-bold"><sk-t>{nickname || t.profile.noName}</sk-t></div>
              <div className="text-ink-muted truncate text-sm"><sk-t>{profile?.email}</sk-t></div>
              {profile?.joinedAt && (
                  <div className="text-ink-muted mt-1 text-xs">
                    <sk-t>{t.profile.joinedAt(formatDate(profile.joinedAt))}</sk-t>
                  </div>
              )}
            </div>

            <div className="border-line mt-5 space-y-5 border-t pt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t.profile.nickname} htmlFor="nickname">
                  <Input
                      id="nickname"
                      value={nickname}
                      onChange={(event) => onNicknameChange(event.target.value)}
                      placeholder={t.profile.nicknamePlaceholder}
                      className="bg-surface border-line"
                  />
                </Field>

                <Field label={t.profile.phone} htmlFor="phone">
                  <Input
                      id="phone"
                      value={phone}
                      onChange={(event) => onPhoneChange(event.target.value.replace(/[^0-9-]/g, ""))}
                      placeholder={t.profile.phonePlaceholder}
                      className="bg-surface border-line"
                  />
                </Field>
              </div>

              <div className="flex justify-end">
                <Button data-sk-tone onClick={onSave} disabled={isSaving} className="bg-blue-600 text-white hover:bg-blue-700">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  <sk-t>{t.common.save}</sk-t>
                </Button>
              </div>
            </div>
          </div>
        </Panel>
      </div>
  )
}

/** 등급·역할처럼 짧게 붙이는 표시 */
function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" }) {
  return (
      <span
          data-sk-tone={tone === "accent" || undefined}
          className={cn(
              "rounded-md border px-2 py-0.5 text-xs font-semibold",
              tone === "accent"
                  ? "text-accent bg-accent-soft border-accent-line"
                  : "text-ink-muted bg-surface border-line",
          )}
      >
        <sk-t>{children}</sk-t>
      </span>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
      <div className="space-y-1.5">
        <Label htmlFor={htmlFor} className="text-ink text-sm font-medium">
          <sk-t>{label}</sk-t>
        </Label>
        {children}
      </div>
  )
}
