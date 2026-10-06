import { combinationKey } from "./combinations"
import { ALL_NUMBERS, PICK_COUNT } from "./constants"
import { extractFeatures, featureVectorOf, type PatternFeatures } from "./features"
import { meanVector, standardDeviation, standardize } from "./matrix"
import { buildOverlapIndex } from "./overlap"
import {
  createBaseline,
  fitPopularity,
  POPULARITY_FEATURE_COUNT,
  type CrowdBaseline,
  type PopularityModel,
} from "./popularity"
import { crowdLogRatio, firstPrizeShare, type DrawPrize } from "./prizes"
import { pickUnique } from "./random"
import type { WinningLottoNumbers } from "./types"

/**
 * 비인기 구간의 경계. 무작위 조합의 예측 인기 분포에서 이 백분위 아래만 고른다.
 *
 * 1~900회로 학습하고 901~1241회 당첨 조합을 예측 인기 5분위로 나누니, 1등 당첨자는 기대 인원의
 * 0.92·0.89·0.92·0.98·1.21배였다. 아래 세 구간은 서로 비슷하고 위 두 구간에서 늘어난다.
 * 아래 40% 로 잡아 늘어나는 구간과 거리를 둔다.
 */
const MAX_PERCENTILE = 0.4

/** 비인기 후보를 이만큼 모은 뒤, 이번 회차 이 앱에서 덜 나간 번호로 된 것을 고른다. */
const CANDIDATE_COUNT = 24

/** 후보를 찾는 최대 시도. 조건을 대부분 통과하므로 여기까지 갈 일은 없다. */
const MAX_TRIES = 20000

/**
 * 과거 어느 회차와도 이 개수를 넘게 겹치지 않도록 한다.
 *
 * 1,239회를 서로 견주면 5개 겹침은 21건, 6개(완전 일치)는 한 번도 없었다.
 * 애초에 드물게 일어나는 일이라, 막아도 고를 수 있는 조합은 거의 줄지 않는다.
 */
const MAX_PAST_OVERLAP = 4

/** 백분위 기준으로 삼는 무작위 조합 수 */
const BASELINE_SAMPLES = 4000

/** 학습에 쓰지 않고 검증에 떼어 두는 최근 회차 비율 */
const VALIDATION_RATIO = 0.2

/** 인기 모델을 세우는 최소 회차 수. 이보다 적으면 인기 없이 과거 회차 회피만 한다. */
const MIN_TRAIN_DRAWS = 200

/** 조합 하나에 대한 평가 */
export interface Recommendation {
  numbers: number[]
  features: PatternFeatures
  /** 예측 인기 (로그 비율). 무작위 조합 평균이 0 이다. 당첨자 수가 없으면 null. */
  popularity: number | null
  /** 무작위 조합 가운데 이 조합보다 덜 몰리는 비율 (0~1). 낮을수록 사람들이 덜 사는 조합이다. */
  popularityPercentile: number | null
  /** 용지 모양이 가장 비슷한 과거 회차 */
  nearestDraw: { drawNo: number; date: string; numbers: number[]; distance: number } | null
  /** 번호가 가장 많이 겹치는 과거 회차 */
  closestPastDraw: { drawNo: number; date: string; numbers: number[]; overlap: number } | null
  /** 이번 회차에 이미 내보내 후보에서 뺀 조합 수 */
  avoidedCount: number
}

/** 학습에 쓰지 않은 최근 회차로 잰 인기 모델의 성적 */
export interface CrowdValidation {
  draws: number
  /** 예측 인기와 실제 1등 비율의 상관 */
  correlation: number
  /** 그중 당첨 조합이 비인기 구간에 든 회차 수 */
  quietDraws: number
  /** 비인기 구간 회차의 1등 당첨자 ÷ 기대 인원 */
  quietShare: number
  /** 검증 회차 전체의 1등 당첨자 ÷ 기대 인원 */
  allShare: number
}

/** 학습 결과 요약 */
export interface EngineStats {
  /** 과거 회차 수 */
  drawCount: number
  /** 인기 모델을 학습한 회차 수. 0 이면 당첨자 수가 없어 인기를 보지 못했다. */
  trainedDraws: number
  /** 인기 모델의 입력 차원 */
  featureCount: number
  /** 과거 회차와 허용하는 최대 겹침 */
  maxPastOverlap: number
  /** 후보로 두는 무작위 조합 백분위 상한 */
  maxPercentile: number
  validation: CrowdValidation | null
  /** 학습에 걸린 시간(ms) */
  trainMs: number
}

/** 이미 내보낸 추천을 피하기 위해 넘기는 정보 */
export interface AvoidInfo {
  /** 이번 회차에 이미 추천한 조합 키 */
  combinations: readonly string[]
  /** 번호별로 이미 추천된 횟수 */
  numberCounts: Readonly<Record<number, number>>
  /** 이번 회차의 전체 추천 수 */
  total: number
}

export interface RecommendationEngine {
  stats: EngineStats
  /** 조합 하나를 새로 추천한다. 이미 내보낸 조합이 있으면 함께 넘긴다. */
  recommend: (avoid?: AvoidInfo) => Recommendation
  /** 임의의 조합을 같은 기준으로 평가한다. */
  evaluate: (numbers: readonly number[]) => Recommendation
}

interface PairedDraw {
  numbers: readonly number[]
  prize: DrawPrize
}

interface CrowdModel {
  model: PopularityModel
  baseline: CrowdBaseline
  validation: CrowdValidation | null
}

/**
 * 사람들이 덜 사는 조합을 고르는 추천 엔진을 만든다.
 *
 * 순서는 이렇다.
 *   1. 회차마다 3등 당첨자가 무작위 구매 기대보다 얼마나 많았는지로 그 당첨 조합의 인기를 잰다.
 *   2. 인기를 용지 모양과 번호로 능형 회귀해 아무 조합의 인기를 예측한다.
 *   3. 무작위 조합의 예측 인기 분포에서 아래쪽 조합만 후보로 둔다.
 *   4. 후보 중 이번 회차 이 앱에서 덜 나간 번호로 된 조합을 고른다.
 * 당첨자 수가 없으면 3을 건너뛰고 과거 회차 회피만 한다.
 */
export function buildEngine(
    draws: readonly WinningLottoNumbers[],
    prizes: readonly DrawPrize[] = [],
): RecommendationEngine {
  const startedAt = performance.now()

  const usable = draws.filter((draw) => draw.numbers?.length === PICK_COUNT)

  // 모양이 가장 닮은 과거 회차를 찾을 때 쓰는 표준화
  const rawVectors = usable.map((draw) => featureVectorOf(draw.numbers))
  const mean = meanVector(rawVectors)
  const sd = standardDeviation(rawVectors, mean)
  const positives = rawVectors.map((row) => standardize(row, mean, sd))

  const paired = pairDraws(usable, Array.isArray(prizes) ? prizes : [])
  const crowd = paired.length >= MIN_TRAIN_DRAWS ? trainCrowd(paired) : null

  const overlapIndex = buildOverlapIndex(usable)

  /** 과거에 이미 나온 조합은 다시 추천하지 않는다. */
  const pastCombinations = new Set(usable.map((draw) => combinationKey(draw.numbers)))

  const trainMs = performance.now() - startedAt

  const crowdOf = (numbers: readonly number[]) => {
    if (!crowd) return { popularity: null, popularityPercentile: null }
    const predicted = crowd.model.predict(numbers)
    return {
      popularity: predicted - crowd.baseline.mean,
      popularityPercentile: crowd.baseline.percentile(predicted),
    }
  }

  const describe = (numbers: number[], avoid?: AvoidInfo): Recommendation => {
    const closest = overlapIndex.closestDraw(numbers)

    return {
      numbers,
      features: extractFeatures(numbers),
      ...crowdOf(numbers),
      avoidedCount: avoid?.combinations.length ?? 0,
      nearestDraw: findNearestDraw(standardize(featureVectorOf(numbers), mean, sd), usable, positives),
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

  const recommend = (avoid?: AvoidInfo): Recommendation => {
    // 과거 당첨 조합에 더해, 이번 회차에 이미 내보낸 조합도 건너뛴다.
    const seen = avoid ? new Set([...pastCombinations, ...avoid.combinations]) : pastCombinations

    const candidates: number[][] = []
    let firstAllowed: number[] | null = null

    for (let tries = 0; tries < MAX_TRIES && candidates.length < CANDIDATE_COUNT; tries++) {
      const numbers = randomCombination()

      // 이미 나온 조합은 물론, 과거 회차를 거의 그대로 베낀 조합도 넘긴다.
      if (seen.has(combinationKey(numbers))) continue
      if (overlapIndex.maxOverlap(numbers) > MAX_PAST_OVERLAP) continue
      firstAllowed ??= numbers

      if (crowd && crowd.baseline.percentile(crowd.model.predict(numbers)) > MAX_PERCENTILE) continue
      candidates.push(numbers)
    }

    const pool = candidates.length > 0 ? candidates : [firstAllowed ?? randomCombination()]

    // 이 앱 사용자끼리 같은 번호로 몰리면 그것대로 나눠 갖는 사람이 는다.
    // 후보 중 이번 회차에 이 앱에서 덜 나간 번호로 된 조합을 고른다.
    const best = pool.reduce((picked, numbers) =>
        appCrowdOf(numbers, avoid) < appCrowdOf(picked, avoid) ? numbers : picked,
    )

    return describe(best, avoid)
  }

  return {
    stats: {
      drawCount: usable.length,
      trainedDraws: crowd ? paired.length : 0,
      featureCount: POPULARITY_FEATURE_COUNT,
      maxPastOverlap: MAX_PAST_OVERLAP,
      maxPercentile: MAX_PERCENTILE,
      validation: crowd?.validation ?? null,
      trainMs,
    },
    recommend,
    evaluate: (numbers) => describe([...numbers].sort((a, b) => a - b)),
  }
}

/** 당첨 번호와 당첨자 수를 회차로 잇는다. 검증이 미래를 엿보지 않도록 회차순으로 둔다. */
const pairDraws = (draws: readonly WinningLottoNumbers[], prizes: readonly DrawPrize[]): PairedDraw[] => {
  const numbersByDraw = new Map(draws.map((draw) => [draw.drawNo, draw.numbers]))

  return prizes
      .filter((prize) => prize.totalSales > 0 && numbersByDraw.has(prize.drawNo))
      .sort((a, b) => a.drawNo - b.drawNo)
      .map((prize) => ({ prize, numbers: numbersByDraw.get(prize.drawNo) ?? [] }))
}

const toSamples = (rows: readonly PairedDraw[]) =>
    rows.map(({ numbers, prize }) => ({ numbers, target: crowdLogRatio(prize, 3) }))

/**
 * 인기 모델을 세우고, 최근 회차를 떼어 그 성적을 잰다.
 *
 * 검증용 모델은 앞쪽 회차만으로 따로 학습한다. 추천에 쓰는 모델은 전 회차로 다시 맞춘다.
 */
const trainCrowd = (paired: readonly PairedDraw[]): CrowdModel | null => {
  const model = fitPopularity(toSamples(paired))
  if (!model) return null

  const cut = Math.floor(paired.length * (1 - VALIDATION_RATIO))
  const trial = fitPopularity(toSamples(paired.slice(0, cut)))

  return {
    model,
    baseline: createBaseline(model, BASELINE_SAMPLES),
    validation: trial ? validateCrowd(trial, paired.slice(cut)) : null,
  }
}

const validateCrowd = (trial: PopularityModel, holdout: readonly PairedDraw[]): CrowdValidation | null => {
  if (holdout.length === 0) return null

  const baseline = createBaseline(trial, BASELINE_SAMPLES)
  const predicted = holdout.map(({ numbers }) => trial.predict(numbers))
  const quiet = holdout.filter((_, index) => baseline.percentile(predicted[index]) <= MAX_PERCENTILE)

  return {
    draws: holdout.length,
    correlation: pearson(predicted, holdout.map(({ prize }) => crowdLogRatio(prize, 1))),
    quietDraws: quiet.length,
    quietShare: firstPrizeShare(quiet.map(({ prize }) => prize)),
    allShare: firstPrizeShare(holdout.map(({ prize }) => prize)),
  }
}

/**
 * 이번 회차에 이 앱에서 이미 나간 번호로 된 정도 (0~1).
 *
 * 한 번호가 이번 회차 추천 전부에 들어 있으면 1에 가까워진다.
 */
const appCrowdOf = (numbers: readonly number[], avoid?: AvoidInfo): number => {
  if (!avoid || avoid.total === 0) return 0

  const used = numbers.reduce((sum, number) => sum + (avoid.numberCounts[number] ?? 0), 0)
  return Math.min(1, used / (avoid.total * PICK_COUNT))
}

const pearson = (a: readonly number[], b: readonly number[]): number => {
  const count = Math.min(a.length, b.length)
  if (count === 0) return 0

  const meanA = a.reduce((sum, value) => sum + value, 0) / count
  const meanB = b.reduce((sum, value) => sum + value, 0) / count
  let numerator = 0
  let varianceA = 0
  let varianceB = 0
  for (let i = 0; i < count; i++) {
    numerator += (a[i] - meanA) * (b[i] - meanB)
    varianceA += (a[i] - meanA) ** 2
    varianceB += (b[i] - meanB) ** 2
  }

  const denominator = Math.sqrt(varianceA * varianceB)
  return denominator === 0 ? 0 : numerator / denominator
}

const randomCombination = (): number[] => pickUnique(ALL_NUMBERS, PICK_COUNT).sort((a, b) => a - b)

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
