"use client"

import { useState, useEffect, useMemo } from "react"
import AIRecommendation from "./ai-recommendation"
import MultipleNumberAnalysis from "./multiple-number-analysis"
import type { MultipleNumberType, SimilarDrawType, LottoAnalytics } from "./types"
import type { WinningLottoNumbers } from "@/types/lotto"
import { Sparkles, SearchCheck, MousePointerClick, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

// 로또 데이터를 분석하여 최근 회차 정보 및 번호 출현 간격을 계산합니다.
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
    const latestDrawNumbers = [...latestDraw.numbers]

    const winningNumbersSet = new Set(
        winningNumbers.map((draw) => [...draw.numbers].sort((a, b) => a - b).join("-")),
    )

    const lastSeen = new Map<number, number>()
    for (let i = 1; i <= 45; i++) lastSeen.set(i, 0)

    winningNumbers.forEach((draw) => {
      const allDrawNumbers = [...draw.numbers]
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

interface AdvancedAnalysisProps {
  numbers: number[]
  userDrawnNumbers: number[]
  winningNumbers: WinningLottoNumbers[]
  multipleNumbers: MultipleNumberType[]
  similarDraws: SimilarDrawType[]
  winningNumbersCount: number
  getBallColor: (number: number) => string
  onNumbersChange: (numbers: number[]) => void
}

export default function AdvancedAnalysis({
                                           numbers,
                                           userDrawnNumbers,
                                           winningNumbers,
                                           multipleNumbers,
                                           similarDraws,
                                           winningNumbersCount,
                                           getBallColor,
                                           onNumbersChange,
                                         }: AdvancedAnalysisProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [originalUserNumbers, setOriginalUserNumbers] = useState<number[]>(userDrawnNumbers)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [showAiArea, setShowAiArea] = useState(false)
  const [aiNumbers, setAiNumbers] = useState<number[]>([])

  const { toast } = useToast()
  const analyticsData = useLottoAnalytics(winningNumbers)

  // 사용자가 뽑은 초기 번호를 저장합니다.
  useEffect(() => {
    if (userDrawnNumbers && userDrawnNumbers.length === 6) {
      setOriginalUserNumbers([...userDrawnNumbers])
    }
  }, [userDrawnNumbers])

  // AI 추천 번호 생성을 시작하며 AI 영역을 노출합니다.
  const generateAIRecommendation = async () => {
    setIsGenerating(true)
    setShowAiArea(true)
    setHasGenerated(true)
  }

  // 추첨 번호 분석 버튼 클릭 시 AI 영역을 숨기고 원래 뽑은 번호로 변경합니다.
  const handleAnalyzeUserNumbers = () => {
    if (originalUserNumbers.length === 6) {
      setShowAiArea(false)
      onNumbersChange(originalUserNumbers)
    }
  }

  // AI 추천 번호 돌아가기 버튼 클릭 시 AI 영역을 다시 노출하고 번호를 복구합니다.
  const handleRestoreAiMode = () => {
    setShowAiArea(true)
    if (aiNumbers.length === 6) {
      onNumbersChange(aiNumbers)
    }
  }

  // AI 추천이 완료되면 생성된 번호를 저장하고 상위 컴포넌트에 전달합니다.
  const handleRecommendationGenerated = (newNumbers: number[]) => {
    setIsGenerating(false)
    setAiNumbers(newNumbers)
    onNumbersChange(newNumbers)
  }

  return (
      <div className="space-y-6">
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
              {/* AI 추천 버튼을 누른 이력이 있을 때만 분석 및 돌아가기 전환 버튼을 노출합니다. */}
              {hasGenerated && (
                  showAiArea ? (
                      <Button
                          onClick={handleAnalyzeUserNumbers}
                          variant="outline"
                          disabled={originalUserNumbers.length !== 6 || isGenerating}
                          className="flex-1 sm:flex-none bg-white dark:bg-[#363636] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-[#363636] hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                      >
                        <SearchCheck className="w-4 h-4 mr-2" />
                        추첨 번호 분석
                      </Button>
                  ) : (
                      <Button
                          onClick={handleRestoreAiMode}
                          variant="outline"
                          className="flex-1 sm:flex-none bg-white dark:bg-[#363636] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-[#363636] hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        AI 추천 번호 돌아가기
                      </Button>
                  )
              )}

              <Button
                  onClick={generateAIRecommendation}
                  disabled={isGenerating}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
              >
                {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      분석 중...
                    </>
                ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI 추천
                    </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 추첨 번호 분석 버튼을 누를 때 컴포넌트를 언마운트 시키지 않고 CSS로 숨겨 상태를 유지합니다. */}
        <div className={showAiArea ? "block" : "hidden"}>
          <AIRecommendation
              analyticsData={analyticsData}
              isGenerating={isGenerating}
              onRecommendationGenerated={handleRecommendationGenerated}
              latestDrawNo={analyticsData.latestDrawNo}
              winningNumbersSet={analyticsData.winningNumbersSet}
              historyData={winningNumbers}
          />
        </div>

        <MultipleNumberAnalysis
            multipleNumbers={multipleNumbers}
            getBallColor={getBallColor}
            isGenerating={isGenerating}
        />
      </div>
  )
}