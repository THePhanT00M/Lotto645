import { NextResponse } from 'next/server'
import { sanitizeNextPath } from '@/lib/auth/redirect'
import { supabase } from '@/lib/supabase/client'

/**
 * Supabase 인증 콜백 핸들러
 * 이메일 확인, 비밀번호 재설정, OAuth 로그인 후 인증 코드를 세션으로 교환합니다.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)

    // URL에서 인증 코드(code)와 리다이렉트할 경로(next)를 가져옵니다.
    const code = searchParams.get('code')
    // 'next' 파라미터가 있으면 해당 경로로, 없으면 메인 페이지('/')로 리다이렉트합니다.
    // 외부 주소가 섞여 들어오면 다른 사이트로 튕겨 나갈 수 있어 같은 사이트 경로만 받습니다.
    const next = sanitizeNextPath(searchParams.get('next')) ?? '/'

    if (code) {
        // 전달받은 인증 코드를 Supabase 세션으로 교환합니다.
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // 인증 성공 시 지정된 경로로 리다이렉트합니다.
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // 인증 실패 시 에러 메시지 쿼리 파라미터와 함께 로그인 페이지로 리다이렉트합니다.
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}