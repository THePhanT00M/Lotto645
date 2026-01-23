"use client"

import Link from "next/link"
import { useState, useEffect } from "react" // useEffect 추가
import { supabase } from "@/lib/supabaseClient" // supabase 클라이언트 임포트

import Logo from "./header/logo"
import Navigation from "./header/navigation"
import SearchBar from "./header/search-bar"
import ThemeToggle from "./header/theme-toggle"
import NotificationBell from "./header/notification-bell"
import ProfileDropdown from "./header/profile-dropdown"
import MobileMenuToggle from "./header/mobile-menu-toggle"

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // 컴포넌트 마운트 시 및 인증 상태 변경 시 상태 업데이트
  useEffect(() => {
    // 1. 현재 세션 확인
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }

    checkUser()

    // 2. 인증 상태 변경 감지 (로그인/로그아웃 등)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut() // 실제 Supabase 로그아웃 처리
    setIsLoggedIn(false)
  }

  return (
      <>
        <header className="w-full bg-white/50 dark:bg-black border-b border-gray-100 dark:border-[rgb(26,26,26)]">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Logo />
              <Navigation
                  showMobileMenu={showMobileMenu}
                  isLoggedIn={isLoggedIn}
                  onToggleMobileMenu={toggleMobileMenu}
                  onLogout={handleLogout}
              />
              <div className="flex items-center gap-4">
                {/*<SearchBar isLoggedIn={isLoggedIn} />*/}
                <ThemeToggle />
                {isLoggedIn ? (
                    <>
                      <NotificationBell />
                      <div className="hidden lg:flex items-center gap-4 relative">
                        <ProfileDropdown onLogout={handleLogout} />
                      </div>
                      <MobileMenuToggle showMobileMenu={showMobileMenu} onToggle={toggleMobileMenu} />
                    </>
                ) : (
                    <>
                      <Link
                          href="/login"
                          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
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
      </>
  )
}