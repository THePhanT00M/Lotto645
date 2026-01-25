"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"

export interface UserData {
    id: string
    name: string
    email: string
    avatarUrl: string | null
}

export function useHeaderData(isLoggedIn: boolean, initialData?: UserData | null, initialCount?: number) {
    const [userData, setUserData] = useState<UserData | null>(initialData || null)
    const [unreadCount, setUnreadCount] = useState(initialCount || 0)
    const isInitialized = useRef(false)

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
            isInitialized.current = false
            return
        }

        const initData = async () => {
            let currentUserId = userData?.id

            // 데이터가 없으면 1회만 fetch
            if (!currentUserId) {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    currentUserId = user.id
                    setUserData({
                        id: user.id,
                        name: user.user_metadata?.full_name || user.user_metadata?.name || "사용자",
                        email: user.email || "",
                        avatarUrl: user.user_metadata?.avatar_url || null,
                    })
                    await fetchUnreadCount(user.id)
                }
            }

            // 실시간 구독 설정 (1회만)
            if (currentUserId && !isInitialized.current) {
                const channel = supabase
                    .channel(`header-notifs-${currentUserId}`)
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "notifications",
                            filter: `user_id=eq.${currentUserId}`,
                        },
                        () => fetchUnreadCount(currentUserId!)
                    )
                    .subscribe()

                isInitialized.current = true
                return channel
            }
        }

        const subscriptionPromise = initData()

        return () => {
            subscriptionPromise.then(channel => {
                if (channel) supabase.removeChannel(channel)
            })
        }
    }, [isLoggedIn, fetchUnreadCount]) // userData 의존성 제거로 중복 호출 방지

    return {
        userData,
        unreadCount,
        refreshNotifications: () => userData && fetchUnreadCount(userData.id)
    }
}