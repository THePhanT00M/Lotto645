import { MAX_NUMBER, PICK_COUNT } from "./constants"

/**
 * 채점된 추천을 무작위 기준과 견주는 계산
 *
 * 같은 회차의 추천은 모두 같은 당첨 번호로 채점되므로 서로 독립이 아니다.
 * 추천이 몇몇 번호에 몰려 있으면 그 번호가 나오느냐에 따라 회차 전체가 함께 오르내린다.
 * 그래서 조합 수만으로 오차를 잡지 않고, 번호가 실제로 몇 번씩 쓰였는지로 분산을 구한다.
 */

/** 번호 하나가 당첨 번호에 들 확률 */
const P_SINGLE = PICK_COUNT / MAX_NUMBER

/** 서로 다른 두 번호가 함께 당첨 번호에 들 확률 */
const P_PAIR = (PICK_COUNT * (PICK_COUNT - 1)) / (MAX_NUMBER * (MAX_NUMBER - 1))

/** 95% 구간의 표준정규 분위수 */
const Z_95 = 1.96

/** 5등이 되는 최소 적중 개수 */
const MIN_PRIZE_MATCH = 3

/** 무작위 조합의 평균 적중 개수 */
export const EXPECTED_MATCHED = PICK_COUNT * P_SINGLE

/** 조합론: nCk */
const choose = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0
  let result = 1
  for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1)
  return result
}

/** 무작위 조합이 당첨 번호와 k개 맞을 확률 (초기하분포) */
export const matchProbability = (k: number): number =>
    (choose(PICK_COUNT, k) * choose(MAX_NUMBER - PICK_COUNT, PICK_COUNT - k)) / choose(MAX_NUMBER, PICK_COUNT)

/** 무작위 조합이 5등 이상에 들 확률 */
export const WIN_PROBABILITY = Array.from({ length: PICK_COUNT - MIN_PRIZE_MATCH + 1 }, (_, i) =>
    matchProbability(MIN_PRIZE_MATCH + i),
).reduce((sum, p) => sum + p, 0)

/** 집계에 필요한 기록 한 건의 값 */
export interface ScoredPick {
  draw_no: number
  numbers: readonly number[] | null
  matched_count: number | null
  prize_rank: number | null
}

/** 한 회차에서 한 무리(AI 추천이나 대조군)의 채점 결과 */
export interface DrawTally {
  drawNo: number
  count: number
  matchedTotal: number
  winCount: number
  /** 번호별로 조합에 들어간 횟수. 인덱스가 번호다. */
  numberCounts: number[]
}

/** 채점된 기록을 회차별로 모은다. 채점 전 기록은 건너뛴다. */
export const tallyByDraw = (picks: readonly ScoredPick[] | null | undefined): DrawTally[] => {
  const byDraw = new Map<number, DrawTally>()

  for (const pick of picks ?? []) {
    if (pick.matched_count === null || !Array.isArray(pick.numbers)) continue

    let tally = byDraw.get(pick.draw_no)
    if (!tally) {
      tally = {
        drawNo: pick.draw_no,
        count: 0,
        matchedTotal: 0,
        winCount: 0,
        numberCounts: new Array<number>(MAX_NUMBER + 1).fill(0),
      }
      byDraw.set(pick.draw_no, tally)
    }

    tally.count++
    tally.matchedTotal += pick.matched_count
    if (pick.prize_rank !== null) tally.winCount++
    for (const number of pick.numbers) {
      if (number >= 1 && number <= MAX_NUMBER) tally.numberCounts[number]++
    }
  }

  return [...byDraw.values()]
}

/**
 * 당첨 번호가 무작위로 나올 때 한 회차 적중 합계의 평균과 분산.
 *
 * 적중 합계는 번호마다 (쓰인 횟수 × 당첨 여부)를 더한 값이다. 번호마다의 분산에
 * 두 번호가 함께 뽑힐 때의 공분산(음수)을 더하면, 같은 번호에 몰린 추천일수록 분산이 커진다.
 */
const nullMoments = ({ numberCounts }: DrawTally): { mean: number; variance: number } => {
  let used = 0
  let usedSquares = 0
  for (const count of numberCounts) {
    used += count
    usedSquares += count * count
  }

  const single = P_SINGLE * (1 - P_SINGLE)
  const pair = P_PAIR - P_SINGLE * P_SINGLE

  return {
    mean: P_SINGLE * used,
    variance: (single - pair) * usedSquares + pair * used * used,
  }
}

/** 무작위 범위 대비 판정 */
export type Verdict = "within" | "above" | "below"

/** 한 무리의 성적을 무작위 기준과 견준 결과 */
export interface RandomComparison {
  count: number
  mean: number
  winCount: number
  /** 무작위였다면 기대되는 5등 이상 건수 */
  expectedWins: number
  /** 무작위였다면 평균 적중이 95% 확률로 들어오는 구간 */
  low: number
  high: number
  verdict: Verdict
}

/**
 * 여러 회차의 채점 결과를 합쳐 무작위 기준과 견준다.
 *
 * 회차마다 당첨 번호가 따로 뽑히므로 회차별 분산을 그대로 더한다.
 * 정규 근사라 건수가 적은 회차일수록 범위가 거칠다.
 */
export const compareWithRandom = (tallies: readonly DrawTally[] | null | undefined): RandomComparison | null => {
  const rows = Array.isArray(tallies) ? tallies : []
  const count = rows.reduce((sum, tally) => sum + tally.count, 0)
  if (count === 0) return null

  let matchedTotal = 0
  let winCount = 0
  let expectedTotal = 0
  let variance = 0
  for (const tally of rows) {
    const moments = nullMoments(tally)
    matchedTotal += tally.matchedTotal
    winCount += tally.winCount
    expectedTotal += moments.mean
    variance += moments.variance
  }

  const mean = matchedTotal / count
  const expectedMean = expectedTotal / count
  const margin = (Z_95 * Math.sqrt(variance)) / count
  const low = Math.max(0, expectedMean - margin)
  const high = expectedMean + margin

  return {
    count,
    mean,
    winCount,
    expectedWins: count * WIN_PROBABILITY,
    low,
    high,
    verdict: mean > high ? "above" : mean < low ? "below" : "within",
  }
}
