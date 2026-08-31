/**
 * 점수 보정 (플랫 스케일링)
 *
 * 신경망 출력은 0.994처럼 1에 바짝 붙는 값이 나오기 쉽다. 두 부류를 잘 가른다는
 * 뜻이지 "994번 중 993번 맞다"는 뜻이 아닌데, 화면에 그대로 내보내면 과장으로 읽힌다.
 * 그래서 검증 데이터에서 시그모이드 한 겹을 더 학습시켜, 출력이 실제 비율에
 * 가깝도록 눌러 준다.
 */

export interface Calibration {
  /** 로짓에 곱하는 기울기 */
  slope: number
  /** 로짓에 더하는 절편 */
  intercept: number
}

/** 보정을 하지 않는 것과 같은 계수 */
export const IDENTITY_CALIBRATION: Calibration = { slope: 1, intercept: 0 }

const CLAMP = 1e-6

const logit = (p: number): number => {
  const clamped = Math.min(1 - CLAMP, Math.max(CLAMP, p))
  return Math.log(clamped / (1 - clamped))
}

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x))

/**
 * 검증 데이터의 (예측값, 실제 부류)로 보정 계수를 찾는다.
 *
 * 목표는 원래 모델을 흔드는 것이 아니라 출력 눈금만 다시 매기는 것이라,
 * 파라미터가 둘뿐인 로지스틱 회귀를 경사하강으로 맞춘다.
 */
export const fitCalibration = (
    predictions: readonly number[],
    labels: readonly number[],
    { steps = 600, learningRate = 0.3 }: { steps?: number; learningRate?: number } = {},
): Calibration => {
  if (predictions.length === 0) return IDENTITY_CALIBRATION

  const positiveCount = labels.reduce((sum, y) => sum + y, 0)
  if (positiveCount === 0 || positiveCount === labels.length) return IDENTITY_CALIBRATION

  const inputs = predictions.map(logit)

  // 부류 가중치는 주지 않는다. 여기서 맞추려는 것은 판별 성능이 아니라
  // "이 점수를 받은 것들 가운데 실제로 당첨 조합이던 비율"이라서,
  // 가중치를 주면 눈금이 다시 부풀어 오른다.
  let slope = 1
  let intercept = 0

  for (let step = 0; step < steps; step++) {
    let gradSlope = 0
    let gradIntercept = 0

    for (let i = 0; i < inputs.length; i++) {
      const error = sigmoid(slope * inputs[i] + intercept) - labels[i]
      gradSlope += error * inputs[i]
      gradIntercept += error
    }

    slope -= (learningRate * gradSlope) / inputs.length
    intercept -= (learningRate * gradIntercept) / inputs.length
  }

  return { slope, intercept }
}

/** 보정 계수를 적용해 점수를 다시 매긴다. */
export const applyCalibration = (prediction: number, { slope, intercept }: Calibration): number =>
    sigmoid(slope * logit(prediction) + intercept)

/**
 * 보정이 얼마나 맞는지 재는 값 (Brier 점수).
 *
 * 예측값과 실제 부류의 제곱 오차 평균이라 낮을수록 좋다.
 */
export const brierScore = (predictions: readonly number[], labels: readonly number[]): number => {
  if (predictions.length === 0) return 0

  let total = 0
  for (let i = 0; i < predictions.length; i++) {
    const diff = predictions[i] - labels[i]
    total += diff * diff
  }

  return total / predictions.length
}
