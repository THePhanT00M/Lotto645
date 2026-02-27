"use client"

import { useState, useEffect, useMemo } from "react"
import { LottoAnalytics } from './types'
import { Sparkles, SearchCheck, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveLottoResult } from "@/utils/lotto-storage"
import AINumberDisplay from "@/components/lotto-analysis/ai-number-display"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/api-config"
import { supabase } from "@/lib/supabaseClient"
import type { WinningLottoNumbers } from "@/types/lotto"
import { Skeleton } from "@/components/ui/skeleton"

interface AIRecommendationProps {
  analyticsData: LottoAnalytics
  winningNumbersSet: Set<string>
  latestDrawNo: number
  historyData: WinningLottoNumbers[]
  manualNumbers?: number[] | null
  onRecommendationGenerated?: (numbers: number[]) => void
  onAnalyzeNumbers?: (numbers: number[]) => void
  isGenerating: boolean
}

// 가중치에 비례하여 무작위 번호를 추출하는 함수
const weightedRandomChoice = (items: number[], weights: number[]): number => {
  let totalWeight = weights.reduce((acc, val) => acc + val, 0)
  if (totalWeight <= 0) {
    const validItems = items.filter((_, idx) => weights[idx] >= 0)
    return validItems[Math.floor(Math.random() * validItems.length)] || items[0]
  }
  let random = Math.random() * totalWeight
  for (let i = 0; i < items.length; i++) {
    if (weights[i] <= 0) continue
    random -= weights[i]
    if (random <= 0) return items[i]
  }
  return items[items.length - 1]
}

// 방금 전까지 뽑힌 번호들을 바탕으로 앞으로 뽑힐 번호들의 확률을 재계산하는 함수
const getConditionalWeights = (
    selectedNums: Set<number>,
    allNumbers: number[],
    baseWeights: number[],
    comboFreq: Record<string, number>
) => {
  const adjustedWeights = [...baseWeights]

  allNumbers.forEach((num, idx) => {
    // 이미 추첨된 번호가 다시 추첨되지 않도록 해당 번호의 확률은 0으로 만듭니다.
    if (selectedNums.has(num)) {
      adjustedWeights[idx] = 0
      return
    }

    // 현재 번호가 이미 추첨된 번호들과 과거에 얼마나 자주 같이 나왔는지 확인하여 보너스 점수를 부여합니다.
    let associationBonus = 0
    selectedNums.forEach((picked) => {
      const pair = [picked, num].sort((a, b) => a - b)
      const key = `${pair[0]}-${pair[1]}`
      if (comboFreq[key]) {
        associationBonus += comboFreq[key]
      }
    })

    // 동반 출현 횟수에 가중치를 크게 두어 연관된 번호가 더 잘 뽑히게 조정합니다.
    adjustedWeights[idx] += associationBonus * 3
  })

  return adjustedWeights
}

export default function AIRecommendation({
                                           analyticsData,
                                           winningNumbersSet,
                                           latestDrawNo,
                                           historyData,
                                           manualNumbers,
                                           onRecommendationGenerated,
                                           onAnalyzeNumbers,
                                           isGenerating,
                                         }: AIRecommendationProps) {
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  const [savedAiNumbers, setSavedAiNumbers] = useState<number[]>([])
  const [analysisMode, setAnalysisMode] = useState<"recommendation" | "manual">("recommendation")
  const { toast } = useToast()

  // 전체 당첨 데이터를 활용하여 개별 출현 횟수와 조합의 동반 출현 횟수를 파악합니다.
  const analysisEngine = useMemo(() => {
    const num_freq: Record<number, number> = {}
    const combo_freq: Record<string, number> = {}

    // 기본 출현 횟수 초기화
    for (let i = 1; i <= 45; i++) {
      num_freq[i] = 0
    }

    if (historyData && historyData.length > 0) {
      historyData.forEach((draw) => {
        const nums = draw.numbers

        // 개별 출현 횟수 증가
        nums.forEach((n) => {
          num_freq[n] = (num_freq[n] || 0) + 1
        })

        // 함께 등장했던 조합을 찾아 정렬된 문자열 키로 변환하고 조합 출현 횟수를 증가시킵니다.
        for (let i = 0; i < nums.length; i++) {
          for (let j = i + 1; j < nums.length; j++) {
            const pair = [nums[i], nums[j]].sort((a, b) => a - b)
            const key = `${pair[0]}-${pair[1]}`
            combo_freq[key] = (combo_freq[key] || 0) + 1
          }
        }
      })
    }

    return { num_freq, combo_freq }
  }, [historyData])

  // 수동 번호 분석 요청 시 상태를 업데이트합니다.
  useEffect(() => {
    if (manualNumbers && manualNumbers.length === 6) {
      setAnalysisMode("manual")
      setRecommendedNumbers(manualNumbers)
    }
  }, [manualNumbers])

  // 분석된 개별 출현 빈도와 연관 규칙 기반 동적 확률을 사용하여 번호를 추천합니다.
  const generateAIRecommendation = async () => {
    if (!historyData || historyData.length === 0) {
      toast({ title: "데이터 로딩 중", description: "잠시 후 다시 시도해주세요.", variant: "destructive" })
      return
    }

    setAnalysisMode("recommendation")
    setRecommendedNumbers([])
    await new Promise((resolve) => setTimeout(resolve, 10))

    const { num_freq, combo_freq } = analysisEngine
    const numbers = Array.from({ length: 45 }, (_, i) => i + 1)

    // 기본 가중치 추출
    const baseWeights = numbers.map((n) => num_freq[n] || 1)

    const selected = new Set<number>()

    // 첫 번째 번호는 순수하게 과거 출현 횟수가 많은 번호가 유리하게끔 추첨합니다.
    const firstPick = weightedRandomChoice(numbers, baseWeights)
    selected.add(firstPick)

    // 나머지 번호들은 뽑힌 번호와의 동반 출현 빈도를 반영한 새로운 확률표를 매번 생성하여 추첨합니다.
    while (selected.size < 6) {
      const dynamicWeights = getConditionalWeights(selected, numbers, baseWeights, combo_freq)
      const nextPick = weightedRandomChoice(numbers, dynamicWeights)
      selected.add(nextPick)
    }

    // 여섯 개의 번호가 모두 모이면 크기 순서대로 정렬합니다.
    const finalCombination = Array.from(selected).sort((a, b) => a - b)

    setRecommendedNumbers(finalCombination)
    setSavedAiNumbers(finalCombination)

    // 생성된 결과를 DB에 기록합니다. (점수 개념이 삭제되었으므로 score는 제외 또는 null 처리)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`
      await fetch(getApiUrl("/api/log-draw"), {
        method: "POST", headers,
        body: JSON.stringify({ numbers: finalCombination, source: "ai", score: null, userId: session?.user?.id }),
      })
      if (!session) saveLottoResult(finalCombination, true, latestDrawNo + 1)
    } catch (e) { console.error(e) }

    if (onRecommendationGenerated) onRecommendationGenerated(finalCombination)
  }

  // 생성 트리거 발생 시 실행합니다.
  useEffect(() => {
    if (isGenerating) generateAIRecommendation()
  }, [isGenerating])

  // 수동 입력 모드에서 다시 기존 AI 추천 번호로 되돌립니다.
  const handleRestoreAiNumbers = () => {
    if (savedAiNumbers.length === 6) {
      setRecommendedNumbers(savedAiNumbers)
      setAnalysisMode("recommendation")
      if (onAnalyzeNumbers) onAnalyzeNumbers(savedAiNumbers)
    }
  }

  // 생성 중 로딩 상태 표시
  if (isGenerating) {
    return (
        <div className="p-4 rounded-lg border bg-white dark:bg-[rgb(36,36,36)] border-gray-200 dark:border-[rgb(36,36,36)] space-y-5">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-5 h-5 rounded-md" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between gap-3">
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
          <div className="flex justify-center py-6">
            <div className="flex gap-2">
              {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
              ))}
            </div>
          </div>
        </div>
    )
  }

  // 생성된 번호가 없으면 표시하지 않습니다.
  if (recommendedNumbers.length === 0) return null

  const isManual = analysisMode === "manual"

  return (
      <div className="p-4 bg-white dark:bg-[rgb(36,36,36)] rounded-lg border border-gray-200 dark:border-[rgb(36,36,36)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isManual ? (
                <SearchCheck className="w-5 h-5 text-indigo-600 mr-2" />
            ) : (
                <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
            )}
            <h3 className="font-bold text-gray-800 dark:text-gray-200">
              {isManual ? "번호 패턴 분석" : "AI 추천 번호"}
            </h3>
          </div>
        </div>
        <div>
          <div className="mt-2 relative overflow-hidden">
            {!isManual && (
                <div className="absolute bottom-0 right-0 p-4 opacity-5">
                  <Sparkles className="w-30 h-30" />
                </div>
            )}

            <div className="flex flex-col mb-3">
              <div className="flex justify-between items-center w-full gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 flex-1 leading-relaxed">
                  역대 당첨 번호 속에 숨겨진 흐름과 패턴을 AI가 다각도로 분석하여, 이번 주 당신에게 행운을 가져다줄 최적의 번호 조합을 제안합니다.
                </p>
              </div>
            </div>

            <div className="py-2">
              <AINumberDisplay numbers={recommendedNumbers} />
            </div>

            <div className="text-[10px] text-gray-400 text-right">
              * 과거 데이터 기반 예측이며 당첨을 보장하지 않습니다.
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 justify-start">
            {isManual && savedAiNumbers.length === 6 && (
                <Button
                    onClick={handleRestoreAiNumbers}
                    variant="outline"
                    className="bg-white dark:bg-[#363636] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-[#363636] hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  AI 추천 번호 돌아가기
                </Button>
            )}
          </div>
        </div>
      </div>
  )
}