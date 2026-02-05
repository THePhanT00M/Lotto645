"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabaseClient"
import AIRecommendation from "./ai-recommendation"
import MultipleNumberAnalysis from "./multiple-number-analysis"
import type { MultipleNumberType, SimilarDrawType, LottoAnalytics } from "./types"
import type { WinningLottoNumbers } from "@/types/lotto"
import { Sparkles, SearchCheck, MousePointerClick, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateFilteredNumbers } from "@/utils/lotto-filtering"
import { useToast } from "@/hooks/use-toast"

// 통계 데이터 계산 훅
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
  // 상태 관리
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingV2, setIsGeneratingV2] = useState(false)
  const [isV2Result, setIsV2Result] = useState(false)

  // V2 로깅 여부 제어 플래그
  const [shouldLogV2, setShouldLogV2] = useState(false)

  const [originalUserNumbers, setOriginalUserNumbers] = useState<number[]>(userDrawnNumbers)
  const [manualAnalysisNumbers, setManualAnalysisNumbers] = useState<number[] | null>(null)

  // V2 추천 번호 백업 상태
  const [savedV2Numbers, setSavedV2Numbers] = useState<number[] | null>(null)

  // 사용자 레벨 상태
  const [userLevel, setUserLevel] = useState(0)

  const { toast } = useToast()
  const analyticsData = useLottoAnalytics(winningNumbers)

  useEffect(() => {
    if (userDrawnNumbers && userDrawnNumbers.length === 6) {
      setOriginalUserNumbers([...userDrawnNumbers])
    }
  }, [userDrawnNumbers])

  // 사용자 레벨 조회
  useEffect(() => {
    const fetchUserLevel = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
            .from("profiles")
            .select("level")
            .eq("id", user.id)
            .single()

        if (data) {
          setUserLevel(data.level)
        }
      }
    }
    fetchUserLevel()
  }, [])

  // 기존 AI 추천 핸들러
  const generateAIRecommendation = async () => {
    setManualAnalysisNumbers(null)
    setIsV2Result(false)
    setShouldLogV2(false)
    setIsGenerating(true)
  }

  // AI 추천 V2 생성 핸들러 (신규 생성)
  const handleGenerateV2Numbers = () => {
    setIsGeneratingV2(true)

    setTimeout(() => {
      const v2Numbers = generateFilteredNumbers(winningNumbers)

      if (v2Numbers) {
        setShouldLogV2(true) // 신규 생성 시에만 로깅
        setIsV2Result(true)
        onNumbersChange(v2Numbers)
        setManualAnalysisNumbers(v2Numbers)
        setSavedV2Numbers(v2Numbers)
        toast({
          title: "AI 추천 V2 완료",
          description: "3/4/5쌍둥이(2등 포함) 제외 조건이 적용된 조합입니다.",
        })
      } else {
        toast({
          title: "생성 실패",
          description: "조건을 만족하는 조합을 찾지 못했습니다.",
          variant: "destructive"
        })
      }
      setIsGeneratingV2(false)
    }, 100)
  }

  // AI 추천 V2 복원 핸들러 (저장 안 함)
  const handleRestoreV2Numbers = () => {
    if (savedV2Numbers) {
      setShouldLogV2(false) // 복원 시 로깅 방지
      setIsV2Result(true)
      onNumbersChange(savedV2Numbers)
      setManualAnalysisNumbers(savedV2Numbers)
      toast({
        title: "AI 추천 V2 복원",
        description: "이전에 생성된 V2 번호를 다시 불러왔습니다.",
      })
    }
  }

  // 사용자 번호 분석
  const handleAnalyzeUserNumbers = () => {
    if (originalUserNumbers.length === 6) {
      setIsV2Result(false)
      setShouldLogV2(false)
      onNumbersChange(originalUserNumbers)
      setManualAnalysisNumbers([...originalUserNumbers])
    }
  }

  // AI 모드로 복귀 핸들러 (부모 상태 초기화)
  // 기존 AI 추천으로 돌아갈 때 V2/매뉴얼 모드 상태를 해제하여
  // "AI 추천 V2 돌아가기" 버튼이 다시 보일 수 있도록 함
  const handleRestoreAiMode = (numbers: number[]) => {
    setIsV2Result(false)
    setManualAnalysisNumbers(null)
    onNumbersChange(numbers)
  }

  const handleRecommendationGenerated = (newNumbers: number[]) => {
    setIsGenerating(false)
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
              <Button
                  onClick={handleAnalyzeUserNumbers}
                  variant="outline"
                  disabled={originalUserNumbers.length !== 6}
                  className="flex-1 sm:flex-none bg-white dark:bg-[#363636] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-[#363636] hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <SearchCheck className="w-4 h-4 mr-2" />
                추첨 번호 AI 분석
              </Button>

              <Button
                  onClick={generateAIRecommendation}
                  disabled={isGenerating || isGeneratingV2}
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

              {userLevel >= 2 && (
                  <Button
                      onClick={handleGenerateV2Numbers}
                      disabled={isGenerating || isGeneratingV2}
                      className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                  >
                    {isGeneratingV2 ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                          생성 중...
                        </>
                    ) : (
                        <>
                          <Filter className="w-4 h-4 mr-2" />
                          AI 추천 V2
                        </>
                    )}
                  </Button>
              )}
            </div>
          </div>
        </div>

        <AIRecommendation
            analyticsData={analyticsData}
            isGenerating={isGenerating}
            onRecommendationGenerated={handleRecommendationGenerated}
            onAnalyzeNumbers={handleRestoreAiMode} // 수정: 상태 초기화를 위한 핸들러 전달
            latestDrawNo={analyticsData.latestDrawNo}
            winningNumbersSet={analyticsData.winningNumbersSet}
            historyData={winningNumbers}
            manualNumbers={manualAnalysisNumbers}
            isFilterResult={isV2Result}
            shouldLogV2={shouldLogV2}
            savedFilteredNumbers={savedV2Numbers}
            onRestoreFilteredNumbers={handleRestoreV2Numbers}
        />

        <MultipleNumberAnalysis
            multipleNumbers={multipleNumbers}
            getBallColor={getBallColor}
            isGenerating={isGenerating}
        />
      </div>
  )
}