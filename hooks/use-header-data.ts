"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"

export interface UserData {
    id: string
    name: string
    email: string
    avatarUrl: string | null
}

export function useHeaderData(isLoggedIn: boolean) {
    const [userData, setUserData] = useState<UserData | null>(null)
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)

    // 알림 개수 조회 함수
    const fetchUnreadCount = useCallback(async (userId: string) => {
        const { count, error } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_read", false)

        if (!error && count !== null) {
            setUnreadCount(count)
        }
    }, [])

    useEffect(() => {
        if (!isLoggedIn) {
            setUserData(null)
            setUnreadCount(0)
            setLoading(false)
            return
        }

        const initHeaderData = async () => {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setUserData({
                    id: user.id,
                    name: user.user_metadata?.full_name || user.user_metadata?.name || "사용자",
                    email: user.email || "",
                    avatarUrl: user.user_metadata?.avatar_url || null,
                })

                await fetchUnreadCount(user.id)

                // 실시간 알림 구독 설정
                const channel = supabase
                    .channel(`header-notifs-${user.id}`)
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "notifications",
                            filter: `user_id=eq.${user.id}`,
                        },
                        () => fetchUnreadCount(user.id)
                    )
                    .subscribe()

                setLoading(false)
                return channel
            }
            setLoading(false)
        }

        const subscriptionPromise = initHeaderData()

        return () => {
            subscriptionPromise.then(channel => {
                if (channel) supabase.removeChannel(channel)
            })
        }
    }, [isLoggedIn, fetchUnreadCount])

    return {
        userData,
        unreadCount,
        loading,
        refreshNotifications: () => userData && fetchUnreadCount(userData.id)
    }
}