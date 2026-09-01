import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { getAdminClient } from "@/lib/supabase/admin"
import { createServerSupabase } from "@/lib/supabase/server"

const TABLE = "profiles"

/** 사용자가 직접 고칠 수 있는 항목 */
const EDITABLE_FIELDS = ["nickname", "phone_number", "avatar_url"] as const

/**
 * GET /api/profile
 *
 * 로그인한 사용자의 프로필을 돌려준다.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) return fail("로그인이 필요합니다.", 401)

    const supabase = getAdminClient()
    const [{ data: profile, error }, { data: auth }] = await Promise.all([
      supabase.from(TABLE).select("nickname, phone_number, avatar_url, role, level, created_at").eq("id", userId).single(),
      supabase.auth.admin.getUserById(userId),
    ])

    if (error) throw error

    return ok({
      profile: {
        ...profile,
        id: userId,
        email: auth?.user?.email ?? "",
        joinedAt: auth?.user?.created_at ?? profile?.created_at ?? null,
      },
    })
  } catch (error) {
    console.error("프로필 조회 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/**
 * PATCH /api/profile
 *
 * 닉네임 같은 표시 정보를 고친다. 등급과 역할은 사용자가 바꿀 수 없다.
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) return fail("로그인이 필요합니다.", 401)

    const body = await request.json().catch(() => ({}))
    const updates: Record<string, string | null> = {}

    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        const value = body[field]
        updates[field] = typeof value === "string" && value.trim() !== "" ? value.trim() : null
      }
    }

    if (Object.keys(updates).length === 0) return fail("변경할 내용이 없습니다.", 400)

    const { error } = await getAdminClient().from(TABLE).update(updates).eq("id", userId)
    if (error) throw error

    return ok({ message: "저장했습니다." })
  } catch (error) {
    console.error("프로필 수정 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

const resolveUserId = async (request: NextRequest): Promise<string | null> => {
  const header = request.headers.get("Authorization")

  if (header?.startsWith("Bearer ")) {
    const { data: { user } } = await getAdminClient().auth.getUser(header.slice("Bearer ".length))
    if (user) return user.id
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}
