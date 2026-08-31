import { PICK_COUNT } from "./constants"
import { matchDraw, type MatchResult, type Rank } from "./rank"
import type { LottoResult, WinningLottoNumbers } from "./types"

/** 기록 한 건과 그 회차 대조 결과 */
export interface AnalyzedResult {
  result: LottoResult
  match: MatchResult
}

/** 등수별 집계 한 줄 */
export interface RankCount {
  rank: Rank
  count: number
  /** 전체 대비 비율(%) */
  percentage: number
}

/** 일치 개수별 집계 한 줄 */
export interface MatchCount {
  matchCount: number
  count: number
  percentage: number
}

/** 한 그룹(전체 / AI / 일반)의 통계 묶음 */
export interface StatsSummary {
  total: number
  winCount: number
  /** 당첨률(%) — 소수점 둘째 자리까지 */
  winRate: string
  rankCounts: RankCount[]
  matchCounts: MatchCount[]
}

/** 표에 항상 같은 순서로 등장해야 하는 등수 */
const RANK_ORDER: Rank[] = [1, 2, 3, 4, 5, null]

/** 기록 목록을 특정 회차와 대조한다. */
export const analyzeResults = (
    results: readonly LottoResult[],
    draw: WinningLottoNumbers,
): AnalyzedResult[] => results.map((result) => ({ result, match: matchDraw(result.numbers, draw) }))

/** 대조 결과를 등수·일치 개수별로 집계한다. */
export const summarize = (analyzed: readonly AnalyzedResult[]): StatsSummary => {
  const total = analyzed.length
  const ratio = (count: number) => (total > 0 ? (count / total) * 100 : 0)

  const rankCounts = RANK_ORDER.map((rank) => {
    const count = analyzed.filter((item) => item.match.rank === rank).length
    return { rank, count, percentage: ratio(count) }
  })

  const matchCounts = Array.from({ length: PICK_COUNT + 1 }, (_, matchCount) => {
    const count = analyzed.filter((item) => item.match.matchCount === matchCount).length
    return { matchCount, count, percentage: ratio(count) }
  })

  const winCount = analyzed.filter((item) => item.match.rank !== null).length

  return {
    total,
    winCount,
    winRate: ratio(winCount).toFixed(2),
    rankCounts,
    matchCounts,
  }
}

/** 당첨된 기록만 등수 순으로 추린다. */
export const listWinners = (analyzed: readonly AnalyzedResult[]): AnalyzedResult[] =>
    analyzed
        .filter((item) => item.match.rank !== null)
        .sort((a, b) => (a.match.rank ?? 99) - (b.match.rank ?? 99))
