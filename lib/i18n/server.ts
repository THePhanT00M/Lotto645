import { cookies, headers } from "next/headers"
import { LOCALE_COOKIE, fromAcceptLanguage, toLocale, type Locale } from "@/lib/i18n/locales"

/**
 * 이번 요청에 쓸 언어
 *
 * 한 번이라도 고른 적이 있으면 그 값이 우선한다. 처음 온 사람에게만 브라우저가
 * 알려 주는 언어를 본다. 계정에 담긴 값은 로그인할 때 이 쿠키로 옮겨 두므로
 * 여기서는 쿠키만 보면 된다.
 */
export const resolveLocale = async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value
  if (saved) return toLocale(saved)

  return fromAcceptLanguage((await headers()).get("accept-language"))
}
