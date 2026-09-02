"use client"

import { Loader2, LogOut, UserCheck } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface ImpersonationBannerProps {
  /** 지금 보고 있는 회원 이름 */
  targetName: string
}

/**
 * 회원 계정으로 보는 중임을 알리는 띠
 *
 * 화면이 회원의 것과 똑같아지므로, 표시가 없으면 관리자가 자기 계정으로
 * 착각한 채 무언가를 바꿔 버릴 수 있다. 모든 화면 맨 위에 붙여 둔다.
 */
export default function ImpersonationBanner({ targetName }: ImpersonationBannerProps) {
  const { toast } = useToast()
  const [isLeaving, setIsLeaving] = useState(false)

  const leave = async () => {
    setIsLeaving(true)

    try {
      const response = await fetch("/api/admin/impersonate", { method: "DELETE" })
      const data = await response.json()

      if (!data.success) throw new Error(data.message)

      // 세션은 서버에서 이미 바뀌었다. 들고 있던 화면을 통째로 다시 불러온다.
      window.location.href = "/admin/members"
    } catch (error) {
      setIsLeaving(false)
      toast({
        variant: "destructive",
        title: "돌아가지 못했습니다",
        description: error instanceof Error ? error.message : "다시 로그인해 주세요.",
      })
    }
  }

  return (
      <div className="flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-black">
        <span className="flex items-center gap-1.5">
          <UserCheck className="h-4 w-4" />
          <span className="font-bold">{targetName}</span> 님 계정으로 보는 중입니다
        </span>

        <button
            type="button"
            onClick={() => void leave()}
            disabled={isLeaving}
            className="flex items-center gap-1 rounded-md bg-black/15 px-2 py-1 transition-colors hover:bg-black/25 disabled:opacity-60"
        >
          {isLeaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
          관리자로 돌아가기
        </button>
      </div>
  )
}
