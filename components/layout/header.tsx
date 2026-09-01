"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import MobileMenuToggle from "@/components/layout/header/mobile-menu-toggle"
import Navigation from "@/components/layout/header/navigation"
import NotificationBell from "@/components/layout/header/notification-bell"
import ProfileDropdown from "@/components/layout/header/profile-dropdown"
import ThemeToggle from "@/components/layout/header/theme-toggle"
import Logo from "@/components/layout/header/logo"
import { useHeaderData, type UserData } from "@/hooks/use-header-data"
import { clearSessionMark, markSessionAlive, shouldClearSession } from "@/lib/auth/session-persistence"
import { supabase } from "@/lib/supabase/client"

interface HeaderProps {
  /** 서버에서 미리 조회한 사용자. 첫 렌더에서 깜빡임을 막는다. */
  initialUser: UserData | null
  initialUnreadCount: number
}

/** 사이트 상단 헤더. 로그인 상태에 따라 우측 영역이 바뀐다. */
export default function Header({ initialUser, initialUnreadCount }: HeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialUser))
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // 하위 컴포넌트가 각자 조회하지 않도록 헤더에서 한 번만 구독한다.
  const { userData, unreadCount } = useHeaderData(isLoggedIn, initialUser, initialUnreadCount)

  useEffect(() => {
    // 로그인 유지를 끈 채 브라우저를 닫았다 열었다면 지난 세션을 정리한다.
    if (shouldClearSession()) {
      void supabase.auth.signOut()
      setIsLoggedIn(false)
    } else {
      markSessionAlive()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session))
    })

    return () => subscription.unsubscribe()
  }, [])

  const toggleMobileMenu = () => setShowMobileMenu((prev) => !prev)

  const logout = async () => {
    await supabase.auth.signOut()
    clearSessionMark()
    setIsLoggedIn(false)
  }

  return (
      <header className="border-line bg-canvas w-full border-b">
        <div className="mx-auto w-full 2xl:max-w-shell px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />

            <Navigation
                showMobileMenu={showMobileMenu}
                isLoggedIn={isLoggedIn}
                onToggleMobileMenu={toggleMobileMenu}
                onLogout={logout}
                userData={userData}
            />

            <div className="flex items-center gap-2">
              <ThemeToggle />

              {isLoggedIn ? (
                  <>
                    <NotificationBell unreadCount={unreadCount} />
                    <div className="relative hidden items-center gap-4 lg:flex">
                      <ProfileDropdown userData={userData} onLogout={logout} />
                    </div>
                  </>
              ) : (
                  <Link href="/login" className="text-ink-muted hover:text-ink font-medium transition-colors">
                    로그인
                  </Link>
              )}

              <MobileMenuToggle showMobileMenu={showMobileMenu} onToggle={toggleMobileMenu} />
            </div>
          </div>
        </div>
      </header>
  )
}
