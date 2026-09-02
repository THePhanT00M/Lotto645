import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales"
import en from "@/lib/i18n/messages/en"
import ja from "@/lib/i18n/messages/ja"
import ko from "@/lib/i18n/messages/ko"
import type { Messages } from "@/lib/i18n/messages/types"
import zh from "@/lib/i18n/messages/zh"

const DICTIONARIES: Record<Locale, Messages> = { ko, en, zh, ja }

/** 그 언어의 문구 묶음. 모르는 언어면 기본 언어로 돌린다. */
export const getMessages = (locale: Locale): Messages => DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]
