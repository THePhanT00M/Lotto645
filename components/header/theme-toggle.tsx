"use client"

import { Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"

export default function ThemeToggle() {
  // theme 대신 resolvedTheme을 사용하여 'system' 설정 시에도 실제 적용된(라이트/다크) 테마를 확인합니다.
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Hydration mismatch(서버와 클라이언트의 렌더링 결과 불일치)를 방지하기 위해 마운트 여부를 확인합니다.
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    // 실제 적용된 테마(resolvedTheme)가 라이트이면 다크로, 아니면 라이트로 변경합니다.
    setTheme(resolvedTheme === "light" ? "dark" : "light")
  }

  const getThemeIcon = () => {
    // 현재 라이트 모드라면 클릭 시 전환될 다크 모드를 상징하는 달 아이콘을 표시합니다.
    if (resolvedTheme === "light") {
      return <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    } else {
      // 현재 다크 모드라면 라이트 모드로 전환하기 위한 해 아이콘을 표시합니다.
      return <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    }
  }

  // 컴포넌트가 마운트되기 전에는 레이아웃 깨짐 방지를 위해 빈 영역을 반환합니다.
  if (!mounted) {
    return <div className="w-9 h-9 p-2" />
  }

  return (
      <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1e1e1e] transition-colors"
          aria-label="Toggle theme"
          title={`Current theme: ${resolvedTheme}`}
      >
        {getThemeIcon()}
      </button>
  )
}