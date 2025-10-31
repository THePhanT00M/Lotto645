"use client"

import { useState, useEffect } from "react"
import { Sparkles, Save, Check, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { winningNumbers } from "@/data/winning-numbers" // 전체 당첨 번호 데이터
import { saveLottoResult } from "@/utils/lotto-storage"
import AINumberDisplay from "@/components/lotto-analysis/ai-number-display"

// --- 1단계: 타입 및 헬퍼 함수 (이제 상위에서 props로 받음) ---
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

// --- 3단계: 컴포넌트 구현 ---

interface AIRecommendationProps {
  analyticsData: LottoAnalytics
  calculateGrade: (numbers: number[], stats: LottoAnalytics) => Grade
  getGradeColor: (grade: Grade) => string
  getGradeDescription: (grade: Grade) => string
  // AI 생성 헬퍼
  generateCombination: (weightedList: number[]) => number[]
  getGradeScore: (grade: Grade) => number
  getPairScore: (numbers: number[], pairMap: StringFrequencyMap) => number
  getTripletScore: (numbers: number[], tripletMap: StringFrequencyMap) => number
  getRecentFrequencyScore: (numbers: number[], recentMap: FrequencyMap) => number
  getGapScore: (numbers: number[], gapMap: FrequencyMap) => number
  getQuadrupletScore: (
    numbers: number[],
    quadrupletLastSeen: StringFrequencyMap,
    latestDrawNo: number,
    recentThreshold: number,
  ) => number
  winningNumbersSet: Set<string>
  // 콜백
  onRecommendationGenerated?: (numbers: number[]) => void
  onAnalyzeNumbers?: (numbers: number[]) => void
  isGenerating: boolean // 로딩 상태를 props로 받음
}

export default function AIRecommendation({
                                           analyticsData,
                                           calculateGrade,
                                           getGradeColor,
                                           getGradeDescription,
                                           generateCombination,
                                           getGradeScore,
                                           getPairScore,
                                           getTripletScore,
                                           getRecentFrequencyScore,
                                           getGapScore,
                                           getQuadrupletScore,
                                           winningNumbersSet,
                                           onRecommendationGenerated,
                                           onAnalyzeNumbers,
                                           isGenerating,
                                         }: AIRecommendationProps) {
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  // const [isGenerating, setIsGenerating] = useState(false) // 로딩 상태를 prop으로 받음
  const [isSaved, setIsSaved] = useState(false)
  const [aiGrade, setAiGrade] = useState<Grade | null>(null)

  // userSelectedNumbers 관련 로직 모두 제거

  /**
   * AI 추천 번호 생성 (고급 알고리즘)
   */
  const generateAIRecommendation = async () => {
    // setIsGenerating(true) // 로딩 상태 관리를 부모로 이동
    setIsSaved(false)
    setRecommendedNumbers([])
    setAiGrade(null)

    await new Promise((resolve) => setTimeout(resolve, 0))

    const finalCombination = await new Promise<number[]>((resolve) => {
      const {
        weightedNumberList,
        pairFrequencies,
        tripletFrequencies,
        quadrupletLastSeen,
        recentFrequencies,
        gapMap,
      } = analyticsData

      const RECENT_THRESHOLD = 156 // 3년
      const latestDrawNo = winningNumbers[winningNumbers.length - 1].drawNo

      const ITERATIONS = 100000
      const TOP_K = 50
      const topCandidates: { combination: number[]; score: number }[] = []

      for (let i = 0; i < ITERATIONS; i++) {
        const currentNumbers = generateCombination(weightedNumberList)
        const combinationKey = currentNumbers.join("-")
        if (winningNumbersSet.has(combinationKey)) {
          continue
        }

        const grade = calculateGrade(currentNumbers, analyticsData)
        const gradeScore = getGradeScore(grade)
        const pairScore = getPairScore(currentNumbers, pairFrequencies)
        const tripletScore = getTripletScore(currentNumbers, tripletFrequencies)
        const quadrupletScore = getQuadrupletScore(
          currentNumbers,
          quadrupletLastSeen,
          latestDrawNo,
          RECENT_THRESHOLD,
        )
        const recentScore = getRecentFrequencyScore(currentNumbers, recentFrequencies)
        const gapScore = getGapScore(currentNumbers, gapMap)

        const totalScore =
          gradeScore * 0.2 +
          quadrupletScore * 0.1 +
          (pairScore / 150) * 50 * 0.35 +
          (tripletScore / 20) * 50 * 0.2 +
          (recentScore / 30) * 50 * 0.05 +
          (gapScore / 600) * 50 * 0.1

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

      let combination: number[]
      if (topCandidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * topCandidates.length)
        combination = topCandidates[randomIndex].combination
      } else {
        combination = generateCombination(weightedNumberList)
      }

      resolve(combination)
    })

    const finalGrade = calculateGrade(finalCombination, analyticsData)
    setRecommendedNumbers(finalCombination)
    setAiGrade(finalGrade)

    if (onRecommendationGenerated) {
      onRecommendationGenerated(finalCombination)
    }

    // setIsGenerating(false) // 로딩 상태 관리를 부모로 이동
  }

  // 'AI 추천 받기' 버튼이 상위로 이동했으므로,
  // 이 컴포넌트가 렌더링 될 때 isGenerating prop을 확인하여
  // 추천 번호 생성을 트리거합니다.
  useEffect(() => {
    if (isGenerating) {
      generateAIRecommendation()
    }
    // isGenerating이 true가 될 때만 이 함수를 실행합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating])

  const handleSaveToHistory = () => {
    if (recommendedNumbers.length > 0) {
      saveLottoResult(recommendedNumbers, true)
      setIsSaved(true)
    }
  }

  const handleAnalyzeAINumbers = () => {
    if (recommendedNumbers.length === 6 && onAnalyzeNumbers) {
      onAnalyzeNumbers(recommendedNumbers)
    }
  }

  // '추첨 번호' 카드 JSX 및 플레이스홀더 JSX 제거됨

  // AI 추천 번호가 있을 때만 이 카드를 렌더링합니다.
  if (recommendedNumbers.length === 0) {
    // 상위 컴포넌트의 '추첨 번호' 카드에 있는 플레이스홀더가
    // 이 컴포넌트가 비어있을 때 표시되므로 여기서는 null을 반환합니다.
    return null
  }

  return (
    <div className="p-4 bg-gray-200 dark:bg-[rgb(36,36,36)] rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-gray-800 dark:text-gray-200">AI 번호 추천</h3>
        </div>
      </div>
      <div>
        <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 mt-4">
          <div className="flex flex-col mb-3">
            <div className="flex justify-between items-center w-full gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                과거 당첨 패턴과 함께 등장한 번호 분석을 기반으로 생성된 추천 번호입니다.
              </p>
              {aiGrade && (
                <div
                  className={`px-3 py-1.5 rounded-lg font-semibold text-sm whitespace-nowrap ${getGradeColor(
                    aiGrade,
                  )}`}
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

          <div className="mt-4 flex flex-col items-center gap-3 md:flex-row md:justify-between md:items-center md:gap-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              * 이 추천은 과거 데이터 패턴을 기반으로 하며, 당첨을 보장하지 않습니다.
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-between">
          <Button
            onClick={handleAnalyzeAINumbers}
            variant="outline"
            className="bg-white dark:bg-[#464646] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            당첨 패턴 보기
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
              AI 번호 저장
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}