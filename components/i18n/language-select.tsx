"use client"

import { Languages } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"
import { authorizedFetch } from "@/lib/auth/client"
import { writeLocaleCookie } from "@/lib/i18n/client"
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/locales"

/**
 * 언어 고르기
 *
 * 고른 값은 쿠키에 적어 로그인 전 화면에서도 이어지게 하고, 로그인한 사람은
 * 계정에도 함께 남겨 기기를 옮겨도 따라오게 한다. 계정 저장이 실패해도 이번
 * 브라우저에서는 바뀐 대로 보인다.
 */
export default function LanguageSelect() {
  const router = useRouter()
  const { locale, t } = useTranslation()
  const [isPending, startTransition] = useTransition()

  const change = (next: Locale) => {
    writeLocaleCookie(next)

    void authorizedFetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: next }),
    }).catch(() => {
      // 로그인하지 않았거나 저장에 실패해도 쿠키만으로 화면은 바뀐다.
    })

    startTransition(() => router.refresh())
  }

  return (
      <div className="relative">
        <Languages className="text-ink-muted pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
        <select
            value={locale}
            disabled={isPending}
            onChange={(event) => change(event.target.value as Locale)}
            aria-label={t.nav.language}
            className="text-ink-muted hover:text-ink hover:bg-hover h-9 cursor-pointer appearance-none rounded-lg bg-transparent py-0 pr-2 pl-7 text-sm font-medium transition-colors focus:outline-none disabled:opacity-60"
        >
          {LOCALES.map((option) => (
              <option key={option} value={option} className="bg-surface text-ink">
                {LOCALE_NAMES[option]}
              </option>
          ))}
        </select>
      </div>
  )
}
