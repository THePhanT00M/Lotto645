import { ALL_NUMBERS, MAX_NUMBER, MIN_NUMBER, PICK_COUNT } from "./constants"
import { GRID_COLUMNS, GRID_ROWS } from "./grid"
import { getRandomInt, pickUnique } from "./random"

/**
 * 학습에서 "이런 모양은 피한다"는 쪽 예시로 쓰는 조합들
 *
 * 실제 당첨 번호도 무작위 추첨이라, 아무렇게나 고른 조합을 반대편 예시로 쓰면
 * 두 무리가 같은 분포라 신경망이 배울 것이 없다. 그래서 사람이 손으로 찍기 쉬운
 * 규칙적인 모양(연속·등차·한 줄 몰림·덩어리)을 반대편에 세운다.
 *
 * 이런 모양이 덜 나온다는 뜻이 아니라, 실제로 나왔을 때 같은 번호를 고른 사람이
 * 많아 나눠 갖는 몫이 줄어드는 조합이다.
 */

/** 격자 좌표를 번호로 되돌린다. 범위를 벗어나면 null. */
const toNumber = (col: number, row: number): number | null => {
  if (col < 0 || col >= GRID_COLUMNS || row < 0 || row >= GRID_ROWS) return null
  const value = row * GRID_COLUMNS + col + 1
  return value >= MIN_NUMBER && value <= MAX_NUMBER ? value : null
}

/** 연속한 여섯 개 */
const consecutive = (): number[] => {
  const start = getRandomInt(MIN_NUMBER, MAX_NUMBER - PICK_COUNT + 1)
  return Array.from({ length: PICK_COUNT }, (_, i) => start + i)
}

/** 일정한 간격으로 벌어진 여섯 개 */
const arithmetic = (): number[] => {
  const step = getRandomInt(2, 8)
  const maxStart = MAX_NUMBER - step * (PICK_COUNT - 1)
  if (maxStart < MIN_NUMBER) return consecutive()

  const start = getRandomInt(MIN_NUMBER, maxStart)
  return Array.from({ length: PICK_COUNT }, (_, i) => start + step * i)
}

/** 용지의 한 가로줄에 몰아 찍은 모양 */
const singleRow = (): number[] => {
  // 마지막 줄은 세 칸뿐이라 여섯 개를 채울 수 없다.
  const row = getRandomInt(0, GRID_ROWS - 2)
  const available = Array.from({ length: GRID_COLUMNS }, (_, col) => toNumber(col, row)).filter(
      (n): n is number => n !== null,
  )

  if (available.length < PICK_COUNT) return consecutive()
  return pickUnique(available, PICK_COUNT)
}

/** 용지의 한 세로줄에 몰아 찍은 모양 */
const singleColumn = (): number[] => {
  const col = getRandomInt(0, GRID_COLUMNS - 1)
  const available = Array.from({ length: GRID_ROWS }, (_, row) => toNumber(col, row)).filter(
      (n): n is number => n !== null,
  )

  if (available.length < PICK_COUNT) return consecutive()
  return pickUnique(available, PICK_COUNT)
}

/** 직사각형 덩어리로 찍은 모양 */
const block = (): number[] => {
  const width = getRandomInt(2, 3)
  const height = Math.ceil(PICK_COUNT / width)
  const col = getRandomInt(0, GRID_COLUMNS - width)
  const row = getRandomInt(0, GRID_ROWS - height - 1)

  const cells: number[] = []
  for (let r = row; r < row + height; r++) {
    for (let c = col; c < col + width; c++) {
      const value = toNumber(c, r)
      if (value !== null) cells.push(value)
    }
  }

  if (cells.length < PICK_COUNT) return consecutive()
  return pickUnique(cells, PICK_COUNT)
}

/**
 * 용지 어딘가의 3×3 영역에 몰아 찍은 모양
 *
 * 네 구석만 쓰면 그 자리의 번호만 반대편 예시에 반복해서 들어간다.
 * 시작 칸을 격자 전체에서 고르게 잡아 어느 번호도 특별히 자주 뽑히지 않게 한다.
 */
const cluster = (): number[] => {
  const col = getRandomInt(0, GRID_COLUMNS - 3)
  const row = getRandomInt(0, GRID_ROWS - 3)

  const cells: number[] = []
  for (let r = row; r < row + 3; r++) {
    for (let c = col; c < col + 3; c++) {
      const value = toNumber(c, r)
      if (value !== null) cells.push(value)
    }
  }

  if (cells.length < PICK_COUNT) return consecutive()
  return pickUnique(cells, PICK_COUNT)
}

/** 대각선으로 이어 찍은 모양 */
const diagonal = (): number[] => {
  const startCol = getRandomInt(0, GRID_COLUMNS - 1)
  const startRow = getRandomInt(0, GRID_ROWS - 1)
  const dc = Math.random() < 0.5 ? 1 : -1

  const cells: number[] = []
  for (let i = 0; i < GRID_ROWS; i++) {
    const value = toNumber(startCol + dc * i, startRow + i)
    if (value !== null) cells.push(value)
  }

  if (cells.length < PICK_COUNT) return consecutive()
  return pickUnique(cells, PICK_COUNT)
}

const GENERATORS = [consecutive, arithmetic, singleRow, singleColumn, block, cluster, diagonal]

/** 규칙적인 모양의 조합을 하나 만든다. */
const createPureDecoy = (): number[] => {
  const generate = GENERATORS[getRandomInt(0, GENERATORS.length - 1)]
  const numbers = generate().filter((n) => n >= MIN_NUMBER && n <= MAX_NUMBER)

  // 생성기가 조건을 못 맞춘 경우 남는 자리는 임의로 채운다.
  if (numbers.length < PICK_COUNT) {
    const pool = ALL_NUMBERS.filter((n) => !numbers.includes(n))
    numbers.push(...pickUnique(pool, PICK_COUNT - numbers.length))
  }

  return [...new Set(numbers)].slice(0, PICK_COUNT).sort((a, b) => a - b)
}

/** 규칙적인 조합에서 몇 개를 임의의 번호로 바꿔 편향을 흐린다. */
const blur = (numbers: readonly number[], count: number): number[] => {
  const result = [...numbers]
  const pool = ALL_NUMBERS.filter((n) => !result.includes(n))

  for (let i = 0; i < count && pool.length > 0; i++) {
    const slot = getRandomInt(0, result.length - 1)
    const swapIndex = getRandomInt(0, pool.length - 1)
    result[slot] = pool[swapIndex]
    pool.splice(swapIndex, 1)
  }

  return [...new Set(result)].sort((a, b) => a - b)
}

/**
 * 반대편 예시 하나를 만든다.
 *
 * 뚜렷한 모양만 모아 두면 경계가 너무 뚜렷해져, 신경망이 정상 조합을 전부
 * 같은 점수로 밀어 올린다. 절반은 원형 그대로, 나머지는 한두 개를 흐트러뜨려
 * 어중간한 예시로 만들어 점수가 이어지도록 한다.
 */
export const createDecoy = (): number[] => {
  const pure = createPureDecoy()
  const blurCount = getRandomInt(0, 2)

  return blurCount === 0 ? pure : blur(pure, blurCount)
}

/** 균형 보정에서 한 조합을 다시 만들어 볼 최대 횟수 */
const MAX_REBALANCE_TRIES = 12

/**
 * 반대편 예시를 필요한 수만큼 만들되, 번호가 고르게 쓰이도록 맞춘다.
 *
 * 생성기들이 격자 좌표를 쓰다 보니 가운데 칸이 자주, 양 끝 칸은 드물게 뽑힌다.
 * 그대로 두면 판별 경계가 격자 일부 영역에만 맞춰지므로, 이미 많이 쓴 번호가
 * 들어간 조합은 몇 번 다시 뽑아 전체 사용량을 고르게 만든다.
 */
export const createDecoySet = (count: number): number[][] => {
  const used = new Array(MAX_NUMBER + 1).fill(0)
  const result: number[][] = []

  for (let i = 0; i < count; i++) {
    // 지금까지 쓴 양을 기준으로, 목표치를 넘긴 번호가 적은 후보를 고른다.
    const target = ((i + 1) * PICK_COUNT) / MAX_NUMBER
    let best = createDecoy()
    let bestExcess = excessOf(best, used, target)

    for (let attempt = 1; attempt < MAX_REBALANCE_TRIES && bestExcess > 0; attempt++) {
      const candidate = createDecoy()
      const excess = excessOf(candidate, used, target)

      if (excess < bestExcess) {
        best = candidate
        bestExcess = excess
      }
    }

    for (const number of best) used[number] += 1
    result.push(best)
  }

  return result
}

/** 목표 사용량을 넘긴 정도의 합. 작을수록 고르게 쓰인 조합이다. */
const excessOf = (numbers: readonly number[], used: readonly number[], target: number): number =>
    numbers.reduce((sum, number) => sum + Math.max(0, used[number] + 1 - target), 0)
