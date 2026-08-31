import { MAX_NUMBER } from "./constants"
import type { WinningLottoNumbers } from "./types"

/**
 * 과거 회차와 얼마나 겹치는지 빠르게 세기 위한 색인
 *
 * 후보마다 1,200회를 전부 훑으면 탐색이 느려진다. 번호별로 그 번호가 나온
 * 회차 목록을 미리 만들어 두면, 후보의 여섯 번호가 가리키는 회차만 세면 된다.
 */
export interface OverlapIndex {
  /** 후보 조합이 과거 어느 회차와 최대 몇 개나 겹치는지 */
  maxOverlap: (numbers: readonly number[]) => number
  /** 가장 많이 겹치는 회차 */
  closestDraw: (numbers: readonly number[]) => { draw: WinningLottoNumbers; overlap: number } | null
}

export const buildOverlapIndex = (draws: readonly WinningLottoNumbers[]): OverlapIndex => {
  const drawsByNumber: number[][] = Array.from({ length: MAX_NUMBER + 1 }, () => [])
  draws.forEach((draw, index) => {
    for (const number of draw.numbers) drawsByNumber[number]?.push(index)
  })

  // 매번 새로 할당하지 않도록 카운터를 재사용하고, 건드린 자리만 되돌린다.
  const counts = new Int32Array(draws.length)
  const touched: number[] = []

  const tally = (numbers: readonly number[]) => {
    touched.length = 0
    let best = 0
    let bestIndex = -1

    for (const number of numbers) {
      for (const index of drawsByNumber[number] ?? []) {
        if (counts[index] === 0) touched.push(index)
        counts[index] += 1

        if (counts[index] > best) {
          best = counts[index]
          bestIndex = index
        }
      }
    }

    for (const index of touched) counts[index] = 0
    return { best, bestIndex }
  }

  return {
    maxOverlap: (numbers) => tally(numbers).best,
    closestDraw: (numbers) => {
      const { best, bestIndex } = tally(numbers)
      return bestIndex === -1 ? null : { draw: draws[bestIndex], overlap: best }
    },
  }
}
