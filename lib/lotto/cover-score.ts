import { PICK_COUNT } from "./constants"
import { matchDraw } from "./rank"
import type { WinningLottoNumbers } from "./types"

/** 묶음 한 벌을 한 회차와 대조한 결과 */
export interface BundleScore {
  /** 가장 잘 맞은 한 장의 적중 개수 */
  bestMatched: number
  /** 적중 0~6개인 장 수 (길이 7) */
  matchCounts: number[]
  /** 1~5등인 장 수 (길이 5) */
  rankCounts: number[]
}

/** 묶음의 모든 장을 당첨 번호와 대조해 적중·등수별 장 수를 센다. */
export const scoreTickets = (tickets: readonly (readonly number[])[], draw: WinningLottoNumbers): BundleScore => {
  const matchCounts = new Array<number>(PICK_COUNT + 1).fill(0)
  const rankCounts = new Array<number>(5).fill(0)

  for (const ticket of tickets) {
    const { matchCount, rank } = matchDraw([...ticket], draw)
    matchCounts[matchCount]++
    if (rank !== null) rankCounts[rank - 1]++
  }

  return { bestMatched: matchCounts.findLastIndex((count) => count > 0), matchCounts, rankCounts }
}
