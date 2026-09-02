import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { resolveUserId } from "@/lib/auth/api-user"
import { clearProfileImage, saveProfileImage, validateImage } from "@/lib/profile/images"

/**
 * POST /api/profile/avatar
 *
 * 잘라 낸 사진을 아바타로 올린다. 스토리지 쓰기를 브라우저에 열어 주지 않으려고
 * 업로드도 서버가 서비스 롤로 대신 한다.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) return fail("로그인이 필요합니다.", 401)

    const form = await request.formData().catch(() => null)
    const file = form?.get("file")
    if (!(file instanceof File)) return fail("이미지를 선택해주세요.", 400)

    const invalid = validateImage(file)
    if (invalid) return fail(invalid, 400)

    return ok({ avatarUrl: await saveProfileImage(userId, file, "avatar") })
  } catch (error) {
    console.error("아바타 업로드 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/**
 * DELETE /api/profile/avatar
 *
 * 아바타를 지우고 기본 아이콘으로 되돌린다.
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) return fail("로그인이 필요합니다.", 401)

    await clearProfileImage(userId, "avatar")
    return ok({ avatarUrl: null })
  } catch (error) {
    console.error("아바타 삭제 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}
