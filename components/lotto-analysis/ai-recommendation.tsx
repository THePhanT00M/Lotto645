"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { LottoAnalytics } from './types'
import { Sparkles, BarChart3, SearchCheck, RotateCcw } from "lucide-react" // RotateCcw 아이콘 추가
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

interface DistributionStats {
  mean: number
  stdDev: number
}

// --- 유틸리티 ---
const calculateACValue = (numbers: number[]): number => {
  const diffs = new Set<number>()
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      diffs.add(Math.abs(numbers[i] - numbers[j]))
    }
  }
  return diffs.size - (numbers.length - 1)
}

const calculateStats = (values: number[]): DistributionStats => {
  if (values.length === 0) return { mean: 0, stdDev: 0 }
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
  return { mean, stdDev: Math.sqrt(variance) }
}

// 평균 지향형 점수 (AC, 합계 등)
const getGaussianScore = (val: number, mean: number, stdDev: number, maxScore: number): number => {
  if (stdDev === 0) return maxScore * 0.5
  const z = Math.abs(val - mean) / stdDev
  const factor = Math.exp(-0.5 * z * z)
  return factor * maxScore
}

// "많을수록 좋은" 점수 (계절성용) - 선형 보간
const getLinearScore = (val: number, maxVal: number, maxScore: number): number => {
  if (maxVal === 0) return 0;
  return (val / maxVal) * maxScore;
}

const getGaussianWeight = (x: number, mean: number, sigma: number = 3): number => {
  return Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(sigma, 2)))
}

// 주차(Week Number) 계산 함수
const getWeekNumber = (dateStr: string): number => {
  const date = new Date(dateStr);
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = ((date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000));
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  return Math.ceil(day / 7);
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
  const [savedAiNumbers, setSavedAiNumbers] = useState<number[]>([]) // [추가] AI가 생성한 번호 백업용
  const [aiScore, setAiScore] = useState<number | null>(null)
  const [analysisMode, setAnalysisMode] = useState<"recommendation" | "manual">("recommendation")
  const { toast } = useToast()

  // ----------------------------------------------------------------------
  // 분석 엔진: 계절성 로직 대폭 강화
  // ----------------------------------------------------------------------
  const analysisEngine = useMemo(() => {
    if (!historyData || historyData.length === 0) {
      return {
        nextNumberProbabilities: new Map<number, Map<number, number[]>>(),
        seasonalHotNumbers: new Map<number, number>(),
        seasonalMaxScore: 1, // 0으로 나누기 방지
        numberAppearances: new Map<number, number>(),
        gapStats: { avgGap: 0, coldAvgGap: 0, maxGap: 0 },
        acStats: { mean: 0, stdDev: 0 },
        sumStats: { mean: 0, stdDev: 0 },
        hotCountStats: { mean: 0, stdDev: 0 }
      }
    }

    // console.log(`%c[AI 분석 엔진] 데이터(${historyData.length}회) 정밀 계절성 분석 시작`, "color: #3b82f6; font-weight: bold;")

    const nextNumberProbabilities = new Map<number, Map<number, number[]>>()
    const seasonalHotNumbers = new Map<number, number>()
    const numberAppearances = new Map<number, number>()

    const acList: number[] = []
    const sumList: number[] = []
    const hotCountList: number[] = []
    const allGaps: number[] = []
    const coldGaps: number[] = []
    const lastSeenMap = new Map<number, number>()

    // 오름차순 정렬
    const sortedHistory = [...historyData].sort((a, b) => a.drawNo - b.drawNo)
    const totalDraws = sortedHistory.length;

    // 현재 시점의 주차(Week) 계산
    const now = new Date();
    const currentWeek = getWeekNumber(now.toISOString().split('T')[0]); // 오늘 날짜 기준 주차

    // [New] 계절성 분석을 위한 변수
    let maxSeasonalScore = 0;

    for (let i = 0; i < totalDraws; i++) {
      const draw = sortedHistory[i]
      const { drawNo, numbers, bonusNo, date } = draw

      // 1. 기본 통계 수집
      acList.push(calculateACValue(numbers))
      sumList.push(numbers.reduce((a, b) => a + b, 0))

      if (i >= 5) {
        const past5Draws = sortedHistory.slice(i - 5, i)
        const hotSetAtThatTime = new Set<number>()
        past5Draws.forEach(d => d.numbers.forEach(n => hotSetAtThatTime.add(n)))
        const count = numbers.filter(n => hotSetAtThatTime.has(n)).length
        hotCountList.push(count)
      }

      const drawNumbers = [...numbers, bonusNo]
      drawNumbers.forEach(num => {
        if (lastSeenMap.has(num)) {
          const prevDrawNo = lastSeenMap.get(num)!
          const gap = drawNo - prevDrawNo
          allGaps.push(gap)
          if (gap >= 10) coldGaps.push(gap)
        }
        lastSeenMap.set(num, drawNo)
        numberAppearances.set(num, (numberAppearances.get(num) || 0) + 1)
      })

      // 2. [New] 정밀 계절성 분석 (Weekly Window + Recency)
      const drawWeek = getWeekNumber(date);
      // 주차 차이 계산 (52주 순환 고려)
      let weekDiff = Math.abs(currentWeek - drawWeek);
      if (weekDiff > 26) weekDiff = 52 - weekDiff; // 연말연시 연결 (예: 1주차와 52주차는 1주 차이)

      // 현재 시점 기준 앞뒤 3주(약 한 달 반) 이내 데이터만 유효
      if (weekDiff <= 3) {
        // 최신성 가중치: 최근 회차일수록 가중치가 높음 (과거 10년 전보다 작년이 더 중요)
        // 1.0(과거) ~ 3.0(최근) 사이로 가중치 부여
        const recencyWeight = 1.0 + (i / totalDraws) * 2.0;

        // 주차 정확도 가중치: 정확히 같은 주차면 가중치 높음
        // 0주 차이: 1.0, 1주 차이: 0.8, 2주 차이: 0.6...
        const precisionWeight = 1.0 - (weekDiff * 0.2);

        const totalWeight = recencyWeight * precisionWeight;

        numbers.forEach((num) => {
          const newScore = (seasonalHotNumbers.get(num) || 0) + totalWeight;
          seasonalHotNumbers.set(num, newScore);
          // 최대 점수 갱신 (점수 정규화를 위해)
          if (newScore > maxSeasonalScore) maxSeasonalScore = newScore;
        });
      }
    }

    // 연관수 맵핑
    for (let i = 0; i < sortedHistory.length - 1; i++) {
      const prev = sortedHistory[i]
      const next = sortedHistory[i+1]
      const prevNums = [...prev.numbers, prev.bonusNo]
      prevNums.forEach(prevNum => {
        if (!nextNumberProbabilities.has(prevNum)) nextNumberProbabilities.set(prevNum, new Map())
        const targetMap = nextNumberProbabilities.get(prevNum)!
        next.numbers.forEach(nextNum => {
          if (!targetMap.has(nextNum)) targetMap.set(nextNum, [])
          targetMap.get(nextNum)!.push(next.drawNo)
        })
      })
    }

    const acStats = calculateStats(acList)
    const sumStats = calculateStats(sumList)
    const hotCountStats = calculateStats(hotCountList)

    const avgGap = allGaps.length > 0 ? allGaps.reduce((a,b) => a+b, 0) / allGaps.length : 0
    const coldAvgGap = coldGaps.length > 0 ? coldGaps.reduce((a,b) => a+b, 0) / coldGaps.length : 0
    const maxGap = Math.max(...allGaps, 0)

    // 통계 로그 (계절성 최대 점수 포함)
    // console.log(`[통계] 계절성최고점:${maxSeasonalScore.toFixed(1)} AC평균:${acStats.mean.toFixed(1)} 합계평균:${sumStats.mean.toFixed(0)}`)

    return {
      nextNumberProbabilities,
      seasonalHotNumbers,
      seasonalMaxScore: maxSeasonalScore, // 정규화를 위한 최대값
      numberAppearances,
      gapStats: { avgGap, coldAvgGap, maxGap },
      acStats,
      sumStats,
      hotCountStats
    }
  }, [historyData])

  // ----------------------------------------------------------------------
  // 점수 계산 (보정됨: Gap 점수 로직 개선 및 배점 조정)
  // ----------------------------------------------------------------------
  const calculateScoreForNumbers = useCallback((targetNumbers: number[], debug: boolean = false) => {
    const {
      nextNumberProbabilities, seasonalHotNumbers, seasonalMaxScore, numberAppearances,
      gapStats, acStats, sumStats, hotCountStats
    } = analysisEngine
    const { latestDrawNumbers, gapMap } = analyticsData

    if (sumStats.mean === 0) return 0

    let score = 0

    // 1. 연관수(Trigger) (35 -> 25점 하향)
    // 이전 회차 번호에 지나치게 의존하지 않도록 비중 축소
    let triggerScoreRaw = 0
    latestDrawNumbers.forEach(prevNum => {
      const totalAppearances = numberAppearances.get(prevNum) || 1
      const map = nextNumberProbabilities.get(prevNum)
      if (map) {
        targetNumbers.forEach(currNum => {
          if (map.has(currNum)) {
            const draws = map.get(currNum)!
            triggerScoreRaw += (draws.length / totalAppearances) * Math.log(draws.length + 1) * 60
          }
        })
      }
    })
    const finalTriggerScore = Math.min(25, triggerScoreRaw)
    score += finalTriggerScore

    // 2. AC(복잡도) (15점)
    const currentAC = calculateACValue(targetNumbers)
    const acScore = getGaussianScore(currentAC, acStats.mean, acStats.stdDev, 15)
    score += acScore

    // 3. 합계(Sum) (10 -> 15점 상향)
    // 번호 대역(고저) 밸런스가 더 중요하다고 판단
    const currentSum = targetNumbers.reduce((a, b) => a + b, 0)
    const sumScore = getGaussianScore(currentSum, sumStats.mean, sumStats.stdDev, 15)
    score += sumScore

    // 4. 밸런스(Hot) (5 -> 10점 상향)
    const currentHotCount = targetNumbers.filter(n => (gapMap.get(n) || 0) < 5).length
    const balanceScore = getGaussianScore(currentHotCount, hotCountStats.mean, hotCountStats.stdDev, 10)
    score += balanceScore

    // 5. 주기(Gap) (20 -> 25점 상향 및 정밀화)
    // 단순 Hot/Cold 뿐만 아니라 '중위권 Gap(5~9)'도 점수화
    let gapScoreRaw = 0
    targetNumbers.forEach(num => {
      const currentGap = gapMap.get(num) || 0
      const normalMatch = getGaussianWeight(currentGap, gapStats.avgGap, 3.0) // 표준편차 여유 있게

      // 장기 미출현 타겟을 너무 먼 값(평균 15주 이상 등)으로 잡으면 점수 획득이 어려우므로 10주 이상이면 인정
      const coldTarget = gapStats.coldAvgGap > 10 ? gapStats.coldAvgGap : 10;
      const coldMatch = getGaussianWeight(currentGap, coldTarget, 5.0)

      // [New] 중위권 Gap (5~9주 미출현) 가산점
      // 너무 핫하지도, 너무 콜드하지도 않은 번호들이 실제 당첨 번호에 자주 포함됨
      const mediumMatch = (currentGap >= 5 && currentGap <= 9) ? 0.8 : 0;

      gapScoreRaw += (normalMatch * 3.0) + (coldMatch * 4.0) + (mediumMatch * 2.0)
    })
    const finalGapScore = Math.min(25, gapScoreRaw)
    score += finalGapScore

    // 6. 계절성 (15 -> 10점 하향)
    let seasonalRawScore = 0
    targetNumbers.forEach(num => seasonalRawScore += (seasonalHotNumbers.get(num) || 0))

    const targetSeasonalScore = seasonalMaxScore * 2.5;
    const finalSeasonalScore = Math.min(10, (seasonalRawScore / targetSeasonalScore) * 10);

    score += finalSeasonalScore

    const totalScore = Math.min(100, Math.floor(score))

    if (debug) {
      console.group(`📊 [동적 점수 분석] 총점: ${totalScore}점`)
      console.log(`1. 연관수(Trigger): ${finalTriggerScore.toFixed(1)} / 25`)
      console.log(`2. AC(복잡도)     : ${acScore.toFixed(1)} / 15 (값:${currentAC}, μ:${acStats.mean.toFixed(1)})`)
      console.log(`3. 합계(Sum)      : ${sumScore.toFixed(1)} / 15 (값:${currentSum}, μ:${sumStats.mean.toFixed(0)})`)
      console.log(`4. 밸런스(Hot)    : ${balanceScore.toFixed(1)} / 10 (개수:${currentHotCount}, μ:${hotCountStats.mean.toFixed(1)})`)
      console.log(`5. 주기(Gap)      : ${finalGapScore.toFixed(1)} / 25`)
      console.log(`6. 계절성(정밀)   : ${finalSeasonalScore.toFixed(1)} / 10 (Raw:${seasonalRawScore.toFixed(1)})`)
      console.groupEnd()
    }

    return totalScore
  }, [analysisEngine, analyticsData])

  // --- 수동 모드 등 ---
  useEffect(() => {
    if (manualNumbers && manualNumbers.length === 6) {
      setAnalysisMode("manual")
      setRecommendedNumbers(manualNumbers)
      const calculatedScore = calculateScoreForNumbers(manualNumbers, true)
      setAiScore(calculatedScore)
    }
  }, [manualNumbers, calculateScoreForNumbers])

  const getProbabilityStatus = (score: number) => {
    if (score >= 90) return { text: "매우 높음", color: "text-purple-600 dark:text-purple-400" }
    if (score >= 80) return { text: "높음", color: "text-blue-600 dark:text-blue-400" }
    if (score >= 60) return { text: "보통", color: "text-green-600 dark:text-green-400" }
    return { text: "낮음", color: "text-gray-500" }
  }

  const generateAIRecommendation = async () => {
    if (!historyData || historyData.length === 0) {
      toast({ title: "데이터 로딩 중", description: "잠시 후 다시 시도해주세요.", variant: "destructive" })
      return
    }

    setAnalysisMode("recommendation")
    setRecommendedNumbers([])
    setAiScore(null)
    await new Promise((resolve) => setTimeout(resolve, 10))

    const { latestDrawNumbers, gapMap } = analyticsData
    const { nextNumberProbabilities, seasonalHotNumbers, numberAppearances, gapStats } = analysisEngine

    // 1단계: 가중치 맵 생성
    const probabilityMap = new Map<number, number>()
    // [보정] 초기값을 1.0으로 고정하지 않고 약간의 랜덤 노이즈(0.8~1.2)를 주어
    // 매번 실행 시 미세하게 다른 번호가 선택될 확률을 높임 (특정 번호 고착화 방지)
    for(let i=1; i<=45; i++) probabilityMap.set(i, 0.8 + Math.random() * 0.4)

    latestDrawNumbers.forEach(prevNum => {
      const totalAppearances = numberAppearances.get(prevNum) || 1
      const nextMap = nextNumberProbabilities.get(prevNum)
      if (nextMap) {
        nextMap.forEach((drawList, nextNum) => {
          // [보정] 연관수 가중치 계수 하향 (50 -> 30)
          const w = (drawList.length / totalAppearances) * 30 * Math.log(drawList.length + 1)
          probabilityMap.set(nextNum, (probabilityMap.get(nextNum) || 0) + w)
        })
      }
    })

    // [New] 계절성 가중치가 너무 지배적이지 않게 클램핑
    seasonalHotNumbers.forEach((score, num) => {
      const adjustedScore = Math.min(score, 10);
      probabilityMap.set(num, (probabilityMap.get(num) || 0) + adjustedScore * 1.2)
    })

    // [보정] Gap 가중치 세분화 (Hot / Medium / Cold)
    for (let i = 1; i <= 45; i++) {
      const currentGap = gapMap.get(i) || 0

      // 1. Hot (최근 자주 나옴)
      const hotWeight = getGaussianWeight(currentGap, gapStats.avgGap, 2.5) * 8

      // 2. Cold (장기 미출현)
      let coldWeight = 0
      if (currentGap > gapStats.avgGap) {
        coldWeight = getGaussianWeight(currentGap, gapStats.coldAvgGap, 4.0) * 12
      }

      // 3. [신규] Medium (Gap 5~9주) - 1209회차 같은 패턴 포착용
      // 최근 5주간 안 나왔지만, 장기 미출현은 아닌 번호들에게 가산점
      let mediumWeight = 0
      if (currentGap >= 5 && currentGap <= 9) {
        mediumWeight = 6.0;
      }

      probabilityMap.set(i, (probabilityMap.get(i) || 0) + hotWeight + coldWeight + mediumWeight)
    }

    const getWeightedRandomNumber = (excludeSet: Set<number>): number => {
      let totalWeight = 0
      const candidates: { num: number, weight: number }[] = []
      probabilityMap.forEach((w, num) => {
        if (!excludeSet.has(num)) {
          totalWeight += w
          candidates.push({ num, weight: w })
        }
      })
      if (totalWeight === 0) return Math.floor(Math.random() * 45) + 1
      let random = Math.random() * totalWeight
      for (const item of candidates) {
        random -= item.weight
        if (random <= 0) return item.num
      }
      return candidates[candidates.length - 1].num
    }

    const ITERATIONS = 3000
    const candidates: any[] = []
    const recentDraws = historyData.slice(-30)

    for (let i = 0; i < ITERATIONS; i++) {
      const currentSet = new Set<number>()
      while (currentSet.size < 6) currentSet.add(getWeightedRandomNumber(currentSet))
      const currentNumbers = Array.from(currentSet).sort((a, b) => a - b)

      const comboKey = currentNumbers.join("-")
      if (winningNumbersSet.has(comboKey)) continue

      let isSimilar = false
      for(const pastDraw of recentDraws) {
        if (currentNumbers.filter(n => pastDraw.numbers.includes(n)).length >= 4) {
          isSimilar = true; break;
        }
      }
      if (isSimilar) continue

      const score = calculateScoreForNumbers(currentNumbers, false)
      candidates.push({ combination: currentNumbers, score })
    }

    candidates.sort((a, b) => b.score - a.score)
    const finalPick = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))]
    const finalCombination = finalPick ? finalPick.combination : Array.from({ length: 6 }, () => Math.floor(Math.random() * 45) + 1).sort((a, b) => a - b)
    const finalScore = calculateScoreForNumbers(finalCombination, true)

    setRecommendedNumbers(finalCombination)
    setSavedAiNumbers(finalCombination) // [추가] 생성된 번호 백업
    setAiScore(finalScore)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`
      await fetch(getApiUrl("/api/log-draw"), {
        method: "POST", headers,
        body: JSON.stringify({ numbers: finalCombination, source: "ai", score: finalScore, userId: session?.user?.id }),
      })
      if (!session) saveLottoResult(finalCombination, true, latestDrawNo + 1)
    } catch (e) { console.error(e) }

    if (onRecommendationGenerated) onRecommendationGenerated(finalCombination)
  }

  useEffect(() => {
    if (isGenerating) generateAIRecommendation()
  }, [isGenerating])

  const handleAnalyzeAINumbers = () => {
    if (recommendedNumbers.length === 6 && onAnalyzeNumbers) {
      onAnalyzeNumbers(recommendedNumbers)
    }
  }

  // [추가] AI 번호로 복구하는 핸들러
  const handleRestoreAiNumbers = () => {
    if (savedAiNumbers.length === 6) {
      setRecommendedNumbers(savedAiNumbers)
      setAnalysisMode("recommendation")
      const score = calculateScoreForNumbers(savedAiNumbers, true)
      setAiScore(score)
      if (onAnalyzeNumbers) onAnalyzeNumbers(savedAiNumbers) // 부모 컴포넌트 차트 등 동기화
    }
  }

  const probabilityStatus = aiScore ? getProbabilityStatus(aiScore) : { text: "-", color: "" }

  if (isGenerating) {
    return (
        <div className="p-4 rounded-lg border bg-white dark:bg-[rgb(36,36,36)] border-gray-200 dark:border-[rgb(36,36,36)] space-y-5">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-5 h-5 rounded-md" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between gap-3">
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
          <div className="flex justify-center py-6">
            <div className="flex gap-2">
              {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-10 rounded-full" />
              ))}
            </div>
          </div>
        </div>
    )
  }

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
                  지난 <span className="font-semibold text-blue-600">{latestDrawNo}회차 데이터</span>와 전체 역대 당첨 번호의 상관관계를 분석하여, <span className="font-semibold text-green-600">5등</span> 이상을 목표로 설계된 조합입니다.
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

          {isManual && savedAiNumbers.length === 6 && (
              <div className="mt-3 flex justify-start">
                <Button
                    onClick={handleRestoreAiNumbers}
                    variant="outline"
                    className="bg-white dark:bg-[#363636] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-[#363636] hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  AI 추천 번호 분석
                </Button>
              </div>
          )}
        </div>
      </div>
  )
}