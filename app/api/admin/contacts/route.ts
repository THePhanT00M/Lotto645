import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { requireAdmin } from "@/lib/auth/admin"
import { getAdminClient } from "@/lib/supabase/admin"

const TABLE = "contact_messages"

/** 한 번에 읽어 올 개수. 더 필요하면 그때 늘린다. */
const PAGE_SIZE = 200

/**
 * GET /api/admin/contacts
 *
 * 들어온 문의를 최근 것부터 돌려준다.
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return fail("관리자 권한이 필요합니다.", 403)

    const { data, error } = await getAdminClient()
        .from(TABLE)
        .select("id, created_at, user_id, email, subject, message, answered_at")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)

    if (error) throw error

    return ok({ messages: data ?? [] })
  } catch (error) {
    console.error("문의 목록 조회 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/**
 * PATCH /api/admin/contacts
 *
 * 답변을 마쳤는지 표시한다. 무엇이 남았는지 눈으로 가리기 위한 것이다.
 */
export async function PATCH(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return fail("관리자 권한이 필요합니다.", 403)

    const body = await request.json().catch(() => ({}))
    const id = Number(body.id)
    const answered = Boolean(body.answered)

    if (!Number.isInteger(id)) return fail("대상 문의를 찾을 수 없습니다.", 400)

    const answeredAt = answered ? new Date().toISOString() : null

    const { error } = await getAdminClient().from(TABLE).update({ answered_at: answeredAt }).eq("id", id)
    if (error) throw error

    return ok({ answeredAt })
  } catch (error) {
    console.error("문의 상태 변경 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}
