"use client"

import Link from "next/link"
import { useState } from "react"

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

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  return (
      <>
        <header className="w-full bg-white/50 dark:bg-black border-b border-gray-100 dark:border-[rgb(26,26,26)]">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Logo />
              <Navigation showMobileMenu={showMobileMenu} isLoggedIn={isLoggedIn} onToggleMobileMenu={toggleMobileMenu} />
              <div className="flex items-center gap-4">
                <SearchBar isLoggedIn={isLoggedIn} />
                <ThemeToggle />
                {isLoggedIn ? (
                    <>
                      <NotificationBell />
                      <ProfileDropdown onLogout={handleLogout} />
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
                      {/* 이 컴포넌트 내부의 lg:hidden 클래스에 의해 PC에서는 보이지 않습니다. */}
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