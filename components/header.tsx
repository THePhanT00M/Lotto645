"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import Logo from "./header/logo"
import Navigation from "./header/navigation"
import ThemeToggle from "./header/theme-toggle"
import NotificationBell from "./header/notification-bell"
import ProfileDropdown from "./header/profile-dropdown"
import MobileMenuToggle from "./header/mobile-menu-toggle"
import { useHeaderData, UserData } from "@/hooks/use-header-data"

interface HeaderProps {
  initialUser: UserData | null
  initialUnreadCount: number
}

export default function Header({ initialUser, initialUnreadCount }: HeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!initialUser)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // 훅을 여기서 한 번만 사용하여 모든 하위 컴포넌트에 공급
  const { userData, unreadCount } = useHeaderData(isLoggedIn, initialUser, initialUnreadCount)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const toggleMobileMenu = () => setShowMobileMenu(!showMobileMenu)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
  }

  return (
      <header className="w-full bg-white/50 dark:bg-black border-b border-gray-100 dark:border-[rgb(26,26,26)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <Navigation
                showMobileMenu={showMobileMenu}
                isLoggedIn={isLoggedIn}
                onToggleMobileMenu={toggleMobileMenu}
                onLogout={handleLogout}
                userData={userData}
            />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isLoggedIn ? (
                  <>
                    <NotificationBell unreadCount={unreadCount} />
                    <div className="hidden lg:flex items-center gap-4 relative">
                      <ProfileDropdown userData={userData} onLogout={handleLogout} />
                    </div>
                    <MobileMenuToggle showMobileMenu={showMobileMenu} onToggle={toggleMobileMenu} />
                  </>
              ) : (
                  <>
                    <Link
                        href="/login"
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 transition-colors font-medium"
                    >
                      로그인
                    </Link>
                    <MobileMenuToggle showMobileMenu={showMobileMenu} onToggle={toggleMobileMenu} />
                  </>
              )}
            </div>
          </div>
        </div>
      </header>
  )
}