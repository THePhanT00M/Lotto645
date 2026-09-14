import { EXPECTED_MATCHED, type Verdict } from "./baseline"
import { MAX_NUMBER, PICK_COUNT } from "./constants"
import { GRID_COLUMNS } from "./grid"
import type { WinningLottoNumbers } from "./types"

/**
 * 사전 등록 신호 추적
 *
 * 1~1241회로 적중 신호 101개를 시험했지만 발견(~900회)·확인(901~1241회) 두 구간을 모두
 * 통과한 것은 없었다. 그중 확인 구간에서 가장 앞섰던 신호를 여기 고정해 두고, 시험에
 * 쓰지 않은 새 회차(PROSPECTIVE_START_DRAW 부터)로만 성적을 쌓는다. 과거 데이터를 보고
 * 고른 신호라 과거 성적은 믿을 수 없고, 앞으로의 회차만이 공정한 시험이 된다.
 *
 * 정의를 바꾸면 사전 등록이 깨진다. 바꾸려면 시작 회차도 그 시점의 다음 회차로 옮긴다.
 */
export const PROSPECTIVE_START_DRAW = 1242

/** 판정을 내리는 간격(약 1년). 매주 들여다보고 판정하면 우연히 선을 넘을 확률이 커진다. */
export const VERDICT_INTERVAL = 52

/**
 * 판정 기준 z (양쪽 0.1%).
 *
 * 신호 다섯 개를 8년 동안 해마다 한 번씩 보면 40번 판정하게 된다. 우연히 하나라도
 * "높음"으로 잘못 판정될 확률을 2% 안으로 두려고 이만큼 엄하게 잡았다.
 */
export const VERDICT_Z = 3.29

/** 조합 하나의 적중 분산 (초기하분포) */
const MATCH_VARIANCE =
    PICK_COUNT *
    (PICK_COUNT / MAX_NUMBER) *
    ((MAX_NUMBER - PICK_COUNT) / MAX_NUMBER) *
    ((MAX_NUMBER - PICK_COUNT) / (MAX_NUMBER - 1))

/** 평균 적중이 무작위보다 uplift 개 높은 신호가 판정 기준을 넘는 데 드는 회차 수 */
export const drawsToDetect = (uplift: number): number =>
    Math.ceil(((VERDICT_Z * Math.sqrt(MATCH_VARIANCE)) / uplift) ** 2)

export const SIGNAL_KEYS = [
  "dueByGap",
  "previousBonus",
  "avoidCooccurrence",
  "avoidGridNeighbors",
  "dateNumbers",
] as const

export type SignalKey = (typeof SIGNAL_KEYS)[number]

interface Target {
  drawNo: number
  /** YYYY-MM-DD */
  date: string
}

/** 번호별 점수 (인덱스가 번호). 점수가 높은 번호부터 고른다. */
type Scorer = (history: readonly WinningLottoNumbers[], target: Target) => number[]

const blank = (): number[] => new Array<number>(MAX_NUMBER + 1).fill(0)

const gridNeighbors = (number: number): number[] => {
  const row = Math.floor((number - 1) / GRID_COLUMNS)
  const col = (number - 1) % GRID_COLUMNS
  const result: number[] = []

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const r = row + dr
      const c = col + dc
      if (r < 0 || c < 0 || c >= GRID_COLUMNS) continue
      const neighbor = r * GRID_COLUMNS + c + 1
      if (neighbor <= MAX_NUMBER) result.push(neighbor)
    }
  }

  return result
}

/** 신호 정의. 괄호 안은 1~1241회 시험에서 6개를 골랐을 때의 z (발견 / 확인). */
const SCORERS: Record<SignalKey, Scorer> = {
  // 지금까지 비어 온 회차 수가 그 번호의 평균 간격에 가까울수록 높다. (-1.31 / +1.74)
  dueByGap: (history) => {
    const last = new Array<number>(MAX_NUMBER + 1).fill(-1)
    const gapSum = blank()
    const gapCount = blank()

    history.forEach((draw, index) => {
      for (const number of draw.numbers) {
        if (last[number] >= 0) {
          gapSum[number] += index - last[number]
          gapCount[number]++
        }
        last[number] = index
      }
    })

    const latest = history.length - 1
    return blank().map((_, number) =>
        gapCount[number] === 0 ? 0 : -Math.abs(latest - last[number] - gapSum[number] / gapCount[number]),
    )
  },

  // 직전 회차의 보너스 번호. 나머지 다섯 자리는 동점이다. (+2.30 / +0.43)
  previousBonus: (history) => {
    const scores = blank()
    const previous = history.at(-1)
    if (previous) scores[previous.bonusNo] = 1
    return scores
  },

  // 직전 회차 번호와 같은 회차에 자주 함께 나온 번호를 피한다. (+0.54 / +0.01, 15개로는 확인 +1.64)
  avoidCooccurrence: (history) => {
    const together = Array.from({ length: MAX_NUMBER + 1 }, blank)
    const seen = blank()

    for (const draw of history) {
      for (const a of draw.numbers) {
        seen[a]++
        for (const b of draw.numbers) if (a !== b) together[a][b]++
      }
    }

    const previous = history.at(-1)?.numbers ?? []
    return blank().map((_, number) =>
        -previous.reduce((sum, m) => sum + together[m][number] / (Math.max(1, seen[m]) * (PICK_COUNT / MAX_NUMBER)), 0),
    )
  },

  // 직전 회차 번호의 용지 위 이웃 칸을 피한다. (+0.81 / +0.15, 15개로는 확인 +1.64)
  avoidGridNeighbors: (history) => {
    const scores = blank()
    for (const number of history.at(-1)?.numbers ?? []) {
      for (const neighbor of gridNeighbors(number)) scores[neighbor]--
    }
    return scores
  },

  // 추첨일의 월·일과 같은 번호. 나머지 자리는 동점이다. (-0.37 / +1.44)
  dateNumbers: (_, target) => {
    const scores = blank()
    const [, month, day] = target.date.split("-").map(Number)
    for (const number of [month, day]) if (number >= 1 && number <= MAX_NUMBER) scores[number] = 1
    return scores
  },
}

/** 회차마다 같은 순서가 나오는 난수 (mulberry32). 동점을 가를 때만 쓴다. */
const seededRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 그 회차를 겨냥해 신호가 고르는 6개. 과거 회차만 쓰고, 동점은 회차 번호로 정한 순서로 가른다. */
export const pickForDraw = (key: SignalKey, history: readonly WinningLottoNumbers[], target: Target): number[] => {
  const scores = SCORERS[key](history, target)
  const random = seededRandom(target.drawNo * 1000 + SIGNAL_KEYS.indexOf(key))

  return Array.from({ length: MAX_NUMBER }, (_, index) => ({ number: index + 1, tie: random() }))
      .sort((a, b) => scores[b.number] - scores[a.number] || a.tie - b.tie)
      .slice(0, PICK_COUNT)
      .map(({ number }) => number)
      .sort((a, b) => a - b)
}

export interface SignalTrack {
  key: SignalKey
  /** 채점한 새 회차 수 */
  draws: number
  /** 누적 평균 적중. 채점한 회차가 없으면 null. */
  mean: number | null
  /** 누적 회차 수에서 무작위라면 평균이 95% 확률로 들어오는 구간 */
  low: number | null
  high: number | null
  /** 가장 최근 판정 시점까지의 회차 수. 0 이면 아직 판정 전이다. */
  checkpoint: number
  verdict: Verdict | "pending"
  latest: { drawNo: number; matched: number } | null
  next: { drawNo: number; numbers: number[] } | null
}

/** YYYY-MM-DD 에 일수를 더한다. */
const addDays = (date: string, days: number): string => {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

/** 새 회차마다 신호를 채점해 누적 성적과 다음 회차 번호를 돌려준다. */
export const trackSignals = (
    draws: readonly WinningLottoNumbers[] | null | undefined,
    startDrawNo: number = PROSPECTIVE_START_DRAW,
): SignalTrack[] => {
  const history = (Array.isArray(draws) ? draws : [])
      .filter((draw) => draw.numbers?.length === PICK_COUNT)
      .sort((a, b) => a.drawNo - b.drawNo)

  const latestDraw = history.at(-1)

  return SIGNAL_KEYS.map((key) => {
    const matches: { drawNo: number; matched: number }[] = []

    history.forEach((draw, index) => {
      if (draw.drawNo < startDrawNo) return
      const picked = pickForDraw(key, history.slice(0, index), draw)
      matches.push({ drawNo: draw.drawNo, matched: picked.filter((number) => draw.numbers.includes(number)).length })
    })

    const count = matches.length
    const total = matches.reduce((sum, m) => sum + m.matched, 0)
    const margin = count > 0 ? 1.96 * Math.sqrt(MATCH_VARIANCE / count) : null

    const checkpoint = Math.floor(count / VERDICT_INTERVAL) * VERDICT_INTERVAL
    const checkpointMean = checkpoint > 0 ? matches.slice(0, checkpoint).reduce((sum, m) => sum + m.matched, 0) / checkpoint : 0
    const z = checkpoint > 0 ? (checkpointMean - EXPECTED_MATCHED) / Math.sqrt(MATCH_VARIANCE / checkpoint) : 0

    return {
      key,
      draws: count,
      mean: count > 0 ? total / count : null,
      low: margin === null ? null : Math.max(0, EXPECTED_MATCHED - margin),
      high: margin === null ? null : EXPECTED_MATCHED + margin,
      checkpoint,
      verdict: checkpoint === 0 ? "pending" : z >= VERDICT_Z ? "above" : z <= -VERDICT_Z ? "below" : "within",
      latest: matches.at(-1) ?? null,
      next: latestDraw
          ? {
            drawNo: latestDraw.drawNo + 1,
            numbers: pickForDraw(key, history, { drawNo: latestDraw.drawNo + 1, date: addDays(latestDraw.date, 7) }),
          }
          : null,
    }
  })
}
