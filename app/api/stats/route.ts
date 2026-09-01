import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { requireAdmin } from "@/lib/auth/admin"
import { getAdminClient } from "@/lib/supabase/admin"

/** 통계 화면에서 쓰는 기록 컬럼 */
const RECORD_COLUMNS = "id, numbers, created_at, source, draw_no"

/**
 * GET /api/stats
 *
 * 관리자 통계 화면용 데이터. 최신 회차의 당첨 번호와 그 회차를 겨냥했던
 * 기록, 그리고 아직 결과를 기다리는 다음 회차 기록을 함께 내려준다.
 * RLS를 우회해야 전체 사용자 기록을 집계할 수 있어 서비스 롤로 조회한다.
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) return fail("관리자 권한이 필요합니다.", 403)

    const supabase = getAdminClient()

    const { data: latestDraw, error: drawError } = await supabase
        .from("winning_numbers")
        .select("*")
        .order("drawNo", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (drawError) throw drawError
    if (!latestDraw) return fail("당첨 번호 데이터가 없습니다.", 404)

    const upcomingDrawNo = latestDraw.drawNo + 1

    const [completed, pending] = await Promise.all([
      supabase.from("number_picks").select(RECORD_COLUMNS).eq("draw_no", latestDraw.drawNo).is("deleted_at", null),
      supabase.from("number_picks").select(RECORD_COLUMNS).eq("draw_no", upcomingDrawNo).is("deleted_at", null),
    ])

    if (completed.error) throw completed.error
    if (pending.error) throw pending.error

    return ok({
      completedHistoryData: completed.data ?? [],
      pendingHistoryData: pending.data ?? [],
      latestDrawData: latestDraw,
      upcomingDrawNo,
    })
  } catch (error) {
    console.error("Admin Stats API Error:", errorMessage(error))
    return fail(errorMessage(error))
  }
}
