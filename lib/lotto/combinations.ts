/**
 * 조합 유틸
 *
 * 2~5쌍둥이 조합을 각각 중첩 루프로 하드코딩하던 것을 일반화한다.
 */

/** items에서 size개를 뽑는 모든 조합을 입력 순서대로 생성한다. */
export const combinations = <T,>(items: readonly T[], size: number): T[][] => {
  if (size <= 0 || size > items.length) return []

  const result: T[][] = []
  const current: T[] = []

  const walk = (start: number) => {
    if (current.length === size) {
      result.push([...current])
      return
    }
    // 남은 자리를 채울 수 없는 지점부터는 순회하지 않는다.
    const limit = items.length - (size - current.length)
    for (let i = start; i <= limit; i++) {
      current.push(items[i])
      walk(i + 1)
      current.pop()
    }
  }

  walk(0)
  return result
}

/** 정렬된 번호 조합을 Set 조회용 키로 만든다. */
export const combinationKey = (numbers: readonly number[]): string =>
    [...numbers].sort((a, b) => a - b).join("-")
