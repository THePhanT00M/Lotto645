"use client"

import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { authorizedFetch } from "@/lib/auth/client"

/** 관리자 목록에 보이는 회원 한 명 */
export interface Member {
  id: string
  email: string | null
  nickname: string | null
  avatar_url: string | null
  banner_url: string | null
  role: string
  level: number
  phone_number: string | null
  created_at: string
}

/**
 * 전체 회원 목록과 그 자리에서 하는 변경.
 *
 * 바꾼 뒤 목록을 다시 불러오지 않고 그 회원만 갈아 끼운다. 목록이 통째로
 * 다시 그려지면 스크롤 자리와 열어 둔 것이 흐트러진다.
 */
export function useAdminMembers() {
  const { toast } = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await authorizedFetch("/api/admin/members")
      const data = await response.json()

      if (!data.success) throw new Error(data.message)

      setMembers(Array.isArray(data.members) ? data.members : [])
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "회원 목록을 불러오지 못했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  /** 목록에서 그 회원만 바꾼다. */
  const patch = useCallback((userId: string, changes: Partial<Member>) => {
    setMembers((previous) => previous.map((member) => (member.id === userId ? { ...member, ...changes } : member)))
  }, [])

  const changeLevel = useCallback(
      async (userId: string, level: number) => {
        try {
          const response = await authorizedFetch("/api/admin/members", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, level }),
          })
          const data = await response.json()

          if (!data.success) throw new Error(data.message)

          patch(userId, { level: data.level, role: data.role })
          toast({ title: `등급을 ${data.level}로 바꿨습니다.` })
        } catch (caught) {
          toast({
            variant: "destructive",
            title: "등급을 바꾸지 못했습니다",
            description: caught instanceof Error ? caught.message : "잠시 후 다시 시도해주세요.",
          })
        }
      },
      [patch, toast],
  )

  return { members, isLoading, error, reload: load, changeLevel, patch }
}
