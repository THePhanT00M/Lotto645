import type { LottoAnalytics } from "./analytics"
import { combinationKey } from "./combinations"
import { ALL_NUMBERS, PICK_COUNT } from "./constants"
import { weightedRandomChoice } from "./random"

/** 동반 출현 횟수를 가중치에 반영할 때 곱하는 계수 */
const ASSOCIATION_WEIGHT = 3

/** 출현 이력이 없는 번호에도 최소한의 추첨 기회를 준다. */
const MIN_BASE_WEIGHT = 1

/**
 * 과거 당첨 이력의 출현 빈도와 동반 출현 패턴으로 번호 한 게임을 추천한다.
 *
 * 첫 번호는 순수 출현 빈도로 뽑고, 이후에는 이미 뽑힌 번호와 함께 나온 적이
 * 많은 번호일수록 가중치를 올려 연관된 조합이 만들어지도록 한다.
 */
export const recommendNumbers = (analytics: LottoAnalytics): number[] => {
  const numbers = [...ALL_NUMBERS]
  const baseWeights = numbers.map((n) => analytics.frequencyMap.get(n) || MIN_BASE_WEIGHT)

  const selected = new Set<number>([weightedRandomChoice(numbers, baseWeights)])

  while (selected.size < PICK_COUNT) {
    const weights = adjustWeights(selected, numbers, baseWeights, analytics.pairFrequency)
    selected.add(weightedRandomChoice(numbers, weights))
  }

  return [...selected].sort((a, b) => a - b)
}

/** 이미 뽑힌 번호를 제외하고, 그 번호들과의 동반 출현 횟수만큼 가중치를 더한다. */
const adjustWeights = (
    selected: ReadonlySet<number>,
    numbers: readonly number[],
    baseWeights: readonly number[],
    pairFrequency: ReadonlyMap<string, number>,
): number[] =>
    numbers.map((number, index) => {
      if (selected.has(number)) return 0

      let associationBonus = 0
      for (const picked of selected) {
        associationBonus += pairFrequency.get(combinationKey([picked, number])) ?? 0
      }

      return baseWeights[index] + associationBonus * ASSOCIATION_WEIGHT
    })
