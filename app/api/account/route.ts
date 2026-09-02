import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { resolveUserId } from "@/lib/auth/api-user"
import { clearProfileImage } from "@/lib/profile/images"
import { getAdminClient } from "@/lib/supabase/admin"

/**
 * DELETE /api/account
 *
 * 회원 탈퇴. 계정을 지우면 프로필도 함께 사라지지만, 스토리지에 올린 사진은
 * 표를 지운다고 없어지지 않으므로 먼저 치운다.
 *
 * 생성한 번호 기록은 남긴다. 계정과의 연결만 끊겨 누구의 것인지 알 수 없게
 * 되고, 회차별 통계는 이어진다. 개인정보처리방침에 적어 둔 대로다.
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) return fail("로그인이 필요합니다.", 401)

    // 사진을 먼저 지운다. 계정이 사라진 뒤에는 어느 파일이 그 사람 것인지 알 수 없다.
    await clearProfileImage(userId, "avatar")
    await clearProfileImage(userId, "banner")

    const { error } = await getAdminClient().auth.admin.deleteUser(userId)
    if (error) throw error

    return ok({ message: "탈퇴 처리했습니다." })
  } catch (error) {
    console.error("회원 탈퇴 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}
