import type { NextRequest } from "next/server"
import { UAParser } from "ua-parser-js"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { combinationKey } from "@/lib/lotto/combinations"
import { PICK_COUNT } from "@/lib/lotto/constants"
import { getAdminClient } from "@/lib/supabase/admin"

const TABLE = "number_picks"
const INSIGHT_TABLE = "pick_insights"

/** 알고리즘이 바뀌면 올린다. 버전별 성적을 나눠 보기 위한 값이다. */
const MODEL_VERSION = "geo-mlp-1"

interface InsightBody {
  score: number
  networkScore: number
  typicality: number
  features: Record<string, number>
  model: Record<string, number>
  maxPastOverlap: number | null
}

interface PickBody {
  numbers: number[]
  source: "machine" | "manual" | "ai"
  drawNo?: number
  memo?: string
  insight?: InsightBody
}

/**
 * POST /api/picks
 *
 * 생성한 번호를 남긴다. AI 추천이면 그 근거도 함께 받아 딸린 표에 넣는다.
 * 회차 번호는 클라이언트를 믿지 않고 서버에서 최신 회차 + 1로 정한다.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const body: PickBody = await request.json()

    if (!Array.isArray(body.numbers) || body.numbers.length !== PICK_COUNT || !body.source) {
      return fail("필수 데이터 누락", 400)
    }

    const { data: latestDraw } = await supabase
        .from("winning_numbers")
        .select("drawNo")
        .order("drawNo", { ascending: false })
        .limit(1)
        .maybeSingle()

    const userId = await resolveUserId(request)
    const parsedUa = new UAParser(request.headers.get("user-agent") ?? "unknown").getResult()

    const { data: pick, error } = await supabase
        .from(TABLE)
        .insert({
          numbers: body.numbers,
          combination_key: combinationKey(body.numbers),
          source: body.source,
          memo: body.memo,
          draw_no: (latestDraw?.drawNo ?? 0) + 1,
          client_ip: readClientIp(request),
          client_agent: parsedUa,
          user_id: userId,
        })
        .select("id")
        .single()

    if (error) throw error

    if (body.insight) await saveInsight(pick.id, body.insight)

    return ok({ id: pick.id, message: "기록되었습니다.", isGuest: !userId })
  } catch (error) {
    return fail(errorMessage(error))
  }
}

/**
 * GET /api/picks
 *
 * 로그인한 사용자의 기록을 최신순으로 돌려준다.
 * number_picks는 RLS를 닫아 두었으므로 브라우저가 직접 읽지 않고 이 경로를 거친다.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request)
    if (!userId) return ok({ picks: [] })

    const { data, error } = await getAdminClient()
        .from(TABLE)
        .select("id, numbers, created_at, source, draw_no, matched_count, bonus_matched, prize_rank, scored_at")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200)

    if (error) throw error

    return ok({ picks: data ?? [] })
  } catch (error) {
    console.error("내 기록 조회 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/**
 * DELETE /api/picks
 *
 * 본인 기록을 소프트 삭제한다. 통계 집계를 위해 행은 남기고 시각만 채운다.
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
        .from(TABLE)
        .update({ deleted_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("deleted_at", null)

    const { data, error } = await (ids.length > 0 ? query.in("id", ids) : query).select("id")

    if (error) throw error

    const removed = data?.length ?? 0
    return ok({ removed, message: `${removed}건을 삭제했습니다.` })
  } catch (error) {
    return fail(errorMessage(error))
  }
}

/** 추천 근거를 딸린 표에 넣는다. 실패해도 번호 기록은 남긴다. */
const saveInsight = async (pickId: number, insight: InsightBody) => {
  const { error } = await getAdminClient().from(INSIGHT_TABLE).insert({
    pick_id: pickId,
    score: insight.score,
    network_score: insight.networkScore,
    typicality: insight.typicality,
    features: insight.features,
    model: insight.model,
    model_version: MODEL_VERSION,
    max_past_overlap: insight.maxPastOverlap,
  })

  if (error) console.error("추천 근거 저장 실패:", error.message)
}

/** 본문에서 삭제할 id 목록을 뽑는다. 숫자로 바꿀 수 없는 값은 버린다. */
const collectIds = (body: unknown): number[] => {
  const source = body as { id?: unknown; ids?: unknown }
  const raw = Array.isArray(source?.ids) ? source.ids : source?.id !== undefined ? [source.id] : []

  return raw.map(Number).filter((value) => Number.isInteger(value) && value > 0)
}

/** 토큰이 있으면 그 사용자의 기록으로 남긴다. */
const resolveUserId = async (request: NextRequest): Promise<string | null> => {
  const token = readBearerToken(request)
  if (!token) return null

  const { data: { user } } = await getAdminClient().auth.getUser(token)
  return user?.id ?? null
}

const readBearerToken = (request: NextRequest): string | null => {
  const header = request.headers.get("Authorization")
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null
}

/** 프록시를 거친 요청에서 원 클라이언트 IP를 찾는다. */
const readClientIp = (request: NextRequest): string | null =>
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? request.headers.get("x-real-ip")
