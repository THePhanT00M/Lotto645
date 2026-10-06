import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { requireAdmin } from "@/lib/auth/admin"
import { resolveUserId } from "@/lib/auth/api-user"
import { ALL_NUMBERS } from "@/lib/lotto/constants"
import { labelCover } from "@/lib/lotto/cover"
import { getAdminClient } from "@/lib/supabase/admin"

const TABLE = "cover_bundles"

/** 구조나 배치 방식이 바뀌면 올린다. 버전별 성적을 나눠 보기 위한 값이다. */
const MODEL_VERSION = "cover-22-23-1"

/** 관리자 화면에 돌려주는 최대 묶음 수. Supabase 응답 상한과 같다. */
const MAX_BUNDLES = 1000

interface CoverBody {
  labels: number[]
  meanPercentile: number | null
  quietTickets: number | null
}

/**
 * POST /api/picks/cover
 *
 * 3개 보장 묶음을 남긴다. 장 목록은 믿지 않고 번호 배치만 받아 서버에서 181장을 다시 만든다.
 * 회차 번호도 서버에서 최신 회차 + 1로 정한다.
 */
export async function POST(request: NextRequest) {
  try {
    const body: CoverBody = await request.json().catch(() => ({}))
    if (!isPermutation(body?.labels)) return fail("번호 배치가 올바르지 않습니다.", 400)

    const supabase = getAdminClient()
    const { data: latestDraw } = await supabase
        .from("winning_numbers")
        .select("drawNo")
        .order("drawNo", { ascending: false })
        .limit(1)
        .maybeSingle()

    const { data, error } = await supabase
        .from(TABLE)
        .insert({
          user_id: await resolveUserId(request),
          draw_no: (latestDraw?.drawNo ?? 0) + 1,
          labels: body.labels,
          tickets: labelCover(body.labels),
          mean_percentile: toRatio(body.meanPercentile),
          quiet_tickets: Number.isInteger(body.quietTickets) ? body.quietTickets : null,
          model_version: MODEL_VERSION,
          client_ip: request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? request.headers.get("x-real-ip"),
        })
        .select("id")
        .single()

    if (error) throw error

    return ok({ id: data.id })
  } catch (error) {
    return fail(errorMessage(error))
  }
}

/**
 * GET /api/picks/cover
 *
 * 관리자 화면용 묶음 목록. 장 목록은 무거워 빼고 요약과 채점 결과만 돌려준다.
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return fail("관리자 권한이 필요합니다.", 403)

    const { data, error } = await getAdminClient()
        .from(TABLE)
        .select("id, created_at, draw_no, mean_percentile, quiet_tickets, model_version, best_matched, match_counts, rank_counts, scored_at")
        .order("id", { ascending: false })
        .limit(MAX_BUNDLES)

    if (error) throw error

    return ok({ bundles: Array.isArray(data) ? data : [] })
  } catch (error) {
    console.error("묶음 기록 조회 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/** 1~45 가 한 번씩 든 45개 배열인지 */
const isPermutation = (labels: unknown): labels is number[] =>
    Array.isArray(labels) &&
    labels.length === ALL_NUMBERS.length &&
    labels.every((n) => Number.isInteger(n) && n >= 1 && n <= ALL_NUMBERS.length) &&
    new Set(labels).size === ALL_NUMBERS.length

const toRatio = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null
