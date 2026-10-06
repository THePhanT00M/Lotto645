import { revalidatePath } from "next/cache"
import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { hasCronSecret, requireAdmin } from "@/lib/auth/admin"
import { prizeFromApi, toPrizeRow, type DrawPrize, type LottoApiItem } from "@/lib/lotto/prizes"
import { matchDraw } from "@/lib/lotto/rank"
import { getAdminClient } from "@/lib/supabase/admin"

/** 동행복권 회차 조회 API */
const LOTTO_API = "https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do"

/** 이미 같은 회차가 들어 있을 때 Postgres가 돌려주는 코드 */
const UNIQUE_VIOLATION = "23505"

/** 조회 결과가 없을 때 Supabase가 돌려주는 코드 */
const NO_ROWS = "PGRST116"

/** 새 회차가 반영되면 다시 생성해야 하는 경로 */
const REVALIDATE_PATHS = ["/", "/winning-numbers", "/history"]

interface LottoApiResponse {
  data?: {
    list?: LottoApiItem[]
  }
}

/**
 * GET /api/update-draw
 *
 * 동행복권에서 다음 회차 결과를 가져와 당첨 번호와 등수별 당첨자 수를 DB에 넣는다.
 * 아직 추첨 전이면 목록이 비어 오므로 404로 알리고, 이미 저장된 회차는 409로 구분한다.
 */
export async function GET(request: NextRequest) {
  try {
    // 매주 스케줄러가 부르는 경로라 시크릿 헤더도 허용한다.
    if (!hasCronSecret(request) && !(await requireAdmin(request))) {
      return fail("관리자 권한이 필요합니다.", 403)
    }

    const supabase = getAdminClient()

    const { data: latestDraw, error: fetchError } = await supabase
        .from("winning_numbers")
        .select("drawNo")
        .order("drawNo", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (fetchError && fetchError.code !== NO_ROWS) {
      throw new Error(`DB 조회 실패: ${fetchError.message}`)
    }

    const nextDrawNo = (latestDraw?.drawNo ?? 0) + 1

    const response = await fetch(`${LOTTO_API}?srchLtEpsd=${nextDrawNo}`, { cache: "no-store" })
    if (!response.ok) throw new Error(`동행복권 API 요청 실패: ${response.statusText}`)

    const payload: LottoApiResponse = await response.json()
    const item = payload.data?.list?.[0]

    if (!item) return fail(`아직 ${nextDrawNo}회차 데이터가 없습니다.`, 404)

    const record = {
      drawNo: item.ltEpsd,
      date: formatDate(item.ltRflYmd),
      numbers: [item.tm1WnNo, item.tm2WnNo, item.tm3WnNo, item.tm4WnNo, item.tm5WnNo, item.tm6WnNo].sort(
          (a, b) => a - b,
      ),
      bonusNo: item.bnsWnNo,
    }

    const { error: insertError } = await supabase.from("winning_numbers").insert(record)

    if (insertError) {
      if (insertError.code === UNIQUE_VIOLATION) {
        return fail(`${record.drawNo}회 데이터는 이미 DB에 존재합니다.`, 409)
      }
      throw new Error(`DB 삽입 실패: ${insertError.message}`)
    }

    const scored = await scorePendingRecommendations(supabase, record)
    const prizeSaved = await savePrize(supabase, prizeFromApi(item))

    REVALIDATE_PATHS.forEach((path) => revalidatePath(path))

    return ok({
      message: `${record.drawNo}회 당첨 번호가 성공적으로 DB에 삽입되었습니다.`,
      data: record,
      scoredPicks: scored,
      prizeSaved,
    })
  } catch (error) {
    console.error("Update Draw API Error:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/**
 * 등수별 당첨자 수와 판매액을 남긴다. AI 추천이 사람들이 몰리는 조합을 배우는 데 쓴다.
 *
 * 실패가 당첨 번호 삽입 성공을 가리지 않도록 따로 감싼다.
 */
const savePrize = async (supabase: ReturnType<typeof getAdminClient>, prize: DrawPrize): Promise<boolean> => {
  const { error } = await supabase.from("draw_prizes").upsert(toPrizeRow(prize), { onConflict: "draw_no" })

  if (error) {
    console.error("당첨자 수 저장 실패:", error.message)
    return false
  }

  return true
}

/** "YYYYMMDD" → "YYYY-MM-DD" */
const formatDate = (raw: string): string => `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`

/**
 * 이번 회차를 겨냥했던 기록을 새 당첨 번호와 대조해 채점한다.
 *
 * 채점 실패가 당첨 번호 삽입 성공을 가리지 않도록 따로 감싼다.
 */
const scorePendingRecommendations = async (
    supabase: ReturnType<typeof getAdminClient>,
    draw: { drawNo: number; numbers: number[]; bonusNo: number; date: string },
): Promise<number> => {
  try {
    const { data: records, error } = await supabase
        .from("number_picks")
        .select("id, numbers")
        .eq("draw_no", draw.drawNo)
        .is("scored_at", null)

    if (error) throw error
    if (!records || records.length === 0) return 0

    const scoredAt = new Date().toISOString()
    let scored = 0

    for (const record of records) {
      const numbers = Array.isArray(record.numbers) ? (record.numbers as number[]) : []
      const match = matchDraw(numbers, draw)

      const { error: updateError } = await supabase
          .from("number_picks")
          .update({
            matched_count: match.matchCount,
            bonus_matched: match.bonusMatch,
            prize_rank: match.rank,
            scored_at: scoredAt,
          })
          .eq("id", record.id)

      if (updateError) throw updateError
      scored++
    }

    return scored
  } catch (error) {
    console.error("채점 실패:", errorMessage(error))
    return 0
  }
}
