import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { resolveUserId } from "@/lib/auth/api-user"
import { getAdminClient } from "@/lib/supabase/admin"

const TABLE = "contact_messages"

/** 너무 짧으면 무슨 일인지 알 수 없고, 너무 길면 표를 어지럽힌다. */
const LIMITS = {
  subject: { min: 1, max: 200 },
  message: { min: 10, max: 5000 },
  email: { max: 320 },
} as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /api/contact
 *
 * 문의를 남긴다. 로그인하지 않아도 남길 수 있고, 로그인한 채라면 누구인지
 * 함께 담아 두어 답변할 때 계정을 찾기 쉽게 한다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    const email = typeof body.email === "string" ? body.email.trim() : ""
    const subject = typeof body.subject === "string" ? body.subject.trim() : ""
    const message = typeof body.message === "string" ? body.message.trim() : ""

    if (!EMAIL_PATTERN.test(email) || email.length > LIMITS.email.max) {
      return fail("답변받을 이메일을 올바르게 입력해 주세요.", 400)
    }
    if (subject.length < LIMITS.subject.min || subject.length > LIMITS.subject.max) {
      return fail("제목을 입력해 주세요.", 400)
    }
    if (message.length < LIMITS.message.min || message.length > LIMITS.message.max) {
      return fail(`내용을 ${LIMITS.message.min}자 이상 적어 주세요.`, 400)
    }

    // 로그인하지 않았어도 문의는 받는다. 누구인지는 알 수 있으면 함께 담는다.
    const userId = await resolveUserId(request).catch(() => null)

    const { error } = await getAdminClient().from(TABLE).insert({ user_id: userId, email, subject, message })
    if (error) throw error

    return ok({ message: "문의를 남겼습니다." })
  } catch (error) {
    console.error("문의 접수 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}
