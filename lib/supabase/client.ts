import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) throw new Error("환경 변수 NEXT_PUBLIC_SUPABASE_URL이 없습니다.")
if (!supabaseAnonKey) throw new Error("환경 변수 NEXT_PUBLIC_SUPABASE_ANON_KEY이 없습니다.")

/**
 * 브라우저에서 쓰는 Supabase 클라이언트 (RLS 적용).
 *
 * supabase-js의 createClient는 세션을 localStorage에 담아 서버가 읽지 못한다.
 * 서버 컴포넌트와 API 라우트가 같은 세션을 보려면 쿠키에 담아야 하므로
 * @supabase/ssr의 브라우저 클라이언트를 쓴다.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
