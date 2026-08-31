import { applyCalibration, brierScore, fitCalibration } from "./calibration"
import { combinationKey } from "./combinations"
import { ALL_NUMBERS, PICK_COUNT } from "./constants"
import { createDecoy } from "./decoys"
import { extractFeatures, featureVectorOf, FEATURE_COUNT, type PatternFeatures } from "./features"
import {
  covarianceMatrix,
  invert,
  mahalanobisSquared,
  meanVector,
  standardDeviation,
  standardize,
} from "./matrix"
import { trainNetwork } from "./neural"
import { buildOverlapIndex } from "./overlap"
import { getRandomInt, pickUnique } from "./random"
import type { WinningLottoNumbers } from "./types"

/** 신경망이 반대편 예시로 삼을 규칙적인 조합 수 */
const DECOY_SAMPLES = 2500

/** 어닐링 반복 횟수 */
const ANNEAL_STEPS = 1200

/** 어닐링 시작·종료 온도 */
const START_TEMPERATURE = 0.35
const END_TEMPERATURE = 0.01

/** 신경망 점수와 분포 적합도를 섞는 비율 */
const NETWORK_WEIGHT = 0.6

/**
 * 과거 어느 회차와도 이 개수를 넘게 겹치지 않도록 한다.
 *
 * 1,239회를 서로 견주면 5개 겹침은 21건, 6개(완전 일치)는 한 번도 없었다.
 * 애초에 드물게 일어나는 일이라, 막아도 고를 수 있는 조합은 거의 줄지 않는다.
 */
const MAX_PAST_OVERLAP = 4

/** 서로 다른 시드로 학습해 평균을 내는 신경망 수 */
const ENSEMBLE_SIZE = 3

/** 학습에 쓰지 않고 검증과 점수 보정에 쓰는 비율 */
const VALIDATION_RATIO = 0.2

/** 조합 하나에 대한 평가 */
export interface Recommendation {
  numbers: number[]
  features: PatternFeatures
  /** 최종 점수 (0~1) */
  score: number
  /** 신경망이 본 "당첨 조합다움" */
  networkScore: number
  /** 과거 분포의 중심에 얼마나 가까운지 (0~1) */
  typicality: number
  /** 용지 모양이 가장 비슷한 과거 회차 */
  nearestDraw: { drawNo: number; date: string; numbers: number[]; distance: number } | null
  /** 번호가 가장 많이 겹치는 과거 회차 */
  closestPastDraw: { drawNo: number; date: string; numbers: number[]; overlap: number } | null
}

/** 학습 결과 요약 */
export interface EngineStats {
  /** 학습에 쓴 과거 회차 수 */
  drawCount: number
  /** 특징 차원 */
  featureCount: number
  /** 학습에 쓰지 않은 데이터에 대한 정확도 */
  accuracy: number
  /** 학습 데이터에 대한 정확도. 검증 정확도와 크게 벌어지면 과적합이다. */
  trainAccuracy: number
  loss: number
  /** 평균을 낸 신경망 수 */
  ensembleSize: number
  /** 과거 회차와 허용하는 최대 겹침 */
  maxPastOverlap: number
  /** 보정 전후의 Brier 점수. 낮을수록 점수가 실제 비율에 가깝다. */
  brierBefore: number
  brierAfter: number
  /** 학습에 걸린 시간(ms) */
  trainMs: number
}

export interface RecommendationEngine {
  stats: EngineStats
  /** 조합 하나를 새로 추천한다. */
  recommend: () => Recommendation
  /** 임의의 조합을 같은 기준으로 평가한다. */
  evaluate: (numbers: readonly number[]) => Recommendation
}

/**
 * 과거 당첨 번호의 용지 모양을 학습해 조합을 추천하는 엔진을 만든다.
 *
 * 순서는 이렇다.
 *   1. 회차마다 여섯 점을 용지에 찍고 모양 특징을 뽑는다.
 *   2. 특징을 표준화하고 공분산의 역행렬을 구해, 분포 중심에서의 거리를 잰다.
 *   3. 실제 당첨 모양과 아무 조합의 모양을 구분하도록 신경망을 학습시킨다.
 *   4. 두 점수를 합친 목적함수를 어닐링으로 최대화해 조합을 찾는다.
 */
export function buildEngine(draws: readonly WinningLottoNumbers[]): RecommendationEngine {
  const startedAt = performance.now()

  const usable = draws.filter((draw) => draw.numbers?.length === PICK_COUNT)
  const rawPositives = usable.map((draw) => featureVectorOf(draw.numbers))

  const mean = meanVector(rawPositives)
  const sd = standardDeviation(rawPositives, mean)
  const positives = rawPositives.map((row) => standardize(row, mean, sd))

  // 실제 당첨도 무작위 추첨이라 아무 조합이나 반대편에 세우면 배울 것이 없다.
  // 사람이 손으로 찍기 쉬운 규칙적인 모양을 반대편 예시로 쓴다.
  const negatives: number[][] = []
  for (let i = 0; i < DECOY_SAMPLES; i++) {
    negatives.push(standardize(featureVectorOf(createDecoy()), mean, sd))
  }

  // 표준화한 뒤라 중심은 원점에 가깝지만, 정확한 평균으로 다시 잡아준다.
  const center = meanVector(positives)
  const inverseCovariance = invert(covarianceMatrix(positives, center)) ?? identity(FEATURE_COUNT)

  // 검증과 점수 보정에 쓸 몫을 앙상블 전체가 공유하도록 여기서 한 번만 떼어 둔다.
  const split = <T,>(rows: readonly T[]) => {
    const holdout = Math.floor(rows.length * VALIDATION_RATIO)
    return { train: rows.slice(holdout), valid: rows.slice(0, holdout) }
  }

  const positiveSplit = split(positives)
  const negativeSplit = split(negatives)

  // 한 번만 학습하면 초기값에 따라 점수가 흔들린다. 시드를 달리해 여러 번 학습하고 평균을 낸다.
  const networks = Array.from({ length: ENSEMBLE_SIZE }, (_, i) =>
      trainNetwork(positiveSplit.train, negativeSplit.train, {
        seed: 20260831 + i * 7919,
        validationRatio: 0,
      }),
  )

  const rawPredict = (vector: readonly number[]) =>
      networks.reduce((sum, net) => sum + net.predict(vector), 0) / networks.length

  const average = (pick: (net: (typeof networks)[number]) => number) =>
      networks.reduce((sum, net) => sum + pick(net), 0) / networks.length

  // 검증 몫으로 눈금을 다시 매긴다. 학습에 쓴 데이터로 맞추면 보정이 의미를 잃는다.
  const validationInputs = [...positiveSplit.valid, ...negativeSplit.valid]
  const validationLabels = [
    ...positiveSplit.valid.map(() => 1),
    ...negativeSplit.valid.map(() => 0),
  ]
  const validationRaw = validationInputs.map(rawPredict)
  const calibration = fitCalibration(validationRaw, validationLabels)

  const predict = (vector: readonly number[]) => applyCalibration(rawPredict(vector), calibration)

  const validationAccuracy =
      validationLabels.length === 0
          ? average((net) => net.accuracy)
          : validationRaw.filter((p, i) => (p >= 0.5 ? 1 : 0) === validationLabels[i]).length /
            validationLabels.length

  const overlapIndex = buildOverlapIndex(usable)
  const trainMs = performance.now() - startedAt

  /** 과거에 이미 나온 조합은 다시 추천하지 않는다. */
  const seen = new Set(usable.map((draw) => combinationKey(draw.numbers)))

  const score = (vector: readonly number[]) => {
    const networkScore = predict(vector)
    // 마할라노비스 거리는 차원 수만큼 커지므로, 차원으로 나눠 0~1로 눌러 준다.
    const typicality = Math.exp(-mahalanobisSquared(vector, center, inverseCovariance) / (2 * FEATURE_COUNT))
    return {
      networkScore,
      typicality,
      total: NETWORK_WEIGHT * networkScore + (1 - NETWORK_WEIGHT) * typicality,
    }
  }

  const describe = (numbers: number[]): Recommendation => {
    const features = extractFeatures(numbers)
    const vector = standardize(featureVectorOf(numbers), mean, sd)
    const parts = score(vector)
    const closest = overlapIndex.closestDraw(numbers)

    return {
      numbers,
      features,
      score: parts.total,
      networkScore: parts.networkScore,
      typicality: parts.typicality,
      nearestDraw: findNearestDraw(vector, usable, positives),
      closestPastDraw: closest
          ? {
            drawNo: closest.draw.drawNo,
            date: closest.draw.date,
            numbers: closest.draw.numbers,
            overlap: closest.overlap,
          }
          : null,
    }
  }

  /**
   * 과거 당첨 조합들이 실제로 받은 점수의 분포.
   *
   * 점수를 끝까지 밀어 올리면 실제 당첨 조합보다 더 "당첨다운" 조합이 나와
   * 오히려 과거와 다른 모양이 된다. 그래서 최댓값을 쫓지 않고
   * 과거 조합이 놓이던 구간 안으로 들어오는 것을 목표로 삼는다.
   */
  const pastScores = positives.map((vector) => score(vector).total).sort((a, b) => a - b)

  const quantile = (ratio: number) =>
      pastScores[Math.min(pastScores.length - 1, Math.max(0, Math.round(ratio * (pastScores.length - 1))))]

  const recommend = (): Recommendation => {
    // 과거 분포의 중간 구간에서 목표 점수를 하나 뽑는다. 매번 달라져 결과가 굳지 않는다.
    const target = quantile(0.35 + Math.random() * 0.55)
    const closeness = (value: number) => -Math.abs(value - target)

    // 시작점부터 제약을 지켜야 결과가 제약 밖에서 끝나지 않는다.
    let current = randomCombination()
    while (overlapIndex.maxOverlap(current) > MAX_PAST_OVERLAP || seen.has(combinationKey(current))) {
      current = randomCombination()
    }
    let currentScore = score(standardize(featureVectorOf(current), mean, sd)).total
    let best = current
    let bestGap = closeness(currentScore)

    for (let step = 0; step < ANNEAL_STEPS; step++) {
      // 온도를 지수적으로 낮춰, 처음에는 넓게 돌아다니고 뒤로 갈수록 다듬게 한다.
      const temperature =
          START_TEMPERATURE * Math.pow(END_TEMPERATURE / START_TEMPERATURE, step / ANNEAL_STEPS)

      const candidate = mutate(current)
      // 이미 나온 조합은 물론, 과거 회차를 거의 그대로 베낀 조합도 넘긴다.
      if (seen.has(combinationKey(candidate))) continue
      if (overlapIndex.maxOverlap(candidate) > MAX_PAST_OVERLAP) continue

      const candidateScore = score(standardize(featureVectorOf(candidate), mean, sd)).total
      const delta = closeness(candidateScore) - closeness(currentScore)

      // 나빠지는 이동도 온도에 따라 받아들여 국소 최적에 갇히지 않게 한다.
      if (delta > 0 || Math.random() < Math.exp(delta / temperature)) {
        current = candidate
        currentScore = candidateScore

        if (closeness(candidateScore) > bestGap) {
          best = candidate
          bestGap = closeness(candidateScore)
        }
      }
    }

    return describe([...best].sort((a, b) => a - b))
  }

  return {
    stats: {
      drawCount: usable.length,
      featureCount: FEATURE_COUNT,
      accuracy: validationAccuracy,
      trainAccuracy: average((net) => net.accuracy),
      loss: average((net) => net.loss),
      ensembleSize: ENSEMBLE_SIZE,
      maxPastOverlap: MAX_PAST_OVERLAP,
      brierBefore: brierScore(validationRaw, validationLabels),
      brierAfter: brierScore(validationRaw.map((p) => applyCalibration(p, calibration)), validationLabels),
      trainMs,
    },
    recommend,
    evaluate: (numbers) => describe([...numbers].sort((a, b) => a - b)),
  }
}

/** 번호 하나를 다른 번호로 바꾼 이웃 조합 */
const mutate = (numbers: readonly number[]): number[] => {
  const next = [...numbers]
  const index = getRandomInt(0, next.length - 1)
  const pool = ALL_NUMBERS.filter((n) => !next.includes(n))

  next[index] = pool[getRandomInt(0, pool.length - 1)]
  return next.sort((a, b) => a - b)
}

const randomCombination = (): number[] => pickUnique(ALL_NUMBERS, PICK_COUNT).sort((a, b) => a - b)

const identity = (size: number): number[][] =>
    Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => (i === j ? 1 : 0)))

/** 특징 공간에서 가장 가까운 과거 회차를 찾는다. */
const findNearestDraw = (
    vector: readonly number[],
    draws: readonly WinningLottoNumbers[],
    positives: readonly number[][],
): Recommendation["nearestDraw"] => {
  let bestIndex = -1
  let bestDistance = Infinity

  for (let i = 0; i < positives.length; i++) {
    let sum = 0
    for (let j = 0; j < vector.length; j++) {
      const diff = vector[j] - positives[i][j]
      sum += diff * diff
    }
    if (sum < bestDistance) {
      bestDistance = sum
      bestIndex = i
    }
  }

  if (bestIndex === -1) return null

  const draw = draws[bestIndex]
  return {
    drawNo: draw.drawNo,
    date: draw.date,
    numbers: draw.numbers,
    distance: Math.sqrt(bestDistance),
  }
}
