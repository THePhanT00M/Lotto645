"use client"

import { X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Logo from "@/components/layout/header/logo"
import ProfileDropdown from "@/components/layout/header/profile-dropdown"
import type { UserData } from "@/hooks/use-header-data"
import { cn } from "@/lib/utils"

/** 헤더와 모바일 메뉴가 함께 쓰는 링크 목록 */
const NAV_LINKS = [
  { href: "/history", label: "추첨기록" },
  { href: "/winning-numbers", label: "당첨번호" },
  { href: "/faq", label: "FAQ" },
] as const

interface NavigationProps {
  showMobileMenu: boolean
  isLoggedIn: boolean
  onToggleMobileMenu: () => void
  onLogout: () => void
  userData: UserData | null
}

/** 데스크톱 내비게이션과 모바일 전체화면 메뉴. */
export default function Navigation({
                                     showMobileMenu,
                                     isLoggedIn,
                                     onToggleMobileMenu,
                                     onLogout,
                                     userData,
                                   }: NavigationProps) {
  const pathname = usePathname()

  const linkClass = (href: string, isMobile: boolean) => {
    const isActive = pathname === href

    if (isMobile) {
      return cn(
          "block rounded-md px-4 py-3 font-medium",
          isActive ? "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" : "text-ink",
      )
    }

    return cn(
        "font-medium transition-colors",
        isActive ? "text-blue-600 dark:text-blue-600" : "text-ink-muted hover:text-ink",
    )
  }

  return (
      <>
        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href, false)}>
                {link.label}
              </Link>
          ))}
        </nav>

        {showMobileMenu && (
            <div className="bg-canvas fixed inset-0 z-50 flex flex-col lg:hidden">
              <div className="border-line border-b pt-[env(safe-area-inset-top)]">
                <div className="mx-auto flex w-full 2xl:max-w-shell items-center justify-between px-4 py-4">
                  <Logo />
                  <div className="relative flex items-center gap-2">
                    {isLoggedIn && <ProfileDropdown userData={userData} onLogout={onLogout} />}
                    <button
                        type="button"
                        onClick={onToggleMobileMenu}
                        aria-label="메뉴 닫기"
                        className="rounded-lg p-2 transition-colors hover:bg-hover"
                    >
                      <X className="text-ink-muted h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <nav className="mx-auto w-full 2xl:max-w-shell flex-1 space-y-1 overflow-y-auto p-4 sm:p-6">
                {NAV_LINKS.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={onToggleMobileMenu}
                        className={linkClass(link.href, true)}
                    >
                      {link.label}
                    </Link>
                ))}
              </nav>
            </div>
        )}
      </>
  )
}
