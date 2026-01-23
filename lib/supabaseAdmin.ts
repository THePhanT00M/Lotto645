import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase Admin Environment Variables");
}

// 서비스 롤 키를 사용하여 관리자 권한 클라이언트 생성
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)