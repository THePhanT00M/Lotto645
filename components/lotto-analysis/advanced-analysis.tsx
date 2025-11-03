"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import AIRecommendation from "./ai-recommendation"
import MultipleNumberAnalysis from "./multiple-number-analysis"
import type { MultipleNumberType, SimilarDrawType } from "./types"
import type { WinningLottoNumbers } from "@/types/lotto" // WinningLottoNumbers 타입 import

// --- AIRecommendation에서 이동된 로직 ---
import { Sparkles, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
// import { winningNumbers } from "@/data/winning-numbers" // 정적 데이터 import 제거
import AINumberDisplay from "@/components/lotto-analysis/ai-number-display"

// --- 1단계: 타입 및 헬퍼 함수 (ai-recommendation.tsx에서 이동) ---
type Grade = "하" | "중하" | "보통" | "중" | "중상" | "상" | "최상"

type FrequencyMap = Map<number, number>
type StringFrequencyMap = Map<string, number>

// LottoAnalytics: AI 추천에 필요한 모든 통계 데이터를 정의하는 인터페이스
interface LottoAnalytics {
  numberFrequencies: FrequencyMap // 1. (보너스 포함) 번호별 총 출현 빈도
  pairFrequencies: StringFrequencyMap // 2. (당첨번호 6개 기준) 2개 번호 조합(쌍) 출현 빈도
  tripletFrequencies: StringFrequencyMap // 3. (당첨번호 6개 기준) 3개 번호 조합(트리플) 출현 빈도
  quadrupletLastSeen: StringFrequencyMap // 4. (당첨번호 6개 기준) 4개 번호 조합이 마지막으로 나온 회차
  recentFrequencies: FrequencyMap // 5. (보너스 포함) 최근 2년(104회)간 번호별 출현 빈도
  gapMap: FrequencyMap // 6. 번호별 미출현 기간 (현재 회차 - 마지막 출현 회차)
  weightedNumberList: number[] // 7. 출현 빈도에 따라 가중치가 부여된 번호 목록 (많이 나온 번호가 목록에 더 많이 포함됨)
  sumStats: { mean: number; stdDev: number } // 8. 당첨번호 6개 합계의 평균 및 표준편차
  oddEvenDistribution: StringFrequencyMap // 9. 홀:짝 비율 분포
  sectionDistribution: StringFrequencyMap // 10. 구간별(1-15, 16-30, 31-45) 개수 분포
  consecutiveDistribution: StringFrequencyMap // 11. 연속번호(n쌍) 분포
  latestDrawNumbers: number[] // 12. (NEW) 직전 회차 번호 (이월수 분석용)
  latestDrawNo: number // (NEW) 마지막 회차 번호
  winningNumbersSet: Set<string> // (NEW) 1등 번호 Set
}

/**
 * data/winning-numbers.ts 데이터를 기반으로 통계 정보를 계산하고 캐시하는 훅
 * @param {WinningLottoNumbers[]} winningNumbers - DB에서 가져온 당첨 번호 배열
 * @returns {LottoAnalytics} 계산된 모든 통계 데이터
 */
const useLottoAnalytics = (winningNumbers: WinningLottoNumbers[]): LottoAnalytics => {
  // useMemo를 사용해 전체 당첨 번호 데이터가 변경되지 않는 한 통계 계산을 반복하지 않도록 캐시합니다.
  return useMemo(() => {
    console.log("Lotto Analytics: Caching started...")

    // 1등 당첨 번호 조합을 Set으로 만들어 중복 체크에 사용 (빠른 조회를 위해)
    const winningNumbersSet = new Set(
      winningNumbers.map((draw) => [...draw.numbers].sort((a, b) => a - b).join("-")),
    )

    // --- A. 통계 데이터 저장을 위한 Map 및 변수 초기화 ---
    const numberFrequencies: FrequencyMap = new Map()
    const pairFrequencies: StringFrequencyMap = new Map()
    const tripletFrequencies: StringFrequencyMap = new Map()
    const quadrupletLastSeen: StringFrequencyMap = new Map() // 4쌍둥이가 마지막으로 나온 회차
    const recentFrequencies: FrequencyMap = new Map() // 최근 빈도
    const gapMap: FrequencyMap = new Map() // 미출현 기간
    const weightedNumberList: number[] = [] // 가중치 목록

    const sumStats = { mean: 0, stdDev: 0, values: [] as number[] } // 6개 번호 합계 통계
    const oddEvenDistribution: StringFrequencyMap = new Map() // 홀짝 분포
    const sectionDistribution: StringFrequencyMap = new Map() // 구간 분포
    const consecutiveDistribution: StringFrequencyMap = new Map() // 연속번호 분포

    const totalDraws = winningNumbers.length
    if (totalDraws === 0) {
      // 데이터가 없는 경우 빈 객체 반환 (오류 방지)
      return {
        numberFrequencies, pairFrequencies, tripletFrequencies, quadrupletLastSeen,
        recentFrequencies, gapMap, weightedNumberList, sumStats, oddEvenDistribution,
        sectionDistribution, consecutiveDistribution, latestDrawNumbers: [],
        latestDrawNo: 0, winningNumbersSet: new Set()
      }
    }

    const RECENT_DRAW_COUNT = 104 // 최근 2년 (약 104주)
    const recentDrawsStart = Math.max(0, totalDraws - RECENT_DRAW_COUNT) // 최근 2년 데이터 시작 인덱스

    // 번호별 마지막 등장 회차 (Gap 계산용)
    const lastSeen: Map<number, number> = new Map()
    for (let i = 1; i <= 45; i++) {
      lastSeen.set(i, 0)
    }

    // --- B. 전체 당첨 번호(winningNumbers)를 순회하며 통계 데이터 구축 ---
    winningNumbers.forEach((draw, index) => {
      const drawNumbers = [...draw.numbers].sort((a, b) => a - b) // 당첨번호 6개 (정렬)
      const allDrawNumbers = [...draw.numbers, draw.bonusNo] // 보너스 번호 포함 7개

      // --- 1. 개별 번호 통계 (보너스 포함 7개) ---
      for (const num of allDrawNumbers) {
        // 1-1. 전체 출현 빈도
        const freq = (numberFrequencies.get(num) || 0) + 1
        numberFrequencies.set(num, freq)
        // 1-2. 가중치 목록에 추가 (많이 나온 번호일수록 목록에 더 많이 들어감)
        weightedNumberList.push(num)
        // 1-3. 마지막 출현 회차 기록 (Gap 계산용)
        lastSeen.set(num, draw.drawNo)
        // 1-4. 최근 2년 출현 빈도
        if (index >= recentDrawsStart) {
          recentFrequencies.set(num, (recentFrequencies.get(num) || 0) + 1)
        }
      }

      // --- 2. 조합 통계 (당첨번호 6개 기준) ---
      // 2-1. 6개 번호 합계
      const sum = drawNumbers.reduce((a, b) => a + b, 0)
      sumStats.values.push(sum)
      // 2-2. 홀짝 비율
      const oddCount = drawNumbers.filter((n) => n % 2 === 1).length
      const evenCount = 6 - oddCount
      const oddEvenKey = `${oddCount}:${evenCount}`
      oddEvenDistribution.set(oddEvenKey, (oddEvenDistribution.get(oddEvenKey) || 0) + 1)
      // 2-3. 구간별 개수 (1-15, 16-30, 31-45)
      const s1 = drawNumbers.filter((n) => n <= 15).length
      const s2 = drawNumbers.filter((n) => n > 15 && n <= 30).length
      const s3 = drawNumbers.filter((n) => n > 30).length
      // (예: "4:1:1", "3:2:1") 가장 많이 나온 구간 순서로 정렬하여 키 생성
      const sectionKey = [s1, s2, s3].sort((a, b) => b - a).join(":")
      sectionDistribution.set(sectionKey, (sectionDistribution.get(sectionKey) || 0) + 1)
      // 2-4. 연속번호 개수
      let consecutiveCount = 0
      for (let i = 0; i < drawNumbers.length - 1; i++) {
        if (drawNumbers[i + 1] - drawNumbers[i] === 1) {
          consecutiveCount++
        }
      }
      const consecutiveKey = `${consecutiveCount}쌍` // (예: "0쌍", "1쌍", "2쌍")
      consecutiveDistribution.set(consecutiveKey, (consecutiveDistribution.get(consecutiveKey) || 0) + 1)

      // 2-5. 2개 번호 조합 (Pair) 빈도
      for (let i = 0; i < drawNumbers.length; i++) {
        for (let j = i + 1; j < drawNumbers.length; j++) {
          const key = `${drawNumbers[i]}-${drawNumbers[j]}`
          pairFrequencies.set(key, (pairFrequencies.get(key) || 0) + 1)
        }
      }

      // 2-6. 3개 번호 조합 (Triplet) 빈도
      for (let i = 0; i < drawNumbers.length - 2; i++) {
        for (let j = i + 1; j < drawNumbers.length - 1; j++) {
          for (let k = j + 1; k < drawNumbers.length; k++) {
            const key = `${drawNumbers[i]}-${drawNumbers[j]}-${drawNumbers[k]}`
            tripletFrequencies.set(key, (tripletFrequencies.get(key) || 0) + 1)
          }
        }
      }

      // 2-7. 4개 번호 조합 (Quadruplet) 마지막 출현 회차
      for (let i = 0; i < drawNumbers.length - 3; i++) {
        for (let j = i + 1; j < drawNumbers.length - 2; j++) {
          for (let k = j + 1; k < drawNumbers.length - 1; k++) {
            for (let l = k + 1; l < drawNumbers.length; l++) {
              const key = `${drawNumbers[i]}-${drawNumbers[j]}-${drawNumbers[k]}-${drawNumbers[l]}`
              quadrupletLastSeen.set(key, draw.drawNo) // 마지막으로 나온 회차를 덮어씀
            }
          }
        }
      }
    }) // End of winningNumbers.forEach

    // --- C. 최종 통계 계산 (후처리) ---
    const latestDrawNo = winningNumbers[totalDraws - 1].drawNo
    for (let i = 1; i <= 45; i++) {
      // 3-1. 한 번도 안 나온 번호 처리 (최소 1회 보장, 가중치 목록에 추가)
      if (!numberFrequencies.has(i)) {
        numberFrequencies.set(i, 1) // 1회로 설정 (0으로 나누기 방지 등)
        weightedNumberList.push(i) // 가중치 목록에 최소 1번 추가
      }
      // 3-2. 미출현 기간(Gap) 계산
      gapMap.set(i, latestDrawNo - (lastSeen.get(i) || 0))
    }
    // 3-3. 6개 번호 합계의 평균(mean) 및 표준편차(stdDev) 계산
    const sumTotal = sumStats.values.reduce((a, b) => a + b, 0)
    sumStats.mean = sumTotal / totalDraws
    const variance = sumStats.values.reduce((a, b) => a + Math.pow(b - sumStats.mean, 2), 0) / totalDraws
    sumStats.stdDev = Math.sqrt(variance)

    // --- 3-4. (NEW) 직전 회차 번호 (이월수 분석용) ---
    const latestDraw = winningNumbers[totalDraws - 1]
    const latestDrawNumbers = [...latestDraw.numbers, latestDraw.bonusNo]

    console.log("Lotto Analytics: Caching complete.")
    // --- D. 모든 통계 데이터 반환 ---
    return {
      numberFrequencies,
      pairFrequencies,
      tripletFrequencies,
      quadrupletLastSeen,
      recentFrequencies,
      gapMap,
      weightedNumberList,
      sumStats,
      oddEvenDistribution,
      sectionDistribution,
      consecutiveDistribution,
      latestDrawNumbers, // (NEW)
      latestDrawNo, // (NEW)
      winningNumbersSet, // (NEW)
    }
  }, [winningNumbers]) // winningNumbers prop이 변경될 때만 재계산
}

// --- 2단계: AI 추천 로직 (ai-recommendation.tsx에서 이동) ---

/** (헬퍼) 가중치 목록에서 랜덤 번호 1개 추출 */
const getWeightedRandomNumber = (list: number[]): number => {
  const randomIndex = Math.floor(Math.random() * list.length)
  return list[randomIndex]
}
/** (헬퍼) 가중치 목록 기반으로 6개 조합 생성 */
const generateCombination = (weightedList: number[]): number[] => {
  const numbers = new Set<number>()
  while (numbers.size < 6) {
    numbers.add(getWeightedRandomNumber(weightedList))
  }
  return Array.from(numbers).sort((a, b) => a - b)
}
/** (헬퍼) 등급별 점수 반환 (AI 평가 가중치용) */
const getGradeScore = (grade: Grade): number => {
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
/** (헬퍼) 6개 번호의 2쌍(Pair) 조합 점수 합산 */
const getPairScore = (numbers: number[], pairMap: StringFrequencyMap): number => {
  let score = 0
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      const key = `${numbers[i]}-${numbers[j]}`
      score += pairMap.get(key) || 0
    }
  }
  return score
}
/** (헬퍼) 6개 번호의 3쌍(Triplet) 조합 점수 합산 */
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
/** (헬퍼) 6개 번호의 최근(2년) 출현 빈도 합산 */
const getRecentFrequencyScore = (numbers: number[], recentMap: FrequencyMap): number => {
  return numbers.reduce((acc, num) => acc + (recentMap.get(num) || 0), 0)
}
/** (헬퍼) 6개 번호의 미출현 기간(Gap) 합산 */
const getGapScore = (numbers: number[], gapMap: FrequencyMap): number => {
  return numbers.reduce((acc, num) => acc + (gapMap.get(num) || 0), 0)
}
/** (헬퍼) 6개 번호의 4쌍(Quadruplet) 조합 페널티 계산 */
const getQuadrupletScore = (
  numbers: number[],
  quadrupletLastSeen: StringFrequencyMap,
  latestDrawNo: number,
  recentThreshold: number, // 156 (3년)
): number => {
  let maxPenalty = 0
  for (let i = 0; i < numbers.length - 3; i++) {
    for (let j = i + 1; j < numbers.length - 2; j++) {
      for (let k = j + 1; k < numbers.length - 1; k++) {
        for (let l = k + 1; l < numbers.length; l++) {
          const key = `${numbers[i]}-${numbers[j]}-${numbers[k]}-${numbers[l]}`
          const lastSeenDraw = quadrupletLastSeen.get(key)
          if (lastSeenDraw) {
            const gap = latestDrawNo - lastSeenDraw
            if (gap < recentThreshold) {
              // 최근 3년 이내에 4개 조합이 일치한 적이 있다면 큰 페널티
              return -150
            } else {
              // 3년 이전에 나온 적이 있다면 작은 페널티
              maxPenalty = Math.min(maxPenalty, -40)
            }
          }
        }
      }
    }
  }
  return maxPenalty // 3년 이내 조합이 없으면 0 또는 -40 반환
}
/** (헬퍼) 분포도 Map에서 특정 key의 순위(빈도 기준) 반환 */
const getRank = (distribution: StringFrequencyMap, key: string): number => {
  // (예: 홀짝 분포 Map, "3:3" 키)
  // 1. 분포 Map을 값(빈도) 기준으로 내림차순 정렬
  const sorted = [...distribution.entries()].sort((a, b) => b[1] - a[1])
  // 2. 정렬된 배열에서 key의 인덱스(순위) 찾기
  const rank = sorted.findIndex((entry) => entry[0] === key)
  return rank === -1 ? 99 : rank + 1 // 1위, 2위...
}

/**
 * (핵심) 6개 번호 조합의 등급(밸런스)을 계산하는 함수
 * @param {number[]} numbers - 정렬된 6개 번호 배열
 * @param {LottoAnalytics} stats - useLottoAnalytics에서 계산된 전체 통계 데이터
 * @returns {Grade} - "최상" ~ "하" 등급
 */
const calculateGrade = (numbers: number[], stats: LottoAnalytics): Grade => {
  const {
    sumStats,
    oddEvenDistribution,
    sectionDistribution,
    consecutiveDistribution,
    quadrupletLastSeen,
    latestDrawNo, // (NEW)
  } = stats

  // 1. 6개 번호의 합계
  const sum = numbers.reduce((acc, num) => acc + num, 0)
  let score = 70 // 기본 점수

  // 2. 합계 점수: 평균(mean)에서 표준편차(stdDev) 범위 내에 있는지 확인
  if (sumStats.stdDev > 0) { // stdDev가 0일 경우(데이터가 1개일 때) 오류 방지
    const sumDiff = Math.abs(sum - sumStats.mean)
    if (sumDiff <= sumStats.stdDev) score += 35 // 1 표준편차 이내 (가장 좋음)
    else if (sumDiff <= sumStats.stdDev * 2) score += 15 // 2 표준편차 이내 (좋음)
    else score -= 20 // 2 표준편차 초과 (나쁨)
  }

  // 3. 연속번호 점수
  const sortedNumbers = [...numbers].sort((a, b) => a - b) // (이미 정렬되었지만 혹시 몰라 다시 정렬)
  let consecutiveCount = 0
  for (let i = 0; i < sortedNumbers.length - 1; i++) {
    if (sortedNumbers[i + 1] - sortedNumbers[i] === 1) consecutiveCount++
  }
  const consecutiveKey = `${consecutiveCount}쌍` // "0쌍", "1쌍" 등
  const consecutiveRank = getRank(consecutiveDistribution, consecutiveKey)
  if (consecutiveRank === 1) score += 20 // 1위 패턴
  else if (consecutiveRank === 2) score += 10 // 2위 패턴
  else score -= 15 // 그 외 (너무 드문 패턴)

  // 4. 홀짝 비율 점수
  const oddCount = numbers.filter((n) => n % 2 === 1).length
  const evenCount = 6 - oddCount
  const oddEvenKey = `${oddCount}:${evenCount}` // "3:3", "4:2" 등
  const oddEvenRank = getRank(oddEvenDistribution, oddEvenKey)
  if (oddEvenRank === 1) score += 30 // 1위 (가장 흔한 비율)
  else if (oddEvenRank <= 3) score += 15 // 2-3위
  else if (oddEvenRank === 4) score -= 10 // 4위
  else score -= 20 // 5위 이하

  // 5. 구간별 분포 점수 (1-15, 16-30, 31-45)
  const s1 = numbers.filter((n) => n <= 15).length
  const s2 = numbers.filter((n) => n > 15 && n <= 30).length
  const s3 = numbers.filter((n) => n > 30).length
  const sectionKey = [s1, s2, s3].sort((a, b) => b - a).join(":") // "3:2:1", "4:1:1" 등
  const sectionRank = getRank(sectionDistribution, sectionKey)
  if (sectionRank === 1) score += 45 // 1위 (가장 밸런스 좋은 구간)
  else if (sectionRank <= 3) score += 20 // 2-3위
  else if (sectionRank <= 6) score += 0 // 4-6위 (보통)
  else score -= 20 // 7위 이하 (쏠림)

  // 6. 4쌍둥이 페널티 (밸런스 등급에도 영향)
  const RECENT_THRESHOLD = 156 // 3년
  // const latestDrawNo = winningNumbers[winningNumbers.length - 1].drawNo // (MODIFIED)
  const quadrupletPenalty = getQuadrupletScore(sortedNumbers, quadrupletLastSeen, latestDrawNo, RECENT_THRESHOLD)
  score += quadrupletPenalty // (0, -40, 또는 -150)

  // 7. 최종 점수에 따라 등급 결정
  if (score >= 180) return "최상"
  if (score >= 150) return "상"
  if (score >= 120) return "중상"
  if (score >= 90) return "중"
  if (score >= 60) return "보통"
  if (score >= 20) return "중하"
  return "하"
}

/** (헬퍼) 등급별 UI 색상 반환 */
const getGradeColor = (grade: Grade): string => {
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
/** (헬퍼) 등급별 설명 텍스트 반환 */
const getGradeDescription = (grade: Grade): string => {
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
}
// --- 로직 이동 완료 ---

/**
 * AdvancedAnalysis: AI 추천 및 '쌍둥이' 패턴 분석을 담당하는 메인 컴포넌트
 */
interface AdvancedAnalysisProps {
  userDrawnNumbers: number[] // 사용자가 추첨기/수동으로 뽑은 원본 번호
  numbers: number[] // 현재 분석 중인 번호 (사용자 번호 또는 AI 추천 번호)
  winningNumbers: WinningLottoNumbers[] // (NEW) DB에서 가져온 전체 당첨 번호
  multipleNumbers: MultipleNumberType[] // 'numbers' prop 기준 '쌍둥이' 분석 결과
  similarDraws: SimilarDrawType[] // 'numbers' prop 기준 '유사 패턴' 분석 결과
  winningNumbersCount: number
  getBallColor: (number: number) => string
  onNumbersChange: (numbers: number[]) => void // 분석 대상 번호 변경 콜백
}

export default function AdvancedAnalysis({
                                           userDrawnNumbers,
                                           numbers,
                                           winningNumbers, // (NEW) prop으로 받음
                                           multipleNumbers,
                                           similarDraws,
                                           winningNumbersCount,
                                           getBallColor,
                                           onNumbersChange,
                                         }: AdvancedAnalysisProps) {
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([]) // AI가 추천한 번호
  const [forceRefresh, setForceRefresh] = useState(0)
  const isFirstRender = useRef(true)

  // --- 로직 이동: 시작 ---
  // useLottoAnalytics 훅을 호출하여 모든 통계 데이터를 analyticsData에 저장 (useMemo로 캐시됨)
  const analyticsData = useLottoAnalytics(winningNumbers) // (MODIFIED) prop을 전달
  const [userGrade, setUserGrade] = useState<Grade | null>(null) // 사용자 번호의 등급
  const [showUserAnalysis, setShowUserAnalysis] = useState(true)
  // 'originalUserNumbers'는 사용자가 '추첨' 또는 '수동 선택'으로 생성한 원본 번호를 저장합니다.
  // 이 상태는 AI 추천 번호가 생성되어도 변경되지 않아야 합니다. (버그 수정의 핵심)
  const [originalUserNumbers, setOriginalUserNumbers] = useState<number[]>(userDrawnNumbers)
  const [isAiAnalyzed, setIsAiAnalyzed] = useState(false) // 현재 AI 번호를 분석 중인지 여부
  const [isGenerating, setIsGenerating] = useState(false) // AI 번호 생성 로딩 상태

  useEffect(() => {
    // 첫 렌더링 시 강제 리프레시 (useMemo 초기화 관련 이슈 대응)
    if (isFirstRender.current) {
      isFirstRender.current = false
      setForceRefresh((prev) => prev + 1)
    }
  }, [])

  // [버그 수정]
  // 이 useEffect는 이제 부모로부터 받은 *사용자 원본 번호*(`userDrawnNumbers`)가
  // 변경될 때만 실행됩니다.
  // '현재 분석 중인 번호'(`numbers` prop)가 변경되어도 더 이상 실행되지 않습니다.
  useEffect(() => {
    if (userDrawnNumbers && userDrawnNumbers.length === 6 && analyticsData.latestDrawNo > 0) { // (MODIFIED) analyticsData가 준비되었는지 확인
      // 1. 사용자 원본 번호를 `originalUserNumbers` 상태에 저장합니다.
      setOriginalUserNumbers([...userDrawnNumbers])
      // 2. 사용자 번호의 등급(밸런스)을 계산합니다.
      const sortedUserNumbers = [...userDrawnNumbers].sort((a, b) => a - b)
      setUserGrade(calculateGrade(sortedUserNumbers, analyticsData))
      // 3. 사용자 분석 UI를 표시합니다.
      setShowUserAnalysis(true)
      // 4. AI 분석 플래그를 리셋합니다.
      setIsAiAnalyzed(false)
    } else {
      // 번호가 6개가 아니면 상태 초기화
      setOriginalUserNumbers([])
      setUserGrade(null)
      setShowUserAnalysis(false)
    }
    // 의존성 배열에서 `numbers`를 제거하고 `userDrawnNumbers`를 사용합니다.
  }, [userDrawnNumbers, analyticsData]) // (MODIFIED) analyticsData 추가

  /** "AI 추천 받기" 버튼 클릭 시 호출되는 함수 */
  const generateAIRecommendation = async () => {
    setIsGenerating(true) // 1. 로딩 상태 시작
    // 2. 실제 번호 생성 로직은 자식 컴포넌트(AIRecommendation)에서 실행됩니다.
    // (isGenerating prop이 true로 변경되면 AIRecommendation의 useEffect가 트리거됨)
  }

  /** "당첨 패턴 보기" (사용자 번호 카드) 버튼 클릭 시 호출 */
  const handleAnalyzeUserNumbers = () => {
    if (originalUserNumbers.length === 6) {
      setIsAiAnalyzed(false) // 1. AI 분석 모드 해제
      // 2. 부모 컴포넌트(lotto-analysis)에 분석 대상을 '사용자 원본 번호'로 변경하도록 알림
      onNumbersChange(originalUserNumbers)
    }
  }

  /** (콜백) AIRecommendation 컴포넌트가 번호 생성을 완료하면 호출됨 */
  const handleRecommendationGenerated = (newNumbers: number[]) => {
    setRecommendedNumbers(newNumbers) // 1. 추천받은 번호 상태에 저장 (AI 카드 표시에 사용)
    setIsAiAnalyzed(true) // 2. AI 분석 모드 활성화
    setIsGenerating(false) // 3. 로딩 상태 종료
    // 4. 부모 컴포넌트(lotto-analysis)에 분석 대상을 '새 AI 번호'로 변경하도록 알림
    //    (이로 인해 MultipleNumberAnalysis가 AI 번호 기준으로 업데이트됨)
    onNumbersChange(newNumbers)
  }
  // --- 로직 이동: 종료 ---

  return (
    <div className="space-y-6">
      {/* --- DIV 1: 추첨 번호 (사용자 원본 번호) 카드 --- */}
      <div className="p-4 bg-gray-200 dark:bg-[rgb(36,36,36)] rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-medium text-gray-800 dark:text-gray-200">추첨 번호</h3>
          </div>
        </div>

        {/* 사용자 번호가 6개이고 등급 계산이 완료된 경우 */}
        {showUserAnalysis && originalUserNumbers.length === 6 && userGrade && (
          <div>
            {/* 사용자 번호 등급 표시 */}
            <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 mb-4">
              <div className="flex flex-col mb-3">
                <div className="flex justify-between items-center w-full gap-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                    추첨기에서 선택한 번호의 분석 결과입니다.
                  </p>
                  <div
                    className={`px-3 py-1.5 rounded-lg font-semibold text-sm whitespace-nowrap ${getGradeColor(
                      userGrade,
                    )}`}
                  >
                    {userGrade}
                  </div>
                </div>
                {/* 등급 설명 */}
                <div className="text-xs p-2 bg-white dark:bg-[#464646] rounded-lg text-gray-700 dark:text-gray-200 mt-3">
                  <p className="font-medium mb-1">추첨 번호 등급 안내:</p>
                  <p>
                    • {userGrade}: {getGradeDescription(userGrade)}
                  </p>
                </div>
              </div>
              {/* 사용자 번호 표시 */}
              <AINumberDisplay numbers={originalUserNumbers} />
            </div>
            {/* 버튼 영역 */}
            <div className="mt-3 flex justify-between">
              {/* "당첨 패턴 보기" 버튼 (사용자 번호 기준) */}
              <Button
                onClick={handleAnalyzeUserNumbers}
                variant="outline"
                className="bg-white dark:bg-[#464646] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-1" />당첨 패턴 보기
              </Button>
              {/* "AI 추천 받기" 버튼 */}
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
      </div>

      {/* --- DIV 2: AI 번호 추천 카드 --- */}
      {/* 이 컴포넌트는 AI 번호 생성이 완료될 때까지 렌더링되지 않습니다. (내부 로직) */}
      <AIRecommendation
        analyticsData={analyticsData} // 1. 전체 통계 데이터 전달
        // 2. 헬퍼 함수들 전달
        calculateGrade={calculateGrade}
        getGradeColor={getGradeColor}
        getGradeDescription={getGradeDescription}
        generateCombination={generateCombination}
        getGradeScore={getGradeScore}
        getPairScore={getPairScore}
        getTripletScore={getTripletScore}
        getRecentFrequencyScore={getRecentFrequencyScore}
        getGapScore={getGapScore}
        getQuadrupletScore={getQuadrupletScore}
        winningNumbersSet={analyticsData.winningNumbersSet} // (MODIFIED) analyticsData에서 전달
        latestDrawNo={analyticsData.latestDrawNo} // (NEW) analyticsData에서 전달
        // 3. 콜백 함수 전달
        onRecommendationGenerated={handleRecommendationGenerated} // AI가 번호 생성을 완료했을 때
        onAnalyzeNumbers={onNumbersChange} // AI 카드의 "당첨 패턴 보기" 버튼 클릭 시
        // 4. 로딩 상태 전달
        isGenerating={isGenerating}
      />

      {/* --- DIV 3: 당첨 패턴 통계 (쌍둥이 분석) --- */}
      {/* 이 컴포넌트는 부모(lotto-analysis)로부터 받은 `multipleNumbers`를 표시합니다. */}
      {/* `multipleNumbers`는 `numbers` prop(현재 분석 중인 번호) 기준으로 계산됩니다. */}
      <MultipleNumberAnalysis multipleNumbers={multipleNumbers} getBallColor={getBallColor} />
    </div>
  )
}