import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { hasCronSecret, requireAdmin } from "@/lib/auth/admin"
import { matchDraw } from "@/lib/lotto/rank"
import type { WinningLottoNumbers } from "@/lib/lotto/types"
import { getAdminClient } from "@/lib/supabase/admin"

const TABLE = "number_picks"

/**
 * POST /api/picks/score
 *
 * 아직 채점하지 않은 기록을 해당 회차의 당첨 번호와 대조해 결과를 채운다.
 * 회차를 지정하지 않으면 발표된 모든 회차의 미채점 기록을 처리한다.
 */
export async function POST(request: NextRequest) {
  try {
    // 스케줄러가 부를 수도 있어 시크릿 헤더도 함께 받는다.
    if (!hasCronSecret(request) && !(await requireAdmin(request))) {
      return fail("관리자 권한이 필요합니다.", 403)
    }

    const supabase = getAdminClient()
    const body = await request.json().catch(() => ({}))
    const targetDrawNo: number | undefined = body?.drawNo

    const pending = supabase.from(TABLE).select("id, draw_no, numbers").is("scored_at", null)
    const { data: records, error } = targetDrawNo ? await pending.eq("draw_no", targetDrawNo) : await pending

    if (error) throw error
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

    const scored = await scoreRecords(records, drawMap)
    return ok({ scored, message: `${scored}건을 채점했습니다.` })
  } catch (error) {
    console.error("채점 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/** 기록을 회차별 당첨 번호와 대조해 결과를 채운다. */
export const scoreRecords = async (
    records: readonly { id: number; draw_no: number; numbers: unknown }[],
    drawMap: ReadonlyMap<number, WinningLottoNumbers>,
): Promise<number> => {
  const supabase = getAdminClient()
  const scoredAt = new Date().toISOString()
  let scored = 0

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

  return scored
}
