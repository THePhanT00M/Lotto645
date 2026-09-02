"use client"

import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "@/lib/i18n/locales"

/**
 * 고른 언어를 쿠키에 적는다.
 *
 * 서버가 첫 화면을 그릴 때 이 값을 본다. 계정에도 함께 담지만, 로그인 전
 * 화면에서는 계정을 알 수 없어 쿠키가 기준이 된다.
 */
export const writeLocaleCookie = (locale: Locale): void => {
  document.cookie = [
    `${LOCALE_COOKIE}=${locale}`,
    "path=/",
    "SameSite=Lax",
    `max-age=${LOCALE_COOKIE_MAX_AGE}`,
    ...(location.protocol === "https:" ? ["Secure"] : []),
  ].join("; ")
}
