import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { requireAdmin } from "@/lib/auth/admin"
import {
  IMPERSONATION_COOKIE,
  MAX_AGE_SECONDS,
  readTicket,
  sealTicket,
} from "@/lib/auth/impersonation"
import { getAdminClient } from "@/lib/supabase/admin"

const TABLE = "profiles"
const LOG_TABLE = "admin_impersonations"

/**
 * POST /api/admin/impersonate
 *
 * 회원 계정으로 들어간다. 그 계정으로 로그인되는 한 번짜리 주소를 만들어
 * 돌려주고, 돌아올 관리자를 감싼 쿠키에 적어 둔다. 브라우저는 받은 주소로
 * 옮겨 가면 된다.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    if (!admin) return fail("관리자 권한이 필요합니다.", 403)

    const body = await request.json().catch(() => ({}))
    const targetId = typeof body.userId === "string" ? body.userId : ""

    if (!targetId) return fail("대상 회원을 찾을 수 없습니다.", 400)
    if (targetId === admin.id) return fail("이미 자기 계정으로 보고 있습니다.", 400)

    const supabase = getAdminClient()
    const { data: target } = await supabase
        .from(TABLE)
        .select("email, nickname")
        .eq("id", targetId)
        .single()

    if (!target?.email) return fail("그 회원의 이메일을 찾을 수 없습니다.", 400)

    // 누가 누구로 들어갔는지 먼저 남긴다. 들어간 뒤에 남기면 중간에 끊겼을 때 흔적이 없다.
    const { data: log, error: logError } = await supabase
        .from(LOG_TABLE)
        .insert({ admin_id: admin.id, target_id: targetId })
        .select("id")
        .single()
    if (logError) throw logError

    const url = await createSignInLink(request, target.email)

    const response = NextResponse.json({ success: true, url })
    response.cookies.set(IMPERSONATION_COOKIE, sealTicket({
      adminId: admin.id,
      targetId,
      targetName: target.nickname ?? target.email,
      logId: log.id,
      issuedAt: Math.floor(Date.now() / 1000),
    }), cookieOptions(request))

    return response
  } catch (error) {
    console.error("회원 계정 전환 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/**
 * DELETE /api/admin/impersonate
 *
 * 관리자 계정으로 돌아온다. 지금 세션은 회원의 것이므로 관리자 권한으로
 * 확인할 수 없고, 들어갈 때 감싸 둔 쿠키만으로 판단한다. 그래서 쿠키는
 * 서버 열쇠로 감싸 두었고 오래 두지 않는다.
 */
export async function DELETE(request: NextRequest) {
  try {
    const ticket = readTicket(request.cookies.get(IMPERSONATION_COOKIE)?.value)
    if (!ticket) return fail("돌아갈 정보가 없습니다. 다시 로그인해 주세요.", 400)

    const supabase = getAdminClient()
    const { data: admin } = await supabase.auth.admin.getUserById(ticket.adminId)

    if (!admin?.user?.email) return fail("관리자 계정을 찾을 수 없습니다. 다시 로그인해 주세요.", 400)

    await supabase.from(LOG_TABLE).update({ ended_at: new Date().toISOString() }).eq("id", ticket.logId)

    const url = await createSignInLink(request, admin.user.email)

    const response = NextResponse.json({ success: true, url })
    response.cookies.set(IMPERSONATION_COOKIE, "", { ...cookieOptions(request), maxAge: 0 })

    return response
  } catch (error) {
    console.error("관리자 계정 복귀 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/** 그 계정으로 로그인되는 한 번짜리 주소 */
const createSignInLink = async (request: NextRequest, email: string): Promise<string> => {
  const origin = new URL(request.url).origin

  const { data, error } = await getAdminClient().auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: origin },
  })

  if (error) throw error

  const link = data?.properties?.action_link
  if (!link) throw new Error("로그인 주소를 만들지 못했습니다.")

  return link
}

const cookieOptions = (request: NextRequest) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: new URL(request.url).protocol === "https:",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
})
