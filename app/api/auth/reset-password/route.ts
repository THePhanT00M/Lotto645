import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { sendPasswordResetMail } from "@/lib/auth/password-reset"

/**
 * POST /api/auth/reset-password
 *
 * 비밀번호 재설정 메일을 보낸다. 가입한 주소인지와 무관하게 같은 답을 돌려준다.
 * 답이 갈리면 어떤 주소가 가입돼 있는지 훑어볼 수 있기 때문이다.
 */
export async function POST(request: NextRequest) {
  const done = ok({ message: "가입된 주소라면 재설정 링크를 보냈습니다." })

  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === "string" ? body.email.trim() : ""

    if (!email) return fail("이메일을 입력해주세요.", 400)

    await sendPasswordResetMail(email, new URL(request.url).origin)

    return done
  } catch (error) {
    // 없는 주소나 잦은 요청도 화면에는 같은 말로 답한다.
    console.error("비밀번호 재설정 메일 발송 실패:", errorMessage(error))
    return done
  }
}
