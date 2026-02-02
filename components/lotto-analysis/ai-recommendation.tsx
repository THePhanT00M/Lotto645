"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { LottoAnalytics } from './types'
import { Sparkles, BarChart3, SearchCheck, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveLottoResult } from "@/utils/lotto-storage"
import AINumberDisplay from "@/components/lotto-analysis/ai-number-display"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/api-config"
import { supabase } from "@/lib/supabaseClient"
import type { WinningLottoNumbers } from "@/types/lotto"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * AI 추천 컴포넌트의 Props 인터페이스 정의
 * 분석 데이터, 당첨 번호 집합, 회차 정보, 이력 데이터 등을 받습니다.
 */
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

/**
 * 분포 통계(평균, 표준편차)를 저장하기 위한 인터페이스
 */
interface DistributionStats {
  mean: number
  stdDev: number
}

/**
 * AC(Arithmetic Complexity) 값 계산 함수
 * 번호 쌍 간의 차이값의 고유 개수를 계산하여 산술적 복잡도를 측정합니다.
 */
const calculateACValue = (numbers: number[]): number => {
  const diffs = new Set<number>()
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      diffs.add(Math.abs(numbers[i] - numbers[j]))
    }
  }
  return diffs.size - (numbers.length - 1)
}

/**
 * 숫자 배열의 평균과 표준편차를 계산하는 유틸리티 함수
 */
const calculateStats = (values: number[]): DistributionStats => {
  if (values.length === 0) return { mean: 0, stdDev: 0 }
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
  return { mean, stdDev: Math.sqrt(variance) }
}

/**
 * 정규 분포 기반 점수 계산 함수
 * 평균에 가까울수록 높은 점수를 부여합니다.
 */
const getGaussianScore = (val: number, mean: number, stdDev: number, maxScore: number): number => {
  if (stdDev === 0) return maxScore * 0.5
  const z = Math.abs(val - mean) / stdDev
  const factor = Math.exp(-0.5 * z * z)
  return factor * maxScore
}

/**
 * 선형 보간 점수 계산 함수
 * 값이 클수록 높은 점수를 부여합니다.
 */
const getLinearScore = (val: number, maxVal: number, maxScore: number): number => {
  if (maxVal === 0) return 0;
  return (val / maxVal) * maxScore;
}

/**
 * 가우시안 가중치 계산 함수
 * 특정 값(mean)을 중심으로 종 모양의 가중치를 반환합니다.
 */
const getGaussianWeight = (x: number, mean: number, sigma: number = 3): number => {
  return Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(sigma, 2)))
}

/**
 * 날짜 문자열을 입력받아 해당 날짜의 주차(Week Number)를 계산하는 함수
 */
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
  const [savedAiNumbers, setSavedAiNumbers] = useState<number[]>([])
  const [aiScore, setAiScore] = useState<number | null>(null)
  const [analysisMode, setAnalysisMode] = useState<"recommendation" | "manual">("recommendation")
  const { toast } = useToast()

  /**
   * 분석 엔진 useMemo
   * 로또 당첨 이력을 분석하여 다음 회차 예측에 필요한 통계 데이터를 생성합니다.
   * 주요 분석 항목: 연관수 확률, 계절성(주차별) 핫 넘버, 미출현 주기(Gap), AC/합계 통계 등
   */
  const analysisEngine = useMemo(() => {
    if (!historyData || historyData.length === 0) {
      return {
        nextNumberProbabilities: new Map<number, Map<number, number[]>>(),
        seasonalHotNumbers: new Map<number, number>(),
        seasonalMaxScore: 1,
        numberAppearances: new Map<number, number>(),
        gapStats: { avgGap: 0, coldAvgGap: 0, maxGap: 0 },
        acStats: { mean: 0, stdDev: 0 },
        sumStats: { mean: 0, stdDev: 0 },
        hotCountStats: { mean: 0, stdDev: 0 }
      }
    }

    const nextNumberProbabilities = new Map<number, Map<number, number[]>>()
    const seasonalHotNumbers = new Map<number, number>()
    const numberAppearances = new Map<number, number>()

    const acList: number[] = []
    const sumList: number[] = []
    const hotCountList: number[] = []
    const allGaps: number[] = []
    const coldGaps: number[] = []
    const lastSeenMap = new Map<number, number>()

    const sortedHistory = [...historyData].sort((a, b) => a.drawNo - b.drawNo)
    const totalDraws = sortedHistory.length;

    const now = new Date();
    const currentWeek = getWeekNumber(now.toISOString().split('T')[0]);

    let maxSeasonalScore = 0;

    /**
     * 전체 이력 순회 및 통계 집계
     */
    for (let i = 0; i < totalDraws; i++) {
      const draw = sortedHistory[i]
      const { drawNo, numbers, bonusNo, date } = draw

      // AC값 및 합계 수집
      acList.push(calculateACValue(numbers))
      sumList.push(numbers.reduce((a, b) => a + b, 0))

      // 최근 5회차 내 번호가 포함된 개수(Hot Count) 계산
      if (i >= 5) {
        const past5Draws = sortedHistory.slice(i - 5, i)
        const hotSetAtThatTime = new Set<number>()
        past5Draws.forEach(d => d.numbers.forEach(n => hotSetAtThatTime.add(n)))
        const count = numbers.filter(n => hotSetAtThatTime.has(n)).length
        hotCountList.push(count)
      }

      // 번호별 출현 빈도 및 미출현 주기(Gap) 계산
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

      /**
       * 계절성 분석 로직
       * 현재 주차(Week)와 유사한 과거 시점의 번호에 가중치를 부여합니다.
       * - Recency Weight: 최근 연도일수록 가중치 증가
       * - Precision Weight: 주차 차이가 적을수록 가중치 증가
       */
      const drawWeek = getWeekNumber(date);
      let weekDiff = Math.abs(currentWeek - drawWeek);
      if (weekDiff > 26) weekDiff = 52 - weekDiff;

      // 앞뒤 3주 이내 데이터만 계절성 점수에 반영
      if (weekDiff <= 3) {
        const recencyWeight = 1.0 + (i / totalDraws) * 2.0;
        const precisionWeight = 1.0 - (weekDiff * 0.2);
        const totalWeight = recencyWeight * precisionWeight;

        numbers.forEach((num) => {
          const newScore = (seasonalHotNumbers.get(num) || 0) + totalWeight;
          seasonalHotNumbers.set(num, newScore);
          if (newScore > maxSeasonalScore) maxSeasonalScore = newScore;
        });
      }
    }

    /**
     * 마르코프 체인 유사 로직: 특정 번호 다음에 나온 번호들의 빈도 맵핑
     */
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

    // 최종 통계 지표 계산 (평균, 표준편차)
    const acStats = calculateStats(acList)
    const sumStats = calculateStats(sumList)
    const hotCountStats = calculateStats(hotCountList)

    const avgGap = allGaps.length > 0 ? allGaps.reduce((a,b) => a+b, 0) / allGaps.length : 0
    const coldAvgGap = coldGaps.length > 0 ? coldGaps.reduce((a,b) => a+b, 0) / coldGaps.length : 0
    const maxGap = Math.max(...allGaps, 0)

    return {
      nextNumberProbabilities,
      seasonalHotNumbers,
      seasonalMaxScore: maxSeasonalScore,
      numberAppearances,
      gapStats: { avgGap, coldAvgGap, maxGap },
      acStats,
      sumStats,
      hotCountStats
    }
  }, [historyData])

  /**
   * 번호 조합 점수 계산 함수 useCallback
   * 생성된 번호 조합이 통계적으로 얼마나 유의미한지 점수화합니다.
   * 항목별 가중치를 적용하여 총점 100점 만점으로 환산합니다.
   */
  const calculateScoreForNumbers = useCallback((targetNumbers: number[], debug: boolean = false) => {
    const {
      nextNumberProbabilities, seasonalHotNumbers, seasonalMaxScore, numberAppearances,
      gapStats, acStats, sumStats, hotCountStats
    } = analysisEngine
    const { latestDrawNumbers, gapMap } = analyticsData

    if (sumStats.mean === 0) return 0

    let score = 0

    // 1. 연관수 점수 (25점 만점): 이전 회차 번호들과의 연관성 분석
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

    // 2. AC(복잡도) 점수 (15점 만점): 번호 간 간격의 다양성 평가
    const currentAC = calculateACValue(targetNumbers)
    const acScore = getGaussianScore(currentAC, acStats.mean, acStats.stdDev, 15)
    score += acScore

    // 3. 합계 점수 (15점 만점): 번호 합계가 평균 분포에 위치하는지 평가
    const currentSum = targetNumbers.reduce((a, b) => a + b, 0)
    const sumScore = getGaussianScore(currentSum, sumStats.mean, sumStats.stdDev, 15)
    score += sumScore

    // 4. 밸런스(Hot/Cold) 점수 (10점 만점): 최근 출현 번호 비율 평가
    const currentHotCount = targetNumbers.filter(n => (gapMap.get(n) || 0) < 5).length
    const balanceScore = getGaussianScore(currentHotCount, hotCountStats.mean, hotCountStats.stdDev, 10)
    score += balanceScore

    // 5. 주기(Gap) 점수 (25점 만점): 미출현 기간에 따른 가중치 평가
    // 일반적인 주기, 장기 미출현(Cold), 중위권 주기(5~9주) 등을 복합적으로 고려
    let gapScoreRaw = 0
    targetNumbers.forEach(num => {
      const currentGap = gapMap.get(num) || 0
      const normalMatch = getGaussianWeight(currentGap, gapStats.avgGap, 3.0)

      const coldTarget = gapStats.coldAvgGap > 10 ? gapStats.coldAvgGap : 10;
      const coldMatch = getGaussianWeight(currentGap, coldTarget, 5.0)

      const mediumMatch = (currentGap >= 5 && currentGap <= 9) ? 0.8 : 0;

      gapScoreRaw += (normalMatch * 3.0) + (coldMatch * 4.0) + (mediumMatch * 2.0)
    })
    const finalGapScore = Math.min(25, gapScoreRaw)
    score += finalGapScore

    // 6. 계절성 점수 (10점 만점): 현재 시기(주차)에 자주 나왔던 번호인지 평가
    let seasonalRawScore = 0
    targetNumbers.forEach(num => seasonalRawScore += (seasonalHotNumbers.get(num) || 0))

    const targetSeasonalScore = seasonalMaxScore * 2.5;
    const finalSeasonalScore = Math.min(10, (seasonalRawScore / targetSeasonalScore) * 10);

    score += finalSeasonalScore

    const totalScore = Math.min(100, Math.floor(score))

    if (debug) {
      console.group(`📊 [동적 점수 분석] 총점: ${totalScore}점`)
      console.log(`1. 연관수(Trigger): ${finalTriggerScore.toFixed(1)} / 25`)
      console.log(`2. AC(복잡도)     : ${acScore.toFixed(1)} / 15`)
      console.log(`3. 합계(Sum)      : ${sumScore.toFixed(1)} / 15`)
      console.log(`4. 밸런스(Hot)    : ${balanceScore.toFixed(1)} / 10`)
      console.log(`5. 주기(Gap)      : ${finalGapScore.toFixed(1)} / 25`)
      console.log(`6. 계절성(정밀)   : ${finalSeasonalScore.toFixed(1)} / 10`)
      console.groupEnd()
    }

    return totalScore
  }, [analysisEngine, analyticsData])

  /**
   * 수동 선택 번호가 입력될 경우 분석 모드로 전환하는 Effect
   */
  useEffect(() => {
    if (manualNumbers && manualNumbers.length === 6) {
      setAnalysisMode("manual")
      setRecommendedNumbers(manualNumbers)
      const calculatedScore = calculateScoreForNumbers(manualNumbers, true)
      setAiScore(calculatedScore)
    }
  }, [manualNumbers, calculateScoreForNumbers])

  /**
   * 점수에 따른 확률 상태 텍스트 및 색상 반환
   */
  const getProbabilityStatus = (score: number) => {
    if (score >= 90) return { text: "매우 높음", color: "text-purple-600 dark:text-purple-400" }
    if (score >= 80) return { text: "높음", color: "text-blue-600 dark:text-blue-400" }
    if (score >= 60) return { text: "보통", color: "text-green-600 dark:text-green-400" }
    return { text: "낮음", color: "text-gray-500" }
  }

  /**
   * AI 추천 번호 생성 함수
   * 통계 분석 데이터를 바탕으로 가중치 기반 무작위 추첨 및 시뮬레이션을 수행합니다.
   */
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

    // 가중치 맵 초기화 (약간의 랜덤 노이즈 추가하여 다양성 확보)
    const probabilityMap = new Map<number, number>()
    for(let i=1; i<=45; i++) probabilityMap.set(i, 0.8 + Math.random() * 0.4)

    // 연관수 가중치 적용
    latestDrawNumbers.forEach(prevNum => {
      const totalAppearances = numberAppearances.get(prevNum) || 1
      const nextMap = nextNumberProbabilities.get(prevNum)
      if (nextMap) {
        nextMap.forEach((drawList, nextNum) => {
          const w = (drawList.length / totalAppearances) * 30 * Math.log(drawList.length + 1)
          probabilityMap.set(nextNum, (probabilityMap.get(nextNum) || 0) + w)
        })
      }
    })

    // 계절성 가중치 적용 (과도한 쏠림 방지를 위해 클램핑)
    seasonalHotNumbers.forEach((score, num) => {
      const adjustedScore = Math.min(score, 10);
      probabilityMap.set(num, (probabilityMap.get(num) || 0) + adjustedScore * 1.2)
    })

    // Gap(미출현 주기) 기반 가중치 적용 (Hot/Cold/Medium)
    for (let i = 1; i <= 45; i++) {
      const currentGap = gapMap.get(i) || 0

      // Hot: 최근 평균 주기 근처에서 자주 출몰
      const hotWeight = getGaussianWeight(currentGap, gapStats.avgGap, 2.5) * 8

      // Cold: 장기 미출현 번호 보정
      let coldWeight = 0
      if (currentGap > gapStats.avgGap) {
        coldWeight = getGaussianWeight(currentGap, gapStats.coldAvgGap, 4.0) * 12
      }

      // Medium: 특정 주기(5~9주) 사이 번호 가중치
      let mediumWeight = 0
      if (currentGap >= 5 && currentGap <= 9) {
        mediumWeight = 6.0;
      }

      probabilityMap.set(i, (probabilityMap.get(i) || 0) + hotWeight + coldWeight + mediumWeight)
    }

    // 가중치 기반 랜덤 번호 추출 함수
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

    // 시뮬레이션: 여러 조합을 생성하고 점수가 높은 후보 선별
    const ITERATIONS = 10000
    const candidates: any[] = []

    // [변경] 최근 2년(약 104주) 간의 데이터를 비교 대상으로 설정
    const recentDraws = historyData.slice(-104)

    for (let i = 0; i < ITERATIONS; i++) {
      const currentSet = new Set<number>()
      while (currentSet.size < 6) currentSet.add(getWeightedRandomNumber(currentSet))
      const currentNumbers = Array.from(currentSet).sort((a, b) => a - b)

      // 과거 당첨 번호와 완전 일치하는 경우 제외
      const comboKey = currentNumbers.join("-")
      if (winningNumbersSet.has(comboKey)) continue

      // [변경] 최근 2년(104회차) 내 4개 이상 번호가 겹치는 경우 제외 (유사 패턴 필터링)
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

    // 점수 기준 정렬 후 상위 3개 중 랜덤 선택
    candidates.sort((a, b) => b.score - a.score)
    const finalPick = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))]
    const finalCombination = finalPick ? finalPick.combination : Array.from({ length: 6 }, () => Math.floor(Math.random() * 45) + 1).sort((a, b) => a - b)
    const finalScore = calculateScoreForNumbers(finalCombination, true)

    setRecommendedNumbers(finalCombination)
    setSavedAiNumbers(finalCombination)
    setAiScore(finalScore)

    // 결과 로깅 (Supabase 및 로컬 스토리지)
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

  // 생성 플래그 변경 시 추천 번호 생성 트리거
  useEffect(() => {
    if (isGenerating) generateAIRecommendation()
  }, [isGenerating])

  const handleAnalyzeAINumbers = () => {
    if (recommendedNumbers.length === 6 && onAnalyzeNumbers) {
      onAnalyzeNumbers(recommendedNumbers)
    }
  }

  /**
   * AI 분석 번호 복원 핸들러 (수동 모드에서 다시 AI 추천 보기로 전환 시)
   */
  const handleRestoreAiNumbers = () => {
    if (savedAiNumbers.length === 6) {
      setRecommendedNumbers(savedAiNumbers)
      setAnalysisMode("recommendation")
      const score = calculateScoreForNumbers(savedAiNumbers, true)
      setAiScore(score)
      if (onAnalyzeNumbers) onAnalyzeNumbers(savedAiNumbers)
    }
  }

  const probabilityStatus = aiScore ? getProbabilityStatus(aiScore) : { text: "-", color: "" }

  // 로딩(생성 중) 상태 렌더링
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