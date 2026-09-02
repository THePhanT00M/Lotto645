"use client"

import { BarChart3, Bell, FlaskConical, Mail, RefreshCw, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "@/components/i18n/locale-provider"
import { cn } from "@/lib/utils"

/** 관리자 화면 목록. 이름은 화면에서 그때의 언어로 붙인다. */
const LINKS = [
  { href: "/admin/members", key: "members", icon: Users },
  { href: "/admin/stats", key: "stats", icon: BarChart3 },
  { href: "/admin/ai-lab", key: "aiLab", icon: FlaskConical },
  { href: "/admin/contacts", key: "contacts", icon: Mail },
  { href: "/admin/notifications", key: "notifications", icon: Bell },
  { href: "/admin/update", key: "update", icon: RefreshCw },
] as const

/** 관리자 화면 상단 메뉴. 좁은 화면에서는 가로로 밀어서 본다. */
export default function AdminNav() {
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
      <nav className="border-line bg-canvas border-b">
        <div className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {LINKS.map(({ href, key, icon: Icon }) => (
              <Link
                  key={href}
                  href={href}
                  className={cn(
                      "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === href ? "bg-accent-soft text-accent" : "text-ink-muted hover:bg-hover hover:text-ink",
                  )}
              >
                <Icon className="h-4 w-4" />
                {t.admin.nav[key]}
              </Link>
          ))}
        </div>
      </nav>
  )
}
