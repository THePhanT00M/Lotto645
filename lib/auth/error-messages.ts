/**
 * 인증 오류를 가리키는 이름
 *
 * Supabase 가 돌려주는 말은 모두 영어라 그대로 띄우면 화면에 영문이 섞인다.
 * 여기서는 어떤 오류인지 이름만 가려내고, 그 말은 화면이 그때의 언어로 붙인다.
 *
 * 코드가 있으면 코드로, 없으면 문장으로 맞춘다. 코드를 먼저 보는 것은 같은
 * 뜻이라도 문장은 버전에 따라 바뀌기 때문이다.
 */

export type AuthErrorKey =
    | "invalidCredentials"
    | "emailNotConfirmed"
    | "userAlreadyExists"
    | "samePassword"
    | "weakPassword"
    | "emailRateLimit"
    | "requestRateLimit"
    | "otpExpired"
    | "sessionNotFound"
    | "userNotFound"
    | "emailFormat"
    | "unknown"

/** 오류 코드로 맞추는 이름 */
const BY_CODE: Record<string, AuthErrorKey> = {
  invalid_credentials: "invalidCredentials",
  email_not_confirmed: "emailNotConfirmed",
  user_already_exists: "userAlreadyExists",
  email_exists: "userAlreadyExists",
  same_password: "samePassword",
  weak_password: "weakPassword",
  over_email_send_rate_limit: "emailRateLimit",
  over_request_rate_limit: "requestRateLimit",
  otp_expired: "otpExpired",
  session_not_found: "sessionNotFound",
  user_not_found: "userNotFound",
}

/** 코드가 없는 예전 응답을 위해 문장으로도 맞춘다. */
const BY_MESSAGE: readonly (readonly [string, AuthErrorKey])[] = [
  ["Invalid login credentials", "invalidCredentials"],
  ["Email not confirmed", "emailNotConfirmed"],
  ["User already registered", "userAlreadyExists"],
  ["New password should be different", "samePassword"],
  ["Password should be at least", "weakPassword"],
  ["Email rate limit exceeded", "emailRateLimit"],
  ["you can only request this after", "requestRateLimit"],
  ["Token has expired or is invalid", "otpExpired"],
  ["Email link is invalid or has expired", "otpExpired"],
  ["Auth session missing", "sessionNotFound"],
  ["Unable to validate email address", "emailFormat"],
]

/** 어떤 오류인지 가려낸다. 아는 오류가 아니면 "unknown". */
export const authErrorKey = (error: unknown): AuthErrorKey => {
  if (!error) return "unknown"

  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : ""
  if (code && BY_CODE[code]) return BY_CODE[code]

  const message = error instanceof Error ? error.message : typeof error === "string" ? error : ""
  if (!message) return "unknown"

  const matched = BY_MESSAGE.find(([needle]) => message.includes(needle))
  return matched ? matched[1] : "unknown"
}
