"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"

/** 라이트/다크 테마를 전환한다. */
export default function ThemeToggle() {
  const { t } = useTranslation()
  // 'system' 설정에서도 실제 적용된 테마를 알아야 하므로 resolvedTheme을 쓴다.
  const { resolvedTheme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)

  // 서버 렌더 결과에는 테마가 없어 하이드레이션 불일치가 생기므로 마운트 후에만 그린다.
  useEffect(() => setIsMounted(true), [])

  if (!isMounted) return <div className="h-9 w-9 p-2" />

  const isLight = resolvedTheme === "light"

  return (
      <button
          type="button"
          onClick={() => setTheme(isLight ? "dark" : "light")}
          aria-label={isLight ? t.header.toDark : t.header.toLight}
          className="rounded-lg p-2 transition-colors hover:bg-hover"
      >
        {isLight ? <Moon className="text-ink-muted h-5 w-5" /> : <Sun className="text-ink-muted h-5 w-5" />}
      </button>
  )
}
