import { NextResponse } from 'next/server'
import { sanitizeNextPath } from '@/lib/auth/redirect'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Supabase 인증 콜백 핸들러
 *
 * 가입 확인 메일처럼 브라우저에서 시작한 인증은 PKCE 로 진행된다. 코드를
 * 세션으로 바꾸려면 그 브라우저에 저장된 검증값이 필요하므로, 쿠키를 함께
 * 다루는 서버 클라이언트를 써야 한다. 브라우저용 클라이언트로는 검증값을
 * 찾지 못해 언제나 실패한다.
 *
 * 바꾼 세션도 이 클라이언트가 쿠키에 적어 주므로, 돌아간 화면은 이미
 * 로그인된 상태가 된다.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)

    const code = searchParams.get('code')
    // 외부 주소가 섞여 들어오면 다른 사이트로 튕겨 나갈 수 있어 같은 사이트 경로만 받습니다.
    const next = sanitizeNextPath(searchParams.get('next')) ?? '/'

    if (code) {
        const supabase = await createServerSupabase()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) return NextResponse.redirect(`${origin}${next}`)

        console.error('인증 코드를 세션으로 바꾸지 못했습니다:', error.message)
    }

    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
