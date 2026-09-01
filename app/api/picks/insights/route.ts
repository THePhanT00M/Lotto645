import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { requireAdmin } from "@/lib/auth/admin"
import { getAdminClient } from "@/lib/supabase/admin"

const TABLE = "pick_insights"

/** 조인 결과의 모양. 타입 생성기를 쓰지 않아 여기서 형태를 밝혀 둔다. */
interface InsightRow {
  pick_id: number
  score: number
  network_score: number
  typicality: number
  features: Record<string, number>
  model: Record<string, number>
  model_version: string
  max_past_overlap: number | null
  pick: {
    created_at: string
    draw_no: number
    numbers: number[]
    matched_count: number | null
    bonus_matched: boolean | null
    prize_rank: number | null
    scored_at: string | null
  } | null
}

/**
 * GET /api/picks/insights
 *
 * AI 추천 근거와 그 번호 기록을 함께 돌려준다.
 * 수집한 데이터를 살펴보고 내려받는 관리자 화면에서 쓴다.
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return fail("관리자 권한이 필요합니다.", 403)

    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 200)

    const { data, error } = await getAdminClient()
        .from(TABLE)
        .select(
            "pick_id, score, network_score, typicality, features, model, model_version, max_past_overlap," +
            " pick:number_picks!inner(id, created_at, draw_no, numbers, matched_count, bonus_matched, prize_rank, scored_at)",
        )
        .order("pick_id", { ascending: false })
        .limit(Math.min(1000, Math.max(1, limit)))

    if (error) throw error

    // 화면에서 다루기 쉽도록 한 겹으로 편다.
    const records = ((data ?? []) as unknown as InsightRow[]).map((row) => {
      const pick = row.pick

      return {
        id: row.pick_id,
        created_at: pick?.created_at ?? null,
        draw_no: pick?.draw_no ?? null,
        numbers: pick?.numbers ?? [],
        matched_count: pick?.matched_count ?? null,
        bonus_matched: pick?.bonus_matched ?? null,
        prize_rank: pick?.prize_rank ?? null,
        scored_at: pick?.scored_at ?? null,
        score: row.score,
        network_score: row.network_score,
        typicality: row.typicality,
        features: row.features,
        model: row.model,
        model_version: row.model_version,
        max_past_overlap: row.max_past_overlap,
      }
    })

    return ok({ records })
  } catch (error) {
    console.error("추천 근거 조회 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}
