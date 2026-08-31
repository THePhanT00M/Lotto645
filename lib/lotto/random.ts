/** min 이상 max 이하의 정수를 반환한다. */
export const getRandomInt = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min

/** 배열에서 무작위 원소 하나를 반환한다. 빈 배열이면 undefined. */
export const pickRandom = <T,>(items: readonly T[]): T | undefined =>
    items.length === 0 ? undefined : items[getRandomInt(0, items.length - 1)]

/**
 * 후보 중 count개를 중복 없이 뽑는다.
 *
 * 원본 배열을 건드리지 않도록 복사본에서 뽑아낸다.
 */
export const pickUnique = (candidates: readonly number[], count: number): number[] => {
  const pool = [...candidates]
  const picked: number[] = []

  while (picked.length < count && pool.length > 0) {
    const index = getRandomInt(0, pool.length - 1)
    picked.push(pool[index])
    pool.splice(index, 1)
  }

  return picked
}

/**
 * 가중치에 비례해 항목 하나를 뽑는다.
 *
 * 가중치 합이 0 이하이면(모두 제외된 경우) 남은 후보 중 균등 추첨한다.
 */
export const weightedRandomChoice = (items: readonly number[], weights: readonly number[]): number => {
  const totalWeight = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0)

  if (totalWeight <= 0) {
    const candidates = items.filter((_, index) => weights[index] >= 0)
    return pickRandom(candidates) ?? items[0]
  }

  let threshold = Math.random() * totalWeight
  for (let i = 0; i < items.length; i++) {
    if (weights[i] <= 0) continue
    threshold -= weights[i]
    if (threshold <= 0) return items[i]
  }

  return items[items.length - 1]
}
