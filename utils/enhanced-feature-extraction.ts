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
} from "./advanced-pattern-analysis"

// 기존 특성 추출 함수들 (이미 구현된 것들)
import {
  calculateSum,
  calculateOddEvenRatio,
  calculateRangeDistribution,
  calculateConsecutiveNumbers,
  calculateGapStatistics,
  calculateNumberFrequencies,
  calculateLastAppearance,
} from "./feature-extraction"

// 향상된 특성 추출 함수
export function extractEnhancedFeatures(drawNumbers: number[][]): number[] {
  // 기본 특성들
  const flatNumbers = drawNumbers.flat()
  const frequencies = calculateNumberFrequencies()
  const lastAppearance = calculateLastAppearance()
  const numberPreferences = calculateNumberPreferences()
  const trendScores = analyzeTrendPatterns()

  // 시간 기반 패턴
  const dayOfWeekWeights = analyzeDayOfWeekPatterns()
  const seasonalWeights = analyzeSeasonalPatterns()
  const monthlyWeights = analyzeMonthlyPatterns()

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

    // 공간적 패턴
    const clusterDistribution = analyzeClusterPatterns(numbers)
    const distancePattern = analyzeDistancePatterns(numbers)
    const variancePattern = analyzeVariancePatterns(numbers)

    // 역사적 패턴
    const similarityScore = analyzeSimilarityPatterns(numbers)
    const combinationScore = analyzeCombinationFrequency(numbers)

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

    return [
      // 기본 통계 (7개)
      sum / 255,
      oddEvenRatio,
      ...rangeDistribution.map((count) => count / 6),
      consecutiveCount / 6,
      gapStats.mean / 44,
      gapStats.max / 44,
      gapStats.min / 44,

      // 수학적 패턴 (5개)
      fibonacciRatio,
      primeRatio,
      perfectSquareRatio,
      symmetryScore,
      arithmeticScore,

      // 공간적 패턴 (7개)
      ...clusterDistribution,
      distancePattern,
      variancePattern,

      // 역사적 패턴 (2개)
      similarityScore,
      combinationScore,

      // 번호별 특성 (6개 × 7가지 = 42개)
      ...numbersFrequency,
      ...numbersLastAppearance,
      ...numbersPreference,
      ...numbersTrend,
      ...numbersDayWeight,
      ...numbersSeasonWeight,
      ...numbersMonthWeight,
    ]
  })

  // 전체 특성 배열 생성
  return [
    ...flatNumbers, // 기본 입력 (30개)
    ...enhancedDrawFeatures.flat(), // 향상된 특성 (회차당 63개 × 5회 = 315개)
  ]
}

// 향상된 데이터셋 특성 추출
export function extractEnhancedFeaturesForDataset(
  winningNumbers: any[],
  sequenceLength: number,
): {
  sequences: number[][]
  targets: number[][]
} {
  const sequences: number[][] = []
  const targets: number[][] = []

  for (let i = 0; i < winningNumbers.length - sequenceLength; i++) {
    const sequence = winningNumbers.slice(i, i + sequenceLength).map((draw) => draw.numbers)
    const target = winningNumbers[i + sequenceLength].numbers

    // 향상된 특성 추출
    const features = extractEnhancedFeatures(sequence)

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

// 특성 중요도 분석
export function analyzeFeatureImportance(sequences: number[][], targets: number[][]): number[] {
  const numFeatures = sequences[0].length
  const importance = Array(numFeatures).fill(0)

  // 각 특성과 타겟 간의 상관관계 계산
  for (let featureIndex = 0; featureIndex < numFeatures; featureIndex++) {
    let correlation = 0

    for (let sampleIndex = 0; sampleIndex < sequences.length; sampleIndex++) {
      const featureValue = sequences[sampleIndex][featureIndex]
      const targetSum = targets[sampleIndex].reduce((sum, val) => sum + val, 0)

      correlation += featureValue * targetSum
    }

    importance[featureIndex] = Math.abs(correlation) / sequences.length
  }

  // 정규화
  const maxImportance = Math.max(...importance)
  return importance.map((imp) => imp / maxImportance)
}

// 특성 설명
export const FEATURE_DESCRIPTIONS = {
  basic: [
    "번호 합계 (정규화)",
    "홀짝 비율",
    "1-15 구간 분포",
    "16-30 구간 분포",
    "31-45 구간 분포",
    "연속 번호 개수",
    "평균 간격",
    "최대 간격",
    "최소 간격",
  ],
  mathematical: ["피보나치 수 비율", "소수 비율", "완전제곱수 비율", "대칭 패턴 점수", "등차수열 점수"],
  spatial: [
    "클러스터 1 분포",
    "클러스터 2 분포",
    "클러스터 3 분포",
    "클러스터 4 분포",
    "클러스터 5 분포",
    "번호 간 거리",
    "번호 분산",
  ],
  historical: ["유사도 점수", "조합 빈도 점수"],
  temporal: ["요일별 가중치", "계절별 가중치", "월별 가중치"],
}
