import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 Supabase URL과 키를 가져옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// URL과 키가 정의되지 않은 경우 오류를 발생시킵니다.
if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Supabase 클라이언트를 생성하고 내보냅니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)