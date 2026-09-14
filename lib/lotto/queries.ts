import { supabase } from "@/lib/supabase/client"
import { fromPrizeRow, type DrawPrize, type DrawPrizeRow } from "./prizes"
import type { DrawSource, LottoResult, WinningLottoNumbers } from "./types"

const WINNING_TABLE = "winning_numbers"
const PRIZE_TABLE = "draw_prizes"

/** 한 번에 읽어 오는 행 수. Supabase 응답 상한과 같다. */
const PAGE_SIZE = 1000

/** 가장 최근 추첨 회차를 반환한다. 데이터가 없으면 null. */
export const fetchLatestDraw = async (): Promise<WinningLottoNumbers | null> => {
  const { data, error } = await supabase
      .from(WINNING_TABLE)
      .select("*")
      .order("drawNo", { ascending: false })
      .limit(1)
      .maybeSingle()

  if (error) {
    console.error("최신 회차를 불러오지 못했습니다:", error.message)
    return null
  }

  return data as WinningLottoNumbers | null
}

/** 전체 당첨 이력을 회차 오름차순으로 반환한다. */
export const fetchAllDraws = async (): Promise<WinningLottoNumbers[]> => {
  const { data, error } = await supabase
      .from(WINNING_TABLE)
      .select("*")
      .order("drawNo", { ascending: true })

  if (error) {
    console.error("당첨 이력을 불러오지 못했습니다:", error.message)
    return []
  }

  return (data ?? []) as WinningLottoNumbers[]
}

/** 회차별 등수 당첨자 수·판매액을 회차 오름차순으로 반환한다. 표가 없거나 읽지 못하면 빈 배열이다. */
export const fetchDrawPrizes = async (): Promise<DrawPrize[]> => {
  const rows: DrawPrizeRow[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
        .from(PRIZE_TABLE)
        .select("*")
        .order("draw_no", { ascending: true })
        .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error("회차별 당첨자 수를 불러오지 못했습니다:", error.message)
      return []
    }

    const page = Array.isArray(data) ? (data as DrawPrizeRow[]) : []
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }

  return rows.map(fromPrizeRow)
}

/** 회차 목록 페이지 조회 방향 */
export type DrawPageDirection = "older" | "newer"

/**
 * 기준 회차에서 한 페이지 분량의 회차를 가져온다.
 *
 * "older"는 기준 회차 이하를 내림차순으로, "newer"는 기준 회차 초과를
 * 오름차순으로 조회한 뒤 항상 최신순으로 정렬해 돌려준다.
 */
export const fetchDrawPage = async (
    baseDrawNo: number,
    direction: DrawPageDirection,
    pageSize: number,
): Promise<WinningLottoNumbers[]> => {
  const query =
      direction === "newer"
          ? supabase.from(WINNING_TABLE).select("*").gt("drawNo", baseDrawNo).order("drawNo", { ascending: true })
          : supabase.from(WINNING_TABLE).select("*").lte("drawNo", baseDrawNo).order("drawNo", { ascending: false })

  const { data, error } = await query.limit(pageSize)

  if (error) {
    console.error("회차 목록을 불러오지 못했습니다:", error.message)
    return []
  }

  return ((data ?? []) as WinningLottoNumbers[]).sort((a, b) => b.drawNo - a.drawNo)
}

/** number_picks 행을 도메인 타입으로 변환한다. */
export const toLottoResult = (row: {
  id: number | string
  numbers: unknown
  created_at: string
  source?: string | null
  draw_no?: number | null
  memo?: string | null
}): LottoResult => ({
  id: String(row.id),
  numbers: Array.isArray(row.numbers) ? (row.numbers as number[]) : [],
  timestamp: new Date(row.created_at).getTime(),
  memo: row.memo ?? undefined,
  isAiRecommended: row.source === "ai",
  pickSource: isDrawSource(row.source) ? row.source : undefined,
  drawNo: row.draw_no ?? undefined,
})

const isDrawSource = (value: unknown): value is DrawSource => value === "machine" || value === "manual" || value === "ai"
