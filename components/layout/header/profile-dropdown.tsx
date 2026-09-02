"use client"

import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"
import type { UserData } from "@/hooks/use-header-data"
import { profileColor } from "@/lib/profile/colors"
import { cn } from "@/lib/utils"

interface ProfileDropdownProps {
  userData: UserData | null
  onLogout: () => void
  /**
   * 메뉴에서 화면을 옮길 때 함께 정리할 것.
   *
   * 모바일에서는 이 메뉴가 전체화면 메뉴 위에 뜬다. 드롭다운만 닫으면 아래 깔린
   * 메뉴가 옮겨 간 화면을 계속 가려, 직접 닫아야만 내용이 보인다.
   */
  onNavigate?: () => void
}

/** 프로필 버튼과 계정 메뉴. 바깥을 누르면 닫힌다. */
export default function ProfileDropdown({ userData, onLogout, onNavigate }: ProfileDropdownProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const close = () => {
    setIsOpen(false)
    onNavigate?.()
  }

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  return (
      <div className="relative" ref={containerRef}>
        <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg px-2 transition-colors hover:bg-hover"
        >
          {userData?.avatarUrl ? (
              <img src={userData.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
              <span
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: profileColor(userData?.id) }}
              >
                <User className="h-4 w-4 text-white/90" />
              </span>
          )}

          <span className="text-ink font-medium">{userData?.name ?? t.nav.profile}</span>
          <ChevronDown className={cn("text-ink-muted h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
            <div className="bg-surface border-line absolute top-full right-0 z-50 mt-2 w-64 rounded-lg border py-2 shadow-lg">
              <div className="border-line border-b px-4 py-3">
                <div className="text-ink font-semibold">{userData?.name}</div>
                <div className="text-ink-muted text-sm">{userData?.email}</div>
              </div>

              <div className="py-1">
                {ACCOUNT_MENU.map(({ href, key, icon }) => (
                    <MenuItem key={href} icon={icon} href={href} onClick={close}>
                      {t.nav[key]}
                    </MenuItem>
                ))}

                <hr className="border-line my-1" />

                <MenuItem
                    icon={LogOut}
                    iconClass="text-red-500"
                    labelClass="text-red-600 font-medium"
                    onClick={() => {
                      onLogout()
                      close()
                    }}
                >
                  {t.nav.logout}
                </MenuItem>
              </div>
            </div>
        )}
      </div>
  )
}

/** 계정 화면으로 가는 항목들. 이름은 화면에서 그때의 언어로 붙인다. */
const ACCOUNT_MENU = [
  { href: "/account/profile", key: "profile", icon: User },
  { href: "/account/notifications", key: "notifications", icon: Bell },
  { href: "/account/settings", key: "settings", icon: Settings },
] as const

interface MenuItemProps {
  icon: typeof User
  /** 지정하면 링크로, 없으면 버튼으로 그린다. */
  href?: string
  onClick?: () => void
  iconClass?: string
  labelClass?: string
  children: React.ReactNode
}

function MenuItem({ icon: Icon, href, onClick, iconClass, labelClass, children }: MenuItemProps) {
  const className =
      "flex w-full items-center space-x-3 px-4 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-[#2b2b2b]"

  const content = (
      <>
        <Icon className={cn("text-ink-muted h-4 w-4", iconClass)} />
        <span className={cn("text-ink", labelClass)}>{children}</span>
      </>
  )

  if (href) {
    return (
        <Link href={href} onClick={onClick} className={className}>
          {content}
        </Link>
    )
  }

  return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
  )
}
