"use client"

import Link from "next/link"
import { History, Menu } from "lucide-react"
import { useState } from "react"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm bg-white/90">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">로또</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              로또 추첨기
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/winning-numbers"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <History className="w-5 h-5" />
              <span>역대 당첨번호</span>
            </Link>
            <Link
              href="/history"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <History className="w-5 h-5" />
              <span>추첨 기록</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden flex items-center text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pt-3 pb-2 border-t mt-3 border-gray-100 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/winning-numbers"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <History className="w-5 h-5" />
                <span>역대 당첨번호</span>
              </Link>
              <Link
                href="/history"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <History className="w-5 h-5" />
                <span>추첨 기록</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
