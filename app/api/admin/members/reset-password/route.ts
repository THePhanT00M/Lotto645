import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { requireAdmin } from "@/lib/auth/admin"
import { sendPasswordResetMail } from "@/lib/auth/password-reset"
import { getAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/admin/members/reset-password
 *
 * 관리자가 그 회원에게 재설정 메일을 보낸다. 임시 비밀번호를 만들어 알려 주는
 * 대신 링크를 보내므로, 관리자도 그 사람의 비밀번호를 알지 못한다.
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return fail("관리자 권한이 필요합니다.", 403)

    const body = await request.json().catch(() => ({}))
    const userId = typeof body.userId === "string" ? body.userId : ""

    if (!userId) return fail("대상 회원을 찾을 수 없습니다.", 400)

    const { data: target } = await getAdminClient()
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single()

    if (!target?.email) return fail("그 회원의 이메일을 찾을 수 없습니다.", 400)

    await sendPasswordResetMail(target.email, new URL(request.url).origin)

    return ok({ message: `${target.email} 으로 재설정 링크를 보냈습니다.` })
  } catch (error) {
    console.error("회원 비밀번호 재설정 메일 발송 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}
