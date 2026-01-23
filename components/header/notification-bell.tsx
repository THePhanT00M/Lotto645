"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { supabase } from "@/lib/supabaseClient" //

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        // 1. 초기 알림 개수 가져오기
        const fetchUnreadCount = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { count, error } = await supabase
                .from("notifications") // 실제 DB 테이블명에 맞춰 수정 가능
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("is_read", false)

            if (!error && count !== null) {
                setUnreadCount(count)
            }
        }

        fetchUnreadCount()

        // 2. 실시간 알림 상태 감시 (Realtime)
        const channel = supabase
            .channel("notification_changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "notifications",
                },
                () => {
                    fetchUnreadCount() // 데이터 변경 시 다시 가져오기
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <div className="relative">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </div>
    )
}