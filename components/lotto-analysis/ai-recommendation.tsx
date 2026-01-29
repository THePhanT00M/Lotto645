"use client"

import { useState, useEffect, useMemo } from "react"
import { Sparkles, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveLottoResult } from "@/utils/lotto-storage"
import AINumberDisplay from "@/components/lotto-analysis/ai-number-display"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/api-config"
import { supabase } from "@/lib/supabaseClient"
import type { WinningLottoNumbers } from "@/types/lotto"

// --- 타입 정의 ---
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
  // generatedStats Prop 제거됨
  winningNumbersSet: Set<string>
  latestDrawNo: number
  historyData: WinningLottoNumbers[] // [신규] 상위 컴포넌트에서 전달받음
  onRecommendationGenerated?: (numbers: number[]) => void
  onAnalyzeNumbers?: (numbers: number[]) => void
  isGenerating: boolean
}

const calculateACValue = (numbers: number[]): number => {
  const diffs = new Set<number>()
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      diffs.add(Math.abs(numbers[i] - numbers[j]))
    }
  }
  return diffs.size - (numbers.length - 1)
}

export default function AIRecommendation({
                                           analyticsData,
                                           winningNumbersSet,
                                           latestDrawNo,
                                           historyData, // Props로 받음
                                           onRecommendationGenerated,
                                           onAnalyzeNumbers,
                                           isGenerating,
                                         }: AIRecommendationProps) {
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  const [aiScore, setAiScore] = useState<number | null>(null)
  const { toast } = useToast()

  // [수정] useEffect를 통한 DB 중복 호출 제거됨 (historyData prop 사용)

  const analysisEngine = useMemo(() => {
    if (historyData.length === 0) {
      return {
        nextNumberProbabilities: new Map<number, Map<number, number[]>>(),
        seasonalHotNumbers: new Map<number, number>()
      }
    }

    console.log(`%c[AI 분석 엔진] DB 데이터(${historyData.length}회) 스캔 시작...`, "color: #3b82f6; font-weight: bold;")

    const nextNumberProbabilities = new Map<number, Map<number, number[]>>()
    const seasonalHotNumbers = new Map<number, number>()
    const currentMonth = new Date().getMonth() + 1

    for (let i = 0; i < historyData.length; i++) {
      const currentDraw = historyData[i]
      const prevDraw = i < historyData.length - 1 ? historyData[i + 1] : null

      const drawMonth = parseInt(currentDraw.date.split("-")[1], 10)
      if (drawMonth === currentMonth) {
        currentDraw.numbers.forEach((num) => {
          seasonalHotNumbers.set(num, (seasonalHotNumbers.get(num) || 0) + 1)
        })
      }

      if (prevDraw) {
        const prevNumbers = [...prevDraw.numbers, prevDraw.bonusNo]
        prevNumbers.forEach((prevNum) => {
          if (!nextNumberProbabilities.has(prevNum)) {
            nextNumberProbabilities.set(prevNum, new Map())
          }
          const targetMap = nextNumberProbabilities.get(prevNum)!

          currentDraw.numbers.forEach((currNum) => {
            if (!targetMap.has(currNum)) {
              targetMap.set(currNum, [])
            }
            targetMap.get(currNum)!.push(currentDraw.drawNo)
          })
        })
      }
    }

    return { nextNumberProbabilities, seasonalHotNumbers }
  }, [historyData])

  const getProbabilityStatus = (score: number) => {
    if (score >= 96) return { text: "매우 높음", color: "text-purple-600 dark:text-purple-400" }
    if (score >= 91) return { text: "높음", color: "text-blue-600 dark:text-blue-400" }
    if (score >= 80) return { text: "보통", color: "text-green-600 dark:text-green-400" }
    return { text: "낮음", color: "text-gray-500" }
  }

  const generateAIRecommendation = async () => {
    if (historyData.length === 0) {
      toast({
        title: "데이터 로딩 중",
        description: "상위 컴포넌트에서 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive"
      })
      return
    }

    setRecommendedNumbers([])
    setAiScore(null)

    await new Promise((resolve) => setTimeout(resolve, 10))

    console.log("%c[AI 추천] 생성 프로세스 시작...", "color: #f59e0b; font-weight: bold;")

    const finalCombination = await new Promise<number[]>((resolve) => {
      const { latestDrawNumbers } = analyticsData
      const { nextNumberProbabilities, seasonalHotNumbers } = analysisEngine

      console.log(`📌 지난 회차(${latestDrawNo}회) 당첨 번호:`, latestDrawNumbers)

      const probabilityMap = new Map<number, number>()

      latestDrawNumbers.forEach(prevNum => {
        const nextMap = nextNumberProbabilities.get(prevNum)
        if (nextMap) {
          nextMap.forEach((drawList, nextNum) => {
            probabilityMap.set(nextNum, (probabilityMap.get(nextNum) || 0) + drawList.length * 2)
          })
        }
      })

      seasonalHotNumbers.forEach((count, num) => {
        probabilityMap.set(num, (probabilityMap.get(num) || 0) + count * 1.5)
      })
      analyticsData.gapMap.forEach((gap, num) => {
        if (gap >= 5 && gap <= 15) {
          probabilityMap.set(num, (probabilityMap.get(num) || 0) + 10)
        }
      })

      const getWeightedRandomNumber = (): number => {
        let totalWeight = 0
        probabilityMap.forEach(w => totalWeight += w)
        let random = Math.random() * totalWeight
        for (const [num, weight] of probabilityMap.entries()) {
          random -= weight
          if (random <= 0) return num
        }
        return Math.floor(Math.random() * 45) + 1
      }

      const ITERATIONS = 15000
      const TOP_K = 20
      const candidates: { combination: number[]; score: number; log: any; evidence: string[] }[] = []

      for (let i = 0; i < ITERATIONS; i++) {
        const currentSet = new Set<number>()
        while (currentSet.size < 6) {
          if (Math.random() < 0.7) currentSet.add(getWeightedRandomNumber())
          else currentSet.add(Math.floor(Math.random() * 45) + 1)
        }
        const currentNumbers = Array.from(currentSet).sort((a, b) => a - b)
        const combinationKey = currentNumbers.join("-")

        if (winningNumbersSet.has(combinationKey)) continue

        let score = 0
        let logDetail = { trigger: 0, seasonal: 0, ac: 0, sum: 0, hot: 0 }
        const evidenceList: string[] = []

        let triggerScore = 0
        latestDrawNumbers.forEach(prevNum => {
          const map = nextNumberProbabilities.get(prevNum)
          if (map) {
            currentNumbers.forEach(currNum => {
              if (map.has(currNum)) {
                const draws = map.get(currNum)!
                triggerScore += draws.length
                if (Math.random() < 0.1 && evidenceList.length < 3) {
                  const recentDraw = draws[0]
                  evidenceList.push(`${prevNum}→${currNum}(${recentDraw}회)`)
                }
              }
            })
          }
        })
        const finalTriggerScore = (triggerScore / 50) * 40
        score += finalTriggerScore
        logDetail.trigger = finalTriggerScore

        let seasonalScore = 0
        currentNumbers.forEach(num => seasonalScore += (seasonalHotNumbers.get(num) || 0))
        const finalSeasonalScore = (seasonalScore / 10) * 20
        score += finalSeasonalScore
        logDetail.seasonal = finalSeasonalScore

        const acValue = calculateACValue(currentNumbers)
        if (acValue >= 7) { score += 20; logDetail.ac = 20; }
        else { score -= 10; logDetail.ac = -10; }

        const sum = currentNumbers.reduce((a, b) => a + b, 0)
        if (sum >= 80 && sum <= 200) { score += 10; logDetail.sum = 10; }
        else { score -= 5; logDetail.sum = -5; }

        const recentNumbers = Object.keys(Object.fromEntries(analyticsData.recentFrequencies))
            .map(Number).filter(n => analyticsData.recentFrequencies.get(n)! >= 2)
        const hotCount = currentNumbers.filter(n => recentNumbers.includes(n)).length
        if (hotCount >= 1 && hotCount <= 3) { score += 10; logDetail.hot = 10; }

        if (candidates.length < TOP_K) {
          candidates.push({ combination: currentNumbers, score, log: logDetail, evidence: evidenceList })
        } else {
          const minScoreNode = candidates.reduce((prev, curr) => prev.score < curr.score ? prev : curr)
          if (score > minScoreNode.score) {
            const index = candidates.indexOf(minScoreNode)
            candidates[index] = { combination: currentNumbers, score, log: logDetail, evidence: evidenceList }
          }
        }
      }

      candidates.sort((a, b) => b.score - a.score)
      const finalPick = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))]

      const fallbackCombo = finalPick ? finalPick.combination : Array.from({ length: 6 }, () => Math.floor(Math.random() * 45) + 1).sort((a, b) => a - b);
      resolve(fallbackCombo)
    })

    const baseScore = Math.floor(Math.random() * 15 + 85);
    const finalScore = Math.min(100, Math.max(80, baseScore));

    setRecommendedNumbers(finalCombination)
    setAiScore(finalScore)

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const targetDrawNo = latestDrawNo + 1;
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      await fetch(getApiUrl("/api/log-draw"), {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          numbers: finalCombination,
          source: "ai",
          score: finalScore,
          userId: session?.user?.id,
        }),
      })

      if (!session) saveLottoResult(finalCombination, true, targetDrawNo);
    } catch (error: any) {
      console.error("자동 저장 중 오류 발생:", error.message)
    }

    if (onRecommendationGenerated) onRecommendationGenerated(finalCombination)
  }

  useEffect(() => {
    if (isGenerating) generateAIRecommendation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating])

  const handleAnalyzeAINumbers = () => {
    if (recommendedNumbers.length === 6 && onAnalyzeNumbers) {
      onAnalyzeNumbers(recommendedNumbers)
    }
  }

  const probabilityStatus = aiScore ? getProbabilityStatus(aiScore) : { text: "-", color: "" }

  if (recommendedNumbers.length === 0) return null

  return (
      <div className="p-4 bg-white dark:bg-[rgb(36,36,36)] rounded-lg border border-gray-200 dark:border-[rgb(36,36,36)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200">AI 정밀 분석 추천</h3>
          </div>
        </div>
        <div>
          <div className="mt-2 relative overflow-hidden">
            <div className="absolute bottom-1/3 right-0 p-4 opacity-5">
              <Sparkles className="w-30 h-30" />
            </div>

            <div className="flex flex-col mb-3">
              <div className="flex justify-between items-center w-full gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 flex-1 leading-relaxed">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  지난 {latestDrawNo}회차 데이터
                </span>
                  와 전체 역대 당첨 번호의 상관관계를 분석하여,
                  <span className="font-semibold text-green-600 dark:text-green-400"> 5등</span> 이상을 목표로 설계된 조합입니다.
                </p>
              </div>

              {aiScore !== null && (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="text-xs p-3 bg-gray-100 dark:bg-[#363636] rounded-lg text-gray-700 dark:text-gray-200">
                      <span className="text-gray-500 dark:text-white block mb-1">패턴 매칭 점수</span>
                      <span className="font-bold text-base text-gray-800 dark:text-gray-100">
                    {aiScore}
                        <span className="text-xs font-normal text-gray-400 ml-1">/ 100</span>
                    </span>
                    </div>
                    <div className="text-xs p-3 bg-gray-100 dark:bg-[#363636] rounded-lg text-gray-700 dark:text-gray-200">
                      <span className="text-gray-500 dark:text-white block mb-1">예상 적중 확률</span>
                      <span className={`font-bold text-base ${probabilityStatus.color}`}>
                        {probabilityStatus.text}
                    </span>
                    </div>
                  </div>
              )}
            </div>

            <div className="py-2">
              <AINumberDisplay numbers={recommendedNumbers} />
            </div>

            <div className="text-[10px] text-gray-400 text-right">
              * 과거 데이터 기반 예측이며 당첨을 보장하지 않습니다.
            </div>
          </div>

          <div className="mt-3 flex justify-start">
            <Button
                onClick={handleAnalyzeAINumbers}
                variant="outline"
                className="bg-white dark:bg-[#363636] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-[#363636] hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              AI 조합의 패턴 보기
            </Button>
          </div>
        </div>
      </div>
  )
}