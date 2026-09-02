/**
 * 인증 오류 문구
 *
 * Supabase 가 돌려주는 말은 모두 영어라 그대로 띄우면 화면에 영문이 섞인다.
 * 코드가 있으면 코드로, 없으면 문장으로 맞춰 우리말로 바꾼다. 코드를 먼저
 * 보는 것은 같은 뜻이라도 문장은 버전에 따라 바뀌기 때문이다.
 */

/** 오류 코드로 맞추는 문구 */
const BY_CODE: Record<string, string> = {
  invalid_credentials: "이메일 또는 비밀번호가 일치하지 않습니다.",
  email_not_confirmed: "이메일 인증을 먼저 마쳐 주세요. 받은 메일의 링크를 눌러 주세요.",
  user_already_exists: "이미 등록된 이메일입니다.",
  email_exists: "이미 등록된 이메일입니다.",
  same_password: "예전 것과 다른 비밀번호를 정해 주세요.",
  weak_password: "비밀번호는 8자 이상이며 영문 대소문자·숫자·특수문자를 모두 포함해야 합니다.",
  over_email_send_rate_limit: "메일을 너무 자주 보냈습니다. 잠시 후 다시 시도해 주세요.",
  over_request_rate_limit: "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.",
  otp_expired: "링크가 만료되었거나 이미 사용되었습니다. 다시 요청해 주세요.",
  session_not_found: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
  user_not_found: "계정을 찾을 수 없습니다.",
}

/** 코드가 없는 예전 응답을 위해 문장으로도 맞춘다. */
const BY_MESSAGE: readonly (readonly [string, string])[] = [
  ["Invalid login credentials", BY_CODE.invalid_credentials],
  ["Email not confirmed", BY_CODE.email_not_confirmed],
  ["User already registered", BY_CODE.user_already_exists],
  ["New password should be different", BY_CODE.same_password],
  ["Password should be at least", BY_CODE.weak_password],
  ["Email rate limit exceeded", BY_CODE.over_email_send_rate_limit],
  ["you can only request this after", "보안을 위해 잠시 후 다시 시도해 주세요."],
  ["Token has expired or is invalid", BY_CODE.otp_expired],
  ["Email link is invalid or has expired", BY_CODE.otp_expired],
  ["Auth session missing", BY_CODE.session_not_found],
  ["Unable to validate email address", "이메일 형식이 올바르지 않습니다."],
]

/** 화면에 띄울 우리말 문구. 아는 오류가 아니면 넘겨준 기본 문구를 쓴다. */
export const describeAuthError = (error: unknown, fallback = "잠시 후 다시 시도해주세요."): string => {
  if (!error) return fallback

  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : ""
  if (code && BY_CODE[code]) return BY_CODE[code]

  const message = error instanceof Error ? error.message : typeof error === "string" ? error : ""
  if (!message) return fallback

  const matched = BY_MESSAGE.find(([needle]) => message.includes(needle))
  return matched ? matched[1] : fallback
}
