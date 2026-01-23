"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { supabase } from "@/lib/supabaseClient" //

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        let user_id: string | null = null;

        const fetchUnreadCount = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            user_id = user.id;

            const { count, error } = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("is_read", false)

            if (!error && count !== null) {
                setUnreadCount(count)
            }
        }

        fetchUnreadCount()

        // 2. 실시간 알림 상태 감시 (내 아이디에 해당하는 데이터만)
        const channel = supabase
            .channel("notification_changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user_id}`,
                },
                (payload) => {
                    console.log("실시간 변경 감지:", payload); // 디버깅용
                    fetchUnreadCount()
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
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
        </div>
    )
}