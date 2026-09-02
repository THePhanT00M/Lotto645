import { getMailerClient } from "@/lib/supabase/mailer"

/** 링크를 누르면 도착할 화면 */
export const UPDATE_PASSWORD_PATH = "/update-password"

/**
 * 비밀번호 재설정 메일을 보낸다.
 *
 * 회원이 직접 요청하든 관리자가 대신 보내든 같은 메일·같은 링크를 쓴다.
 * 한 곳에서 만들어야 두 길이 갈라지지 않는다.
 */
export const sendPasswordResetMail = async (email: string, origin: string): Promise<void> => {
  const { error } = await getMailerClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}${UPDATE_PASSWORD_PATH}`,
  })

  if (error) throw error
}
