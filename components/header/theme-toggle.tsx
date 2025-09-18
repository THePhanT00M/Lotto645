"use client"

import { Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else {
      setTheme("light")
    }
  }

  const getThemeIcon = () => {
    if (theme === "light") {
      return <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    } else {
      return <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
      title={mounted ? `Current theme: ${theme}` : "Loading theme..."}
    >
      {mounted ? getThemeIcon() : <div className="w-5 h-5" />}
    </button>
  )
}
