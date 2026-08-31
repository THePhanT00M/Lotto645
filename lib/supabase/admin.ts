import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

let cached: SupabaseClient | null = null

/**
 * 서비스 롤 키로 RLS를 우회하는 서버 전용 클라이언트.
 *
 * 환경 변수가 없으면 예외를 던지므로, 라우트에서는 try/catch로 감싸
 * 설정 오류를 500 응답으로 돌려준다.
 */
export const getAdminClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL 또는 Service Key가 서버 환경 변수에 설정되지 않았습니다.")
  }

  cached ??= createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  return cached
}
