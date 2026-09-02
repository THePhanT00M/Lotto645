"use client"

import { BarChart3, Bell, FlaskConical, RefreshCw, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

/** 관리자 화면 목록. 지금까지는 주소를 직접 쳐야 오갈 수 있었다. */
const LINKS = [
  { href: "/admin/members", label: "회원 관리", icon: Users },
  { href: "/admin/stats", label: "통계", icon: BarChart3 },
  { href: "/admin/ai-lab", label: "AI 추천 데이터", icon: FlaskConical },
  { href: "/admin/notifications", label: "알림 발송", icon: Bell },
  { href: "/admin/update", label: "회차 갱신", icon: RefreshCw },
] as const

/** 관리자 화면 상단 메뉴. 좁은 화면에서는 가로로 밀어서 본다. */
export default function AdminNav() {
  const pathname = usePathname()

  return (
      <nav className="border-line bg-canvas border-b">
        <div className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                  key={href}
                  href={href}
                  className={cn(
                      "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === href ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-hover hover:text-ink",
                  )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
          ))}
        </div>
      </nav>
  )
}
