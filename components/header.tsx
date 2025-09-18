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
      <header className="w-full dark:bg-gray-900">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo />

            <Navigation showMobileMenu={showMobileMenu} isLoggedIn={isLoggedIn} onToggleMobileMenu={toggleMobileMenu} />

            <div className="flex items-center space-x-4">
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
