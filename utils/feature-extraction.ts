import { winningNumbers } from "@/data/winning-numbers"
import {
  analyzeDayOfWeekPatterns,
  analyzeSeasonalPatterns,
  analyzeMonthlyPatterns,
  analyzeFibonacciPatterns,
  analyzePrimePatterns,
  analyzePerfectSquarePatterns,
  analyzeSymmetryPatterns,
  analyzeArithmeticSequencePatterns,
  analyzeClusterPatterns,
  calculateNumberPreferences,
  analyzeDistancePatterns,
  analyzeVariancePatterns,
  analyzeSimilarityPatterns,
  analyzeCombinationFrequency,
  analyzeTrendPatterns,
  analyzeMultiplePatterns,
  analyzeDigitEntropy,
  analyzeLottoGridPatterns,
  analyzeLunarPatterns,
  analyzeHolidayEffects,
} from "./advanced-pattern-analysis"

// 번호 합계 계산
export function calculateSum(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0)
}

// 홀짝 비율 계산 (홀수 번호의 비율)
export function calculateOddEvenRatio(numbers: number[]): number {
  const oddCount = numbers.filter((num) => num % 2 === 1).length
  return oddCount / numbers.length
}

// 번호 범위 분포 계산
export function calculateRangeDistribution(numbers: number[]): number[] {
  const ranges = [0, 0, 0] // [1-15, 16-30, 31-45]

  numbers.forEach((num) => {
    if (num <= 15) ranges[0]++
    else if (num <= 30) ranges[1]++
    else ranges[2]++
  })

  return ranges
}

// 연속 번호 개수 계산
export function calculateConsecutiveNumbers(numbers: number[]): number {
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
export function calculateGapStatistics(numbers: number[]): { mean: number; max: number; min: number } {
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
export function calculateNumberFrequencies(): number[] {
  const frequencies = Array(45).fill(0)

  winningNumbers.forEach((draw) => {
    draw.numbers.forEach((num) => {
      frequencies[num - 1]++
    })
  })

  return frequencies
}

// 번호별 최근 등장 회차 계산
export function calculateLastAppearance(): number[] {
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

// 번호 간 상관관계 계산 (함께 등장한 횟수)
export function calculateNumberCorrelations(): number[][] {
  const correlations = Array(45)
    .fill(0)
    .map(() => Array(45).fill(0))

  winningNumbers.forEach((draw) => {
    for (let i = 0; i < draw.numbers.length; i++) {
      for (let j = i + 1; j < draw.numbers.length; j++) {
        const num1 = draw.numbers[i] - 1
        const num2 = draw.numbers[j] - 1
        correlations[num1][num2]++
        correlations[num2][num1]++
      }
    }
  })

  return correlations
}

// 향상된 특성 추출 함수
export function extractEnhancedFeatures(drawNumbers: number[][], winningNumbers: any[]): number[] {
  // 기본 입력 데이터
  const flatNumbers = drawNumbers.flat()

  // 전역 패턴 분석 (한 번만 계산)
  const frequencies = calculateNumberFrequencies()
  const lastAppearance = calculateLastAppearance()
  const numberPreferences = calculateNumberPreferences()
  const trendScores = analyzeTrendPatterns()
  const dayOfWeekWeights = analyzeDayOfWeekPatterns()
  const seasonalWeights = analyzeSeasonalPatterns()
  const monthlyWeights = analyzeMonthlyPatterns()
  const lunarWeights = analyzeLunarPatterns()
  const holidayWeights = analyzeHolidayEffects()

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
    const similarityScore = analyzeSimilarityPatterns(numbers)
    const combinationScore = analyzeCombinationFrequency(numbers)

    // 번호별 가중치 특성 (각 번호에 대한 다양한 가중치)
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
      sum / 255, // 정규화
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

      // 공간적 패턴 (5 + 16개 = 21개)
      ...clusterDistribution, // 5개
      distancePattern,
      variancePattern,
      ...gridPatterns, // 16개 (7행 + 7열 + 2대각선)

      // 역사적 패턴 (2개)
      similarityScore,
      combinationScore,

      // 번호별 특성 (6개 × 9가지 = 54개)
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

// 모든 특성을 추출하여 단일 배열로 반환 (기존 호환성 유지)
export function extractAllFeatures(drawNumbers: number[][], winningNumbers: any[]): number[] {
  return extractEnhancedFeatures(drawNumbers, winningNumbers)
}

// 전체 데이터셋에 대한 특성 추출
export function extractFeaturesForDataset(
  winningNumbers: any[],
  sequenceLength: number,
): {
  sequences: number[][]
  targets: number[][]
} {
  const sequences: number[][] = []
  const targets: number[][] = []

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
