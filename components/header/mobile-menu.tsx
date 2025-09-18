"use client"

import Link from "next/link"
import { Search, Bell, ChevronDown, X } from "lucide-react"
import Logo from "./logo"

interface MobileMenuProps {
  showMobileMenu: boolean
  isLoggedIn: boolean
  onToggle: () => void
}

export default function MobileMenu({ showMobileMenu, isLoggedIn, onToggle }: MobileMenuProps) {
  if (!showMobileMenu) return null

  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <Logo />

          <div className="flex items-center space-x-4">
            {isLoggedIn && (
              <>
                <div className="relative">
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
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
              onClick={onToggle}
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
          <Link
            href="/dashboard"
            className="flex items-center px-4 py-3 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg font-medium border-l-4 border-purple-600 dark:border-purple-400"
            onClick={onToggle}
          >
            Dashboard
          </Link>
          <Link
            href="/features"
            className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium"
            onClick={onToggle}
          >
            Projects
          </Link>
          <Link
            href="/testimonials"
            className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium"
            onClick={onToggle}
          >
            Team
          </Link>
          <Link
            href="/faq"
            className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium"
            onClick={onToggle}
          >
            Analytics
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg font-medium"
            onClick={onToggle}
          >
            Settings
          </Link>
        </nav>
      </div>
    </div>
  )
}
