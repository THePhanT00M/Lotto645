import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { ADMIN_LEVEL, requireAdmin } from "@/lib/auth/admin"
import { getAdminClient } from "@/lib/supabase/admin"

const TABLE = "profiles"

/** 부여할 수 있는 등급 범위 */
const MIN_LEVEL = 0
const MAX_LEVEL = 9

/** 목록에 필요한 항목만 읽는다. */
const COLUMNS = "id, email, nickname, avatar_url, banner_url, role, level, phone_number, created_at"

/**
 * GET /api/admin/members
 *
 * 전체 회원을 최근 가입 순으로 돌려준다. 남의 프로필을 읽는 일이라 RLS 를
 * 여는 대신 서버가 서비스 롤로 대신 조회한다.
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return fail("관리자 권한이 필요합니다.", 403)

    const { data, error } = await getAdminClient()
        .from(TABLE)
        .select(COLUMNS)
        .order("created_at", { ascending: false })

    if (error) throw error

    return ok({ members: data ?? [] })
  } catch (error) {
    console.error("회원 목록 조회 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/**
 * PATCH /api/admin/members
 *
 * 등급을 바꾼다. role 은 등급을 따라 함께 정한다. 두 값을 따로 두면 화면에는
 * 관리자로 보이는데 실제로는 못 들어오는 식으로 어긋나기 때문이다.
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) return fail("관리자 권한이 필요합니다.", 403)

    const body = await request.json().catch(() => ({}))
    const userId = typeof body.userId === "string" ? body.userId : ""
    const level = Number(body.level)

    if (!userId) return fail("대상 회원을 찾을 수 없습니다.", 400)

    // 스스로 등급을 내리면 관리자 화면에 다시 들어올 수 없다.
    if (userId === admin.id) return fail("자기 등급은 여기서 바꿀 수 없습니다.", 400)

    if (!Number.isInteger(level) || level < MIN_LEVEL || level > MAX_LEVEL) {
      return fail(`등급은 ${MIN_LEVEL}에서 ${MAX_LEVEL} 사이여야 합니다.`, 400)
    }

    const role = level >= ADMIN_LEVEL ? "admin" : "user"

    const { error } = await getAdminClient().from(TABLE).update({ level, role }).eq("id", userId)
    if (error) throw error

    return ok({ level, role })
  } catch (error) {
    console.error("회원 등급 변경 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}
