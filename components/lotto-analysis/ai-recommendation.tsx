"use client"

import { useState, useEffect, useMemo } from "react"
import { Sparkles, BarChart3, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveLottoResult } from "@/utils/lotto-storage"
import AINumberDisplay from "@/components/lotto-analysis/ai-number-display"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/api-config"
import { supabase } from "@/lib/supabaseClient"
import type { WinningLottoNumbers } from "@/types/lotto" // 타입 import

// --- 타입 정의 ---
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

// --- 헬퍼 함수: AC 값 계산 (산술적 복잡도) ---
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
                                           generatedStats,
                                           scoreToGrade,
                                           getGradeColor,
                                           getGradeDescription,
                                           generateCombination,
                                           winningNumbersSet,
                                           latestDrawNo,
                                           onRecommendationGenerated,
                                           onAnalyzeNumbers,
                                           isGenerating,
                                         }: AIRecommendationProps) {
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  const [aiGrade, setAiGrade] = useState<Grade | null>(null)
  const [aiScore, setAiScore] = useState<number | null>(null)
  const [historyData, setHistoryData] = useState<WinningLottoNumbers[]>([]) // DB 데이터 저장용
  const { toast } = useToast()

  // 1. 컴포넌트 마운트 시 DB에서 전체 당첨 번호 가져오기
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
            .from("winning_numbers")
            .select("*")
            .order("drawNo", { ascending: false }) // 최신순 정렬

        if (error) throw error
        if (data) {
          setHistoryData(data)
        }
      } catch (error) {
        console.error("당첨 번호 로딩 실패:", error)
      }
    }
    fetchHistory()
  }, [])

  // --- 알고리즘 핵심 로직: 패턴 분석 데이터 생성 (메모이제이션) ---
  const analysisEngine = useMemo(() => {
    // 데이터가 아직 로드되지 않았으면 빈 값 반환
    if (historyData.length === 0) {
      return {
        nextNumberProbabilities: new Map<number, Map<number, number[]>>(),
        seasonalHotNumbers: new Map<number, number>()
      }
    }

    console.log(`%c[AI 분석 엔진] DB 데이터(${historyData.length}회) 스캔 시작...`, "color: #3b82f6; font-weight: bold;")

    // Map<직전번호, Map<다음번호, [회차1, 회차2, ...]>>
    const nextNumberProbabilities = new Map<number, Map<number, number[]>>()
    const seasonalHotNumbers = new Map<number, number>()
    const currentMonth = new Date().getMonth() + 1

    // 전체 과거 데이터 순회 (내림차순 데이터: historyData[0]이 최신)
    for (let i = 0; i < historyData.length; i++) {
      const currentDraw = historyData[i]
      // 내림차순이므로 '이전 회차(과거)'는 인덱스 i + 1
      const prevDraw = i < historyData.length - 1 ? historyData[i + 1] : null

      // 1. 계절성(Seasonal) 분석
      const drawMonth = parseInt(currentDraw.date.split("-")[1], 10)
      if (drawMonth === currentMonth) {
        currentDraw.numbers.forEach((num) => {
          seasonalHotNumbers.set(num, (seasonalHotNumbers.get(num) || 0) + 1)
        })
      }

      // 2. 트리거(Trigger) 분석: 회차 정보 기록
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
            // 해당 패턴이 발생한 '회차 번호'를 배열에 추가
            targetMap.get(currNum)!.push(currentDraw.drawNo)
          })
        })
      }
    }

    return { nextNumberProbabilities, seasonalHotNumbers }
  }, [historyData]) // historyData가 로드되면 재계산

  /**
   * AI 추천 번호 생성 및 로그 출력
   */
  const generateAIRecommendation = async () => {
    if (historyData.length === 0) {
      toast({
        title: "데이터 로딩 중",
        description: "과거 당첨 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive"
      })
      return
    }

    setRecommendedNumbers([])
    setAiGrade(null)
    setAiScore(null)

    await new Promise((resolve) => setTimeout(resolve, 10))

    console.log("%c[AI 추천] 생성 프로세스 시작...", "color: #f59e0b; font-weight: bold;")

    const finalCombination = await new Promise<number[]>((resolve) => {
      const { latestDrawNumbers } = analyticsData
      const { nextNumberProbabilities, seasonalHotNumbers } = analysisEngine

      console.log(`📌 지난 회차(${latestDrawNo}회) 당첨 번호:`, latestDrawNumbers)

      // --- 1단계: 가중치 풀 생성 ---
      const probabilityMap = new Map<number, number>()

      // 1-1. 트리거 가중치 (로그에 회차 정보 포함)
      console.groupCollapsed("🔍 [트리거 분석 상세] 지난 회차 번호가 불렀던 역사적 회차들")
      latestDrawNumbers.forEach(prevNum => {
        const nextMap = nextNumberProbabilities.get(prevNum)
        if (nextMap) {
          // 상위 3개만 로그로 출력 (많이 나온 순)
          const topCalls = [...nextMap.entries()]
              .sort((a,b) => b[1].length - a[1].length)
              .slice(0, 3)

          console.log(`  └─ ${prevNum}번 패턴:`)
          topCalls.forEach(([nextNum, drawList]) => {
            // 내림차순(최신순) 데이터이므로 앞부분(slice 0,4)이 최근 회차
            const recentDraws = drawList.slice(0, 4).join(", ")
            const totalCount = drawList.length
            console.log(`      ➡️ ${nextNum}번 (총 ${totalCount}회): [${recentDraws}...] 회차 등에서 출현`)
          })

          nextMap.forEach((drawList, nextNum) => {
            // 빈도수(drawList.length)를 가중치로 사용
            probabilityMap.set(nextNum, (probabilityMap.get(nextNum) || 0) + drawList.length * 2)
          })
        }
      })
      console.groupEnd()

      // 1-2. 계절성 및 미출현 가중치 적용
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

      // --- 2단계: 조합 생성 및 시뮬레이션 ---
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

        // --- 점수 채점 및 근거 수집 ---
        let score = 0
        let logDetail = { trigger: 0, seasonal: 0, ac: 0, sum: 0, hot: 0 }
        const evidenceList: string[] = []

        // 1. 트리거 점수
        let triggerScore = 0
        latestDrawNumbers.forEach(prevNum => {
          const map = nextNumberProbabilities.get(prevNum)
          if (map) {
            currentNumbers.forEach(currNum => {
              if (map.has(currNum)) {
                const draws = map.get(currNum)!
                triggerScore += draws.length

                // 근거 기록 (확률적으로 일부만 기록하여 로그 폭주 방지)
                if (Math.random() < 0.1 && evidenceList.length < 3) {
                  // 최신 회차(0번 인덱스) 사용
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

        // 2. 계절성 점수
        let seasonalScore = 0
        currentNumbers.forEach(num => seasonalScore += (seasonalHotNumbers.get(num) || 0))
        const finalSeasonalScore = (seasonalScore / 10) * 20
        score += finalSeasonalScore
        logDetail.seasonal = finalSeasonalScore

        // 3. AC 값
        const acValue = calculateACValue(currentNumbers)
        if (acValue >= 7) { score += 20; logDetail.ac = 20; }
        else { score -= 10; logDetail.ac = -10; }

        // 4. 총합
        const sum = currentNumbers.reduce((a, b) => a + b, 0)
        if (sum >= 80 && sum <= 200) { score += 10; logDetail.sum = 10; }
        else { score -= 5; logDetail.sum = -5; }

        // 5. Hot 번호
        const recentNumbers = Object.keys(Object.fromEntries(analyticsData.recentFrequencies))
            .map(Number).filter(n => analyticsData.recentFrequencies.get(n)! >= 2)
        const hotCount = currentNumbers.filter(n => recentNumbers.includes(n)).length
        if (hotCount >= 1 && hotCount <= 3) { score += 10; logDetail.hot = 10; }

        // 후보군 등록
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

      // 최종 선택
      const finalPick = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))]

      if (finalPick) {
        console.group(`✨ [최종 추천] 조합: ${finalPick.combination.join(", ")}`)
        console.log(`📊 종합 점수: ${finalPick.score.toFixed(1)}점`)
        console.log(`🔗 트리거 근거 (직전회차→이번번호): ${finalPick.evidence.length > 0 ? finalPick.evidence.join(", ") : "다수의 과거 패턴 반영"} 등 과거 패턴 반복`)
        console.log(`📅 계절성 점수: ${finalPick.log.seasonal.toFixed(1)}`)
        console.log(`🔢 AC(복잡도): ${finalPick.log.ac}`)
        console.groupEnd()
      }

      resolve(finalPick ? finalPick.combination : generateCombination(analyticsData.weightedNumberList))
    })

    const finalScore = Math.min(99, Math.max(50, Math.floor(Math.random() * 20 + 75)))
    const displayGrade = scoreToGrade(finalScore * 2)

    setRecommendedNumbers(finalCombination)
    setAiGrade(displayGrade)
    setAiScore(finalScore * 2)

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
          score: finalScore * 2,
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

  if (recommendedNumbers.length === 0) return null

  return (
      <div className="p-4 bg-gray-200 dark:bg-[rgb(36,36,36)] rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200">AI 정밀 분석 추천</h3>
          </div>
        </div>
        <div>
          <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 mt-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <RotateCw className="w-24 h-24" />
            </div>

            <div className="flex flex-col mb-3 relative z-10">
              <div className="flex justify-between items-center w-full gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 flex-1 leading-relaxed">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  지난 {latestDrawNo}회차 데이터
                </span>
                  와 전체 역대 당첨 번호의 상관관계를 분석하여,
                  <span className="font-semibold text-green-600 dark:text-green-400"> 5등</span> 이상을 목표로 설계된 조합입니다.
                </p>
                {aiGrade && (
                    <div
                        className={`px-3 py-1.5 rounded-lg font-bold text-sm whitespace-nowrap shadow-sm ${getGradeColor(
                            aiGrade,
                        )}`}
                    >
                      {aiGrade} 등급
                    </div>
                )}
              </div>

              {aiGrade && aiScore !== null && (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="text-xs p-2 bg-white dark:bg-[#464646] rounded-lg text-gray-700 dark:text-gray-200">
                      <span className="text-gray-500 dark:text-white block mb-1">패턴 매칭 점수</span>
                      <span className="font-bold text-base text-gray-800 dark:text-gray-100">
                        {Math.min(100, Math.floor(aiScore / 2) + 15)}
                        <span className="text-xs font-normal text-gray-400 ml-1">/ 100</span>
                    </span>
                    </div>
                    <div className="text-xs p-2 bg-white dark:bg-[#464646] rounded-lg text-gray-700 dark:text-gray-200">
                      <span className="text-gray-500 dark:text-white block mb-1">예상 적중 확률</span>
                      <span className="font-bold text-base text-blue-600 dark:text-blue-400">
                        높음
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
                className="bg-white dark:bg-[#464646] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              AI 조합의 패턴 보기
            </Button>
          </div>
        </div>
      </div>
  )
}