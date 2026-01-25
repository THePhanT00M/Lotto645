"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"

export interface UserData {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    role: 'user' | 'admin'
    level: number
    phoneNumber?: string
}

export function useHeaderData(
    isLoggedIn: boolean,
    initialData?: UserData | null,
    initialCount?: number
) {
    // 서버에서 전달받은 초기값으로 상태 초기화
    const [userData, setUserData] = useState<UserData | null>(initialData || null)
    const [unreadCount, setUnreadCount] = useState(initialCount || 0)
    const isInitialized = useRef(false)

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
        // 로그아웃 상태일 경우 초기화
        if (!isLoggedIn) {
            setUserData(null)
            setUnreadCount(0)
            isInitialized.current = false
            return
        }

        const initData = async () => {
            let currentUserId = userData?.id

            // 1. 유저 정보가 없거나 갱신이 필요한 경우만 호출
            if (!currentUserId) {
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    currentUserId = user.id

                    // public.profiles 테이블에서 등급 및 추가 필드 조회
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("nickname, role, level, avatar_url, phone_number")
                        .eq("id", user.id)
                        .single()

                    setUserData({
                        id: user.id,
                        email: user.email || "",
                        name: profile?.nickname || user.user_metadata?.full_name || "사용자",
                        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
                        role: profile?.role || 'user',
                        level: profile?.level || 0,
                        phoneNumber: profile?.phone_number || ""
                    })

                    await fetchUnreadCount(user.id)
                }
            }

            // 2. 실시간 알림 구독 설정 (컴포넌트당 1회만)
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
        // isLoggedIn과 fetchUnreadCount가 변경될 때만 실행
    }, [isLoggedIn, fetchUnreadCount])

    return {
        userData,
        unreadCount,
        // 필요 시 수동으로 알림을 갱신하기 위한 함수
        refreshNotifications: () => userData && fetchUnreadCount(userData.id)
    }
}