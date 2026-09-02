"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { loginHref } from "@/lib/auth/redirect"
import { supabase } from "@/lib/supabase/client"
import type { UserData } from "@/hooks/use-header-data"
import { useToast } from "@/hooks/use-toast"

/** 관리자 기능을 쓸 수 있는 최소 등급 */
const ADMIN_LEVEL = 2

/**
 * 관리자 권한을 확인하고 전체 회원 목록을 불러온다.
 *
 * 권한이 없으면 안내 후 홈으로, 비로그인 상태면 로그인 화면으로 보낸다.
 */
export function useAdminUsers() {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(loginHref(pathname))
        return
      }

      const { data: profile } = await supabase.from("profiles").select("level").eq("id", user.id).single()

      if (!profile || profile.level < ADMIN_LEVEL) {
        toast({
          variant: "destructive",
          title: "접근 권한 없음",
          description: "어드민 등급 이상의 권한이 필요합니다.",
        })
        router.push("/")
        return
      }

      const { data: rows, error } = await supabase
          .from("profiles")
          .select("id, nickname, email, avatar_url, role, level")
          .order("created_at", { ascending: false })

      if (cancelled) return

      if (error) {
        console.error("회원 목록을 불러오지 못했습니다:", error.message)
      } else {
        setUsers((rows ?? []).map(toUserData))
      }
      setIsLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [router, toast])

  return { users, isLoading }
}

const toUserData = (row: {
  id: string
  nickname: string | null
  email: string | null
  avatar_url: string | null
  role: string | null
  level: number | null
}): UserData => ({
  id: row.id,
  name: row.nickname || "이름 없음",
  email: row.email || "",
  avatarUrl: row.avatar_url,
  role: (row.role as UserData["role"]) ?? "user",
  level: row.level ?? 0,
})
