import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * 모든 회원에게 알림 전송 API
 * POST /api/admin/notifications
 */
export async function POST(req: Request) {
    try {
        const { title, message } = await req.json()

        if (!title || !message) {
            return NextResponse.json(
                { error: '제목과 내용을 입력해주세요.' },
                { status: 400 }
            )
        }

        // SQL Editor에서 생성한 함수(rpc)를 호출합니다.
        // 이 방식은 DB 내부에서 처리되므로 수만 명의 사용자에게도 즉시 반영됩니다.
        const { error } = await supabaseAdmin.rpc('send_notification_to_all', {
            notif_title: title,
            notif_message: message,
        })

        if (error) {
            console.error('알림 전송 실패:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: '모든 회원에게 알림이 전송되었습니다.'
        })

    } catch (err) {
        return NextResponse.json(
            { error: '서버 내부 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}