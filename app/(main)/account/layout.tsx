import { Bell, Settings, User } from "lucide-react"
import type { ReactNode } from "react"
import AccountNav from "@/components/account/account-nav"
import { isSessionRetired } from "@/lib/auth/session"
import { createServerSupabase } from "@/lib/supabase/server"
import SignInRequired from "@/components/account/sign-in-required"

/** 계정 화면 좌측 메뉴 */
export const ACCOUNT_LINKS = [
  { href: "/account/profile", label: "프로필", icon: User },
  { href: "/account/notifications", label: "알림", icon: Bell },
  { href: "/account/settings", label: "설정", icon: Settings },
] as const

/**
 * 계정 화면 공통 레이아웃
 *
 * 세 화면 모두 로그인이 필요하므로 여기서 한 번에 확인한다.
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const retired = await isSessionRetired()
  const supabase = await createServerSupabase()
  const { data: { user } } = retired ? { data: { user: null } } : await supabase.auth.getUser()

  if (!user) return <SignInRequired />

  return (
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
          <AccountNav links={ACCOUNT_LINKS.map(({ href, label }) => ({ href, label }))} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
  )
}
