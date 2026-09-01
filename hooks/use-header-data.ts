"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

export interface UserData {
    id: string
    name: string
    email: string
    avatarUrl: string | null
    role: 'user' | 'admin'
    level: number
    phoneNumber?: string
}

/**
 * 헤더에 필요한 사용자 정보를 한 번만 조회한다.
 *
 * 서버에서 넘겨준 값이 있으면 그대로 쓰고, 없을 때만 직접 조회한다.
 * 알림은 공유 스토어(lib/notifications/store)가 맡는다.
 */
export function useHeaderData(isLoggedIn: boolean, initialData?: UserData | null) {
    const [userData, setUserData] = useState<UserData | null>(initialData ?? null)

    useEffect(() => {
        if (!isLoggedIn) {
            setUserData(null)
            return
        }

        if (userData) return

        let cancelled = false

        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || cancelled) return

            const { data: profile } = await supabase
                .from("profiles")
                .select("nickname, role, level, avatar_url, phone_number")
                .eq("id", user.id)
                .single()

            if (cancelled) return

            setUserData({
                id: user.id,
                email: user.email || "",
                name: profile?.nickname || user.user_metadata?.full_name || "사용자",
                avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
                role: profile?.role || 'user',
                level: profile?.level || 0,
                phoneNumber: profile?.phone_number || "",
            })
        }

        void load()

        return () => {
            cancelled = true
        }
    }, [isLoggedIn, userData])

    return { userData }
}
