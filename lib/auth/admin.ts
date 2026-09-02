import type { NextRequest } from "next/server"
import { resolveUserId } from "@/lib/auth/api-user"
import { isSessionRetired } from "@/lib/auth/session"
import { getAdminClient } from "@/lib/supabase/admin"
import { ADMIN_LEVEL } from "@/lib/auth/levels"
import { createServerSupabase } from "@/lib/supabase/server"

export { ADMIN_LEVEL } from "@/lib/auth/levels"

interface AdminUser {
  id: string
  email: string
  level: number
  role: string
}

/**
 * 관리자 화면에 들어올 수 있는지와, 막혔다면 그 이유.
 *
 * 로그인은 했지만 등급이 모자란 경우("denied")와 아예 로그인하지 않은 경우("guest")를
 * 구분해야 막힌 화면에서 로그인한 사람에게 다시 로그인을 권하지 않는다.
 */
export type AdminAccess =
    | { status: "ok"; user: AdminUser }
    | { status: "denied" }
    | { status: "guest" }

/** 서버 컴포넌트에서 현재 사용자의 관리자 접근 여부를 확인한다. */
export const getAdminAccess = async (): Promise<AdminAccess> => {
  if (await isSessionRetired()) return { status: "guest" }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: "guest" }

  const { data: profile } = await supabase.from("profiles").select("level, role").eq("id", user.id).single()
  if (!profile || (profile.level ?? 0) < ADMIN_LEVEL) return { status: "denied" }

  return {
    status: "ok",
    user: { id: user.id, email: user.email ?? "", level: profile.level as number, role: profile.role as string },
  }
}

/**
 * API 라우트에서 관리자 권한을 확인한다.
 *
 * 브라우저에서 온 요청은 쿠키 세션을, 외부 호출은 Authorization 헤더를 쓴다.
 * 권한이 없으면 null을 돌려주고, 호출한 쪽에서 401로 끊는다.
 */
export const requireAdmin = async (request: NextRequest): Promise<{ id: string } | null> => {
  const userId = await resolveUserId(request)
  if (!userId) return null

  // 등급 조회는 RLS 정책과 무관하게 확인해야 하므로 서비스 롤을 쓴다.
  const { data: profile } = await getAdminClient().from("profiles").select("level").eq("id", userId).single()
  if (!profile || (profile.level ?? 0) < ADMIN_LEVEL) return null

  return { id: userId }
}

/**
 * 사람이 아닌 호출(스케줄러 등)인지 확인한다.
 *
 * CRON_SECRET을 설정해 두면 그 값을 가진 요청만 통과한다.
 * 설정하지 않았다면 해당 경로는 관리자 세션으로만 쓸 수 있다.
 */
export const hasCronSecret = (request: NextRequest): boolean => {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const header = request.headers.get("Authorization") ?? request.headers.get("x-cron-secret") ?? ""
  return header === secret || header === `Bearer ${secret}`
}
