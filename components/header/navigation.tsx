"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, X } from "lucide-react"
import Logo from "./logo"
import ProfileDropdown from "./profile-dropdown"

const navigationItems = [
  { href: "/history", label: "추첨기록" },
  { href: "/winning-numbers", label: "당첨번호" },
  { href: "/faq", label: "FAQ" },
]

interface NavigationProps {
  showMobileMenu?: boolean
  isLoggedIn?: boolean
  onToggleMobileMenu?: () => void
  onLogout: () => void
}

export default function Navigation({
                                     showMobileMenu,
                                     isLoggedIn = false,
                                     onToggleMobileMenu,
                                     onLogout
                                   }: NavigationProps) {
  const pathname = usePathname()

  const isActiveLink = (href: string) => pathname === href

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

  // 데스크톱 네비게이션
  const DesktopNav = () => (
      <nav className="hidden lg:flex items-center space-x-8">
        {navigationItems.map((item) => (
            <Link key={item.href} href={item.href} className={getLinkClasses(item.href)}>
              {item.label}
            </Link>
        ))}
      </nav>
  )

  // 모바일 네비게이션
  const MobileNav = () => {
    if (!showMobileMenu) return null

    return (
        <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-black flex flex-col">
          <div className="w-full bg-white/50 dark:bg-black border-b border-gray-100 dark:border-[rgb(26,26,26)] pt-[env(safe-area-inset-top)]">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <Logo />
              <div className="flex items-center space-x-4 relative">
                {isLoggedIn && (
                    <>
                      <ProfileDropdown onLogout={onLogout} />
                    </>
                )}
                <button
                    onClick={onToggleMobileMenu}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto container mx-auto p-4 sm:p-6">
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