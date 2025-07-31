// TensorFlow.js 로드
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
        await self.tf.ready()
        self.postMessage({ type: "initialized", backend: self.tf.getBackend() })
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

// === 고급 패턴 분석 함수들 ===

// 소수 판별 함수
function isPrime(num) {
  if (num < 2) return false
  if (num === 2) return true
  if (num % 2 === 0) return false

  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    if (num % i === 0) return false
  }
  return true
}

// 피보나치 수 판별
const fibonacciNumbers = [1, 1, 2, 3, 5, 8, 13, 21, 34]
function isFibonacci(num) {
  return fibonacciNumbers.includes(num)
}

// 완전제곱수 판별
function isPerfectSquare(num) {
  const sqrt = Math.sqrt(num)
  return sqrt === Math.floor(sqrt)
}

// 요일별 패턴 분석
function analyzeDayOfWeekPatterns(winningNumbers) {
  const dayWeights = Array(45).fill(0)
  const dayCounts = Array(7).fill(0)

  winningNumbers.forEach((draw) => {
    const date = new Date(draw.date)
    const dayOfWeek = date.getDay()
    dayCounts[dayOfWeek]++

    draw.numbers.forEach((num) => {
      dayWeights[num - 1] += 1 / Math.max(dayCounts[dayOfWeek], 1)
    })
  })

  const maxWeight = Math.max(...dayWeights)
  return dayWeights.map((w) => (maxWeight > 0 ? w / maxWeight : 0))
}

// 계절별 패턴 분석
function analyzeSeasonalPatterns(winningNumbers) {
  const seasonWeights = Array(45).fill(0)
  const seasonCounts = Array(4).fill(0)

  winningNumbers.forEach((draw) => {
    const date = new Date(draw.date)
    const month = date.getMonth() + 1
    let season = 0

    if (month >= 3 && month <= 5) season = 0
    else if (month >= 6 && month <= 8) season = 1
    else if (month >= 9 && month <= 11) season = 2
    else season = 3

    seasonCounts[season]++

    draw.numbers.forEach((num) => {
      seasonWeights[num - 1] += 1 / Math.max(seasonCounts[season], 1)
    })
  })

  const maxWeight = Math.max(...seasonWeights)
  return seasonWeights.map((w) => (maxWeight > 0 ? w / maxWeight : 0))
}

// 월별 패턴 분석
function analyzeMonthlyPatterns(winningNumbers) {
  const monthWeights = Array(45).fill(0)
  const monthCounts = Array(12).fill(0)

  winningNumbers.forEach((draw) => {
    const date = new Date(draw.date)
    const month = date.getMonth()
    monthCounts[month]++

    draw.numbers.forEach((num) => {
      monthWeights[num - 1] += 1 / Math.max(monthCounts[month], 1)
    })
  })

  const maxWeight = Math.max(...monthWeights)
  return monthWeights.map((w) => (maxWeight > 0 ? w / maxWeight : 0))
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

// 번호 선호도 계산
function calculateNumberPreferences(winningNumbers) {
  const preferences = Array(45).fill(0)
  const totalDraws = winningNumbers.length

  winningNumbers.forEach((draw) => {
    draw.numbers.forEach((num) => {
      preferences[num - 1]++
    })
  })

  const maxPreference = Math.max(...preferences)
  return preferences.map((pref) => (maxPreference > 0 ? pref / maxPreference : 0))
}

// 트렌드 패턴 분석
function analyzeTrendPatterns(winningNumbers) {
  const trends = Array(45).fill(0)
  const recentWindow = 20

  if (winningNumbers.length < recentWindow) return trends

  for (let num = 1; num <= 45; num++) {
    const recentDraws = winningNumbers.slice(-recentWindow)
    const oldDraws = winningNumbers.slice(-recentWindow * 2, -recentWindow)

    const recentCount = recentDraws.filter((draw) => draw.numbers.includes(num)).length
    const oldCount = oldDraws.filter((draw) => draw.numbers.includes(num)).length

    const trend = (recentCount - oldCount) / recentWindow
    trends[num - 1] = trend
  }

  return trends
}

// 번호 합계 계산
function calculateSum(numbers) {
  return numbers.reduce((sum, num) => sum + num, 0)
}

// 홀짝 비율 계산
function calculateOddEvenRatio(numbers) {
  const oddCount = numbers.filter((num) => num % 2 === 1).length
  return oddCount / numbers.length
}

// 번호 범위 분포 계산
function calculateRangeDistribution(numbers) {
  const ranges = [0, 0, 0]

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

// 피보나치 패턴 분석
function analyzeFibonacciPatterns(numbers) {
  const fibCount = numbers.filter((num) => isFibonacci(num)).length
  return fibCount / numbers.length
}

// 소수 패턴 분석
function analyzePrimePatterns(numbers) {
  const primeCount = numbers.filter((num) => isPrime(num)).length
  return primeCount / numbers.length
}

// 완전제곱수 패턴 분석
function analyzePerfectSquarePatterns(numbers) {
  const squareCount = numbers.filter((num) => isPerfectSquare(num)).length
  return squareCount / numbers.length
}

// 대칭 패턴 분석
function analyzeSymmetryPatterns(numbers) {
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  let symmetryScore = 0

  for (let i = 0; i < sortedNumbers.length / 2; i++) {
    const left = sortedNumbers[i]
    const right = sortedNumbers[sortedNumbers.length - 1 - i]
    const center = 23

    const leftDistance = Math.abs(left - center)
    const rightDistance = Math.abs(right - center)

    if (Math.abs(leftDistance - rightDistance) <= 2) {
      symmetryScore += 1
    }
  }

  return symmetryScore / Math.floor(numbers.length / 2)
}

// 등차수열 패턴 분석
function analyzeArithmeticSequencePatterns(numbers) {
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  let maxSequenceLength = 1
  let currentLength = 1
  let commonDiff = 0

  for (let i = 1; i < sortedNumbers.length; i++) {
    const diff = sortedNumbers[i] - sortedNumbers[i - 1]

    if (currentLength === 1) {
      commonDiff = diff
      currentLength = 2
    } else if (diff === commonDiff) {
      currentLength++
    } else {
      maxSequenceLength = Math.max(maxSequenceLength, currentLength)
      commonDiff = diff
      currentLength = 2
    }
  }

  maxSequenceLength = Math.max(maxSequenceLength, currentLength)
  return maxSequenceLength / numbers.length
}

// 배수 패턴 분석
function analyzeMultiplePatterns(numbers, divisor) {
  const multipleCount = numbers.filter((num) => num % divisor === 0).length
  return multipleCount / numbers.length
}

// 끝자리 엔트로피 분석
function analyzeDigitEntropy(numbers) {
  const lastDigits = numbers.map((num) => num % 10)
  const digitCounts = Array(10).fill(0)

  lastDigits.forEach((digit) => {
    digitCounts[digit]++
  })

  let entropy = 0
  digitCounts.forEach((count) => {
    if (count > 0) {
      const probability = count / numbers.length
      entropy -= probability * Math.log2(probability)
    }
  })

  return entropy / Math.log2(10)
}

// 클러스터 패턴 분석
function analyzeClusterPatterns(numbers) {
  const clusters = Array(5).fill(0)

  numbers.forEach((num) => {
    const clusterIndex = Math.min(Math.floor((num - 1) / 9), 4)
    clusters[clusterIndex]++
  })

  return clusters.map((count) => count / numbers.length)
}

// 거리 패턴 분석
function analyzeDistancePatterns(numbers) {
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  let totalDistance = 0

  for (let i = 1; i < sortedNumbers.length; i++) {
    totalDistance += sortedNumbers[i] - sortedNumbers[i - 1]
  }

  const avgDistance = totalDistance / (sortedNumbers.length - 1)
  return avgDistance / 44
}

// 분산 패턴 분석
function analyzeVariancePatterns(numbers) {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length

  const maxVariance = Math.pow(45 - 1, 2) / 4
  return Math.min(variance / maxVariance, 1)
}

// 로또 용지 위치 패턴 분석
function analyzeLottoGridPatterns(numbers) {
  const gridFeatures = []

  // 행별 분포
  const rowCounts = Array(7).fill(0)
  numbers.forEach((num) => {
    const row = Math.floor((num - 1) / 7)
    if (row < 7) rowCounts[row]++
  })
  gridFeatures.push(...rowCounts.map((count) => count / numbers.length))

  // 열별 분포
  const colCounts = Array(7).fill(0)
  numbers.forEach((num) => {
    const col = (num - 1) % 7
    colCounts[col]++
  })
  gridFeatures.push(...colCounts.map((count) => count / numbers.length))

  // 대각선 패턴
  let mainDiagonal = 0
  let antiDiagonal = 0
  numbers.forEach((num) => {
    const row = Math.floor((num - 1) / 7)
    const col = (num - 1) % 7
    if (row === col) mainDiagonal++
    if (row + col === 6) antiDiagonal++
  })
  gridFeatures.push(mainDiagonal / numbers.length)
  gridFeatures.push(antiDiagonal / numbers.length)

  return gridFeatures
}

// 유사도 패턴 분석
function analyzeSimilarityPatterns(numbers, winningNumbers) {
  if (winningNumbers.length === 0) return 0

  const recentDraws = winningNumbers.slice(-10)
  let maxSimilarity = 0

  recentDraws.forEach((draw) => {
    const intersection = numbers.filter((num) => draw.numbers.includes(num))
    const similarity = intersection.length / 6
    maxSimilarity = Math.max(maxSimilarity, similarity)
  })

  return maxSimilarity
}

// 조합 빈도 분석
function analyzeCombinationFrequency(numbers, winningNumbers) {
  let totalFrequency = 0
  let pairCount = 0

  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      const num1 = numbers[i]
      const num2 = numbers[j]

      let pairFrequency = 0
      winningNumbers.forEach((draw) => {
        if (draw.numbers.includes(num1) && draw.numbers.includes(num2)) {
          pairFrequency++
        }
      })

      totalFrequency += pairFrequency
      pairCount++
    }
  }

  if (pairCount === 0) return 0
  const avgFrequency = totalFrequency / pairCount
  return avgFrequency / winningNumbers.length
}

// 음력 패턴 분석
function analyzeLunarPatterns(winningNumbers) {
  const lunarWeights = Array(45).fill(0)
  const lunarCycle = 29.5

  winningNumbers.forEach((draw) => {
    const date = new Date(draw.date)
    const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24))
    const lunarPhase = (daysSinceEpoch % lunarCycle) / lunarCycle

    draw.numbers.forEach((num) => {
      lunarWeights[num - 1] += Math.sin(2 * Math.PI * lunarPhase)
    })
  })

  const maxWeight = Math.max(...lunarWeights.map(Math.abs))
  return lunarWeights.map((w) => (maxWeight > 0 ? w / maxWeight : 0))
}

// 공휴일 효과 분석
function analyzeHolidayEffects(winningNumbers) {
  const holidayWeights = Array(45).fill(0)

  const holidays = ["01-01", "03-01", "05-05", "06-06", "08-15", "10-03", "10-09", "12-25"]

  winningNumbers.forEach((draw) => {
    const date = new Date(draw.date)
    const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    const isHoliday = holidays.includes(monthDay)

    if (isHoliday) {
      draw.numbers.forEach((num) => {
        holidayWeights[num - 1] += 1
      })
    }
  })

  const maxWeight = Math.max(...holidayWeights)
  return holidayWeights.map((w) => (maxWeight > 0 ? w / maxWeight : 0))
}

// 향상된 특성 추출 함수
function extractEnhancedFeatures(drawNumbers, winningNumbers) {
  // 기본 입력 데이터
  const flatNumbers = drawNumbers.flat()

  // 전역 패턴 분석 (한 번만 계산)
  const frequencies = calculateNumberFrequencies(winningNumbers)
  const lastAppearance = calculateLastAppearance(winningNumbers)
  const numberPreferences = calculateNumberPreferences(winningNumbers)
  const trendScores = analyzeTrendPatterns(winningNumbers)
  const dayOfWeekWeights = analyzeDayOfWeekPatterns(winningNumbers)
  const seasonalWeights = analyzeSeasonalPatterns(winningNumbers)
  const monthlyWeights = analyzeMonthlyPatterns(winningNumbers)
  const lunarWeights = analyzeLunarPatterns(winningNumbers)
  const holidayWeights = analyzeHolidayEffects(winningNumbers)

  // 각 회차별 향상된 특성 추출
  const enhancedDrawFeatures = drawNumbers.map((numbers) => {
    // 기본 통계적 특성
    const sum = calculateSum(numbers)
    const oddEvenRatio = calculateOddEvenRatio(numbers)
    const rangeDistribution = calculateRangeDistribution(numbers)
    const consecutiveCount = calculateConsecutiveNumbers(numbers)
    const gapStats = calculateGapStatistics(numbers)

    // 수학적 패턴
    const fibonacciRatio = analyzeFibonacciPatterns(numbers)
    const primeRatio = analyzePrimePatterns(numbers)
    const perfectSquareRatio = analyzePerfectSquarePatterns(numbers)
    const symmetryScore = analyzeSymmetryPatterns(numbers)
    const arithmeticScore = analyzeArithmeticSequencePatterns(numbers)
    const multiple3Ratio = analyzeMultiplePatterns(numbers, 3)
    const multiple7Ratio = analyzeMultiplePatterns(numbers, 7)
    const digitEntropy = analyzeDigitEntropy(numbers)

    // 공간적 패턴
    const clusterDistribution = analyzeClusterPatterns(numbers)
    const distancePattern = analyzeDistancePatterns(numbers)
    const variancePattern = analyzeVariancePatterns(numbers)
    const gridPatterns = analyzeLottoGridPatterns(numbers)

    // 역사적 패턴
    const similarityScore = analyzeSimilarityPatterns(numbers, winningNumbers)
    const combinationScore = analyzeCombinationFrequency(numbers, winningNumbers)

    // 번호별 가중치 특성
    const numbersFrequency = numbers.map((num) => frequencies[num - 1] / winningNumbers.length)
    const numbersLastAppearance = numbers.map((num) => {
      const appearance = lastAppearance[num - 1]
      return appearance / winningNumbers.length
    })
    const numbersPreference = numbers.map((num) => numberPreferences[num - 1])
    const numbersTrend = numbers.map((num) => trendScores[num - 1])
    const numbersDayWeight = numbers.map((num) => dayOfWeekWeights[num - 1])
    const numbersSeasonWeight = numbers.map((num) => seasonalWeights[num - 1])
    const numbersMonthWeight = numbers.map((num) => monthlyWeights[num - 1])
    const numbersLunarWeight = numbers.map((num) => lunarWeights[num - 1])
    const numbersHolidayWeight = numbers.map((num) => holidayWeights[num - 1])

    return [
      // 기본 통계 (9개)
      sum / 255,
      oddEvenRatio,
      ...rangeDistribution.map((count) => count / 6),
      consecutiveCount / 6,
      gapStats.mean / 44,
      gapStats.max / 44,
      gapStats.min / 44,

      // 수학적 패턴 (8개)
      fibonacciRatio,
      primeRatio,
      perfectSquareRatio,
      symmetryScore,
      arithmeticScore,
      multiple3Ratio,
      multiple7Ratio,
      digitEntropy,

      // 공간적 패턴 (21개)
      ...clusterDistribution, // 5개
      distancePattern,
      variancePattern,
      ...gridPatterns, // 16개

      // 역사적 패턴 (2개)
      similarityScore,
      combinationScore,

      // 번호별 특성 (54개)
      ...numbersFrequency,
      ...numbersLastAppearance,
      ...numbersPreference,
      ...numbersTrend,
      ...numbersDayWeight,
      ...numbersSeasonWeight,
      ...numbersMonthWeight,
      ...numbersLunarWeight,
      ...numbersHolidayWeight,
    ]
  })

  // 전체 특성 배열 생성
  return [
    ...flatNumbers, // 기본 입력 (30개)
    ...enhancedDrawFeatures.flat(), // 향상된 특성 (회차당 94개 × 5회 = 470개)
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

    // 향상된 특성 추출 (현재 시점까지의 당첨 번호만 사용)
    const features = extractEnhancedFeatures(sequence, winningNumbers.slice(0, i + sequenceLength))

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

// 데이터 전처리: 향상된 특성을 포함
function preprocessData(winningNumbers) {
  // 시퀀스 길이 (몇 개의 이전 추첨 결과를 사용할지)
  const sequenceLength = 5

  // 최소 sequenceLength+1개의 데이터가 있어야 시퀀스 생성 가능
  if (winningNumbers.length <= sequenceLength) {
    throw new Error("학습 데이터가 충분하지 않습니다.")
  }

  // 향상된 특성 추출
  const { sequences, targets } = extractFeaturesForDataset(winningNumbers, sequenceLength)

  return {
    sequences: self.tf.tensor2d(sequences),
    targets: self.tf.tensor2d(targets),
    inputShape: [sequences[0].length], // 입력 형태 저장
  }
}

// 모델 생성 - 향상된 특성에 맞게 조정
function createModel(inputShape) {
  const model = self.tf.sequential()

  // 입력 레이어: 향상된 특성 (500개 특성)
  model.add(
    self.tf.layers.dense({
      units: 256,
      activation: "relu",
      inputShape: inputShape,
      kernelRegularizer: self.tf.regularizers.l2({ l2: 0.001 }),
    }),
  )

  // 배치 정규화 추가
  model.add(self.tf.layers.batchNormalization())

  // 드롭아웃 레이어로 과적합 방지
  model.add(self.tf.layers.dropout({ rate: 0.4 }))

  // 히든 레이어 1
  model.add(
    self.tf.layers.dense({
      units: 512,
      activation: "relu",
      kernelRegularizer: self.tf.regularizers.l2({ l2: 0.001 }),
    }),
  )

  model.add(self.tf.layers.batchNormalization())
  model.add(self.tf.layers.dropout({ rate: 0.4 }))

  // 히든 레이어 2
  model.add(
    self.tf.layers.dense({
      units: 256,
      activation: "relu",
      kernelRegularizer: self.tf.regularizers.l1l2({ l1: 0.0001, l2: 0.001 }),
    }),
  )

  model.add(self.tf.layers.batchNormalization())
  model.add(self.tf.layers.dropout({ rate: 0.3 }))

  // 히든 레이어 3 (추가)
  model.add(
    self.tf.layers.dense({
      units: 128,
      activation: "relu",
      kernelRegularizer: self.tf.regularizers.l2({ l2: 0.001 }),
    }),
  )

  model.add(self.tf.layers.batchNormalization())

  // 출력 레이어: 각 번호(1-45)의 등장 확률
  model.add(
    self.tf.layers.dense({
      units: 45,
      activation: "sigmoid",
    }),
  )

  // 모델 컴파일 - 최적화 알고리즘 및 학습률 조정
  const learningRate = 0.0005 // 학습률 조정
  const optimizer = self.tf.train.adam(learningRate, 0.9, 0.999, 1e-7)

  model.compile({
    optimizer: optimizer,
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  })

  return model
}

// 모델 학습 - 기존과 동일하지만 향상된 특성 사용
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

    // 데이터 전처리 (향상된 특성 사용)
    const preprocessedData = preprocessData(winningNumbers)
    sequences = preprocessedData.sequences
    targets = preprocessedData.targets
    const inputShape = preprocessedData.inputShape

    console.log(`향상된 특성 개수: ${inputShape[0]}개`)

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
    const epochs = 100 // 에포크 수 증가
    const batchSize = 16 // 배치 크기 증가

    // 학습률 스케줄링 설정
    const initialLearningRate = 0.0005
    const decayRate = 0.95

    // 조기 종료 설정
    let bestValLoss = Number.POSITIVE_INFINITY
    const patience = 15 // 인내심 증가
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
      const learningRate = initialLearningRate * Math.pow(decayRate, Math.floor(epoch / 15))
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
      self.tf.dispose(evalResult)

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
      self.tf.io.withSaveHandler(async (modelArtifacts) => {
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
    if (sequences) self.tf.dispose(sequences)
    if (targets) self.tf.dispose(targets)
    if (trainSequences) self.tf.dispose(trainSequences)
    if (trainTargets) self.tf.dispose(trainTargets)
    if (valSequences) self.tf.dispose(valSequences)
    if (valTargets) self.tf.dispose(valTargets)
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
    model = await self.tf.loadLayersModel(self.tf.io.fromMemory(modelJson))

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

// 번호 추천 - 향상된 특성 사용
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

    // 향상된 특성 추출
    const features = extractEnhancedFeatures(recentDrawsArray, winningNumbers)
    input = self.tf.tensor2d([features])

    // 앙상블 예측 (여러 번 예측 후 평균)
    const numPredictions = 7 // 예측 횟수 증가
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

      // 상위 20개 번호 선택 (선택 범위 확대)
      const topIndices = indices.slice(0, 20)

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
    if (input) self.tf.dispose(input)
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
