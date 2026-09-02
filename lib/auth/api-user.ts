import type { NextRequest } from "next/server"
import { getAdminClient } from "@/lib/supabase/admin"
import { createServerSupabase } from "@/lib/supabase/server"

/**
 * 요청을 보낸 사용자의 id.
 *
 * 웹은 쿠키로 세션이 오지만 Capacitor 앱은 출처가 달라 쿠키가 따라오지 않는다.
 * Authorization 헤더를 먼저 보고, 없을 때만 쿠키 세션으로 확인한다.
 */
export const resolveUserId = async (request: NextRequest): Promise<string | null> => {
  const header = request.headers.get("Authorization")

  if (header?.startsWith("Bearer ")) {
    const { data: { user } } = await getAdminClient().auth.getUser(header.slice("Bearer ".length))
    if (user) return user.id
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}
