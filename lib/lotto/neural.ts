/**
 * 작은 다층 신경망
 *
 * 실제 당첨 조합의 용지 모양과 아무렇게나 고른 조합의 모양을 구분하도록
 * 학습시킨다. 층이 얕고 입력이 스물한 개뿐이라 외부 라이브러리 없이
 * 순전파·역전파·Adam을 직접 구현하는 편이 가볍고 빠르다.
 */

/** 은닉층 크기 */
const HIDDEN_SIZES = [16, 8] as const

/** Adam 하이퍼파라미터 */
const LEARNING_RATE = 0.01
const BETA1 = 0.9
const BETA2 = 0.999
const EPSILON = 1e-8

interface Layer {
  /** weights[출력][입력] */
  weights: number[][]
  bias: number[]
  /** Adam의 1차·2차 모멘트 */
  mWeights: number[][]
  vWeights: number[][]
  mBias: number[]
  vBias: number[]
}

export interface TrainOptions {
  epochs?: number
  batchSize?: number
  /** 재현 가능한 초기화를 위한 시드 */
  seed?: number
}

export interface TrainResult {
  /** 마지막 에폭의 평균 손실 */
  loss: number
  /** 학습 데이터에 대한 정확도 */
  accuracy: number
  epochs: number
}

/** 재현 가능한 난수 (xorshift32) */
const createRandom = (seed: number) => {
  let state = seed || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4294967296
  }
}

const createLayer = (inputSize: number, outputSize: number, random: () => number): Layer => {
  // Xavier 초기화: 층을 지날수록 신호가 커지거나 사그라들지 않게 분산을 맞춘다.
  const limit = Math.sqrt(6 / (inputSize + outputSize))

  return {
    weights: Array.from({ length: outputSize }, () =>
        Array.from({ length: inputSize }, () => (random() * 2 - 1) * limit),
    ),
    bias: new Array(outputSize).fill(0),
    mWeights: Array.from({ length: outputSize }, () => new Array(inputSize).fill(0)),
    vWeights: Array.from({ length: outputSize }, () => new Array(inputSize).fill(0)),
    mBias: new Array(outputSize).fill(0),
    vBias: new Array(outputSize).fill(0),
  }
}

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x))

/** 학습이 끝난 신경망. 조합 하나를 받아 0~1 점수를 돌려준다. */
export interface PatternNetwork {
  predict: (input: readonly number[]) => number
}

/**
 * 두 부류를 가르도록 신경망을 학습시킨다.
 *
 * @param positives 실제 당첨 조합의 특징 벡터
 * @param negatives 비교 대상으로 뽑은 조합의 특징 벡터
 */
export function trainNetwork(
    positives: readonly number[][],
    negatives: readonly number[][],
    { epochs = 60, batchSize = 64, seed = 20260831 }: TrainOptions = {},
): PatternNetwork & TrainResult {
  const random = createRandom(seed)
  const inputSize = positives[0]?.length ?? 0

  const sizes = [inputSize, ...HIDDEN_SIZES, 1]
  const layers: Layer[] = []
  for (let i = 0; i < sizes.length - 1; i++) {
    layers.push(createLayer(sizes[i], sizes[i + 1], random))
  }

  const samples = [
    ...positives.map((input) => ({ input, target: 1 })),
    ...negatives.map((input) => ({ input, target: 0 })),
  ]

  // 당첨 조합이 훨씬 적으므로, 적은 쪽 손실에 가중치를 줘 균형을 맞춘다.
  const positiveWeight = negatives.length / Math.max(1, positives.length)

  /** 각 층의 활성값을 남기며 순전파한다. 마지막 층만 시그모이드를 쓴다. */
  const forward = (input: readonly number[]): number[][] => {
    const activations: number[][] = [[...input]]

    layers.forEach((layer, index) => {
      const previous = activations[index]
      const isLast = index === layers.length - 1
      const output = layer.bias.map((bias, o) => {
        let sum = bias
        const weights = layer.weights[o]
        for (let i = 0; i < previous.length; i++) sum += weights[i] * previous[i]
        return isLast ? sigmoid(sum) : Math.tanh(sum)
      })
      activations.push(output)
    })

    return activations
  }

  let step = 0
  let lastLoss = 0

  for (let epoch = 0; epoch < epochs; epoch++) {
    // 순서를 섞어 배치마다 한쪽 부류로 치우치지 않게 한다.
    for (let i = samples.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[samples[i], samples[j]] = [samples[j], samples[i]]
    }

    let epochLoss = 0

    for (let start = 0; start < samples.length; start += batchSize) {
      const batch = samples.slice(start, start + batchSize)

      const gradWeights = layers.map((layer) => layer.weights.map((row) => new Array(row.length).fill(0)))
      const gradBias = layers.map((layer) => new Array(layer.bias.length).fill(0))

      for (const { input, target } of batch) {
        const activations = forward(input)
        const output = activations[activations.length - 1][0]
        const weight = target === 1 ? positiveWeight : 1

        // 이진 교차 엔트로피
        const clamped = Math.min(1 - 1e-7, Math.max(1e-7, output))
        epochLoss += -weight * (target * Math.log(clamped) + (1 - target) * Math.log(1 - clamped))

        // 시그모이드 + 교차 엔트로피의 미분은 (출력 - 정답)으로 정리된다.
        let delta = [weight * (output - target)]

        for (let index = layers.length - 1; index >= 0; index--) {
          const layer = layers[index]
          const previous = activations[index]

          for (let o = 0; o < layer.bias.length; o++) {
            gradBias[index][o] += delta[o]
            const row = gradWeights[index][o]
            for (let i = 0; i < previous.length; i++) row[i] += delta[o] * previous[i]
          }

          if (index === 0) break

          // tanh의 도함수는 1 - tanh²
          const nextDelta = new Array(previous.length).fill(0)
          for (let i = 0; i < previous.length; i++) {
            let sum = 0
            for (let o = 0; o < layer.bias.length; o++) sum += layer.weights[o][i] * delta[o]
            nextDelta[i] = sum * (1 - previous[i] * previous[i])
          }
          delta = nextDelta
        }
      }

      step++
      const correction1 = 1 - Math.pow(BETA1, step)
      const correction2 = 1 - Math.pow(BETA2, step)

      layers.forEach((layer, index) => {
        for (let o = 0; o < layer.bias.length; o++) {
          const gb = gradBias[index][o] / batch.length
          layer.mBias[o] = BETA1 * layer.mBias[o] + (1 - BETA1) * gb
          layer.vBias[o] = BETA2 * layer.vBias[o] + (1 - BETA2) * gb * gb
          layer.bias[o] -=
              (LEARNING_RATE * (layer.mBias[o] / correction1)) /
              (Math.sqrt(layer.vBias[o] / correction2) + EPSILON)

          const weights = layer.weights[o]
          for (let i = 0; i < weights.length; i++) {
            const gw = gradWeights[index][o][i] / batch.length
            layer.mWeights[o][i] = BETA1 * layer.mWeights[o][i] + (1 - BETA1) * gw
            layer.vWeights[o][i] = BETA2 * layer.vWeights[o][i] + (1 - BETA2) * gw * gw
            weights[i] -=
                (LEARNING_RATE * (layer.mWeights[o][i] / correction1)) /
                (Math.sqrt(layer.vWeights[o][i] / correction2) + EPSILON)
          }
        }
      })
    }

    lastLoss = epochLoss / samples.length
  }

  const predict = (input: readonly number[]): number => {
    const activations = forward(input)
    return activations[activations.length - 1][0]
  }

  const correct = samples.filter(({ input, target }) => (predict(input) >= 0.5 ? 1 : 0) === target).length

  return { predict, loss: lastLoss, accuracy: correct / samples.length, epochs }
}
