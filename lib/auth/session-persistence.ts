/**
 * 로그인 상태 유지 여부
 *
 * Supabase는 기본적으로 로그인을 오래 유지한다. 공용 컴퓨터처럼 그걸 원치
 * 않는 경우를 위해, 사용자가 유지를 끄면 브라우저를 닫을 때 로그아웃되도록 한다.
 *
 * 판단에 쓰는 값은 localStorage가 아니라 쿠키에 둔다. 서버 컴포넌트가 첫 렌더에서
 * 함께 읽어야, 로그인 화면이 잠깐 보였다가 사라지는 일이 없다.
 *
 *   lotto-persist=session  유지하지 않겠다는 표시. 브라우저가 기억한다.
 *   lotto-alive=1          이 창이 살아 있다는 표시. 브라우저를 닫으면 사라진다.
 *
 * 둘을 함께 보면 "유지를 끈 채 브라우저를 닫았다 열었는지"를 알 수 있다.
 */

export const PERSIST_COOKIE = "lotto-persist"
export const ALIVE_COOKIE = "lotto-alive"

/** 유지하지 않겠다는 표시에 쓰는 값 */
export const SESSION_ONLY = "session"

/** 유지 표시는 브라우저를 닫아도 남아야 한다 (쿠키 최대치) */
const PERSIST_MAX_AGE = 60 * 60 * 24 * 400

const isBrowser = () => typeof document !== "undefined"

const readCookie = (name: string): string | null => {
  if (!isBrowser()) return null

  const found = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`))
  return found ? decodeURIComponent(found.slice(name.length + 1)) : null
}

const writeCookie = (name: string, value: string, maxAge?: number) => {
  if (!isBrowser()) return

  const parts = [`${name}=${encodeURIComponent(value)}`, "path=/", "SameSite=Lax"]
  // maxAge를 주지 않으면 세션 쿠키가 되어 브라우저를 닫을 때 사라진다.
  if (maxAge !== undefined) parts.push(`max-age=${maxAge}`)
  if (location.protocol === "https:") parts.push("Secure")

  document.cookie = parts.join("; ")
}

const removeCookie = (name: string) => writeCookie(name, "", 0)

/** 로그인 유지를 켤지 저장한다. 로그인 직전에 호출한다. */
export const setRememberLogin = (remember: boolean): void => {
  if (remember) {
    removeCookie(PERSIST_COOKIE)
    removeCookie(ALIVE_COOKIE)
    return
  }

  writeCookie(PERSIST_COOKIE, SESSION_ONLY, PERSIST_MAX_AGE)
  writeCookie(ALIVE_COOKIE, "1")
}

/** 저장된 설정을 읽는다. 값이 없으면 유지하는 쪽을 기본으로 본다. */
export const getRememberLogin = (): boolean => readCookie(PERSIST_COOKIE) !== SESSION_ONLY

/**
 * 새로 연 창에서 지난 세션을 정리해야 하는지 판단한다.
 *
 * 서버도 같은 쿠키로 먼저 판단하지만, 남아 있는 인증 쿠키를 실제로 지우는 것은
 * 브라우저 쪽 몫이라 여기서 한 번 더 확인한다.
 */
export const shouldClearSession = (): boolean =>
    readCookie(PERSIST_COOKIE) === SESSION_ONLY && readCookie(ALIVE_COOKIE) === null

/** 이번 창이 살아 있음을 표시한다. */
export const markSessionAlive = (): void => {
  if (readCookie(PERSIST_COOKIE) === SESSION_ONLY) writeCookie(ALIVE_COOKIE, "1")
}

/** 로그아웃할 때 표시를 지운다. */
export const clearSessionMark = (): void => removeCookie(ALIVE_COOKIE)
