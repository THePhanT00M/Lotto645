import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { requireAdmin } from "@/lib/auth/admin"
import { getAdminClient } from "@/lib/supabase/admin"

const TABLE = "notifications"

/** 한 번에 넣을 최대 행 수. 회원이 많아도 나눠 보낸다. */
const CHUNK_SIZE = 500

/** 전 회원 발송에서 회원 id를 한 번에 읽어올 크기. */
const PROFILE_PAGE_SIZE = 1000

interface SendBody {
  title: string
  message: string
  /** "all"이면 전 회원, 배열이면 그 사용자들에게만 보낸다. */
  target: "all" | string[]
}

/**
 * POST /api/admin/notifications
 *
 * 알림을 보낸다. 브라우저에서 테이블에 직접 넣지 않고 여기를 거치므로,
 * 전 회원 발송처럼 남의 행을 만드는 작업도 RLS를 열지 않고 처리된다.
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return fail("관리자 권한이 필요합니다.", 403)

    const body: SendBody = await request.json()
    const title = body.title?.trim()
    const message = body.message?.trim()

    if (!title || !message) return fail("제목과 내용을 입력해주세요.", 400)

    const userIds = body.target === "all" ? await fetchAllUserIds() : body.target

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return fail("받는 사람을 한 명 이상 선택해주세요.", 400)
    }

    const sent = await insertNotifications(title, message, userIds)

    return ok({ sent, message: `${sent.toLocaleString()}명에게 발송했습니다.` })
  } catch (error) {
    console.error("알림 발송 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/** 전 회원의 id. 한 번의 조회로는 다 오지 않으므로 끝까지 넘겨가며 읽는다. */
const fetchAllUserIds = async (): Promise<string[]> => {
  const supabase = getAdminClient()
  const ids: string[] = []

  for (let page = 0; ; page += 1) {
    const from = page * PROFILE_PAGE_SIZE

    const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .range(from, from + PROFILE_PAGE_SIZE - 1)

    if (error) throw error

    const rows = data ?? []
    ids.push(...rows.map((row) => row.id))

    if (rows.length < PROFILE_PAGE_SIZE) return ids
  }
}

/** 한 번에 넣는 행이 너무 많지 않도록 나눠 넣는다. */
const insertNotifications = async (title: string, message: string, userIds: string[]): Promise<number> => {
  const supabase = getAdminClient()
  let sent = 0

  for (let start = 0; start < userIds.length; start += CHUNK_SIZE) {
    const rows = userIds.slice(start, start + CHUNK_SIZE).map((userId) => ({
      user_id: userId,
      title,
      message,
      is_read: false,
    }))

    const { error } = await supabase.from(TABLE).insert(rows)
    if (error) throw error

    sent += rows.length
  }

  return sent
}
