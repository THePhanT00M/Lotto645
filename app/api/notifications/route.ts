import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { getAdminClient } from "@/lib/supabase/admin"
import { createServerSupabase } from "@/lib/supabase/server"

const TABLE = "notifications"

/** 벨 목록에 한 번에 보여줄 최대 개수 */
const LIST_LIMIT = 30

/**
 * GET /api/notifications
 *
 * 로그인한 사용자의 알림을 최신순으로 돌려준다.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) return fail("로그인이 필요합니다.", 401)

    const { data, error } = await getAdminClient()
        .from(TABLE)
        .select("id, title, message, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(LIST_LIMIT)

    if (error) throw error

    return ok({ notifications: data ?? [] })
  } catch (error) {
    console.error("알림 조회 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/**
 * PATCH /api/notifications
 *
 * 알림을 읽음으로 표시한다. id를 주면 그 한 건만, 없으면 전부 처리한다.
 * 다른 사람의 알림을 건드리지 못하도록 언제나 user_id 조건을 함께 건다.
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) return fail("로그인이 필요합니다.", 401)

    const { id } = await request.json().catch(() => ({ id: undefined }))

    const query = getAdminClient().from(TABLE).update({ is_read: true }).eq("user_id", userId)
    const { error } = id ? await query.eq("id", id) : await query.eq("is_read", false)

    if (error) throw error

    return ok({ message: "읽음으로 표시했습니다." })
  } catch (error) {
    console.error("알림 읽음 처리 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/**
 * DELETE /api/notifications
 *
 * 알림을 지운다. id를 주면 그 한 건만, 없으면 본인 알림 전부를 지운다.
 * 남의 알림을 건드리지 못하도록 언제나 user_id 조건을 함께 건다.
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) return fail("로그인이 필요합니다.", 401)

    const { id } = await request.json().catch(() => ({ id: undefined }))

    const query = getAdminClient().from(TABLE).delete().eq("user_id", userId)
    const { data, error } = await (id ? query.eq("id", id) : query).select("id")

    if (error) throw error

    const removed = data?.length ?? 0
    return ok({ removed, message: `${removed}건을 삭제했습니다.` })
  } catch (error) {
    console.error("알림 삭제 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/** 쿠키 세션이나 Authorization 헤더에서 사용자를 찾는다. */
const resolveUserId = async (request: NextRequest): Promise<string | null> => {
  const header = request.headers.get("Authorization")

  if (header?.startsWith("Bearer ")) {
    const { data: { user } } = await getAdminClient().auth.getUser(header.slice("Bearer ".length))
    if (user) return user.id
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}
