"use client"

import { useState, useEffect, useMemo } from "react"
import AIRecommendation from "./ai-recommendation"
import MultipleNumberAnalysis from "./multiple-number-analysis"
import type { MultipleNumberType, SimilarDrawType, LottoAnalytics } from "./types"
import type { WinningLottoNumbers } from "@/types/lotto"
import { Sparkles, SearchCheck, MousePointerClick } from "lucide-react"
import { Button } from "@/components/ui/button"

// --- 1단계: 통계 훅 (최적화됨) ---
const useLottoAnalytics = (winningNumbers: WinningLottoNumbers[]): LottoAnalytics => {
  return useMemo(() => {
    const totalDraws = winningNumbers.length

    if (totalDraws === 0) {
      return {
        gapMap: new Map(),
        latestDrawNumbers: [],
        latestDrawNo: 0,
        winningNumbersSet: new Set(),
      }
    }

    const latestDraw = winningNumbers[totalDraws - 1]
    const latestDrawNo = latestDraw.drawNo
    const latestDrawNumbers = [...latestDraw.numbers, latestDraw.bonusNo]

    const winningNumbersSet = new Set(
        winningNumbers.map((draw) => [...draw.numbers].sort((a, b) => a - b).join("-")),
    )

    const lastSeen = new Map<number, number>()
    for (let i = 1; i <= 45; i++) lastSeen.set(i, 0)

    winningNumbers.forEach((draw) => {
      const allDrawNumbers = [...draw.numbers, draw.bonusNo]
      for (const num of allDrawNumbers) {
        lastSeen.set(num, draw.drawNo)
      }
    })

    const gapMap = new Map<number, number>()
    for (let i = 1; i <= 45; i++) {
      gapMap.set(i, latestDrawNo - (lastSeen.get(i) || 0))
    }

    return {
      gapMap,
      latestDrawNumbers,
      latestDrawNo,
      winningNumbersSet,
    }
  }, [winningNumbers])
}

// --- 2단계: 메인 컴포넌트 ---
interface AdvancedAnalysisProps {
  numbers: number[] // 추가됨
  userDrawnNumbers: number[]
  winningNumbers: WinningLottoNumbers[]
  multipleNumbers: MultipleNumberType[]
  similarDraws: SimilarDrawType[] // 추가됨
  winningNumbersCount: number // 추가됨
  getBallColor: (number: number) => string
  onNumbersChange: (numbers: number[]) => void
}

export default function AdvancedAnalysis({
                                           numbers, // 추가됨
                                           userDrawnNumbers,
                                           winningNumbers,
                                           multipleNumbers,
                                           similarDraws, // 추가됨
                                           winningNumbersCount, // 추가됨
                                           getBallColor,
                                           onNumbersChange,
                                         }: AdvancedAnalysisProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [originalUserNumbers, setOriginalUserNumbers] = useState<number[]>(userDrawnNumbers)

  const [manualAnalysisNumbers, setManualAnalysisNumbers] = useState<number[] | null>(null)

  const analyticsData = useLottoAnalytics(winningNumbers)

  useEffect(() => {
    if (userDrawnNumbers && userDrawnNumbers.length === 6) {
      setOriginalUserNumbers([...userDrawnNumbers])
    }
  }, [userDrawnNumbers])

  const generateAIRecommendation = async () => {
    setManualAnalysisNumbers(null)
    setIsGenerating(true)
  }

  const handleAnalyzeUserNumbers = () => {
    if (originalUserNumbers.length === 6) {
      onNumbersChange(originalUserNumbers)
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
                <SearchCheck className="w-4 h-4" />
                추첨 번호 AI 분석
              </Button>
              <Button
                  onClick={generateAIRecommendation}
                  disabled={isGenerating}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
              >
                {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      분석 중...
                    </>
                ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
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
            manualNumbers={manualAnalysisNumbers}
        />

        <MultipleNumberAnalysis
            multipleNumbers={multipleNumbers}
            getBallColor={getBallColor}
            isGenerating={isGenerating}
        />
      </div>
  )
}