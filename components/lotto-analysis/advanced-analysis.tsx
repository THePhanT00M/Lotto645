"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import AIRecommendation from "./ai-recommendation"
import MultipleNumberAnalysis from "./multiple-number-analysis"
import type { MultipleNumberType, SimilarDrawType } from "./types"

// --- AIRecommendation에서 이동된 로직 ---
import { Sparkles, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { winningNumbers } from "@/data/winning-numbers"
import AINumberDisplay from "@/components/lotto-analysis/ai-number-display"

// --- 1단계: 타입 및 헬퍼 함수 (ai-recommendation.tsx에서 이동) ---
type Grade = "하" | "중하" | "보통" | "중" | "중상" | "상" | "최상"

type FrequencyMap = Map<number, number>
type StringFrequencyMap = Map<string, number>

interface LottoAnalytics {
  numberFrequencies: FrequencyMap
  pairFrequencies: StringFrequencyMap
  tripletFrequencies: StringFrequencyMap
  quadrupletLastSeen: StringFrequencyMap
  recentFrequencies: FrequencyMap
  gapMap: FrequencyMap
  weightedNumberList: number[]
  sumStats: { mean: number; stdDev: number }
  oddEvenDistribution: StringFrequencyMap
  sectionDistribution: StringFrequencyMap
  consecutiveDistribution: StringFrequencyMap
}

const winningNumbersSet = new Set(
  winningNumbers.map((draw) => [...draw.numbers].sort((a, b) => a - b).join("-")),
)

/**
 * data/winning-numbers.ts 데이터를 기반으로 통계 정보를 계산하고 캐시하는 훅
 */
const useLottoAnalytics = (): LottoAnalytics => {
  return useMemo(() => {
    console.log("Lotto Analytics: Caching started...")
    const numberFrequencies: FrequencyMap = new Map()
    const pairFrequencies: StringFrequencyMap = new Map()
    const tripletFrequencies: StringFrequencyMap = new Map()
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
      quadrupletLastSeen,
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

// --- 2단계: AI 추천 로직 (ai-recommendation.tsx에서 이동) ---
const getWeightedRandomNumber = (list: number[]): number => {
  const randomIndex = Math.floor(Math.random() * list.length)
  return list[randomIndex]
}
const generateCombination = (weightedList: number[]): number[] => {
  const numbers = new Set<number>()
  while (numbers.size < 6) {
    numbers.add(getWeightedRandomNumber(weightedList))
  }
  return Array.from(numbers).sort((a, b) => a - b)
}
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
const getRecentFrequencyScore = (numbers: number[], recentMap: FrequencyMap): number => {
  return numbers.reduce((acc, num) => acc + (recentMap.get(num) || 0), 0)
}
const getGapScore = (numbers: number[], gapMap: FrequencyMap): number => {
  return numbers.reduce((acc, num) => acc + (gapMap.get(num) || 0), 0)
}
const getQuadrupletScore = (
  numbers: number[],
  quadrupletLastSeen: StringFrequencyMap,
  latestDrawNo: number,
  recentThreshold: number,
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
              return -150
            } else {
              maxPenalty = Math.min(maxPenalty, -40)
            }
          }
        }
      }
    }
  }
  return maxPenalty
}
const getRank = (distribution: StringFrequencyMap, key: string): number => {
  const sorted = [...distribution.entries()].sort((a, b) => b[1] - a[1])
  const rank = sorted.findIndex((entry) => entry[0] === key)
  return rank === -1 ? 99 : rank + 1
}
const calculateGrade = (numbers: number[], stats: LottoAnalytics): Grade => {
  const {
    sumStats,
    oddEvenDistribution,
    sectionDistribution,
    consecutiveDistribution,
    quadrupletLastSeen,
  } = stats
  const sum = numbers.reduce((acc, num) => acc + num, 0)
  let score = 70
  const sumDiff = Math.abs(sum - sumStats.mean)
  if (sumDiff <= sumStats.stdDev) score += 35
  else if (sumDiff <= sumStats.stdDev * 2) score += 15
  else score -= 20
  const sortedNumbers = [...numbers].sort((a, b) => a - b)
  let consecutiveCount = 0
  for (let i = 0; i < sortedNumbers.length - 1; i++) {
    if (sortedNumbers[i + 1] - sortedNumbers[i] === 1) consecutiveCount++
  }
  const consecutiveKey = `${consecutiveCount}쌍`
  const consecutiveRank = getRank(consecutiveDistribution, consecutiveKey)
  if (consecutiveRank === 1) score += 20
  else if (consecutiveRank === 2) score += 10
  else score -= 15
  const oddCount = numbers.filter((n) => n % 2 === 1).length
  const evenCount = 6 - oddCount
  const oddEvenKey = `${oddCount}:${evenCount}`
  const oddEvenRank = getRank(oddEvenDistribution, oddEvenKey)
  if (oddEvenRank === 1) score += 30
  else if (oddEvenRank <= 3) score += 15
  else if (oddEvenRank === 4) score -= 10
  else score -= 20
  const s1 = numbers.filter((n) => n <= 15).length
  const s2 = numbers.filter((n) => n > 15 && n <= 30).length
  const s3 = numbers.filter((n) => n > 30).length
  const sectionKey = [s1, s2, s3].sort((a, b) => b - a).join(":")
  const sectionRank = getRank(sectionDistribution, sectionKey)
  if (sectionRank === 1) score += 45
  else if (sectionRank <= 3) score += 20
  else if (sectionRank <= 6) score += 0
  else score -= 20
  const RECENT_THRESHOLD = 156
  const latestDrawNo = winningNumbers[winningNumbers.length - 1].drawNo
  const quadrupletPenalty = getQuadrupletScore(sortedNumbers, quadrupletLastSeen, latestDrawNo, RECENT_THRESHOLD)
  score += quadrupletPenalty
  if (score >= 180) return "최상"
  if (score >= 150) return "상"
  if (score >= 120) return "중상"
  if (score >= 90) return "중"
  if (score >= 60) return "보통"
  if (score >= 20) return "중하"
  return "하"
}
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

interface AdvancedAnalysisProps {
  numbers: number[]
  multipleNumbers: MultipleNumberType[]
  similarDraws: SimilarDrawType[]
  winningNumbersCount: number
  getBallColor: (number: number) => string
  onNumbersChange: (numbers: number[]) => void
}

export default function AdvancedAnalysis({
                                           numbers,
                                           multipleNumbers,
                                           similarDraws,
                                           winningNumbersCount,
                                           getBallColor,
                                           onNumbersChange,
                                         }: AdvancedAnalysisProps) {
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  const [forceRefresh, setForceRefresh] = useState(0)
  const isFirstRender = useRef(true)

  // --- 로직 이동: 시작 ---
  const analyticsData = useLottoAnalytics()
  const [userGrade, setUserGrade] = useState<Grade | null>(null)
  const [showUserAnalysis, setShowUserAnalysis] = useState(false)
  const [originalUserNumbers, setOriginalUserNumbers] = useState<number[]>([])
  const [isAiAnalyzed, setIsAiAnalyzed] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false) // AI 생성 로딩 상태

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      setForceRefresh((prev) => prev + 1)
    }
  }, [])

  useEffect(() => {
    if (numbers && numbers.length === 6) {
      if (!isAiAnalyzed) {
        setOriginalUserNumbers([...numbers])
        const sortedUserNumbers = [...numbers].sort((a, b) => a - b)
        setUserGrade(calculateGrade(sortedUserNumbers, analyticsData))
        setShowUserAnalysis(true)
      } else {
        setIsAiAnalyzed(false)
      }
    } else {
      setOriginalUserNumbers([])
      setUserGrade(null)
      setShowUserAnalysis(false)
      setIsAiAnalyzed(false)
    }
  }, [numbers, analyticsData, isAiAnalyzed])

  // AI 추천 생성 로직 (이제 AIRecommendation 컴포넌트에 prop으로 전달됨)
  const generateAIRecommendation = async () => {
    setIsGenerating(true) // 로딩 상태 시작

    // AIRecommendation 컴포넌트가 이 함수를 실행할 때
    // AIRecommendation 컴포넌트 내부에서 로직이 실행되고
    // onRecommendationGenerated 콜백이 호출됩니다.
    // 실제 로직은 AIRecommendation 컴포넌트에 있습니다.
    // 여기서는 로딩 상태만 관리합니다.
  }

  const handleAnalyzeUserNumbers = () => {
    if (originalUserNumbers.length === 6) {
      setIsAiAnalyzed(false)
      onNumbersChange(originalUserNumbers)
    }
  }

  const handleRecommendationGenerated = (newNumbers: number[]) => {
    setRecommendedNumbers(newNumbers)
    setIsAiAnalyzed(true)
    setIsGenerating(false) // 로딩 상태 종료
  }
  // --- 로직 이동: 종료 ---

  return (
    <div className="space-y-6">
      {/* [리팩토링] DIV 1: 추첨 번호 (User Analysis)
        ai-recommendation.tsx에서 가져온 UI
      */}
      <div className="p-4 bg-gray-200 dark:bg-[rgb(36,36,36)] rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-medium text-gray-800 dark:text-gray-200">추첨 번호</h3>
          </div>
        </div>

        {/* [수정] 불필요한 플레이스홀더 UI 삭제 */}
        {showUserAnalysis && originalUserNumbers.length === 6 && userGrade && (
          // A: 사용자 번호가 선택되고 분석된 상태
          <div>
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
            </div>
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
      </div>

      {/* [리팩토링] DIV 2: AI 번호 추천
        이제 이 컴포넌트는 AI 추천 카드만 렌더링합니다.
      */}
      <AIRecommendation
        analyticsData={analyticsData}
        calculateGrade={calculateGrade}
        getGradeColor={getGradeColor}
        getGradeDescription={getGradeDescription}
        // AI 생성에 필요한 헬퍼 함수들 전달
        generateCombination={generateCombination}
        getGradeScore={getGradeScore}
        getPairScore={getPairScore}
        getTripletScore={getTripletScore}
        getRecentFrequencyScore={getRecentFrequencyScore}
        getGapScore={getGapScore}
        getQuadrupletScore={getQuadrupletScore}
        winningNumbersSet={winningNumbersSet}
        // 콜백 함수 전달
        onRecommendationGenerated={handleRecommendationGenerated}
        onAnalyzeNumbers={onNumbersChange} // AI 카드의 "당첨 패턴 보기" 버튼용
        // 로딩 상태 전달
        isGenerating={isGenerating}
      />

      {/* [리팩토링] DIV 3: 당첨 패턴 통계 */}
      <MultipleNumberAnalysis multipleNumbers={multipleNumbers} getBallColor={getBallColor} />
    </div>
  )
}