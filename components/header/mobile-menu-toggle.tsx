"use client"

import { Menu, X } from "lucide-react"

interface MobileMenuToggleProps {
  showMobileMenu: boolean
  onToggle: () => void
}

export default function MobileMenuToggle({ showMobileMenu, onToggle }: MobileMenuToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle mobile menu"
    >
      {showMobileMenu ? (
        <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      ) : (
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      )}
    </button>
  )
}
