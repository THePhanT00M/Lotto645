"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { getMessages } from "@/lib/i18n"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales"
import type { Messages } from "@/lib/i18n/messages/types"

interface LocaleValue {
  locale: Locale
  /** 문구 묶음. `t.nav.history` 처럼 바로 꺼내 쓴다. */
  t: Messages
}

const LocaleContext = createContext<LocaleValue>({ locale: DEFAULT_LOCALE, t: getMessages(DEFAULT_LOCALE) })

/**
 * 화면 언어를 아래로 내려 준다.
 *
 * 언어는 서버에서 정해 넘긴다. 브라우저가 정하면 첫 그림과 다시 그린 그림의
 * 언어가 달라져 화면이 한 번 깜빡인다.
 */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: getMessages(locale) }), [locale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

/** 화면에서 문구를 꺼내 쓴다. */
export const useTranslation = (): LocaleValue => useContext(LocaleContext)
