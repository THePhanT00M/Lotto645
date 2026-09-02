/**
 * 화면 언어
 *
 * 기본은 한국어다. 로또 자체가 한국 로또라 한국어를 먼저 두고, 다른 언어는
 * 고른 사람에게만 보여 준다.
 *
 * 고른 언어는 계정(profiles.language)에 담아 기기를 옮겨도 따라오게 하고,
 * 같은 값을 쿠키에도 둔다. 로그인 전 화면은 계정을 알 수 없기 때문이다.
 */

export const LOCALES = ["ko", "en", "zh", "ja"] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "ko"

/** 언어 고르는 자리에 그 언어로 적는다. 자기 말로 적혀 있어야 찾기 쉽다. */
export const LOCALE_NAMES: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  zh: "中文",
  ja: "日本語",
}

/** 서버와 브라우저가 함께 보는 쿠키 */
export const LOCALE_COOKIE = "lotto-lang"

/** 쿠키를 오래 둔다. 언어는 자주 바꾸는 값이 아니다. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 400

/** 아는 언어면 그대로, 아니면 기본값. */
export const toLocale = (value: string | null | undefined): Locale =>
    LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE

/**
 * Accept-Language 에서 쓸 만한 언어를 고른다.
 *
 * 처음 온 사람에게만 쓴다. 한 번이라도 고르면 그 값이 우선한다.
 */
export const fromAcceptLanguage = (header: string | null | undefined): Locale => {
  if (!header) return DEFAULT_LOCALE

  for (const part of header.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase() ?? ""
    if (!tag) continue

    const base = tag.split("-")[0]
    if (LOCALES.includes(base as Locale)) return base as Locale
  }

  return DEFAULT_LOCALE
}
