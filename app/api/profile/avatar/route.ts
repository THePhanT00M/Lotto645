import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { resolveUserId } from "@/lib/auth/api-user"
import { getAdminClient } from "@/lib/supabase/admin"

const TABLE = "profiles"

/** 아바타를 담는 스토리지 버킷 (supabase/migrations/20260902_avatars_bucket.sql) */
const BUCKET = "avatars"

/** 공개 URL에서 버킷 안 경로를 잘라낼 기준 */
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`

/** 허용하는 형식과 저장할 확장자 */
const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
}

/** 2MB. 프로필 사진에 그 이상은 필요 없고, 큰 파일은 목록 로딩만 느리게 한다. */
const MAX_BYTES = 2 * 1024 * 1024

/**
 * POST /api/profile/avatar
 *
 * 사진을 올려 아바타로 삼는다. 스토리지 쓰기를 브라우저에 열어 주지 않으려고
 * 업로드도 서버가 서비스 롤로 대신 한다.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) return fail("로그인이 필요합니다.", 401)

    const form = await request.formData().catch(() => null)
    const file = form?.get("file")

    if (!(file instanceof File)) return fail("이미지를 선택해주세요.", 400)

    const extension = EXTENSIONS[file.type]
    if (!extension) return fail("PNG·JPG·WEBP·GIF 형식만 올릴 수 있습니다.", 400)
    if (file.size > MAX_BYTES) return fail("이미지는 2MB 이하만 올릴 수 있습니다.", 400)

    const supabase = getAdminClient()

    // 같은 이름에 덮어쓰면 캐시에 남은 예전 사진이 계속 보인다. 매번 새 이름으로 올린다.
    const path = `${userId}/${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const { data: previous } = await supabase.from(TABLE).select("avatar_url").eq("id", userId).single()

    const { error } = await supabase.from(TABLE).update({ avatar_url: publicUrl }).eq("id", userId)
    if (error) throw error

    await removeStored(previous?.avatar_url ?? null)

    return ok({ avatarUrl: publicUrl })
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

    const supabase = getAdminClient()
    const { data: previous } = await supabase.from(TABLE).select("avatar_url").eq("id", userId).single()

    const { error } = await supabase.from(TABLE).update({ avatar_url: null }).eq("id", userId)
    if (error) throw error

    await removeStored(previous?.avatar_url ?? null)

    return ok({ avatarUrl: null })
  } catch (error) {
    console.error("아바타 삭제 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/** 우리 버킷에 올린 파일일 때만 지운다. 소셜 로그인으로 받은 외부 주소는 건드리지 않는다. */
const removeStored = async (url: string | null): Promise<void> => {
  if (!url) return

  const index = url.indexOf(PUBLIC_PREFIX)
  if (index === -1) return

  await getAdminClient().storage.from(BUCKET).remove([url.slice(index + PUBLIC_PREFIX.length)])
}
