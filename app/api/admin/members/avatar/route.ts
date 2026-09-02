import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { requireAdmin } from "@/lib/auth/admin"
import { clearProfileImage, saveProfileImage, validateImage } from "@/lib/profile/images"

/**
 * POST /api/admin/members/avatar
 *
 * 관리자가 다른 회원의 프로필 사진을 대신 올린다. 본인 것과 같은 저장소를 쓰고,
 * 대상만 폼에 실어 보낸다.
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return fail("관리자 권한이 필요합니다.", 403)

    const form = await request.formData().catch(() => null)
    const userId = String(form?.get("userId") ?? "")
    const file = form?.get("file")

    if (!userId) return fail("대상 회원을 찾을 수 없습니다.", 400)
    if (!(file instanceof File)) return fail("이미지를 선택해주세요.", 400)

    const invalid = validateImage(file)
    if (invalid) return fail(invalid, 400)

    return ok({ avatarUrl: await saveProfileImage(userId, file, "avatar") })
  } catch (error) {
    console.error("회원 사진 변경 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/**
 * DELETE /api/admin/members/avatar?userId=...
 *
 * 프로필 사진을 지워 기본 색으로 되돌린다.
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return fail("관리자 권한이 필요합니다.", 403)

    const userId = new URL(request.url).searchParams.get("userId") ?? ""
    if (!userId) return fail("대상 회원을 찾을 수 없습니다.", 400)

    await clearProfileImage(userId, "avatar")

    return ok({ avatarUrl: null })
  } catch (error) {
    console.error("회원 사진 삭제 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}
