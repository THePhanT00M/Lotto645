"use client"

import { useState, useEffect, useMemo } from "react"
import { Sparkles, Save, Check, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { winningNumbers } from "@/data/winning-numbers" // 전체 당첨 번호 데이터
import { saveLottoResult } from "@/utils/lotto-storage"
import AINumberDisplay from "@/components/lotto-analysis/ai-number-display"

interface AIRecommendationProps {
  userSelectedNumbers?: number[]
  onRecommendationGenerated?: (numbers: number[]) => void
  onAnalyzeNumbers?: (numbers: number[]) => void // Add callback for analyzing numbers
}

type Grade = "하" | "중하" | "보통" | "중" | "중상" | "상" | "최상"

// --- 1단계: 패턴 분석 로직 (useMemo로 캐시) ---
type FrequencyMap = Map<number, number>
type StringFrequencyMap = Map<string, number>

interface LottoAnalytics {
  numberFrequencies: FrequencyMap
  pairFrequencies: StringFrequencyMap
  tripletFrequencies: StringFrequencyMap
  // [이전 요청] 4-조합(쿼드러플) 마지막 등장 회차 맵 추가
  quadrupletLastSeen: StringFrequencyMap
  recentFrequencies: FrequencyMap
  gapMap: FrequencyMap
  weightedNumberList: number[]
  sumStats: { mean: number; stdDev: number }
  oddEvenDistribution: StringFrequencyMap
  sectionDistribution: StringFrequencyMap
  consecutiveDistribution: StringFrequencyMap
}

// [이전 요청] 1등 당첨번호 Set (중복 체크용)
const winningNumbersSet = new Set(
  winningNumbers.map((draw) => [...draw.numbers].sort((a, b) => a - b).join("-")),
)
// ------------------------------------------------

/**
 * data/winning-numbers.ts 데이터를 기반으로 통계 정보를 계산하고 캐시하는 훅
 */
const useLottoAnalytics = (): LottoAnalytics => {
  return useMemo(() => {
    console.log("Lotto Analytics: Caching started...")
    const numberFrequencies: FrequencyMap = new Map()
    const pairFrequencies: StringFrequencyMap = new Map()
    const tripletFrequencies: StringFrequencyMap = new Map()
    // [이전 요청] 4-조합(쿼드러플) 맵 초기화
    const quadrupletLastSeen: StringFrequencyMap = new Map()
    const recentFrequencies: FrequencyMap = new Map()
    const gapMap: FrequencyMap = new Map()
    const weightedNumberList: number[] = []

    const sumStats = { mean: 0, stdDev: 0, values: [] as number[] }
    const oddEvenDistribution: StringFrequencyMap = new Map()
    const sectionDistribution: StringFrequencyMap = new Map()
    const consecutiveDistribution: StringFrequencyMap = new Map()

    const totalDraws = winningNumbers.length
    const RECENT_DRAW_COUNT = 104 // 최근 2년 (약 104주)
    const recentDrawsStart = totalDraws - RECENT_DRAW_COUNT

    const lastSeen: Map<number, number> = new Map()
    for (let i = 1; i <= 45; i++) {
      lastSeen.set(i, 0)
    }

    winningNumbers.forEach((draw, index) => {
      const drawNumbers = [...draw.numbers].sort((a, b) => a - b)
      const allDrawNumbers = [...draw.numbers, draw.bonusNo]

      // --- 1. 개별 번호 통계 ---
      for (const num of allDrawNumbers) {
        const freq = (numberFrequencies.get(num) || 0) + 1
        numberFrequencies.set(num, freq)
        weightedNumberList.push(num)
        lastSeen.set(num, draw.drawNo)
        if (index >= recentDrawsStart) {
          recentFrequencies.set(num, (recentFrequencies.get(num) || 0) + 1)
        }
      }

      // --- 2. 조합 통계 (당첨번호 6개 기준) ---
      const sum = drawNumbers.reduce((a, b) => a + b, 0)
      sumStats.values.push(sum)
      const oddCount = drawNumbers.filter((n) => n % 2 === 1).length
      const evenCount = 6 - oddCount
      const oddEvenKey = `${oddCount}:${evenCount}`
      oddEvenDistribution.set(oddEvenKey, (oddEvenDistribution.get(oddEvenKey) || 0) + 1)
      const s1 = drawNumbers.filter((n) => n <= 15).length
      const s2 = drawNumbers.filter((n) => n > 15 && n <= 30).length
      const s3 = drawNumbers.filter((n) => n > 30).length
      const sectionKey = [s1, s2, s3].sort((a, b) => b - a).join(":")
      sectionDistribution.set(sectionKey, (sectionDistribution.get(sectionKey) || 0) + 1)
      let consecutiveCount = 0
      for (let i = 0; i < drawNumbers.length - 1; i++) {
        if (drawNumbers[i + 1] - drawNumbers[i] === 1) {
          consecutiveCount++
        }
      }
      const consecutiveKey = `${consecutiveCount}쌍`
      consecutiveDistribution.set(consecutiveKey, (consecutiveDistribution.get(consecutiveKey) || 0) + 1)

      for (let i = 0; i < drawNumbers.length; i++) {
        for (let j = i + 1; j < drawNumbers.length; j++) {
          const key = `${drawNumbers[i]}-${drawNumbers[j]}`
          pairFrequencies.set(key, (pairFrequencies.get(key) || 0) + 1)
        }
      }

      for (let i = 0; i < drawNumbers.length - 2; i++) {
        for (let j = i + 1; j < drawNumbers.length - 1; j++) {
          for (let k = j + 1; k < drawNumbers.length; k++) {
            const key = `${drawNumbers[i]}-${drawNumbers[j]}-${drawNumbers[k]}`
            tripletFrequencies.set(key, (tripletFrequencies.get(key) || 0) + 1)
          }
        }
      }

      // [이전 요청] 4-조합(쿼드러플) - 마지막 등장 회차 기록
      for (let i = 0; i < drawNumbers.length - 3; i++) {
        for (let j = i + 1; j < drawNumbers.length - 2; j++) {
          for (let k = j + 1; k < drawNumbers.length - 1; k++) {
            for (let l = k + 1; l < drawNumbers.length; l++) {
              const key = `${drawNumbers[i]}-${drawNumbers[j]}-${drawNumbers[k]}-${drawNumbers[l]}`
              quadrupletLastSeen.set(key, draw.drawNo)
            }
          }
        }
      }
    })

    // --- 3. 최종 통계 계산 ---
    const latestDrawNo = winningNumbers[totalDraws - 1].drawNo
    for (let i = 1; i <= 45; i++) {
      if (!numberFrequencies.has(i)) {
        numberFrequencies.set(i, 1)
        weightedNumberList.push(i)
      }
      gapMap.set(i, latestDrawNo - (lastSeen.get(i) || 0))
    }
    const sumTotal = sumStats.values.reduce((a, b) => a + b, 0)
    sumStats.mean = sumTotal / totalDraws
    const variance = sumStats.values.reduce((a, b) => a + Math.pow(b - sumStats.mean, 2), 0) / totalDraws
    sumStats.stdDev = Math.sqrt(variance)

    console.log("Lotto Analytics: Caching complete.")
    return {
      numberFrequencies,
      pairFrequencies,
      tripletFrequencies,
      quadrupletLastSeen, // [이전 요청] 반환 객체에 추가
      recentFrequencies,
      gapMap,
      weightedNumberList,
      sumStats,
      oddEvenDistribution,
      sectionDistribution,
      consecutiveDistribution,
    }
  }, [])
}

// --- 2단계: 신규 AI 추천 로직 ---

/**
 * 가중치 리스트에서 무작위로 번호 하나를 뽑는 함수
 * @param list - 빈도에 따라 가중치가 적용된 번호 배열
 */
const getWeightedRandomNumber = (list: number[]): number => {
  const randomIndex = Math.floor(Math.random() * list.length)
  return list[randomIndex]
}

/**
 * 가중치 기반으로 6개 번호 조합 생성
 * @param weightedList - 빈도 가중치가 적용된 번호 배열
 */
const generateCombination = (weightedList: number[]): number[] => {
  const numbers = new Set<number>()
  while (numbers.size < 6) {
    numbers.add(getWeightedRandomNumber(weightedList))
  }
  return Array.from(numbers).sort((a, b) => a - b)
}

/**
 * 조합의 등급 점수 계산 (기존 calculateGrade 활용)
 * @param grade - "최상" ~ "하" 등급
 */
const getGradeScore = (grade: Grade): number => {
  // [이전 요청] 등급별 점수 조정 (200점 만점 기준)
  switch (grade) {
    case "최상":
      return 80
    case "상":
      return 50
    case "중상":
      return 30
    case "중":
      return 10
    case "보통":
      return 0
    case "중하":
      return -20
    case "하":
      return -40
  }
}
// ------------------------------------

/**
 * 조합의 동반 출현(궁합수) 점수 계산
 * @param numbers - 6개 번호 조합 (정렬된 상태)
 * @param pairMap - 동반 출현 빈도 맵
 */
const getPairScore = (numbers: number[], pairMap: StringFrequencyMap): number => {
  let score = 0
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      const key = `${numbers[i]}-${numbers[j]}` // 정렬된 상태로 생성됨
      score += pairMap.get(key) || 0
    }
  }
  return score
}

/**
 * 3-조합(트리오) 점수 계산
 * @param numbers - 6개 번호 조합 (정렬된 상태)
 * @param tripletMap - 3-조합 빈도 맵
 */
const getTripletScore = (numbers: number[], tripletMap: StringFrequencyMap): number => {
  let score = 0
  for (let i = 0; i < numbers.length - 2; i++) {
    for (let j = i + 1; j < numbers.length - 1; j++) {
      for (let k = j + 1; k < numbers.length; k++) {
        const key = `${numbers[i]}-${numbers[j]}-${numbers[k]}`
        score += tripletMap.get(key) || 0
      }
    }
  }
  return score
}

/**
 * 최근 빈도(Hot) 점수 계산
 * @param numbers - 6개 번호 조합
 * @param recentMap - 최근 빈도 맵
 */
const getRecentFrequencyScore = (numbers: number[], recentMap: FrequencyMap): number => {
  return numbers.reduce((acc, num) => acc + (recentMap.get(num) || 0), 0)
}

/**
 * 미출현 기간(Cold) 점수 계산
 * @param numbers - 6개 번호 조합
 * @param gapMap - 미출현 기간 맵
 */
const getGapScore = (numbers: number[], gapMap: FrequencyMap): number => {
  // 미출현 기간이 길수록(Cold) 점수가 높음
  return numbers.reduce((acc, num) => acc + (gapMap.get(num) || 0), 0)
}

// [이전 요청] 4-조합 패널티 점수 계산 함수
/**
 * 4-조합(Quadruplet) 패널티 점수 계산
 * @param numbers - 6개 번호 조합 (정렬된 상태)
 * @param quadrupletLastSeen - 4-조합 마지막 등장 회차 맵
 * @param latestDrawNo - 가장 최근 회차 번호
 * @param recentThreshold - '최근'으로 간주할 회차 수 (예: 156 = 3년)
 */
const getQuadrupletScore = (
  numbers: number[],
  quadrupletLastSeen: StringFrequencyMap,
  latestDrawNo: number,
  recentThreshold: number,
): number => {
  let maxPenalty = 0 // 0이 가장 좋은 점수 (패널티 없음)

  // 6개 중 4개를 뽑는 15가지 모든 조합을 순회
  for (let i = 0; i < numbers.length - 3; i++) {
    for (let j = i + 1; j < numbers.length - 2; j++) {
      for (let k = j + 1; k < numbers.length - 1; k++) {
        for (let l = k + 1; l < numbers.length; l++) {
          const key = `${numbers[i]}-${numbers[j]}-${numbers[k]}-${numbers[l]}`
          const lastSeenDraw = quadrupletLastSeen.get(key)

          if (lastSeenDraw) {
            const gap = latestDrawNo - lastSeenDraw
            if (gap < recentThreshold) {
              // [이전 요청] 패널티 점수 상향 (200점 만점 기준)
              // '최근' (3년 이내)에 등장한 4-조합이 포함됨 -> 매우 높은 패널티
              return -150 // (기존 -100) 즉시 반환
            } else {
              // '오래 전'에 등장한 4-조합이 포함됨 -> 중간 패널티
              maxPenalty = Math.min(maxPenalty, -40) // (기존 -30)
              // ----------------------------------------------------
            }
          }
        }
      }
    }
  }
  return maxPenalty // 0 또는 -40 반환
}
// ----------------------------------------------------

// --- 등급 계산 및 설명 함수 ---

/**
 * 조합의 통계적 등급을 계산하는 함수 (데이터 기반)
 * @param numbers - 6개 번호 조합
 * @param stats - useLottoAnalytics에서 계산된 통계 데이터
 */
const calculateGrade = (numbers: number[], stats: LottoAnalytics): Grade => {
  const {
    sumStats,
    oddEvenDistribution,
    sectionDistribution,
    consecutiveDistribution,
    quadrupletLastSeen, // [이전 요청] 4-조합 맵 가져오기
  } = stats

  const sum = numbers.reduce((acc, num) => acc + num, 0)

  // [이전 요청] 점수 기준 200점 만점으로 상향 조정
  // 1. 총합 (Sum) 점수
  let score = 70 // (기존 50)
  const sumDiff = Math.abs(sum - sumStats.mean)
  if (sumDiff <= sumStats.stdDev) {
    score += 35 // (기존 25) 1표준편차 이내
  } else if (sumDiff <= sumStats.stdDev * 2) {
    score += 15 // (기존 10) 2표준편차 이내
  } else {
    score -= 20 // (기존 -15) 2표준편차 밖
  }

  // 2. 연속번호 (Consecutive) 점수
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  let consecutiveCount = 0
  for (let i = 0; i < sortedNumbers.length - 1; i++) {
    if (sortedNumbers[i + 1] - sortedNumbers[i] === 1) {
      consecutiveCount++
    }
  }
  const consecutiveKey = `${consecutiveCount}쌍`
  const consecutiveRank = getRank(consecutiveDistribution, consecutiveKey)
  if (consecutiveRank === 1) score += 20 // (기존 15)
  else if (consecutiveRank === 2) score += 10 // (기존 5)
  else score -= 15 // (기존 -10)

  // 3. 홀짝 (Odd/Even) 점수
  const oddCount = numbers.filter((n) => n % 2 === 1).length
  const evenCount = 6 - oddCount
  const oddEvenKey = `${oddCount}:${evenCount}`
  const oddEvenRank = getRank(oddEvenDistribution, oddEvenKey)
  if (oddEvenRank === 1) score += 30 // (기존 20)
  else if (oddEvenRank <= 3) score += 15 // (기존 10)
  else if (oddEvenRank === 4) score -= 10 // (기존 -5)
  else score -= 20 // (기존 -15)

  // 4. 구간 밸런스 (Section) 점수
  const s1 = numbers.filter((n) => n <= 15).length
  const s2 = numbers.filter((n) => n > 15 && n <= 30).length
  const s3 = numbers.filter((n) => n > 30).length
  const sectionKey = [s1, s2, s3].sort((a, b) => b - a).join(":")
  const sectionRank = getRank(sectionDistribution, sectionKey)

  if (sectionRank === 1) score += 45 // (기존 30)
  else if (sectionRank <= 3) score += 20 // (기존 15)
  else if (sectionRank <= 6) score += 0 // (기존 0)
  else score -= 20 // (기존 -15)

  // [이전 요청] 5. 4-조합(쿼드러플) 패널티 적용
  const RECENT_THRESHOLD = 156 // 3년 (약 156주)
  const latestDrawNo = winningNumbers[winningNumbers.length - 1].drawNo
  const quadrupletPenalty = getQuadrupletScore(sortedNumbers, quadrupletLastSeen, latestDrawNo, RECENT_THRESHOLD)

  score += quadrupletPenalty // 패널티 점수(음수)를 점수에 더함

  // [이전 요청] 최종 등급 반환 (200점 만점 기준)
  if (score >= 180) return "최상" // (기존 90) - 90% 이상
  if (score >= 150) return "상" // (기존 75) - 75% 이상
  if (score >= 120) return "중상" // (기존 60) - 60% 이상
  if (score >= 90) return "중" // (기존 45) - 45% 이상
  if (score >= 60) return "보통" // (기존 30) - 30% 이상
  if (score >= 20) return "중하" // (기존 10) - 10% 이상
  return "하"
  // ---------------------------------------------
}

// 분포 Map에서 특정 key의 순위(빈도 기준)를 반환하는 헬퍼
const getRank = (distribution: StringFrequencyMap, key: string): number => {
  const sorted = [...distribution.entries()].sort((a, b) => b[1] - a[1])
  const rank = sorted.findIndex((entry) => entry[0] === key)
  return rank === -1 ? 99 : rank + 1 // 순위는 1부터 시작
}

const getGradeColor = (grade: Grade): string => {
  // ... (등급별 색상 반환 로직 - 변경 없음) ...
  switch (grade) {
    case "최상":
      return "border border-purple-100 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950"
    case "상":
      return "border border-blue-100 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950"
    case "중상":
      return "border border-green-100 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950"
    case "중":
      return "border border-teal-100 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950"
    case "보통":
      return "border border-yellow-100 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950"
    case "중하":
      return "border border-orange-100 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950"
    case "하":
      return "border border-red-100 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950"
  }
}

/**
 * 등급에 대한 구체적인 설명을 반환합니다. (사용자 요청 반영)
 * @param grade - "최상" ~ "하" 등급
 */
const getGradeDescription = (grade: Grade): string => {
  // --- [요청사항 2] 등급 설명 단순화 ---
  switch (grade) {
    case "최상":
      return "통계적으로 가장 완벽한 '황금 비율' 조합입니다. 번호의 합, 홀짝, 높낮이 밸런스가 과거 1등 번호들의 평균과 거의 일치합니다."
    case "상":
      return "매우 훌륭한 조합입니다. 과거 당첨 번호들에서 가장 자주 보였던 안정적인 패턴을 따르고 있습니다."
    case "중상":
      return "균형이 잘 잡힌 좋은 조합입니다. 대부분의 통계 기준이 '당첨 번호'하면 떠오르는 평균적인 범위를 만족합니다."
    case "중":
      return "평균적인 조합입니다. 한두 가지 요소(예: 홀짝 비율)가 평균에서 살짝 벗어났지만, 여전히 가능성이 있는 패턴입니다."
    case "보통":
      return "무난한 조합입니다. 다만, 번호가 특정 구간에 조금 쏠려있거나, 번호의 총합이 평균보다 높거나 낮을 수 있습니다."
    case "중하":
      return "통계적 균형이 다소 아쉬운 조합입니다. 홀짝이나 번호대별 분포가 과거 당첨 패턴과 조금 다른 경향을 보입니다."
    case "하":
      return "매우 독특한 조합입니다. 번호의 합이나 분포가 과거 당첨 통계에서 매우 드물게 나타났던 패턴입니다."
  }
  // ------------------------------------
}

// --- 3단계: 컴포넌트 구현 ---
export default function AIRecommendation({
                                           userSelectedNumbers,
                                           onRecommendationGenerated,
                                           onAnalyzeNumbers,
                                         }: AIRecommendationProps) {
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [aiGrade, setAiGrade] = useState<Grade | null>(null)
  const [userGrade, setUserGrade] = useState<Grade | null>(null)
  const [showUserAnalysis, setShowUserAnalysis] = useState(false)
  const [originalUserNumbers, setOriginalUserNumbers] = useState<number[]>([])

  // --- [요청사항 2] AI에 의한 분석 업데이트인지 추적하는 상태 ---
  const [isAiAnalyzed, setIsAiAnalyzed] = useState(false)
  // ---------------------------------------------------

  // 1단계: 패턴 데이터 캐싱
  const analyticsData = useLottoAnalytics()

  useEffect(() => {
    if (userSelectedNumbers && userSelectedNumbers.length === 6) {
      // --- [요청사항 2] 원본 번호 보존 로직 수정 ---
      // AI에 의해 분석이 트리거된 것이 아니라면 (isAiAnalyzed === false)
      // 이 번호는 사용자가 직접 생성/선택한 '원본 번호'로 간주합니다.
      if (!isAiAnalyzed) {
        // 이 번호를 '원본 추첨 번호'로 저장합니다.
        setOriginalUserNumbers([...userSelectedNumbers])
        const sortedUserNumbers = [...userSelectedNumbers].sort((a, b) => a - b)
        setUserGrade(calculateGrade(sortedUserNumbers, analyticsData))
        setShowUserAnalysis(true)
      } else {
        // AI에 의해 분석이 트리거된 경우 ('AI 추천 번호'가 분석 대상이 됨)
        // '원본 추첨 번호'는 덮어쓰지 않고, 플래그만 리셋합니다.
        setIsAiAnalyzed(false)
      }
      // -------------------------------------------
    } else {
      // 번호가 6개가 아니면 (예: 리셋) 모든 상태를 초기화합니다.
      setOriginalUserNumbers([])
      setUserGrade(null)
      setShowUserAnalysis(false)
      setIsAiAnalyzed(false) // [요청사항 2] 플래그 초기화
    }
  }, [userSelectedNumbers, analyticsData]) // [요청사항 2] recommendedNumbers 의존성 제거

  /**
   * AI 추천 번호 생성 (고급 알고리즘)
   */
  const generateAIRecommendation = async () => {
    setIsGenerating(true)
    setIsSaved(false)
    setRecommendedNumbers([])
    setAiGrade(null)

    // AI 추천을 눌러도 '추첨 번호 분석' 창은 그대로 유지되도록 함
    // (useEffect가 originalUserNumbers를 덮어쓰지 않기 때문)
    if (originalUserNumbers.length === 6) {
      const sortedUserNumbers = [...originalUserNumbers].sort((a, b) => a - b)
      setUserGrade(calculateGrade(sortedUserNumbers, analyticsData))
      setShowUserAnalysis(true)
    }

    await new Promise((resolve) => setTimeout(resolve, 0))

    const finalCombination = await new Promise<number[]>((resolve) => {
      const {
        weightedNumberList,
        pairFrequencies,
        tripletFrequencies,
        quadrupletLastSeen, // [이전 요청] 4-조합 맵 가져오기
        recentFrequencies,
        gapMap,
      } = analyticsData

      // [이전 요청] 4-조합 분석을 위한 변수 추가
      const RECENT_THRESHOLD = 156 // 3년
      const latestDrawNo = winningNumbers[winningNumbers.length - 1].drawNo
      // ---------------------------------------------

      const ITERATIONS = 50000 // 50,000개의 후보 조합 생성 및 테스트
      const TOP_K = 50
      const topCandidates: { combination: number[]; score: number }[] = []

      // '생성 및 평가' 시작
      for (let i = 0; i < ITERATIONS; i++) {
        // 1. 후보 조합 생성 (가중치 기반)
        const currentNumbers = generateCombination(weightedNumberList)

        // [이전 요청] 1등 당첨번호 중복 제거
        const combinationKey = currentNumbers.join("-")
        if (winningNumbersSet.has(combinationKey)) {
          continue
        }

        // 2. 후보 조합 평가
        const grade = calculateGrade(currentNumbers, analyticsData)
        const gradeScore = getGradeScore(grade) // A: 기본 균형 점수
        const pairScore = getPairScore(currentNumbers, pairFrequencies) // B: 궁합수(2-조합) 점수
        const tripletScore = getTripletScore(currentNumbers, tripletFrequencies) // C: 트리오(3-조합) 점수

        // [이전 요청] D: 4-조합(쿼드러플) 패널티 점수
        const quadrupletScore = getQuadrupletScore(
          currentNumbers,
          quadrupletLastSeen,
          latestDrawNo,
          RECENT_THRESHOLD,
        )
        // ---------------------------------------------

        const recentScore = getRecentFrequencyScore(currentNumbers, recentFrequencies) // E: 최신 빈도(Hot) 점수
        const gapScore = getGapScore(currentNumbers, gapMap) // F: 미출현(Cold) 점수

        // [이전 요청] AI 종합 점수 계산 (가중치 변경: 균형 20%, 4-조합 10%, 궁합 55%, Hot/Cold 15%)
        const totalScore =
          gradeScore * 0.2 + // 기본 균형 (20%)
          quadrupletScore * 0.1 + // 4-조합 패널티 (10%)
          (pairScore / 150) * 50 * 0.35 + // 2-조합(궁합수) 점수 (35%)
          (tripletScore / 20) * 50 * 0.2 + // 3-조합(트리오) 점수 (20%)
          (recentScore / 30) * 50 * 0.05 + // 최신 빈도(Hot) 점수 (5%)
          (gapScore / 600) * 50 * 0.1 // 미출현(Cold) 점수 (10%)
        // ---------------------------------------------------------------------------------

        // 3. Top-K 리스트 관리
        if (topCandidates.length < TOP_K) {
          topCandidates.push({ combination: currentNumbers, score: totalScore })
        } else {
          let minScore = topCandidates[0].score
          let minIndex = 0
          for (let j = 1; j < topCandidates.length; j++) {
            if (topCandidates[j].score < minScore) {
              minScore = topCandidates[j].score
              minIndex = j
            }
          }
          if (totalScore > minScore) {
            topCandidates[minIndex] = { combination: currentNumbers, score: totalScore }
          }
        }
      }

      // 4. 최종 선택: Top-K 리스트에서 무작위로 하나 선택
      let combination: number[]
      if (topCandidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * topCandidates.length)
        combination = topCandidates[randomIndex].combination
      } else {
        combination = generateCombination(weightedNumberList)
      }

      resolve(combination)
    })

    // AI 추천 번호 상태 업데이트
    const finalGrade = calculateGrade(finalCombination, analyticsData)
    setRecommendedNumbers(finalCombination)
    setAiGrade(finalGrade)

    if (onRecommendationGenerated) {
      onRecommendationGenerated(finalCombination)
    }

    // --- [요청사항 1 & 2] 자동 분석 실행 ---
    // [요청사항 2] onAnalyzeNumbers를 호출하기 직전에, 이 업데이트가 AI에 의한 것임을 표시
    setIsAiAnalyzed(true)
    // [요청사항 1] 부모 컴포넌트(lotto-analysis)의 분석 대상 번호를 AI 추천 번호로 자동 업데이트
    if (onAnalyzeNumbers) {
      onAnalyzeNumbers(finalCombination)
    }
    // ---------------------------------------

    setIsGenerating(false)
  }

  const handleSaveToHistory = () => {
    if (recommendedNumbers.length > 0) {
      saveLottoResult(recommendedNumbers, true)
      setIsSaved(true)
    }
  }

  // 이 함수는 "추첨 번호 분석" 카드에 있는 버튼을 위한 것
  const handleAnalyzeUserNumbers = () => {
    if (originalUserNumbers.length === 6 && onAnalyzeNumbers) {
      // "원본 번호"로 분석 대상을 변경 (AI 분석 상태가 아님)
      setIsAiAnalyzed(false)
      onAnalyzeNumbers(originalUserNumbers)
    }
  }

  // 이 함수는 "AI 추천 번호" 카드에 있는 버튼을 위한 것
  const handleAnalyzeAINumbers = () => {
    if (recommendedNumbers.length === 6 && onAnalyzeNumbers) {
      // "AI 추천 번호"로 분석 대상을 변경 (AI 분석 상태임)
      setIsAiAnalyzed(true)
      onAnalyzeNumbers(recommendedNumbers)
    }
  }

  return (
    <div className="p-4 bg-gray-200 dark:bg-[rgb(36,36,36)] rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-gray-800 dark:text-gray-200">추첨 번호</h3>
        </div>
      </div>

      {showUserAnalysis && originalUserNumbers.length === 6 && userGrade && (
        <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 mb-4">
          <div className="flex flex-col mb-3">
            <div className="flex justify-between items-center w-full gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                추첨기에서 선택한 번호의 분석 결과입니다.
              </p>
              <div
                className={`px-3 py-1.5 rounded-lg font-semibold text-sm whitespace-nowrap ${getGradeColor(userGrade)}`}
              >
                {userGrade}
              </div>
            </div>
            <div className="text-xs p-2 bg-white dark:bg-[#464646] rounded-lg text-gray-700 dark:text-gray-200 mt-3">
              <p className="font-medium mb-1">추첨 번호 등급 안내:</p>
              <p>
                • {userGrade}: {getGradeDescription(userGrade)}
              </p>
            </div>
          </div>
          <AINumberDisplay numbers={originalUserNumbers} />
          <div className="mt-3 flex justify-between">
            <Button
              onClick={handleAnalyzeUserNumbers}
              variant="outline"
              className="bg-white dark:bg-[#464646] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-1" />당첨 패턴 보기
            </Button>
            <Button
              onClick={generateAIRecommendation}
              disabled={isGenerating}
              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 mr-1 animate-spin" />
                  패턴 연산 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  AI 추천 받기
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {recommendedNumbers.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-medium text-gray-800 dark:text-gray-200">AI 번호 추천</h3>
          </div>
        </div>
      )}

      {recommendedNumbers.length > 0 && (
        <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 mt-4">
          <div className="flex flex-col mb-3">
            <div className="flex justify-between items-center w-full gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                과거 당첨 패턴과 함께 등장한 번호 분석을 기반으로 생성된 추천 번호입니다.
              </p>
              {aiGrade && (
                <div
                  className={`px-3 py-1.5 rounded-lg font-semibold text-sm whitespace-nowrap ${getGradeColor(aiGrade)}`}
                >
                  {aiGrade}
                </div>
              )}
            </div>
            {aiGrade && (
              <div className="text-xs p-2 bg-white dark:bg-[#464646] rounded-lg text-gray-700 dark:text-gray-200 mt-3">
                <p className="font-medium mb-1">추천 등급 안내:</p>
                <p>
                  • {aiGrade}: {getGradeDescription(aiGrade)}
                </p>
              </div>
            )}
          </div>
          <AINumberDisplay numbers={recommendedNumbers} />
          <div className="mt-3 flex justify-between">
            <Button
              onClick={handleAnalyzeAINumbers}
              variant="outline"
              className="bg-white dark:bg-[#464646] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-1" />당첨 패턴 보기
            </Button>
            {isSaved ? (
              <div className="text-sm text-green-600 flex items-center justify-center md:w-24 md:justify-end">
                <Check className="w-4 h-4 mr-1" />
                기록 저장됨
              </div>
            ) : (
              <Button
                onClick={handleSaveToHistory}
                className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white whitespace-nowrap"
              >
                <Save className="w-4 h-4 mr-1" />
                AI 추천 번호 저장
              </Button>
            )}
          </div>
          <div className="mt-4 flex flex-col items-center gap-3 md:flex-row md:justify-between md:items-center md:gap-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              * 이 추천은 과거 데이터 패턴을 기반으로 하며, 당첨을 보장하지 않습니다.
            </div>
          </div>
        </div>
      )}

      {recommendedNumbers.length === 0 && !showUserAnalysis && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-black rounded-xl">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">AI가 분석한 추천 번호를 받아보세요</p>
        </div>
      )}
    </div>
  )
}