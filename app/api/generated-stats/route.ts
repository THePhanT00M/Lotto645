import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { requireAdmin } from "@/lib/auth/admin"
import { getAdminClient } from "@/lib/supabase/admin"

/** 조회 결과가 없을 때 Supabase가 돌려주는 코드 */
const NO_ROWS = "PGRST116"

/**
 * GET /api/generated-stats
 *
 * 다음 회차를 겨냥해 AI가 만든 번호들의 출현 빈도를 집계한다.
 * 클라이언트에서는 RLS 때문에 다른 사용자의 기록을 볼 수 없어 서버에서 집계한다.
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return fail("관리자 권한이 필요합니다.", 403)

    const supabase = getAdminClient()

    const { data: latestDraw, error: drawError } = await supabase
        .from("winning_numbers")
        .select("drawNo")
        .order("drawNo", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (drawError && drawError.code !== NO_ROWS) throw drawError

    const upcomingDrawNo = (latestDraw?.drawNo ?? 0) + 1

    const { data: generated, error: generatedError } = await supabase
        .from("generated_numbers")
        .select("numbers")
        .eq("draw_no", upcomingDrawNo)
        .eq("source", "ai")

    if (generatedError) throw generatedError

    const stats = new Map<number, number>()
    for (const row of generated ?? []) {
      const numbers = Array.isArray(row.numbers) ? (row.numbers as number[]) : []
      for (const number of numbers) {
        stats.set(number, (stats.get(number) ?? 0) + 1)
      }
    }

    return ok({
      upcomingDrawNo,
      stats: Object.fromEntries(stats),
      count: generated?.length ?? 0,
    })
  } catch (error) {
    console.error("Generated Stats API Error:", errorMessage(error))
    return fail(errorMessage(error))
  }
}
