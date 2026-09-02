import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { resolveUserId } from "@/lib/auth/api-user"
import { clearProfileImage, saveProfileImage, validateImage } from "@/lib/profile/images"

/**
 * POST /api/profile/banner
 *
 * 잘라 낸 사진을 프로필 배너로 올린다.
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

    return ok({ bannerUrl: await saveProfileImage(userId, file, "banner") })
  } catch (error) {
    console.error("배너 업로드 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/**
 * DELETE /api/profile/banner
 *
 * 배너를 지우고 기본 그라데이션으로 되돌린다.
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) return fail("로그인이 필요합니다.", 401)

    await clearProfileImage(userId, "banner")
    return ok({ bannerUrl: null })
  } catch (error) {
    console.error("배너 삭제 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}
