// TensorFlow.js 및 필요한 모듈 로드
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js")

// 모델 상태 관리
let model = null
let isModelTrained = false
let isTraining = false
let trainingProgress = 0

// 메시지 핸들러
self.onmessage = async (e) => {
  const { action, data } = e.data

  try {
    switch (action) {
      case "init":
        const tf = self.tf // Declare tf variable
        await tf.ready()
        self.postMessage({ type: "initialized", backend: tf.getBackend() })
        break

      case "train":
        await trainModel(data.winningNumbers)
        break

      case "predict":
        const numbers = await predictNumbers(data.recentDraws, data.winningNumbers)
        self.postMessage({ type: "prediction", numbers })
        break

      case "load":
        const loaded = await loadModel(data.modelJson)
        self.postMessage({ type: "modelLoaded", success: loaded })
        break

      case "reset":
        resetModel()
        self.postMessage({ type: "modelReset" })
        break

      default:
        self.postMessage({ type: "error", message: `Unknown action: ${action}` })
    }
  } catch (error) {
    self.postMessage({ type: "error", message: error.message || "Unknown error" })
  }
}

// 번호 합계 계산
function calculateSum(numbers) {
  return numbers.reduce((sum, num) => sum + num, 0)
}

// 홀짝 비율 계산 (홀수 번호의 비율)
function calculateOddEvenRatio(numbers) {
  const oddCount = numbers.filter((num) => num % 2 === 1).length
  return oddCount / numbers.length
}

// 번호 범위 분포 계산
function calculateRangeDistribution(numbers) {
  const ranges = [0, 0, 0] // [1-15, 16-30, 31-45]

  numbers.forEach((num) => {
    if (num <= 15) ranges[0]++
    else if (num <= 30) ranges[1]++
    else ranges[2]++
  })

  return ranges
}

// 연속 번호 개수 계산
function calculateConsecutiveNumbers(numbers) {
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  let maxConsecutive = 1
  let currentConsecutive = 1

  for (let i = 1; i < sortedNumbers.length; i++) {
    if (sortedNumbers[i] === sortedNumbers[i - 1] + 1) {
      currentConsecutive++
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
    } else {
      currentConsecutive = 1
    }
  }

  return maxConsecutive
}

// 번호 간 간격 통계 계산
function calculateGapStatistics(numbers) {
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  const gaps = []

  for (let i = 1; i < sortedNumbers.length; i++) {
    gaps.push(sortedNumbers[i] - sortedNumbers[i - 1])
  }

  if (gaps.length === 0) return { mean: 0, max: 0, min: 0 }

  const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
  const max = Math.max(...gaps)
  const min = Math.min(...gaps)

  return { mean, max, min }
}

// 번호별 과거 당첨 빈도 계산
function calculateNumberFrequencies(winningNumbers) {
  const frequencies = Array(45).fill(0)

  winningNumbers.forEach((draw) => {
    draw.numbers.forEach((num) => {
      frequencies[num - 1]++
    })
  })

  return frequencies
}

// 번호별 최근 등장 회차 계산
function calculateLastAppearance(winningNumbers) {
  const lastAppearance = Array(45).fill(0)
  const totalDraws = winningNumbers.length

  for (let i = 0; i < 45; i++) {
    for (let j = totalDraws - 1; j >= 0; j--) {
      if (winningNumbers[j].numbers.includes(i + 1)) {
        lastAppearance[i] = totalDraws - j
        break
      }
    }
  }

  return lastAppearance
}

// 모든 특성을 추출하여 단일 배열로 반환
function extractAllFeatures(drawNumbers, winningNumbers) {
  // 최근 5회 당첨 번호를 평탄화
  const flatNumbers = drawNumbers.flat()

  // 전체 당첨 번호 데이터에서 통계 계산
  const frequencies = calculateNumberFrequencies(winningNumbers)
  const lastAppearance = calculateLastAppearance(winningNumbers)

  // 각 회차별 특성 추출
  const drawFeatures = drawNumbers.map((numbers) => {
    const sum = calculateSum(numbers)
    const oddEvenRatio = calculateOddEvenRatio(numbers)
    const rangeDistribution = calculateRangeDistribution(numbers)
    const consecutiveCount = calculateConsecutiveNumbers(numbers)
    const gapStats = calculateGapStatistics(numbers)

    // 이 회차의 번호들에 대한 빈도 및 최근 등장 정보
    const numbersFrequency = numbers.map((num) => frequencies[num - 1] / winningNumbers.length)
    const numbersLastAppearance = numbers.map((num) => {
      const appearance = lastAppearance[num - 1]
      return appearance / winningNumbers.length // 정규화
    })

    return [
      sum / 255, // 정규화 (최대 가능 합계는 45+44+43+42+41+40=255)
      oddEvenRatio,
      ...rangeDistribution.map((count) => count / 6), // 정규화
      consecutiveCount / 6, // 정규화
      gapStats.mean / 44, // 정규화 (최대 가능 간격은 44)
      gapStats.max / 44, // 정규화
      gapStats.min / 44, // 정규화
      ...numbersFrequency,
      ...numbersLastAppearance,
    ]
  })

  // 전체 특성 배열 생성
  return [
    ...flatNumbers, // 기본 입력 (5회 x 6개 번호 = 30개)
    ...drawFeatures.flat(), // 추가 특성
  ]
}

// 전체 데이터셋에 대한 특성 추출
function extractFeaturesForDataset(winningNumbers, sequenceLength) {
  const sequences = []
  const targets = []

  // 시퀀스 생성
  for (let i = 0; i < winningNumbers.length - sequenceLength; i++) {
    const sequence = winningNumbers.slice(i, i + sequenceLength).map((draw) => draw.numbers)
    const target = winningNumbers[i + sequenceLength].numbers

    // 특성 추출 (현재 시점까지의 당첨 번호만 사용)
    const features = extractAllFeatures(sequence, winningNumbers.slice(0, i + sequenceLength))

    sequences.push(features)

    // 타겟 번호를 원-핫 인코딩으로 변환
    const targetOneHot = Array(45).fill(0)
    target.forEach((num) => {
      targetOneHot[num - 1] = 1
    })

    targets.push(targetOneHot)
  }

  return { sequences, targets }
}

// 데이터 전처리: 로또 번호와 추가 특성을 포함
function preprocessData(winningNumbers) {
  // 시퀀스 길이 (몇 개의 이전 추첨 결과를 사용할지)
  const sequenceLength = 5

  // 최소 sequenceLength+1개의 데이터가 있어야 시퀀스 생성 가능
  if (winningNumbers.length <= sequenceLength) {
    throw new Error("학습 데이터가 충분하지 않습니다.")
  }

  // 특성 추출
  const { sequences, targets } = extractFeaturesForDataset(winningNumbers, sequenceLength)

  return {
    sequences: tf.tensor2d(sequences),
    targets: tf.tensor2d(targets),
    inputShape: [sequences[0].length], // 입력 형태 저장
  }
}

// 모델 생성
function createModel(inputShape) {
  const tf = self.tf // Declare tf variable
  const model = tf.sequential()

  // 입력 레이어: 기본 입력 + 추가 특성
  model.add(
    tf.layers.dense({
      units: 128,
      activation: "relu",
      inputShape: inputShape,
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    }),
  )

  // 배치 정규화 추가
  model.add(tf.layers.batchNormalization())

  // 드롭아웃 레이어로 과적합 방지
  model.add(tf.layers.dropout({ rate: 0.3 }))

  // 히든 레이어 1
  model.add(
    tf.layers.dense({
      units: 256,
      activation: "relu",
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }),
    }),
  )

  model.add(tf.layers.batchNormalization())
  model.add(tf.layers.dropout({ rate: 0.3 }))

  // 히든 레이어 2
  model.add(
    tf.layers.dense({
      units: 128,
      activation: "relu",
      kernelRegularizer: tf.regularizers.l1l2({ l1: 0.0001, l2: 0.001 }),
    }),
  )

  model.add(tf.layers.batchNormalization())

  // 출력 레이어: 각 번호(1-45)의 등장 확률
  model.add(
    tf.layers.dense({
      units: 45,
      activation: "sigmoid",
    }),
  )

  // 모델 컴파일 - 최적화 알고리즘 및 학습률 조정
  const learningRate = 0.001
  const optimizer = tf.train.adam(learningRate, 0.9, 0.999, 1e-7)

  model.compile({
    optimizer: optimizer,
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  })

  return model
}

// 모델 학습
async function trainModel(winningNumbers) {
  if (isTraining) {
    self.postMessage({ type: "error", message: "이미 학습 중입니다." })
    return
  }

  // 기존 모델이 있다면 해제
  if (model) {
    model.dispose()
    model = null
  }

  // 상태 초기화
  isModelTrained = false
  isTraining = true
  trainingProgress = 0

  let sequences = null
  let targets = null
  let trainSequences = null
  let trainTargets = null
  let valSequences = null
  let valTargets = null

  try {
    isTraining = true
    trainingProgress = 0
    self.postMessage({ type: "trainingStart" })

    // 데이터 전처리
    const preprocessedData = preprocessData(winningNumbers)
    sequences = preprocessedData.sequences
    targets = preprocessedData.targets
    const inputShape = preprocessedData.inputShape

    // 데이터 분할: 학습 데이터와 검증 데이터
    const splitRatio = 0.8
    const numSamples = sequences.shape[0]
    const numTrainSamples = Math.floor(numSamples * splitRatio)

    trainSequences = sequences.slice([0, 0], [numTrainSamples, -1])
    valSequences = sequences.slice([numTrainSamples, 0], [-1, -1])

    trainTargets = targets.slice([0, 0], [numTrainSamples, -1])
    valTargets = targets.slice([numTrainSamples, 0], [-1, -1])

    // 모델 생성
    model = createModel(inputShape)

    // 학습 설정
    const epochs = 50
    const batchSize = 8

    // 학습률 스케줄링 설정
    const initialLearningRate = 0.001
    const decayRate = 0.96

    // 조기 종료 설정
    let bestValLoss = Number.POSITIVE_INFINITY
    const patience = 10
    let patienceCounter = 0
    let bestModelWeights = null

    // 학습 지표 저장
    const trainingHistory = {
      loss: [],
      accuracy: [],
      valLoss: [],
      valAccuracy: [],
    }

    // 학습 진행 - 작은 배치로 나누어 UI 업데이트 허용
    for (let epoch = 0; epoch < epochs; epoch++) {
      // 학습률 조정
      const learningRate = initialLearningRate * Math.pow(decayRate, Math.floor(epoch / 10))
      model.optimizer.learningRate = learningRate

      // 에포크 학습
      const history = await model.fit(trainSequences, trainTargets, {
        epochs: 1,
        batchSize,
        shuffle: true,
      })

      // 검증 데이터로 평가
      const evalResult = await model.evaluate(valSequences, valTargets, {
        batchSize,
      })

      const valLoss = await evalResult[0].dataSync()[0]
      const valAccuracy = await evalResult[1].dataSync()[0]

      // 학습 지표 저장
      trainingHistory.loss.push(history.history.loss[0])
      trainingHistory.accuracy.push(history.history.acc[0])
      trainingHistory.valLoss.push(valLoss)
      trainingHistory.valAccuracy.push(valAccuracy)

      // 진행 상황 업데이트
      trainingProgress = (epoch + 1) / epochs
      self.postMessage({
        type: "trainingProgress",
        progress: trainingProgress,
        metrics: {
          loss: history.history.loss[0],
          accuracy: history.history.acc[0],
          valLoss,
          valAccuracy,
          learningRate,
        },
      })

      // 최적 모델 저장 (검증 손실 기준)
      if (valLoss < bestValLoss) {
        bestValLoss = valLoss
        patienceCounter = 0

        // 최적 가중치 저장
        if (bestModelWeights) {
          bestModelWeights.forEach((t) => t.dispose())
        }
        bestModelWeights = model.getWeights().map((w) => w.clone())
      } else {
        patienceCounter++
      }

      // 조기 종료 확인
      if (patienceCounter >= patience) {
        self.postMessage({
          type: "trainingInfo",
          message: `조기 종료: ${epoch + 1}번째 에포크에서 학습 중단 (${patience} 에포크 동안 개선 없음)`,
        })
        break
      }

      // 메모리 정리
      tf.dispose(evalResult)

      // UI 업데이트를 위한 짧은 지연
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    // 최적 가중치 복원
    if (bestModelWeights) {
      model.setWeights(bestModelWeights)
      bestModelWeights.forEach((t) => t.dispose())
    }

    isModelTrained = true
    isTraining = false
    trainingProgress = 1

    // 학습된 모델 저장
    const modelJson = await model.save(
      tf.io.withSaveHandler(async (modelArtifacts) => {
        return modelArtifacts
      }),
    )

    // 입력 형태 정보 추가
    modelJson.inputShape = inputShape

    self.postMessage({
      type: "trainingComplete",
      history: trainingHistory,
      modelJson,
    })
  } catch (error) {
    console.error("모델 학습 실패:", error)
    isTraining = false
    self.postMessage({ type: "trainingError", error: error.message || "Unknown error" })
  } finally {
    // 메모리 정리 - 변수가 정의되었는지 확인 후 해제
    if (sequences) tf.dispose(sequences)
    if (targets) tf.dispose(targets)
    if (trainSequences) tf.dispose(trainSequences)
    if (trainTargets) tf.dispose(trainTargets)
    if (valSequences) tf.dispose(valSequences)
    if (valTargets) tf.dispose(valTargets)
  }
}

// 모델 로드 - 개선된 오류 처리
async function loadModel(modelJson) {
  try {
    console.log("Worker: 모델 로드 시작")

    // 입력 데이터 유효성 검사
    if (!modelJson) {
      console.log("Worker: 모델 데이터가 없습니다")
      return false
    }

    // 모델 데이터 구조 검사
    if (!modelJson.modelTopology || !modelJson.weightSpecs || !modelJson.weightData) {
      console.error("Worker: 모델 데이터 구조가 올바르지 않습니다", {
        hasTopology: !!modelJson.modelTopology,
        hasWeightSpecs: !!modelJson.weightSpecs,
        hasWeightData: !!modelJson.weightData,
      })
      return false
    }

    console.log("Worker: 모델 데이터 구조 검증 완료")

    // 기존 모델이 있다면 해제
    if (model) {
      console.log("Worker: 기존 모델 해제")
      model.dispose()
      model = null
    }

    // TensorFlow.js를 사용하여 모델 로드
    console.log("Worker: TensorFlow.js 모델 로드 시도")
    model = await tf.loadLayersModel(tf.io.fromMemory(modelJson))

    if (model) {
      console.log("Worker: 모델 로드 성공")
      isModelTrained = true
      return true
    } else {
      console.error("Worker: 모델 로드 실패 - 모델이 null입니다")
      return false
    }
  } catch (error) {
    console.error("Worker: 모델 로드 중 오류 발생:", error)
    console.error("Worker: 오류 스택:", error.stack)

    // 모델 상태 초기화
    if (model) {
      try {
        model.dispose()
      } catch (disposeError) {
        console.error("Worker: 모델 해제 중 오류:", disposeError)
      }
      model = null
    }
    isModelTrained = false

    return false
  }
}

// 번호 추천
async function predictNumbers(recentDraws, winningNumbers) {
  if (!model || !isModelTrained) {
    throw new Error("모델이 학습되지 않았습니다.")
  }

  let input = null

  try {
    // 최근 5회 당첨 번호를 입력으로 사용
    const recentDrawsArray = []
    for (let i = 0; i < 5; i++) {
      recentDrawsArray.push(recentDraws.slice(i * 6, (i + 1) * 6))
    }

    // 추가 특성 추출
    const features = extractAllFeatures(recentDrawsArray, winningNumbers)
    input = tf.tensor2d([features])

    // 앙상블 예측 (여러 번 예측 후 평균)
    const numPredictions = 5
    const allPredictions = []

    for (let i = 0; i < numPredictions; i++) {
      // 예측 실행
      const prediction = model.predict(input)

      // 예측 결과를 배열로 변환
      const probabilities = await prediction.data()

      // 확률이 높은 순서대로 인덱스 정렬
      const indices = Array.from(Array(45).keys())
        .map((i) => ({ index: i, probability: probabilities[i] }))
        .sort((a, b) => b.probability - a.probability)

      // 상위 15개 번호 선택
      const topIndices = indices.slice(0, 15)

      // 확률 기반 샘플링으로 6개 번호 선택
      const selectedNumbers = new Set()
      while (selectedNumbers.size < 6) {
        // 확률에 비례하여 번호 선택
        const totalProb = topIndices.reduce((sum, item) => sum + item.probability, 0)
        let random = Math.random() * totalProb
        let selectedIndex = -1

        for (let i = 0; i < topIndices.length; i++) {
          random -= topIndices[i].probability
          if (random <= 0) {
            selectedIndex = topIndices[i].index
            break
          }
        }

        // 선택된 인덱스가 없으면 랜덤 선택
        if (selectedIndex === -1) {
          selectedIndex = topIndices[Math.floor(Math.random() * topIndices.length)].index
        }

        // 번호는 1부터 시작하므로 +1
        selectedNumbers.add(selectedIndex + 1)
      }

      // 오름차순 정렬
      allPredictions.push(Array.from(selectedNumbers).sort((a, b) => a - b))

      // 메모리 정리
      prediction.dispose()
    }

    // 가장 자주 등장한 번호 선택
    const numberCounts = new Map()
    allPredictions.forEach((prediction) => {
      prediction.forEach((num) => {
        numberCounts.set(num, (numberCounts.get(num) || 0) + 1)
      })
    })

    // 빈도수 기준 정렬
    const sortedNumbers = Array.from(numberCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0])

    // 상위 6개 번호 선택 (동점일 경우 번호가 작은 것 우선)
    const finalNumbers = sortedNumbers.slice(0, 6).sort((a, b) => a - b)

    // 6개 미만인 경우 추가 번호 선택
    if (finalNumbers.length < 6) {
      const remainingCount = 6 - finalNumbers.length
      const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1).filter((num) => !finalNumbers.includes(num))

      // 남은 번호 중 랜덤 선택
      for (let i = 0; i < remainingCount; i++) {
        const randomIndex = Math.floor(Math.random() * availableNumbers.length)
        finalNumbers.push(availableNumbers[randomIndex])
        availableNumbers.splice(randomIndex, 1)
      }

      // 오름차순 정렬
      finalNumbers.sort((a, b) => a - b)
    }

    return finalNumbers
  } catch (error) {
    console.error("번호 예측 실패:", error)
    throw error
  } finally {
    // 메모리 정리 - 변수가 정의되었는지 확인 후 해제
    if (input) tf.dispose(input)
  }
}

// 모델 초기화
function resetModel() {
  try {
    if (model) {
      model.dispose()
      model = null
    }
    isModelTrained = false
    isTraining = false
    trainingProgress = 0

    console.log("Worker: 모델 상태 초기화 완료")
    return true
  } catch (error) {
    console.error("Worker: 모델 초기화 실패:", error)
    return false
  }
}
