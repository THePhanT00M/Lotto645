import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { requireAdmin } from "@/lib/auth/admin"
import {
  IMPERSONATION_COOKIE,
  MAX_AGE_SECONDS,
  readTicket,
  sealTicket,
} from "@/lib/auth/impersonation"
import { getAdminClient } from "@/lib/supabase/admin"
import { createServerSupabase } from "@/lib/supabase/server"

const TABLE = "profiles"
const LOG_TABLE = "admin_impersonations"

/**
 * POST /api/admin/impersonate
 *
 * 회원 계정으로 들어간다. 서버가 그 자리에서 세션을 바꿔 쿠키에 심으므로,
 * 브라우저는 화면만 다시 그리면 된다.
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
    const { data: target } = await supabase.from(TABLE).select("email, nickname").eq("id", targetId).single()

    if (!target?.email) return fail("그 회원의 이메일을 찾을 수 없습니다.", 400)

    // 돌아오지 않고 다시 들어가면 앞 기록이 열린 채 남는다. 쪽지는 하나뿐이라
    // 그 기록은 닫을 방법이 없으므로, 새로 들어갈 때 함께 닫아 준다.
    await supabase.from(LOG_TABLE).update({ ended_at: new Date().toISOString() })
        .eq("admin_id", admin.id).is("ended_at", null)

    // 누가 누구로 들어갔는지 먼저 남긴다. 들어간 뒤에 남기면 중간에 끊겼을 때 흔적이 없다.
    const { data: log, error: logError } = await supabase
        .from(LOG_TABLE)
        .insert({ admin_id: admin.id, target_id: targetId })
        .select("id")
        .single()
    if (logError) throw logError

    // 쪽지를 먼저 넣는다. 세션이 바뀐 뒤에는 관리자 권한으로 아무것도 할 수 없다.
    const store = await cookies()
    store.set(IMPERSONATION_COOKIE, sealTicket({
      adminId: admin.id,
      targetId,
      targetName: target.nickname ?? target.email,
      logId: log.id,
      issuedAt: Math.floor(Date.now() / 1000),
    }), cookieOptions(request))

    await signInAs(target.email)

    return ok({ targetName: target.nickname ?? target.email })
  } catch (error) {
    console.error("회원 계정 전환 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/**
 * DELETE /api/admin/impersonate
 *
 * 관리자 계정으로 돌아온다. 지금 세션은 회원의 것이라 관리자 권한으로 확인할
 * 수 없고, 들어갈 때 감싸 둔 쿠키만으로 판단한다. 그래서 쿠키는 서버 열쇠로
 * 감싸 두었고 오래 두지 않는다.
 */
export async function DELETE(request: NextRequest) {
  try {
    const store = await cookies()
    const ticket = readTicket(store.get(IMPERSONATION_COOKIE)?.value)

    if (!ticket) return fail("돌아갈 정보가 없습니다. 다시 로그인해 주세요.", 400)

    const supabase = getAdminClient()
    const { data: admin } = await supabase.auth.admin.getUserById(ticket.adminId)

    if (!admin?.user?.email) return fail("관리자 계정을 찾을 수 없습니다. 다시 로그인해 주세요.", 400)

    await supabase.from(LOG_TABLE).update({ ended_at: new Date().toISOString() }).eq("id", ticket.logId)

    await signInAs(admin.user.email)
    store.set(IMPERSONATION_COOKIE, "", { ...cookieOptions(request), maxAge: 0 })

    return ok({})
  } catch (error) {
    console.error("관리자 계정 복귀 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/**
 * 그 계정의 세션을 만들어 쿠키에 심는다.
 *
 * 로그인 주소를 브라우저에 넘겨 옮겨 가게 하면, 이미 로그인해 있던 세션이
 * 그대로 남아 화면만 바뀐 것처럼 보이는 일이 있었다. 서버가 한 번짜리 표를
 * 직접 세션으로 바꿔 쿠키에 적으면 그럴 여지가 없다.
 */
const signInAs = async (email: string): Promise<void> => {
  const { data, error } = await getAdminClient().auth.admin.generateLink({ type: "magiclink", email })
  if (error) throw error

  const tokenHash = data?.properties?.hashed_token
  if (!tokenHash) throw new Error("로그인 표를 만들지 못했습니다.")

  const supabase = await createServerSupabase()
  const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" })
  if (verifyError) throw verifyError
}

const cookieOptions = (request: NextRequest) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: new URL(request.url).protocol === "https:",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
})
