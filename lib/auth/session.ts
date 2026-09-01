import { cookies } from "next/headers"
import { ALIVE_COOKIE, PERSIST_COOKIE, SESSION_ONLY } from "./session-persistence"

/**
 * 서버에서 로그인 유지 정책을 확인한다.
 *
 * "유지하지 않음"으로 로그인했는데 이 창이 살아 있다는 표시가 없으면
 * 브라우저를 닫았다 다시 연 것이다. 인증 쿠키가 아직 남아 있어도
 * 로그인하지 않은 것으로 다룬다. 첫 렌더부터 이렇게 판단해야
 * 로그인 화면이 잠깐 보였다가 사라지지 않는다.
 */
export const isSessionRetired = async (): Promise<boolean> => {
  const store = await cookies()

  return store.get(PERSIST_COOKIE)?.value === SESSION_ONLY && !store.get(ALIVE_COOKIE)
}
