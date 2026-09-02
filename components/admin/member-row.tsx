"use client"

import { ImageUp, Loader2, LogIn, ShieldCheck, Trash2, User } from "lucide-react"
import { useState } from "react"
import ImageCropDialog from "@/components/account/image-crop-dialog"
import { Button } from "@/components/ui/button"
import { useImageFile } from "@/hooks/use-image-file"
import { useProfileImage } from "@/hooks/use-profile-image"
import { useToast } from "@/hooks/use-toast"
import { authorizedFetch } from "@/lib/auth/client"
import type { Member } from "@/hooks/use-admin-members"
import { ADMIN_LEVEL } from "@/lib/auth/levels"
import { profileColor } from "@/lib/profile/colors"

/** 프로필 화면과 같은 크기로 저장해, 나중에 크게 써도 흐려지지 않는다. */
const OUTPUT_WIDTH = 512

/** 고를 수 있는 등급 */
const LEVELS = Array.from({ length: 10 }, (_, level) => level)

interface MemberRowProps {
  member: Member
  /** 자기 자신은 등급을 바꿀 수 없다. 스스로 내리면 다시 들어올 수 없다. */
  isSelf: boolean
  onChangeLevel: (userId: string, level: number) => void
  onChangeAvatar: (userId: string, avatarUrl: string | null) => void
}

/** 회원 한 명. 등급과 프로필 사진을 이 자리에서 바꾼다. */
export default function MemberRow({ member, isSelf, onChangeLevel, onChangeAvatar }: MemberRowProps) {
  const { toast } = useToast()
  const { file, clear, open, input } = useImageFile()
  const [isEntering, setIsEntering] = useState(false)
  const { isSaving, upload, remove } = useProfileImage(
      "avatar",
      (url) => onChangeAvatar(member.id, url),
      member.id,
  )

  const apply = async (image: Blob) => {
    await upload(image)
    clear()
  }

  /** 이 회원 계정으로 화면을 본다. 받은 주소로 옮겨 가면 그 계정으로 로그인된다. */
  const enter = async () => {
    setIsEntering(true)

    try {
      const response = await authorizedFetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id }),
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.message)

      window.location.href = data.url
    } catch (error) {
      setIsEntering(false)
      toast({
        variant: "destructive",
        title: "계정 전환에 실패했습니다",
        description: error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.",
      })
    }
  }

  return (
      <div className="bg-surface border-line flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="border-line h-10 w-10 shrink-0 overflow-hidden rounded-full border">
            {member.avatar_url ? (
                <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
                <span
                    className="flex h-full w-full items-center justify-center"
                    style={{ backgroundColor: profileColor(member.id) }}
                >
                  <User className="h-4 w-4 text-white/90" />
                </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="text-ink flex items-center gap-1.5 truncate font-semibold">
              {member.nickname || "이름 없음"}
              {member.level >= ADMIN_LEVEL && (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="text-ink-muted truncate text-xs">{member.email ?? "-"}</div>
            <div className="text-ink-muted truncate text-xs">
              {member.phone_number || "연락처 없음"} · {new Date(member.created_at).toLocaleDateString()} 가입
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 pl-13 sm:pl-0">
          <label className="text-ink-muted flex items-center gap-1.5 text-xs">
            등급
            <select
                value={member.level}
                disabled={isSelf}
                onChange={(event) => onChangeLevel(member.id, Number(event.target.value))}
                className="bg-surface-2 border-line text-ink h-8 rounded-md border px-2 text-sm disabled:opacity-50"
                title={isSelf ? "자기 등급은 바꿀 수 없습니다." : `${ADMIN_LEVEL} 이상이면 관리자 화면에 들어올 수 있습니다.`}
            >
              {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
              ))}
            </select>
          </label>

          <Button
              variant="outline"
              size="custom"
              onClick={() => void enter()}
              disabled={isSelf || isEntering}
              title={isSelf ? "이미 자기 계정으로 보고 있습니다." : "이 회원 화면을 그대로 확인합니다."}
              className="bg-surface border-line h-8 px-2 text-xs"
          >
            {isEntering ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <LogIn className="mr-1 h-3.5 w-3.5" />}
            이 계정으로
          </Button>

          <Button
              variant="outline"
              size="custom"
              onClick={open}
              disabled={isSaving}
              className="bg-surface border-line h-8 px-2 text-xs"
          >
            {isSaving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <ImageUp className="mr-1 h-3.5 w-3.5" />}
            사진 변경
          </Button>

          {member.avatar_url && (
              <Button
                  variant="ghost"
                  size="custom"
                  onClick={() => void remove()}
                  disabled={isSaving}
                  className="text-ink-muted hover:text-danger h-8 px-2 text-xs"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                기본으로
              </Button>
          )}
        </div>

        <ImageCropDialog
            file={file}
            title={`${member.nickname || "회원"} 사진 자르기`}
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
