"use client"

import Link from "next/link"
import { useTranslation } from "@/components/i18n/locale-provider"

/** 사이트 하단 정보 영역. */
export default function Footer() {
  const { t } = useTranslation()

  const links = [
    { href: "/terms", label: t.footer.terms },
    { href: "/privacy", label: t.footer.privacy },
    { href: "/contact", label: t.footer.contact },
  ]

  return (
      <footer className="bg-canvas mt-auto w-full">
        <div className="mx-auto w-full 2xl:max-w-shell px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-ink-muted text-sm">{t.footer.rights(new Date().getFullYear())}</p>

            <nav className="flex space-x-6">
              {links.map((link) => (
                  <Link
                      key={link.href}
                      href={link.href}
                      className="text-ink-muted text-sm transition-colors hover:text-blue-600"
                  >
                    {link.label}
                  </Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>
  )
}
