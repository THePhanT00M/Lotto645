"use client"

import { Bell, Settings, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const ICONS = {
  "/account/profile": User,
  "/account/notifications": Bell,
  "/account/settings": Settings,
} as const

interface AccountNavProps {
  links: readonly { href: string; label: string }[]
}

/** 계정 화면 사이드 메뉴. 좁은 화면에서는 가로로 늘어선다. */
export default function AccountNav({ links }: AccountNavProps) {
  const pathname = usePathname()

  return (
      <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {links.map(({ href, label }) => {
          const Icon = ICONS[href as keyof typeof ICONS] ?? User
          const isActive = pathname === href

          return (
              <Link
                  key={href}
                  href={href}
                  className={cn(
                      "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                      isActive
                          ? "bg-accent-soft text-accent"
                          : "text-ink-muted hover:bg-hover hover:text-ink",
                  )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
          )
        })}
      </nav>
  )
}
