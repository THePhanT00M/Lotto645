"use client"

import { Menu, X } from "lucide-react"

interface MobileMenuToggleProps {
  showMobileMenu: boolean
  onToggle: () => void
}

/** 모바일 메뉴 열기/닫기 버튼. */
export default function MobileMenuToggle({ showMobileMenu, onToggle }: MobileMenuToggleProps) {
  return (
      <button
          type="button"
          onClick={onToggle}
          aria-label={showMobileMenu ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={showMobileMenu}
          className="rounded-lg p-2 transition-colors hover:bg-hover lg:hidden"
      >
        {showMobileMenu ? <X className="text-ink-muted h-5 w-5" /> : <Menu className="text-ink-muted h-5 w-5" />}
      </button>
  )
}
