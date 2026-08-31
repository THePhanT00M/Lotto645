import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { getAdminClient } from "@/lib/supabase/admin"

const TABLE = "ai_recommendations"

/** 한 회차에서 회피 판단에 쓸 최대 기록 수 */
const MAX_ROWS = 2000

/**
 * GET /api/ai-recommendations/avoid?drawNo=1240
 *
 * 이번 회차에 이미 내보낸 조합과 번호별 추천 횟수를 돌려준다.
 * 추천 엔진이 같은 조합을 다시 내지 않고, 이미 많이 나간 번호는 덜 고르게 하는 데 쓴다.
 */
export async function GET(request: NextRequest) {
  try {
    const drawNo = Number(new URL(request.url).searchParams.get("drawNo"))
    if (!drawNo) return fail("drawNo가 필요합니다.", 400)

    const { data, error } = await getAdminClient()
        .from(TABLE)
        .select("combination_key, numbers")
        .eq("draw_no", drawNo)
        .limit(MAX_ROWS)

    if (error) throw error

    const rows = data ?? []
    const numberCounts: Record<number, number> = {}

    for (const row of rows) {
      const numbers = Array.isArray(row.numbers) ? (row.numbers as number[]) : []
      for (const number of numbers) {
        numberCounts[number] = (numberCounts[number] ?? 0) + 1
      }
    }

    return ok({
      drawNo,
      total: rows.length,
      combinations: rows.map((row) => row.combination_key).filter(Boolean),
      numberCounts,
    })
  } catch (error) {
    console.error("추천 회피 정보 조회 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}
