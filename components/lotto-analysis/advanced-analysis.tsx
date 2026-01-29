"use client"

import { useState, useEffect, useMemo } from "react"
import AIRecommendation from "./ai-recommendation"
import MultipleNumberAnalysis from "./multiple-number-analysis"
import type { MultipleNumberType, SimilarDrawType } from "./types"
import type { WinningLottoNumbers } from "@/types/lotto"
import { Sparkles, BarChart3, MousePointerClick } from "lucide-react"
import { Button } from "@/components/ui/button"

// --- 1단계: 타입 및 통계 훅 ---
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

const useLottoAnalytics = (winningNumbers: WinningLottoNumbers[]): LottoAnalytics => {
  return useMemo(() => {
    const winningNumbersSet = new Set(
        winningNumbers.map((draw) => [...draw.numbers].sort((a, b) => a - b).join("-")),
    )
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
    if (totalDraws === 0) {
      return {
        numberFrequencies, pairFrequencies, tripletFrequencies, quadrupletLastSeen,
        recentFrequencies, gapMap, weightedNumberList, sumStats, oddEvenDistribution,
        sectionDistribution, consecutiveDistribution, latestDrawNumbers: [],
        latestDrawNo: 0, winningNumbersSet: new Set()
      }
    }

    const RECENT_DRAW_COUNT = 260
    const recentDrawsStart = Math.max(0, totalDraws - RECENT_DRAW_COUNT)
    const lastSeen: Map<number, number> = new Map()
    for (let i = 1; i <= 45; i++) lastSeen.set(i, 0)

    winningNumbers.forEach((draw, index) => {
      const drawNumbers = [...draw.numbers].sort((a, b) => a - b)
      const allDrawNumbers = [...draw.numbers, draw.bonusNo]
      for (const num of allDrawNumbers) {
        numberFrequencies.set(num, (numberFrequencies.get(num) || 0) + 1)
        weightedNumberList.push(num)
        lastSeen.set(num, draw.drawNo)
        if (index >= recentDrawsStart) recentFrequencies.set(num, (recentFrequencies.get(num) || 0) + 1)
      }
      const sum = drawNumbers.reduce((a, b) => a + b, 0)
      sumStats.values.push(sum)
      const oddCount = drawNumbers.filter((n) => n % 2 === 1).length
      const oddEvenKey = `${oddCount}:${6 - oddCount}`
      oddEvenDistribution.set(oddEvenKey, (oddEvenDistribution.get(oddEvenKey) || 0) + 1)
      const s1 = drawNumbers.filter((n) => n <= 15).length
      const s2 = drawNumbers.filter((n) => n > 15 && n <= 30).length
      const s3 = drawNumbers.filter((n) => n > 30).length
      const sectionKey = [s1, s2, s3].sort((a, b) => b - a).join(":")
      sectionDistribution.set(sectionKey, (sectionDistribution.get(sectionKey) || 0) + 1)
      let consecutiveCount = 0
      for (let i = 0; i < drawNumbers.length - 1; i++) {
        if (drawNumbers[i + 1] - drawNumbers[i] === 1) consecutiveCount++
      }
      const consecutiveKey = `${consecutiveCount}쌍`
      consecutiveDistribution.set(consecutiveKey, (consecutiveDistribution.get(consecutiveKey) || 0) + 1)
      for (let i = 0; i < drawNumbers.length; i++) {
        for (let j = i + 1; j < drawNumbers.length; j++) {
          pairFrequencies.set(`${drawNumbers[i]}-${drawNumbers[j]}`, (pairFrequencies.get(`${drawNumbers[i]}-${drawNumbers[j]}`) || 0) + 1)
        }
      }
    })
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

    return {
      numberFrequencies, pairFrequencies, tripletFrequencies, quadrupletLastSeen,
      recentFrequencies, gapMap, weightedNumberList, sumStats, oddEvenDistribution,
      sectionDistribution, consecutiveDistribution,
      latestDrawNumbers: [...winningNumbers[totalDraws - 1].numbers, winningNumbers[totalDraws - 1].bonusNo],
      latestDrawNo, winningNumbersSet,
    }
  }, [winningNumbers])
}

// --- 2단계: 메인 컴포넌트 ---
interface AdvancedAnalysisProps {
  userDrawnNumbers: number[]
  numbers: number[]
  winningNumbers: WinningLottoNumbers[]
  generatedStats: FrequencyMap
  multipleNumbers: MultipleNumberType[]
  similarDraws: SimilarDrawType[]
  winningNumbersCount: number
  getBallColor: (number: number) => string
  onNumbersChange: (numbers: number[]) => void
}

export default function AdvancedAnalysis({
                                           userDrawnNumbers,
                                           numbers,
                                           winningNumbers,
                                           generatedStats,
                                           multipleNumbers,
                                           similarDraws,
                                           winningNumbersCount,
                                           getBallColor,
                                           onNumbersChange,
                                         }: AdvancedAnalysisProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [originalUserNumbers, setOriginalUserNumbers] = useState<number[]>(userDrawnNumbers)

  // [신규] 수동 분석할 번호 상태
  const [manualAnalysisNumbers, setManualAnalysisNumbers] = useState<number[] | null>(null)

  const analyticsData = useLottoAnalytics(winningNumbers)

  useEffect(() => {
    if (userDrawnNumbers && userDrawnNumbers.length === 6) {
      setOriginalUserNumbers([...userDrawnNumbers])
    }
  }, [userDrawnNumbers])

  const generateAIRecommendation = async () => {
    setManualAnalysisNumbers(null) // AI 추천 요청 시 수동 분석 상태 초기화
    setIsGenerating(true)
  }

  const handleAnalyzeUserNumbers = () => {
    if (originalUserNumbers.length === 6) {
      // 1. 차트 컴포넌트에 번호 전달
      onNumbersChange(originalUserNumbers)
      // 2. [신규] AI 추천 컴포넌트에 번호 전달 (수동 분석 모드 트리거)
      setManualAnalysisNumbers([...originalUserNumbers])
    }
  }

  const handleRecommendationGenerated = (newNumbers: number[]) => {
    setIsGenerating(false)
    onNumbersChange(newNumbers)
  }

  return (
      <div className="space-y-6">
        {/* --- 상단 액션 카드: 분석 및 추천 --- */}
        <div className="p-4 bg-white dark:bg-[rgb(36,36,36)] rounded-xl border border-gray-200 dark:border-[rgb(36,36,36)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                  번호 분석 및 AI 추천
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                추첨된 번호를 분석하거나 AI의 새로운 추천을 받을 수 있습니다.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                  onClick={handleAnalyzeUserNumbers}
                  variant="outline"
                  disabled={originalUserNumbers.length !== 6}
                  className="flex-1 sm:flex-none bg-white dark:bg-[#363636] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-[#363636] hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                추첨 번호 패턴 분석
              </Button>
              <Button
                  onClick={generateAIRecommendation}
                  disabled={isGenerating}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
              >
                {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      연산 중...
                    </>
                ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI 추천 받기
                    </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* --- AI 추천 및 분석 결과 영역 --- */}
        <AIRecommendation
            analyticsData={analyticsData}
            isGenerating={isGenerating}
            onRecommendationGenerated={handleRecommendationGenerated}
            onAnalyzeNumbers={onNumbersChange}
            latestDrawNo={analyticsData.latestDrawNo}
            winningNumbersSet={analyticsData.winningNumbersSet}
            historyData={winningNumbers}
            manualNumbers={manualAnalysisNumbers} // [중요] 수동 분석 번호 전달
        />

        <MultipleNumberAnalysis
            multipleNumbers={multipleNumbers}
            getBallColor={getBallColor}
        />
      </div>
  )
}