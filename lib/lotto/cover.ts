import { MAX_NUMBER } from "./constants"

/**
 * 3개 보장 묶음 181장. 45개를 22·23개로 나누면 당첨 번호 중 3개 이상이 반드시 한쪽에 든다.
 * 양쪽의 모든 3개 묶음을 어느 한 장이 품으므로, 어떤 당첨 번호에도 한 장은 3개 이상 맞는다.
 *
 * 구성
 *   - 22개 쪽 : 확장 골레이 부호에서 얻는 S(3,6,22) 77장. 3개 묶음 1,540가지를 정확히 한 번씩 품는다.
 *   - 23개 쪽 : 같은 77장 + 남은 한 번호에 22개의 2개 묶음을 덮는 5개짜리 27장을 붙인 104장.
 * 전수 검증은 pnpm cover:verify
 */

/** 22개 쪽 블록 수. La Jolla 표의 C(22,6,3) 최솟값과 같다. */
const STEINER_SIZE = 77

/** 22개의 모든 2개 묶음을 덮는 5개짜리 27장. 담금질로 찾았고 하한 27장과 같다. */
const PAIR_COVER_22: readonly (readonly number[])[] = [
  [2, 3, 5, 10, 12], [5, 14, 17, 18, 20], [6, 7, 9, 15, 19], [4, 9, 14, 20, 21], [1, 11, 12, 13, 20],
  [1, 5, 7, 10, 14], [0, 12, 14, 19, 20], [4, 9, 10, 11, 18], [0, 1, 4, 15, 17], [1, 6, 9, 12, 16],
  [2, 3, 13, 14, 15], [2, 3, 9, 16, 17], [4, 5, 16, 19, 21], [1, 2, 4, 8, 21], [0, 3, 7, 11, 21],
  [2, 7, 11, 19, 20], [6, 12, 15, 18, 21], [1, 3, 8, 18, 19], [6, 8, 11, 14, 16], [10, 13, 17, 19, 21],
  [5, 6, 11, 15, 17], [0, 7, 13, 16, 18], [8, 10, 15, 16, 20], [0, 2, 6, 10, 18], [4, 7, 8, 12, 17],
  [3, 4, 6, 13, 20], [0, 5, 8, 9, 13],
]

/** 23개 쪽의 첫 자리. 0~21 이 22개 쪽, 22~44 가 23개 쪽이다. */
const SECOND_HALF = 22

/** 골레이 부호의 생성 다항식 차수들 (x^11 + x^10 + x^6 + x^5 + x^4 + x^2 + 1) */
const GOLAY_GENERATOR = [0, 2, 4, 5, 6, 10, 11]

/**
 * S(3,6,22) 77장을 0~21 로 만든다.
 * 확장 골레이 부호의 무게 8 부호어 가운데 22·23번 자리를 모두 가진 것에서 그 두 자리를 뺀다.
 */
const buildSteiner22 = (): number[][] => {
  const basis = Array.from({ length: 12 }, (_, shift) =>
      GOLAY_GENERATOR.reduce((word, power) => word | (1 << (power + shift)), 0),
  )
  const blocks: number[][] = []

  for (let mask = 0; mask < 4096; mask++) {
    let word = 0
    for (let i = 0; i < 12; i++) if ((mask >> i) & 1) word ^= basis[i]
    if (bitCount(word) % 2 === 1) word |= 1 << 23

    if (bitCount(word) !== 8 || !((word >> 22) & 1) || !((word >> 23) & 1)) continue
    blocks.push(Array.from({ length: 22 }, (_, i) => i).filter((i) => (word >> i) & 1))
  }

  if (blocks.length !== STEINER_SIZE) throw new Error(`S(3,6,22) 블록 수가 ${blocks.length}개입니다.`)
  return blocks
}

const bitCount = (value: number): number => {
  let count = 0
  for (let rest = value; rest; rest &= rest - 1) count++
  return count
}

/** 자리(0~44)로 적은 181장. 번호를 붙이기 전의 뼈대다. */
export const COVER_LAYOUT: readonly (readonly number[])[] = (() => {
  const steiner = buildSteiner22()
  const last = MAX_NUMBER - 1

  return [
    ...steiner,
    ...steiner.map((block) => block.map((slot) => slot + SECOND_HALF)),
    ...PAIR_COVER_22.map((block) => [...block.map((slot) => slot + SECOND_HALF), last]),
  ]
})()

/** 묶음 장수 */
export const COVER_SIZE = COVER_LAYOUT.length

/** 814만 가지 당첨 번호 전부로 잰 묶음 성적. 번호 배치와 무관하며 pnpm cover:verify 가 다시 잰다. */
export const COVER_STATS = {
  /** 묶음에서 가장 잘 맞은 한 장의 적중 개수 분포 (3~6개, 회차 비율) */
  bestShare: { 3: 6_353_988 / 8_145_060, 4: 1_748_621 / 8_145_060, 5: 42_270 / 8_145_060, 6: 181 / 8_145_060 },
  /** 회차마다 3개·4개 적중하는 평균 장수 */
  averageHits: { 3: 4.061747856983251, 4: 0.24699818049222474 },
} as const

/** 자리마다 번호를 붙여 181장을 만든다. labels[자리] = 번호. 장 안은 오름차순이다. */
export const labelCover = (labels: readonly number[]): number[][] => {
  if (labels.length !== MAX_NUMBER) throw new Error("번호 배치는 45개여야 합니다.")
  return COVER_LAYOUT.map((block) => block.map((slot) => labels[slot]).sort((a, b) => a - b))
}

/** 자리마다 그 자리가 든 장 번호 목록. 배치를 바꿀 때 다시 잴 장만 고르는 데 쓴다. */
export const TICKETS_BY_SLOT: readonly (readonly number[])[] = Array.from({ length: MAX_NUMBER }, (_, slot) =>
    COVER_LAYOUT.flatMap((block, index) => (block.includes(slot) ? [index] : [])),
)
