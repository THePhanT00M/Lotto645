import { Bell, Settings, User } from "lucide-react"
import type { ReactNode } from "react"
import AccountNav from "@/components/account/account-nav"
import { isSessionRetired } from "@/lib/auth/session"
import { createServerSupabase } from "@/lib/supabase/server"
import SignInRequired from "@/components/account/sign-in-required"

/** 계정 화면 좌측 메뉴. 이름은 AccountNav 가 그때의 언어로 붙인다. */
export const ACCOUNT_LINKS = [
  { href: "/account/profile", key: "profile", icon: User },
  { href: "/account/notifications", key: "notifications", icon: Bell },
  { href: "/account/settings", key: "settings", icon: Settings },
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
          <AccountNav links={ACCOUNT_LINKS.map(({ href, key }) => ({ href, key }))} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
  )
}
