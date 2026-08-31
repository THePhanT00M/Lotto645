import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) throw new Error("환경 변수 NEXT_PUBLIC_SUPABASE_URL이 없습니다.")
if (!supabaseAnonKey) throw new Error("환경 변수 NEXT_PUBLIC_SUPABASE_ANON_KEY이 없습니다.")

/** 브라우저에서 쓰는 Supabase 클라이언트 (RLS 적용). */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
