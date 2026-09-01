import type { NextRequest } from "next/server"
import { UAParser } from "ua-parser-js"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { PICK_COUNT } from "@/lib/lotto/constants"
import { getAdminClient } from "@/lib/supabase/admin"

interface LogDrawBody {
  numbers: number[]
  source: "manual" | "machine" | "ai"
  score?: number
  userId?: string
  memo?: string
}

/**
 * POST /api/log-draw
 *
 * 생성된 번호를 기록한다. 회차 번호는 클라이언트를 믿지 않고 서버에서
 * 최신 회차 + 1로 정한다. 비로그인 사용자의 기록도 통계를 위해 남긴다.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const body: LogDrawBody = await request.json()

    if (!Array.isArray(body.numbers) || body.numbers.length !== PICK_COUNT || !body.source) {
      return fail("필수 데이터 누락", 400)
    }

    const { data: latestDraw } = await supabase
        .from("winning_numbers")
        .select("drawNo")
        .order("drawNo", { ascending: false })
        .limit(1)
        .maybeSingle()

    const userId = await resolveUserId(request, body.userId)
    const parsedUa = new UAParser(request.headers.get("user-agent") ?? "unknown").getResult()

    const { error } = await supabase.from("generated_numbers").insert({
      numbers: body.numbers,
      source: body.source,
      memo: body.memo,
      draw_no: (latestDraw?.drawNo ?? 0) + 1,
      ip_address: readClientIp(request),
      device_info: JSON.stringify(parsedUa),
      user_id: userId,
      is_deleted: "N",
      ...(body.score !== undefined && { score: body.score }),
    })

    if (error) throw error

    return ok({ message: "기록되었습니다.", isGuest: !userId })
  } catch (error) {
    return fail(errorMessage(error))
  }
}

/**
 * DELETE /api/log-draw
 *
 * 본인 기록을 소프트 삭제한다. 통계 집계를 위해 행은 남기고 플래그만 바꾼다.
 *
 * 본문에 따라 범위가 달라진다.
 *   { id }    한 건
 *   { ids }   고른 여러 건
 *   { all }   본인의 남은 기록 전부
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const token = readBearerToken(request)
    if (!token) return fail("인증 필요", 401)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return fail("권한 없음", 401)

    const body = await request.json().catch(() => ({}))
    const ids = collectIds(body)

    if (ids.length === 0 && !body?.all) return fail("삭제할 대상이 없습니다.", 400)

    // 어떤 경우에도 본인 것만 건드리도록 user_id 조건을 먼저 건다.
    const query = supabase
        .from("generated_numbers")
        .update({ is_deleted: "Y", deleted_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_deleted", "N")

    const { data, error } = await (ids.length > 0 ? query.in("id", ids) : query).select("id")

    if (error) throw error

    const removed = data?.length ?? 0
    return ok({ removed, message: `${removed}건을 삭제했습니다.` })
  } catch (error) {
    return fail(errorMessage(error))
  }
}

/** 본문에서 삭제할 id 목록을 뽑는다. 숫자로 바꿀 수 없는 값은 버린다. */
const collectIds = (body: unknown): number[] => {
  const source = body as { id?: unknown; ids?: unknown }
  const raw = Array.isArray(source?.ids) ? source.ids : source?.id !== undefined ? [source.id] : []

  return raw.map(Number).filter((value) => Number.isInteger(value) && value > 0)
}

/** 토큰이 있으면 토큰의 사용자를, 없으면 요청 본문의 값을 쓴다. */
const resolveUserId = async (request: NextRequest, fallback?: string): Promise<string | null> => {
  const token = readBearerToken(request)
  if (!token) return fallback ?? null

  const { data: { user } } = await getAdminClient().auth.getUser(token)
  return user?.id ?? fallback ?? null
}

const readBearerToken = (request: NextRequest): string | null => {
  const header = request.headers.get("Authorization")
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null
}

/** 프록시를 거친 요청에서 원 클라이언트 IP를 찾는다. */
const readClientIp = (request: NextRequest): string | null =>
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? request.headers.get("x-real-ip")
