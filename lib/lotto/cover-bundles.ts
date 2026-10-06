import { getAdminClient } from "@/lib/supabase/admin"
import { scoreTickets } from "./cover-score"
import type { WinningLottoNumbers } from "./types"

const TABLE = "cover_bundles"

/**
 * 아직 채점하지 않은 묶음을 회차별 당첨 번호와 대조해 결과를 채운다.
 * 표가 없거나 실패해도 번호 기록 채점을 막지 않도록 0을 돌려준다.
 */
export const scorePendingBundles = async (drawMap: ReadonlyMap<number, WinningLottoNumbers>): Promise<number> => {
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
        .from(TABLE)
        .select("id, draw_no, tickets")
        .in("draw_no", [...drawMap.keys()])
        .is("scored_at", null)

    if (error) throw error

    const rows = Array.isArray(data) ? data : []
    const scoredAt = new Date().toISOString()
    let scored = 0

    for (const row of rows) {
      const draw = drawMap.get(row.draw_no)
      if (!draw || !Array.isArray(row.tickets)) continue

      const result = scoreTickets(row.tickets as number[][], draw)
      const { error: updateError } = await supabase
          .from(TABLE)
          .update({
            best_matched: result.bestMatched,
            match_counts: result.matchCounts,
            rank_counts: result.rankCounts,
            scored_at: scoredAt,
          })
          .eq("id", row.id)

      if (updateError) throw updateError
      scored++
    }

    return scored
  } catch (error) {
    console.error("묶음 채점 실패:", error instanceof Error ? error.message : error)
    return 0
  }
}
