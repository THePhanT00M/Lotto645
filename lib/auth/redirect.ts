/**
 * 로그인 후 돌아갈 경로
 *
 * 로그인 버튼은 어느 화면에서나 눌릴 수 있으므로, 보던 경로를 `next` 쿼리로
 * 넘겨 두었다가 로그인이 끝나면 그 자리로 되돌린다. 넘기지 않으면 항상
 * 메인으로 떨어져 하던 일이 끊긴다.
 */

/** 돌아갈 경로를 담는 쿼리 파라미터 이름 */
export const NEXT_PARAM = "next"

/** 돌아갈 곳으로 삼으면 안 되는 화면. 로그인을 마치고 다시 보내면 제자리를 맴돈다. */
const AUTH_PATHS = ["/login", "/register"]

/**
 * 돌아갈 경로로 써도 되는 값인지 확인한다.
 *
 * `//evil.com` 이나 `https://…` 같은 값을 그대로 받으면 로그인 직후 다른
 * 사이트로 보낼 수 있어(오픈 리다이렉트), 같은 사이트 안의 절대 경로만 통과시킨다.
 */
export function sanitizeNextPath(value?: string | null): string | null {
  if (!value) return null
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null

  const path = value.split(/[?#]/)[0]
  if (AUTH_PATHS.includes(path)) return null

  return value
}

/** 지금 보고 있는 주소를 쿼리까지 포함해 돌려준다. 브라우저에서만 값이 있다. */
export function currentPath(): string | null {
  if (typeof window === "undefined") return null
  return `${window.location.pathname}${window.location.search}`
}

/** 로그인·회원가입 주소에 담긴 돌아갈 경로를 읽는다. 없거나 쓸 수 없으면 메인. */
export function readNextPath(search?: string): string {
  const source = search ?? (typeof window === "undefined" ? "" : window.location.search)
  return sanitizeNextPath(new URLSearchParams(source).get(NEXT_PARAM)) ?? "/"
}

/** 메인으로 돌아가는 것은 기본 동작이라 쿼리를 붙이지 않는다. */
const withNext = (base: string, from?: string | null): string => {
  const target = sanitizeNextPath(from)
  return target && target !== "/" ? `${base}?${NEXT_PARAM}=${encodeURIComponent(target)}` : base
}

/** 보던 경로를 기억한 로그인 화면 주소 */
export const loginHref = (from?: string | null): string => withNext("/login", from)

/** 보던 경로를 기억한 회원가입 화면 주소 */
export const registerHref = (from?: string | null): string => withNext("/register", from)
