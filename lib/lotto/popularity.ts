import { ALL_NUMBERS, MAX_NUMBER, PICK_COUNT } from "./constants"
import { FEATURE_COUNT, featureVectorOf } from "./features"
import { invert } from "./matrix"
import { pickUnique } from "./random"

/**
 * 조합이 얼마나 많이 팔릴지 예측하는 모델
 *
 * 회차마다 "3등 당첨자 ÷ 모두 무작위로 샀을 때의 기대 인원"을 재면, 그 회차 당첨 조합의
 * 다섯 개짜리 부분을 사람들이 얼마나 많이 골랐는지가 나온다. 이 값을 용지 모양 21개와
 * 번호 45개로 능형 회귀한다.
 *
 * 고른 근거 (1~900회 학습, 901~1241회 평가, 평가 상관의 표준오차 약 0.054)
 *   - 3등 비율을 목표로 한 모델이 평가 구간의 1등 비율과 가장 잘 맞았다 (r 0.249).
 *     4등 0.221, 5등 0.222, 셋의 합성 0.232. 1등 자체는 회차당 인원이 적어 목표로 쓰면 0.150 이다.
 *   - 같은 입력의 회귀 신경망 5개 평균은 0.227 로 능형 회귀보다 낫지 않았다.
 */

/** 규제 세기. 학습 구간 뒤쪽 20% 로 1~3000 을 견줘 골랐다. */
const LAMBDA = 300

/** 모양 특징 + 번호 표시 */
export const POPULARITY_FEATURE_COUNT = FEATURE_COUNT + MAX_NUMBER

const designRow = (numbers: readonly number[]): number[] => {
  const indicators = new Array<number>(MAX_NUMBER).fill(0)
  for (const number of numbers) indicators[number - 1] = 1
  return [...featureVectorOf(numbers), ...indicators]
}

export interface PopularityModel {
  /** 예측 인기 (로그 비율). 클수록 사람들이 많이 사는 조합이다. */
  predict: (numbers: readonly number[]) => number
}

/** 조합과 그 회차에서 잰 인기를 받아 능형 회귀로 맞춘다. 표본이 없거나 풀 수 없으면 null. */
export const fitPopularity = (
    samples: readonly { numbers: readonly number[]; target: number }[],
): PopularityModel | null => {
  if (samples.length === 0) return null

  const dim = POPULARITY_FEATURE_COUNT
  const rows = samples.map((sample) => designRow(sample.numbers))
  const count = rows.length

  const mean = new Array<number>(dim).fill(0)
  const sd = new Array<number>(dim).fill(0)
  for (const row of rows) for (let j = 0; j < dim; j++) mean[j] += row[j] / count
  for (const row of rows) for (let j = 0; j < dim; j++) sd[j] += (row[j] - mean[j]) ** 2 / count
  for (let j = 0; j < dim; j++) sd[j] = Math.sqrt(sd[j]) || 1

  const targetMean = samples.reduce((sum, sample) => sum + sample.target, 0) / count

  // (ZᵀZ + λI) β = Zᵀ(y − ȳ)
  const gram = Array.from({ length: dim }, () => new Array<number>(dim).fill(0))
  const moment = new Array<number>(dim).fill(0)
  rows.forEach((row, k) => {
    const z = row.map((value, j) => (value - mean[j]) / sd[j])
    const y = samples[k].target - targetMean
    for (let i = 0; i < dim; i++) {
      moment[i] += z[i] * y
      for (let j = i; j < dim; j++) gram[i][j] += z[i] * z[j]
    }
  })
  for (let i = 0; i < dim; i++) {
    gram[i][i] += LAMBDA
    for (let j = 0; j < i; j++) gram[i][j] = gram[j][i]
  }

  const inverse = invert(gram)
  if (!inverse) return null
  const beta = inverse.map((row) => row.reduce((sum, value, j) => sum + value * moment[j], 0))

  return {
    predict: (numbers) => {
      const row = designRow(numbers)
      let value = targetMean
      for (let j = 0; j < dim; j++) value += ((row[j] - mean[j]) / sd[j]) * beta[j]
      return value
    },
  }
}

/** 무작위 조합의 예측 인기 분포. 백분위를 매기는 기준이다. */
export interface CrowdBaseline {
  mean: number
  /** 무작위 조합 가운데 이 값보다 덜 몰리는 비율 (0~1) */
  percentile: (value: number) => number
}

export const createBaseline = (model: PopularityModel, samples: number): CrowdBaseline => {
  const values = Array.from({ length: samples }, () =>
      model.predict(pickUnique(ALL_NUMBERS, PICK_COUNT).sort((a, b) => a - b)),
  ).sort((a, b) => a - b)

  const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)

  const percentile = (value: number): number => {
    let low = 0
    let high = values.length
    while (low < high) {
      const middle = (low + high) >>> 1
      if (values[middle] < value) low = middle + 1
      else high = middle
    }
    return values.length === 0 ? 0.5 : low / values.length
  }

  return { mean, percentile }
}
