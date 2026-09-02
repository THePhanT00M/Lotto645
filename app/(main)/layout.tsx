import type { ReactNode } from "react"
import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import type { UserData } from "@/hooks/use-header-data"
import { isSessionRetired } from "@/lib/auth/session"
import { createServerSupabase } from "@/lib/supabase/server"

/**
 * 헤더·푸터가 붙는 일반 화면 레이아웃.
 *
 * 로그인 정보와 안 읽은 알림 수를 서버에서 미리 조회해 헤더에 넘겨,
 * 첫 화면에서 로그인 상태가 늦게 반영되는 깜빡임을 막는다.
 */
export default async function MainLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabase()

  // 로그인 유지를 끈 채 브라우저를 닫았다 열었다면, 인증 쿠키가 남아 있어도
  // 로그인하지 않은 것으로 다룬다. 실제 정리는 브라우저 쪽에서 이어서 한다.
  const retired = await isSessionRetired()
  const { data: { user } } = retired ? { data: { user: null } } : await supabase.auth.getUser()

  let userData: UserData | null = null
  let unreadCount = 0

  if (user) {
    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from("profiles").select("nickname, role, level, avatar_url").eq("id", user.id).single(),
      supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
    ])

    userData = {
      id: user.id,
      name: profile?.nickname || user.user_metadata?.full_name || user.user_metadata?.name || "사용자",
      email: user.email ?? "",
      avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
      role: profile?.role ?? "user",
      level: profile?.level ?? 0,
    }
    unreadCount = count ?? 0
  }

  return (
      <>
        <Header initialUser={userData} initialUnreadCount={unreadCount} />
        <main className="bg-canvas flex-1">{children}</main>
        <Footer />
      </>
  )
}
