"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Bell, ChevronDown, X } from "lucide-react"
import Logo from "./logo"

const navigationItems = [
  { href: "/winning-numbers", label: "당첨번호" },
  { href: "/history", label: "추첨기록" },
  { href: "/faq", label: "FAQ" },
]

interface NavigationProps {
  showMobileMenu?: boolean
  isLoggedIn?: boolean
  onToggleMobileMenu?: () => void
}

export default function Navigation({ showMobileMenu, isLoggedIn, onToggleMobileMenu }: NavigationProps) {
  const pathname = usePathname()

  const isActiveLink = (href: string) => {
    return pathname === href
  }

  const getLinkClasses = (href: string, isMobile = false) => {
    const isActive = isActiveLink(href)

    if (isMobile) {
      return isActive
        ? "flex items-center px-4 py-3 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 rounded-md font-medium"
        : "block px-4 py-3 text-gray-700 dark:text-gray-300 rounded-md font-medium"
    }

    return isActive
      ? "text-blue-600 dark:text-blue-600 font-semibold transition-colors"
      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
  }

  // Desktop Navigation
  const DesktopNav = () => (
    <nav className="hidden lg:flex items-center space-x-8">
      {navigationItems.map((item) => (
        <Link key={item.href} href={item.href} className={getLinkClasses(item.href)}>
          {item.label}
        </Link>
      ))}
    </nav>
  )

  // Mobile Navigation
  const MobileNav = () => {
    if (!showMobileMenu) return null

    return (
      <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-black">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <Logo />

            <div className="flex items-center space-x-4">
              {isLoggedIn && (
                <>
                  <div className="relative">
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                      3
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <img src="/diverse-group-profile.png" alt="Profile" className="w-8 h-8 rounded-full" />
                    <span className="text-gray-900 dark:text-white font-medium">Sarah</span>
                    <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </div>
                </>
              )}

              <button
                onClick={onToggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close mobile menu"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {isLoggedIn && (
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-3 w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          )}

          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={getLinkClasses(item.href, true)}
                onClick={onToggleMobileMenu}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    )
  }

  return (
    <>
      <DesktopNav />
      <MobileNav />
    </>
  )
}
