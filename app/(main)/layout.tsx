import type React from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export default async function MainLayout({
                                             children,
                                         }: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // 서버 컴포넌트에서의 set은 미들웨어 처리가 권장되므로 무시 가능합니다.
                    }
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    let initialUnreadCount = 0
    let userData = null

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("nickname, role, level, avatar_url, phone_number")
            .eq("id", user.id)
            .single()

        userData = {
            id: user.id,
            name: profile?.nickname || user.user_metadata?.full_name || user.user_metadata?.name || "사용자",
            email: user.email || "",
            avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
            role: profile?.role || 'user',
            level: profile?.level || 0,
            phoneNumber: profile?.phone_number || ""
        }

        const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false)

        initialUnreadCount = count || 0
    }

    return (
        <>
            <Header initialUser={userData} initialUnreadCount={initialUnreadCount} />
            <main className="flex-1 bg-white dark:bg-black">{children}</main>
            <Footer />
        </>
    )
}