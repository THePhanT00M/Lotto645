"use client"

import { Loader2, Save, User } from "lucide-react"
import { useEffect, useState } from "react"
import AvatarPicker from "@/components/account/avatar-picker"
import BannerPicker from "@/components/account/banner-picker"
import { Notice } from "@/components/common/notice"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
          setLoadError(data.message ?? "잠시 후 다시 시도해주세요.")
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

      toast({ title: "저장 완료", description: "프로필이 수정되었습니다." })
    } catch (error) {
      toast({
        title: "저장 실패",
        description: error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.",
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
            프로필
          </h1>
          <p className="text-ink-muted mt-1 text-sm">계정에 표시되는 정보를 확인하고 수정합니다.</p>
        </div>

        {loadError && (
            <Notice title="프로필을 불러오지 못했습니다" tone="danger">
              <p className="opacity-90">{loadError}</p>
            </Notice>
        )}

        {/* 배너와 겹친 아바타로 이 화면이 '나'를 다루는 곳임을 먼저 보여 준다. */}
        <Panel className="overflow-hidden p-0">
          <BannerPicker url={bannerUrl} onChange={setBannerUrl} />

          <div className="px-5 pb-5">
            <div className="-mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-end gap-4">
                <AvatarPicker url={avatarUrl} onChange={setAvatarUrl} />

                {/* 아바타 아래 삭제 버튼 자리만큼 띄워, 이름이 사진 옆에 오게 한다. */}
                <div className="min-w-0 pb-7">
                  <div className="text-ink truncate text-xl font-bold">{nickname || "이름 없음"}</div>
                  <div className="text-ink-muted truncate text-sm">{profile?.email}</div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:pb-7">
                <Badge>Lv.{profile?.level ?? 0}</Badge>
                {profile?.role === "admin" && <Badge tone="accent">관리자</Badge>}
              </div>
            </div>

            <div className="border-line mt-5 space-y-5 border-t pt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="닉네임" htmlFor="nickname">
                  <Input
                      id="nickname"
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      placeholder="표시할 이름"
                      className="bg-surface border-line"
                  />
                </Field>

                <Field label="연락처" htmlFor="phone">
                  <Input
                      id="phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value.replace(/[^0-9-]/g, ""))}
                      placeholder="010-0000-0000"
                      className="bg-surface border-line"
                  />
                </Field>
              </div>

              <div className="flex justify-end">
                <Button onClick={save} disabled={isSaving} className="bg-blue-600 text-white hover:bg-blue-700">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  저장
                </Button>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="space-y-3">
          <h2 className="text-ink font-semibold">계정 정보</h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Row label="이메일" value={profile?.email ?? "-"} />
            <Row label="등급" value={`Lv.${profile?.level ?? 0}${profile?.role === "admin" ? " (관리자)" : ""}`} />
            <Row
                label="가입일"
                value={profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : "-"}
            />
          </dl>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
      <div className="flex justify-between gap-3">
        <dt className="text-ink-muted">{label}</dt>
        <dd className="text-ink truncate font-medium">{value}</dd>
      </div>
  )
}

function ProfileSkeleton() {
  return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>

        <Panel className="overflow-hidden p-0">
          <Skeleton className="aspect-[5/1] w-full rounded-none" />

          <div className="px-5 pb-5">
            <div className="-mt-10 flex items-end gap-4">
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="ring-panel h-20 w-20 rounded-full ring-4" />
                <div className="h-6" />
              </div>
              <div className="space-y-2 pb-7">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>

            <div className="border-line mt-5 space-y-5 border-t pt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-10 w-20 rounded-md" />
              </div>
            </div>
          </div>
        </Panel>

        <Skeleton className="h-32 rounded-xl" />
      </div>
  )
}
