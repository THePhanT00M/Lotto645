import { supabase } from "@/lib/supabase/client"
import type { LottoResult, WinningLottoNumbers } from "./types"

const WINNING_TABLE = "winning_numbers"
const GENERATED_TABLE = "generated_numbers"

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

/** 로그인한 사용자의 서버 저장 기록을 최신순으로 반환한다. */
export const fetchUserRecords = async (userId: string): Promise<LottoResult[]> => {
  const { data, error } = await supabase
      .from(GENERATED_TABLE)
      .select("id, numbers, created_at, source, draw_no")
      .eq("user_id", userId)
      .eq("is_deleted", "N")
      .order("created_at", { ascending: false })

  if (error) {
    console.error("내 기록을 불러오지 못했습니다:", error.message)
    return []
  }

  return (data ?? []).map(toLottoResult)
}

/** generated_numbers 행을 도메인 타입으로 변환한다. */
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
  drawNo: row.draw_no ?? undefined,
})
