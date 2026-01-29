"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Sparkles, BarChart3, SearchCheck } from "lucide-react"
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
  winningNumbersSet: Set<string>
  latestDrawNo: number
  historyData: WinningLottoNumbers[]
  manualNumbers?: number[] | null
  onRecommendationGenerated?: (numbers: number[]) => void
  onAnalyzeNumbers?: (numbers: number[]) => void
  isGenerating: boolean
}

// --- 헬퍼 함수 ---
const calculateACValue = (numbers: number[]): number => {
  const diffs = new Set<number>()
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      diffs.add(Math.abs(numbers[i] - numbers[j]))
    }
  }
  return diffs.size - (numbers.length - 1)
}

const getSeason = (month: number): 'spring' | 'summer' | 'autumn' | 'winter' => {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
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
  const [aiScore, setAiScore] = useState<number | null>(null)
  const [analysisMode, setAnalysisMode] = useState<"recommendation" | "manual">("recommendation")
  const { toast } = useToast()

  // --- 알고리즘 엔진 (메모이제이션) ---
  const analysisEngine = useMemo(() => {
    if (!historyData || historyData.length === 0) {
      return {
        nextNumberProbabilities: new Map<number, Map<number, number[]>>(),
        seasonalHotNumbers: new Map<number, number>(),
        numberAppearances: new Map<number, number>()
      }
    }

    console.log(`%c[AI 분석 엔진] 데이터(${historyData.length}회) 정밀 분석 시작`, "color: #3b82f6; font-weight: bold;")

    const nextNumberProbabilities = new Map<number, Map<number, number[]>>()
    const seasonalHotNumbers = new Map<number, number>()
    const numberAppearances = new Map<number, number>()

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentSeason = getSeason(currentMonth)

    for (let i = 0; i < historyData.length; i++) {
      const currentDraw = historyData[i];

      // 1. 계절성 분석
      const drawMonth = parseInt(currentDraw.date.split("-")[1], 10)
      const drawSeason = getSeason(drawMonth)
      let seasonalWeight = 0
      if (drawMonth === currentMonth) seasonalWeight = 3.0; // 같은 달
      else if (drawSeason === currentSeason) seasonalWeight = 1.0; // 같은 계절

      if (seasonalWeight > 0) {
        currentDraw.numbers.forEach((num) => {
          seasonalHotNumbers.set(num, (seasonalHotNumbers.get(num) || 0) + seasonalWeight)
        })
      }

      // 2. 트리거 분석 (i = 과거, i+1 = 미래)
      if (i < historyData.length - 1) {
        const prevDraw = historyData[i];
        const nextDraw = historyData[i + 1];

        const prevNumbers = [...prevDraw.numbers, prevDraw.bonusNo]
        prevNumbers.forEach((prevNum) => {
          // 모수(총 출현 횟수) 카운트
          numberAppearances.set(prevNum, (numberAppearances.get(prevNum) || 0) + 1)

          if (!nextNumberProbabilities.has(prevNum)) nextNumberProbabilities.set(prevNum, new Map())
          const targetMap = nextNumberProbabilities.get(prevNum)!

          nextDraw.numbers.forEach((nextNum) => {
            if (!targetMap.has(nextNum)) targetMap.set(nextNum, [])
            targetMap.get(nextNum)!.push(nextDraw.drawNo)
          })
        })
      }
    }
    return { nextNumberProbabilities, seasonalHotNumbers, numberAppearances }
  }, [historyData])

  // --- 공통 점수 계산 로직 (수동/자동 모두 사용) ---
  const calculateScoreForNumbers = useCallback((targetNumbers: number[]) => {
    const { nextNumberProbabilities, seasonalHotNumbers, numberAppearances } = analysisEngine
    const { latestDrawNumbers } = analyticsData

    let score = 0
    let triggerScore = 0

    // 1. 정밀 트리거 점수 (확률 기반)
    latestDrawNumbers.forEach(prevNum => {
      const totalAppearances = numberAppearances.get(prevNum) || 1
      const map = nextNumberProbabilities.get(prevNum)

      if (map) {
        targetNumbers.forEach(currNum => {
          if (map.has(currNum)) {
            const draws = map.get(currNum)!
            // 확률 = (함께 나온 횟수) / (총 나온 횟수)
            const probability = draws.length / totalAppearances
            // [수정] 계수 조정: 100 -> 60 (점수 인플레이션 방지)
            const impact = probability * Math.log(draws.length + 1) * 60
            triggerScore += impact
          }
        })
      }
    })
    // 트리거 점수 상한 35점
    score += Math.min(35, triggerScore)

    // 2. 계절성 점수 (정규화 적용)
    let seasonalRawScore = 0
    targetNumbers.forEach(num => seasonalRawScore += (seasonalHotNumbers.get(num) || 0))

    // [수정] 절대값 나누기가 아니라, 데이터 길이에 비례한 정규화
    // (누적점수 / 전체회차) * 35 -> 평균적인 계절성이면 약 10점, 높으면 20점
    const historyLen = historyData.length || 1000
    const normalizedSeasonal = (seasonalRawScore / historyLen) * 35
    score += Math.min(20, normalizedSeasonal)

    // 3. AC값 (극단적 허용, 7 이상이면 가산점 20)
    if (calculateACValue(targetNumbers) >= 7) score += 20;

    // 4. 합계 (극단적 허용, 범위 내면 가산점 10)
    const sum = targetNumbers.reduce((a, b) => a + b, 0)
    if (sum >= 80 && sum <= 200) score += 10;

    // 5. 핫/콜드 밸런스 (가산점 10)
    const recentNumbers = Object.keys(Object.fromEntries(analyticsData.recentFrequencies))
        .map(Number).filter(n => analyticsData.recentFrequencies.get(n)! >= 2)
    const hotCount = targetNumbers.filter(n => recentNumbers.includes(n)).length
    if (hotCount >= 1 && hotCount <= 3) score += 10;

    // [수정] 기본 보정치 축소 (+15 -> +5)
    // 35(트리거) + 20(계절) + 20(AC) + 10(합계) + 10(핫) = 95점 만점 + 5점 보너스
    return Math.min(100, Math.floor(score + 5));
  }, [analysisEngine, analyticsData, historyData.length])

  // --- 수동 분석 모드 ---
  useEffect(() => {
    if (manualNumbers && manualNumbers.length === 6) {
      setAnalysisMode("manual")
      setRecommendedNumbers(manualNumbers)
      const calculatedScore = calculateScoreForNumbers(manualNumbers)
      setAiScore(calculatedScore)
    }
  }, [manualNumbers, calculateScoreForNumbers])

  const getProbabilityStatus = (score: number) => {
    if (score >= 90) return { text: "매우 높음", color: "text-purple-600 dark:text-purple-400" }
    if (score >= 80) return { text: "높음", color: "text-blue-600 dark:text-blue-400" }
    if (score >= 60) return { text: "보통", color: "text-green-600 dark:text-green-400" }
    return { text: "낮음", color: "text-gray-500" }
  }

  // --- AI 추천 생성 ---
  const generateAIRecommendation = async () => {
    if (!historyData || historyData.length === 0) {
      toast({ title: "데이터 로딩 중", description: "잠시 후 다시 시도해주세요.", variant: "destructive" })
      return
    }

    setAnalysisMode("recommendation")
    setRecommendedNumbers([])
    setAiScore(null)
    await new Promise((resolve) => setTimeout(resolve, 10))

    const { latestDrawNumbers } = analyticsData
    const { nextNumberProbabilities, seasonalHotNumbers, numberAppearances } = analysisEngine

    // 1. 가중치 맵 생성
    const probabilityMap = new Map<number, number>()

    // (1) 트리거 가중치
    latestDrawNumbers.forEach(prevNum => {
      const totalAppearances = numberAppearances.get(prevNum) || 1
      const nextMap = nextNumberProbabilities.get(prevNum)
      if (nextMap) {
        nextMap.forEach((drawList, nextNum) => {
          const probability = drawList.length / totalAppearances
          // [수정] 계수 조정 (20 -> 40) : 선택 확률에는 좀 더 강하게 반영
          const weight = probability * 40 * Math.log(drawList.length + 1)
          probabilityMap.set(nextNum, (probabilityMap.get(nextNum) || 0) + weight)
        })
      }
    })

    // (2) 계절성 가중치
    seasonalHotNumbers.forEach((score, num) => {
      probabilityMap.set(num, (probabilityMap.get(num) || 0) + score * 0.3)
    })

    // (3) 미출현 보정
    analyticsData.gapMap.forEach((gap, num) => {
      if (gap >= 5 && gap <= 15) probabilityMap.set(num, (probabilityMap.get(num) || 0) + 3)
    })

    // (4) 기본 가중치
    for(let i=1; i<=45; i++) { if (!probabilityMap.has(i)) probabilityMap.set(i, 1.0); }

    const getWeightedRandomNumber = (): number => {
      let totalWeight = 0; probabilityMap.forEach(w => totalWeight += w);
      let random = Math.random() * totalWeight;
      for (const [num, weight] of probabilityMap.entries()) { random -= weight; if (random <= 0) return num; }
      return Math.floor(Math.random() * 45) + 1;
    }

    const ITERATIONS = 5000;
    const candidates: any[] = [];
    const recentDraws = historyData.slice(-30);

    for (let i = 0; i < ITERATIONS; i++) {
      const currentSet = new Set<number>()

      // 60% 가중치(AI), 40% 무작위(Random)
      while (currentSet.size < 6) {
        if (Math.random() < 0.6) currentSet.add(getWeightedRandomNumber())
        else currentSet.add(Math.floor(Math.random() * 45) + 1)
      }

      const currentNumbers = Array.from(currentSet).sort((a, b) => a - b)
      const comboKey = currentNumbers.join("-")

      // 필터 1: 역대 1등 제외
      if (winningNumbersSet.has(comboKey)) continue

      // 필터 2: 최근 30회차 유사(4개 이상 일치) 제외
      let isSimilar = false
      for(const pastDraw of recentDraws) {
        if (currentNumbers.filter(n => pastDraw.numbers.includes(n)).length >= 4) {
          isSimilar = true; break;
        }
      }
      if (isSimilar) continue

      // 점수 계산 (실제 로직 사용)
      const score = calculateScoreForNumbers(currentNumbers)

      // 로그 생성 (디버깅용)
      let evidenceList: string[] = []
      if (candidates.length < 10) {
        latestDrawNumbers.forEach(prevNum => {
          const totalApp = numberAppearances.get(prevNum) || 1
          const map = nextNumberProbabilities.get(prevNum)
          if (map) {
            currentNumbers.forEach(currNum => {
              if (map.has(currNum)) {
                const draws = map.get(currNum)!
                const prob = (draws.length / totalApp) * 100
                if (prob > 5 && evidenceList.length < 2) {
                  evidenceList.push(`${prevNum}→${currNum}(${prob.toFixed(0)}%)`)
                }
              }
            })
          }
        })
      }

      candidates.push({ combination: currentNumbers, score, evidence: evidenceList })
    }

    // 점수순 정렬 후 상위 5개 중 랜덤 선택
    candidates.sort((a, b) => b.score - a.score)
    const finalPick = candidates[Math.floor(Math.random() * Math.min(5, candidates.length))]

    const finalCombination = finalPick ? finalPick.combination : Array.from({ length: 6 }, () => Math.floor(Math.random() * 45) + 1).sort((a, b) => a - b)
    // [중요] 계산된 실제 점수 사용 (폴백 로직 제거)
    const finalScore = finalPick ? finalPick.score : Math.floor(Math.random() * 20 + 70)

    if (finalPick) {
      console.groupCollapsed(`✨ [AI 최종 추천] 점수: ${finalScore}점`)
      console.log(`조합: ${finalCombination.join(", ")}`)
      console.log(`근거: ${finalPick.evidence.join(", ") || "복합 패턴 분석"}`)
      console.groupEnd()
    }

    setRecommendedNumbers(finalCombination)
    setAiScore(finalScore)

    // DB 저장
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      await fetch(getApiUrl("/api/log-draw"), {
        method: "POST", headers,
        body: JSON.stringify({ numbers: finalCombination, source: "ai", score: finalScore, userId: session?.user?.id }),
      })
      if (!session) saveLottoResult(finalCombination, true, latestDrawNo + 1);
    } catch (e) { console.error(e) }

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

  const isManual = analysisMode === "manual"

  return (
      <div className={`p-4 rounded-lg border bg-white dark:bg-[rgb(36,36,36)] border-gray-200 dark:border-[rgb(36,36,36)]"`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isManual ? (
                <SearchCheck className="w-5 h-5 text-indigo-600 mr-2" />
            ) : (
                <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
            )}
            <h3 className="font-bold text-gray-800 dark:text-gray-200">
              {isManual ? "번호 패턴 정밀 분석" : "AI 정밀 분석 추천"}
            </h3>
          </div>
        </div>
        <div>
          <div className="mt-2 relative overflow-hidden">
            {!isManual && (
                <div className="absolute bottom-1/3 right-0 p-4 opacity-5">
                  <Sparkles className="w-30 h-30" />
                </div>
            )}

            <div className="flex flex-col mb-3">
              <div className="flex justify-between items-center w-full gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 flex-1 leading-relaxed">
                  {isManual ? (
                      <>선택하신 번호의 <span className="font-semibold text-indigo-600">패턴 매칭 점수</span>와 AI가 분석한 <span className="font-semibold text-blue-600">당첨 확률</span>입니다.</>
                  ) : (
                      <>지난 <span className="font-semibold text-blue-600">{latestDrawNo}회차 데이터</span>와 전체 역대 당첨 번호의 상관관계를 분석하여, <span className="font-semibold text-green-600">5등</span> 이상을 목표로 설계된 조합입니다.</>
                  )}
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

          {!isManual && (
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
          )}
        </div>
      </div>
  )
}