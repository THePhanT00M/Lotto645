import { PICK_COUNT } from "./constants"
import type { LottoResult, WinningLottoNumbers } from "./types"

/** 당첨 등수. `null`은 미당첨을 뜻한다. */
export type Rank = 1 | 2 | 3 | 4 | 5 | null

/** 번호 한 세트를 특정 회차와 대조한 결과 */
export interface MatchResult {
  /** 메인 번호 6개 중 맞은 개수 */
  matchCount: number
  /** 보너스 번호 일치 여부 */
  bonusMatch: boolean
  rank: Rank
}

/** 기록의 당첨 판정 상태 */
export type DrawStatus =
    | { kind: "matched"; drawNo: number; match: MatchResult }
    /** 아직 추첨되지 않은 회차 */
    | { kind: "pending"; drawNo: number }
    /** 과거 회차인데 당첨 번호 데이터가 없는 경우 */
    | { kind: "missing"; drawNo: number }

/** 등수를 한국어 라벨로 변환한다. */

/** 번호 한 세트를 회차 당첨 번호와 대조한다. */
export const matchDraw = (numbers: number[], draw: WinningLottoNumbers): MatchResult => {
  const winning = new Set(draw.numbers)
  const matchCount = numbers.reduce((count, n) => (winning.has(n) ? count + 1 : count), 0)
  const bonusMatch = numbers.includes(draw.bonusNo)

  return { matchCount, bonusMatch, rank: resolveRank(matchCount, bonusMatch) }
}

const resolveRank = (matchCount: number, bonusMatch: boolean): Rank => {
  if (matchCount === PICK_COUNT) return 1
  if (matchCount === 5) return bonusMatch ? 2 : 3
  if (matchCount === 4) return 4
  if (matchCount === 3) return 5
  return null
}

/**
 * 기록 한 건의 당첨 상태를 판정한다.
 *
 * 회차 정보(drawNo)가 있으면 그 회차와 대조하고, 없는 구 기록은
 * 저장 시각이 최신 회차 추첨일 이후인지로 대기 여부를 추정한다.
 */
export const resolveDrawStatus = (
    result: Pick<LottoResult, "numbers" | "timestamp" | "drawNo">,
    drawsByNo: ReadonlyMap<number, WinningLottoNumbers>,
    latestDraw: WinningLottoNumbers,
): DrawStatus => {
  if (result.drawNo !== undefined) {
    const target = drawsByNo.get(result.drawNo)
    if (target) {
      return { kind: "matched", drawNo: target.drawNo, match: matchDraw(result.numbers, target) }
    }
    return result.drawNo > latestDraw.drawNo
        ? { kind: "pending", drawNo: result.drawNo }
        : { kind: "missing", drawNo: result.drawNo }
  }

  if (result.timestamp > endOfDrawDay(latestDraw.date)) {
    return { kind: "pending", drawNo: latestDraw.drawNo + 1 }
  }

  return {
    kind: "matched",
    drawNo: latestDraw.drawNo,
    match: matchDraw(result.numbers, latestDraw),
  }
}

/** "YYYY-MM-DD" 추첨일의 자정 직전 시각(ms)을 구한다. */
const endOfDrawDay = (date: string): number => {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime()
}

/** 회차 목록을 회차 번호로 조회할 수 있는 Map으로 만든다. */
export const indexDrawsByNo = (
    draws: readonly WinningLottoNumbers[],
): Map<number, WinningLottoNumbers> => new Map(draws.map((draw) => [draw.drawNo, draw]))
