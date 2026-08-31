import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * 서버 컴포넌트에서 쓰는 Supabase 클라이언트.
 *
 * 쿠키 쓰기는 미들웨어에서 처리하는 것이 권장되므로, 서버 컴포넌트에서
 * 발생하는 set 실패는 무시한다.
 */
export const createServerSupabase = async () => {
  const cookieStore = await cookies()

  return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // 서버 컴포넌트에서는 응답 헤더가 이미 확정된 뒤일 수 있어 무시한다.
            }
          },
        },
      },
  )
}
