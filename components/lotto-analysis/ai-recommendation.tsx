"use client"

import { useState, useEffect } from "react"
import { Sparkles, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveLottoResult } from "@/utils/lotto-storage"
import AINumberDisplay from "@/components/lotto-analysis/ai-number-display"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/api-config"
import { supabase } from "@/lib/supabaseClient"

// --- 1단계: 타입 및 헬퍼 함수 (상위 컴포넌트에서 Props로 받음) ---
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
  latestDrawNumbers: number[]
  latestDrawNo: number
  winningNumbersSet: Set<string>
}

interface AIRecommendationProps {
  analyticsData: LottoAnalytics
  generatedStats: FrequencyMap
  calculateBalanceScore: (numbers: number[], stats: LottoAnalytics) => number
  scoreToGrade: (score: number) => Grade
  getGradeColor: (grade: Grade) => string
  getGradeDescription: (grade: Grade) => string
  generateCombination: (weightedList: number[]) => number[]
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
  getAiPopularityScore: (numbers: number[], generatedStats: FrequencyMap) => number
  winningNumbersSet: Set<string>
  latestDrawNo: number
  onRecommendationGenerated?: (numbers: number[]) => void
  onAnalyzeNumbers?: (numbers: number[]) => void
  isGenerating: boolean
}

export default function AIRecommendation({
                                           analyticsData,
                                           generatedStats,
                                           calculateBalanceScore,
                                           scoreToGrade,
                                           getGradeColor,
                                           getGradeDescription,
                                           generateCombination,
                                           getPairScore,
                                           getTripletScore,
                                           getRecentFrequencyScore,
                                           getGapScore,
                                           getQuadrupletScore,
                                           getAiPopularityScore,
                                           winningNumbersSet,
                                           latestDrawNo,
                                           onRecommendationGenerated,
                                           onAnalyzeNumbers,
                                           isGenerating,
                                         }: AIRecommendationProps) {
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  const [aiGrade, setAiGrade] = useState<Grade | null>(null)
  const [aiScore, setAiScore] = useState<number | null>(null)
  const { toast } = useToast()

  /**
   * AI 추천 번호 생성 및 *자동 저장* (서버 또는 로컬)
   */
  const generateAIRecommendation = async () => {
    setRecommendedNumbers([])
    setAiGrade(null)
    setAiScore(null)

    await new Promise((resolve) => setTimeout(resolve, 0))

    const finalCombination = await new Promise<number[]>((resolve) => {
      const {
        weightedNumberList,
        pairFrequencies,
        tripletFrequencies,
        quadrupletLastSeen,
        recentFrequencies,
        gapMap,
        latestDrawNumbers,
      } = analyticsData

      const RECENT_THRESHOLD = 156
      const ITERATIONS = 100000
      const TOP_K = 50
      const topCandidates: { combination: number[]; score: number }[] = []

      for (let i = 0; i < ITERATIONS; i++) {
        const currentNumbers = generateCombination(weightedNumberList)
        const combinationKey = currentNumbers.join("-")

        if (winningNumbersSet.has(combinationKey)) {
          continue
        }

        const balanceScore = calculateBalanceScore(currentNumbers, analyticsData)

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
        const carryOverCount = currentNumbers.filter((num) => latestDrawNumbers.includes(num)).length
        let carryOverScore = 0
        if (carryOverCount === 0) carryOverScore = 20
        else if (carryOverCount === 1) carryOverScore = 15
        else if (carryOverCount === 2) carryOverScore = -10
        else carryOverScore = -30

        const aiPopularityScore = getAiPopularityScore(currentNumbers, generatedStats)

        const totalScore =
            balanceScore * 0.08 +
            quadrupletScore * 0.1 +
            aiPopularityScore * 0.1 +
            (pairScore / 150) * 50 * 0.2 +
            (tripletScore / 20) * 50 * 0.15 +
            (recentScore / 30) * 50 * 0.05 +
            (gapScore / 600) * 50 * 0.1 +
            (carryOverScore / 20) * 50 * 0.1

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
        combination = generateCombination(analyticsData.weightedNumberList)
      }

      resolve(combination)
    })

    const finalBalanceScore = calculateBalanceScore(finalCombination, analyticsData)
    const finalGrade = scoreToGrade(finalBalanceScore)

    setRecommendedNumbers(finalCombination)
    setAiGrade(finalGrade)
    setAiScore(finalBalanceScore)

    // --- 자동 저장 로직 (로그인 시 서버, 미로그인 시 로컬) ---
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const targetDrawNo = latestDrawNo + 1;

      // 1. 서버 통계 저장 및 로그인 사용자 히스토리 반영
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      await fetch(getApiUrl("/api/log-draw"), {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          numbers: finalCombination,
          source: "ai",
          score: finalBalanceScore,
          userId: session?.user?.id,
        }),
      })

      // 2. 미로그인 시 로컬 스토리지에 자동 저장
      if (!session) {
        saveLottoResult(finalCombination, true, targetDrawNo);
      }
    } catch (error: any) {
      console.error("자동 저장 중 오류 발생:", error.message)
    }

    if (onRecommendationGenerated) {
      onRecommendationGenerated(finalCombination)
    }
  }

  useEffect(() => {
    if (isGenerating) {
      generateAIRecommendation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating])

  const handleAnalyzeAINumbers = () => {
    if (recommendedNumbers.length === 6 && onAnalyzeNumbers) {
      onAnalyzeNumbers(recommendedNumbers)
    }
  }

  if (recommendedNumbers.length === 0) {
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
                    <p className="font-medium mb-1">
                      추천 등급 안내 (밸런스 점수: {aiScore}점):
                    </p>
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
          <div className="mt-3 flex justify-start">
            <Button
                onClick={handleAnalyzeAINumbers}
                variant="outline"
                className="bg-white dark:bg-[#464646] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              당첨 패턴 보기
            </Button>
          </div>
        </div>
      </div>
  )
}