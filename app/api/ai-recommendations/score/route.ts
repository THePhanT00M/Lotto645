import { errorMessage, fail, ok } from "@/lib/api-response"
import { matchDraw } from "@/lib/lotto/rank"
import type { WinningLottoNumbers } from "@/lib/lotto/types"
import { getAdminClient } from "@/lib/supabase/admin"

const TABLE = "ai_recommendations"

/**
 * POST /api/ai-recommendations/score
 *
 * 아직 채점하지 않은 추천 기록을, 해당 회차의 당첨 번호와 대조해 결과를 채운다.
 * 회차를 지정하지 않으면 발표된 모든 회차의 미채점 기록을 처리한다.
 */
export async function POST(request: Request) {
  try {
    const supabase = getAdminClient()
    const body = await request.json().catch(() => ({}))
    const targetDrawNo: number | undefined = body?.drawNo

    const pending = supabase
        .from(TABLE)
        .select("id, draw_no, numbers")
        .is("scored_at", null)

    const { data: records, error: pendingError } = targetDrawNo
        ? await pending.eq("draw_no", targetDrawNo)
        : await pending

    if (pendingError) throw pendingError
    if (!records || records.length === 0) return ok({ scored: 0, message: "채점할 기록이 없습니다." })

    const drawNos = [...new Set(records.map((row) => row.draw_no))]
    const { data: draws, error: drawError } = await supabase
        .from("winning_numbers")
        .select("*")
        .in("drawNo", drawNos)

    if (drawError) throw drawError

    const drawMap = new Map<number, WinningLottoNumbers>(
        (draws ?? []).map((draw) => [draw.drawNo, draw as WinningLottoNumbers]),
    )

    const scoredAt = new Date().toISOString()
    let scored = 0

    // 회차 수만큼만 갱신이 돌도록, 같은 결과끼리 묶지 않고 건별로 처리한다.
    for (const record of records) {
      const draw = drawMap.get(record.draw_no)
      if (!draw) continue

      const numbers = Array.isArray(record.numbers) ? (record.numbers as number[]) : []
      const match = matchDraw(numbers, draw)

      const { error } = await supabase
          .from(TABLE)
          .update({
            matched_count: match.matchCount,
            bonus_matched: match.bonusMatch,
            prize_rank: match.rank,
            scored_at: scoredAt,
          })
          .eq("id", record.id)

      if (error) throw error
      scored++
    }

    return ok({ scored, message: `${scored}건을 채점했습니다.` })
  } catch (error) {
    console.error("AI 추천 채점 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}
