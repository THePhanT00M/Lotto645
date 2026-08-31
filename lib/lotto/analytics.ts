import { combinationKey, combinations } from "./combinations"
import { PICK_COUNT } from "./constants"
import type { WinningLottoNumbers } from "./types"

/** 특정 조합이 등장했던 회차 */
export interface Appearance {
  drawNo: number
  date: string
}

/** 선택한 번호의 부분 조합과 그 조합의 과거 등장 이력 */
export interface MultipleNumber {
  /** 조합을 이루는 번호 개수 (2~5) */
  size: number
  numbers: number[]
  count: number
  appearances: Appearance[]
}

/** 쌍둥이 분석에서 다루는 조합 크기 (큰 조합부터) */
export const MULTIPLE_SIZES = [5, 4, 3, 2] as const

export type MultipleSize = (typeof MULTIPLE_SIZES)[number]

/** 조합 크기를 "5쌍둥이" 형태의 라벨로 변환한다. */
export const multipleLabel = (size: number): string => `${size}쌍둥이`

/**
 * 선택한 6개 번호의 모든 부분 조합(2~5개)이 과거에 몇 번 함께 당첨됐는지 집계한다.
 *
 * 조합마다 전체 이력을 훑으면 O(조합수 × 회차수)가 되므로,
 * 이력을 한 번만 순회하며 각 회차가 포함하는 부분 조합에 등장 이력을 누적한다.
 */
export const findMultiples = (
    selectedNumbers: readonly number[],
    draws: readonly WinningLottoNumbers[],
): MultipleNumber[] => {
  if (selectedNumbers.length !== PICK_COUNT) return []

  const sorted = [...selectedNumbers].sort((a, b) => a - b)
  const selectedSet = new Set(sorted)

  const buckets = new Map<string, MultipleNumber>()
  for (const size of MULTIPLE_SIZES) {
    for (const numbers of combinations(sorted, size)) {
      buckets.set(combinationKey(numbers), { size, numbers, count: 0, appearances: [] })
    }
  }

  for (const draw of draws) {
    // 이번 회차가 맞춘 선택 번호들. 그 안의 부분 조합만 등장 이력을 얻는다.
    const overlap = draw.numbers.filter((n) => selectedSet.has(n)).sort((a, b) => a - b)
    if (overlap.length < 2) continue

    for (const size of MULTIPLE_SIZES) {
      if (overlap.length < size) continue
      for (const numbers of combinations(overlap, size)) {
        const bucket = buckets.get(combinationKey(numbers))
        if (!bucket) continue
        bucket.count += 1
        bucket.appearances.push({ drawNo: draw.drawNo, date: draw.date })
      }
    }
  }

  return [...buckets.values()]
      .map((bucket) => ({
        ...bucket,
        appearances: bucket.appearances.sort((a, b) => b.drawNo - a.drawNo),
      }))
      .sort((a, b) => b.size - a.size || b.count - a.count)
}

/** 번호 목록의 출현 빈도를 내림차순으로 집계한다. */
export const countNumberFrequency = (
    numberSets: readonly (readonly number[])[],
): { number: number; count: number }[] => {
  const counts = new Map<number, number>()

  for (const numbers of numberSets) {
    if (!Array.isArray(numbers)) continue
    for (const number of numbers) {
      counts.set(number, (counts.get(number) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
      .map(([number, count]) => ({ number, count }))
      .sort((a, b) => b.count - a.count || a.number - b.number)
}
