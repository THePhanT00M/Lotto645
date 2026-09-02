"use client"

import { Menu, X } from "lucide-react"
import { useTranslation } from "@/components/i18n/locale-provider"

interface MobileMenuToggleProps {
  showMobileMenu: boolean
  onToggle: () => void
}

/** 모바일 메뉴 열기/닫기 버튼. */
export default function MobileMenuToggle({ showMobileMenu, onToggle }: MobileMenuToggleProps) {
  const { t } = useTranslation()
  return (
      <button
          type="button"
          onClick={onToggle}
          aria-label={showMobileMenu ? t.nav.closeMenu : t.nav.openMenu}
          aria-expanded={showMobileMenu}
          className="rounded-lg p-2 transition-colors hover:bg-hover lg:hidden"
      >
        {showMobileMenu ? <X className="text-ink-muted h-5 w-5" /> : <Menu className="text-ink-muted h-5 w-5" />}
      </button>
  )
}
