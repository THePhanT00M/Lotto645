import { errorMessage, fail, ok } from "@/lib/api-response"
import { getAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/admin/notifications
 *
 * 전 회원에게 같은 알림을 발송한다. 회원 수가 많아도 한 번에 처리되도록
 * 행 삽입 대신 DB 함수(send_notification_to_all)를 호출한다.
 */
export async function POST(request: Request) {
  try {
    const { title, message } = await request.json()

    if (!title || !message) return fail("제목과 내용을 입력해주세요.", 400)

    const { error } = await getAdminClient().rpc("send_notification_to_all", {
      notif_title: title,
      notif_message: message,
    })

    if (error) throw error

    return ok({ message: "모든 회원에게 알림이 전송되었습니다." })
  } catch (error) {
    console.error("알림 전송 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}
