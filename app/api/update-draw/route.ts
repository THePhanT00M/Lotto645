import { revalidatePath } from "next/cache"
import { errorMessage, fail, ok } from "@/lib/api-response"
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
    list?: {
      /** 회차 */
      ltEpsd: number
      /** 추첨일 (YYYYMMDD) */
      ltRflYmd: string
      tm1WnNo: number
      tm2WnNo: number
      tm3WnNo: number
      tm4WnNo: number
      tm5WnNo: number
      tm6WnNo: number
      bnsWnNo: number
    }[]
  }
}

/**
 * GET /api/update-draw
 *
 * 동행복권에서 다음 회차 결과를 가져와 DB에 넣는다. 아직 추첨 전이면
 * 목록이 비어 오므로 404로 알리고, 이미 저장된 회차는 409로 구분한다.
 */
export async function GET() {
  try {
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

    REVALIDATE_PATHS.forEach((path) => revalidatePath(path))

    return ok({ message: `${record.drawNo}회 당첨 번호가 성공적으로 DB에 삽입되었습니다.`, data: record })
  } catch (error) {
    console.error("Update Draw API Error:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/** "YYYYMMDD" → "YYYY-MM-DD" */
const formatDate = (raw: string): string => `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
