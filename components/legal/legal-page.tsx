"use client"

import type { ReactNode } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"
import { Panel } from "@/components/common/panel"

interface LegalPageProps {
  title: string
  /** 시행일 */
  effectiveDate: string
  children: ReactNode
}

/**
 * 약관·방침 화면의 공통 틀
 *
 * 본문은 한국어만 둔다. 법적 효력이 있는 문서라 옮긴 글이 원문과 조금이라도
 * 어긋나면 다툼의 소지가 된다. 대신 어떤 언어로 보고 있든 한국어가 정본임을
 * 위에 적어 둔다.
 */
export default function LegalPage({ title, effectiveDate, children }: LegalPageProps) {
  const { t, locale } = useTranslation()

  return (
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-ink text-2xl font-bold">{title}</h1>
          <p className="text-ink-muted mt-1 text-sm">{t.legal.updatedAt(effectiveDate)}</p>
        </div>

        {locale !== "ko" && (
            <p className="text-ink-muted bg-surface-2 rounded-lg px-4 py-3 text-sm">{t.legal.koreanOnly}</p>
        )}

        <Panel className="space-y-8">{children}</Panel>
      </div>
  )
}

/** 조항 하나 */
export function Article({ title, children }: { title: string; children: ReactNode }) {
  return (
      <section className="space-y-2">
        <h2 className="text-ink text-lg font-bold">{title}</h2>
        <div className="text-ink-muted space-y-2 text-sm leading-relaxed">{children}</div>
      </section>
  )
}

/** 번호가 붙는 항목들 */
export function Items({ items }: { items: readonly ReactNode[] }) {
  return (
      <ol className="list-outside list-decimal space-y-1 pl-5">
        {items.map((item, index) => (
            <li key={index}>{item}</li>
        ))}
      </ol>
  )
}
