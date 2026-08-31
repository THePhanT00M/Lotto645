"use client"

import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { UserData } from "@/hooks/use-header-data"
import { cn } from "@/lib/utils"

interface ProfileDropdownProps {
  userData: UserData | null
  onLogout: () => void
}

/** 프로필 버튼과 계정 메뉴. 바깥을 누르면 닫힌다. */
export default function ProfileDropdown({ userData, onLogout }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-[#1e1e1e]">
                <User className="text-ink-muted h-4 w-4" />
              </span>
          )}

          <span className="text-ink font-medium">{userData?.name ?? "사용자"}</span>
          <ChevronDown className={cn("text-ink-muted h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
            <div className="bg-surface border-line absolute top-full right-0 z-50 mt-2 w-64 rounded-lg border py-2 shadow-lg">
              <div className="border-line border-b px-4 py-3">
                <div className="text-ink font-semibold">{userData?.name}</div>
                <div className="text-ink-muted text-sm">{userData?.email}</div>
              </div>

              <div className="py-1">
                <MenuItem icon={User}>프로필</MenuItem>
                <MenuItem icon={Bell}>알림</MenuItem>
                <MenuItem icon={Settings}>설정</MenuItem>

                <hr className="border-line my-1" />

                <MenuItem
                    icon={LogOut}
                    iconClass="text-red-500"
                    labelClass="text-red-600 font-medium"
                    onClick={() => {
                      onLogout()
                      setIsOpen(false)
                    }}
                >
                  로그아웃
                </MenuItem>
              </div>
            </div>
        )}
      </div>
  )
}

interface MenuItemProps {
  icon: typeof User
  onClick?: () => void
  iconClass?: string
  labelClass?: string
  children: React.ReactNode
}

function MenuItem({ icon: Icon, onClick, iconClass, labelClass, children }: MenuItemProps) {
  return (
      <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center space-x-3 px-4 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-[#2b2b2b]"
      >
        <Icon className={cn("text-ink-muted h-4 w-4", iconClass)} />
        <span className={cn("text-ink", labelClass)}>{children}</span>
      </button>
  )
}
