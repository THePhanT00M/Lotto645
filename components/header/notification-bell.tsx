"use client"

import { Bell } from "lucide-react"
import { useHeaderData } from "@/hooks/use-header-data"

export default function NotificationBell() {
    // 이미 로그인된 상태에서 렌더링되므로 true 전달
    const { unreadCount } = useHeaderData(true)

    return (
        <div className="relative">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </div>
    )
}