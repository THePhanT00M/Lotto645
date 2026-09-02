import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let cached: SupabaseClient | null = null

/**
 * 인증 메일을 보내기 위한 서버 클라이언트
 *
 * 비밀번호 재설정 메일은 서버가 대신 보낸다. 기본값인 PKCE 로 보내면 링크에
 * 딸린 코드를 풀 검증값이 보낸 쪽(서버)에 저장되는데, 링크를 누르는 것은
 * 회원의 브라우저라 서로 맞지 않아 언제나 실패한다.
 *
 * 그래서 이 클라이언트만 implicit 로 둔다. 링크에 토큰이 그대로 실려 오고,
 * 회원의 브라우저가 그걸로 바로 로그인 상태가 된다. 세션을 서버에 남기지
 * 않도록 저장도 끈다.
 */
export const getMailerClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL 또는 anon key 가 서버 환경 변수에 설정되지 않았습니다.")
  }

  cached ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  return cached
}
