"use client"

import { useState, useEffect } from "react"
import { Sparkles, Save, Check, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveLottoResult } from "@/utils/lotto-storage"
import AINumberDisplay from "@/components/lotto-analysis/ai-number-display"
import { useToast } from "@/hooks/use-toast"

// --- 1단계: 타입 및 헬퍼 함수 (상위 컴포넌트에서 Props로 받음) ---
type Grade = "하" | "중하" | "보통" | "중" | "중상" | "상" | "최상"

type FrequencyMap = Map<number, number>
type StringFrequencyMap = Map<string, number>

// 2. AI 추천에 필요한 모든 통계 데이터를 정의하는 인터페이스
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

// 3. 컴포넌트 Props 인터페이스 정의
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

export default function AIRecommendation({
                                           analyticsData,
                                           generatedStats,
                                           calculateBalanceScore,
                                           scoreToGrade,
                                           getGradeColor,
                                           getGradeDescription,
                                           generateCombination,
                                           getPairScore,
                                           getTripletScore,
                                           getRecentFrequencyScore,
                                           getGapScore,
                                           getQuadrupletScore,
                                           getAiPopularityScore,
                                           winningNumbersSet,
                                           latestDrawNo,
                                           onRecommendationGenerated,
                                           onAnalyzeNumbers,
                                           isGenerating,
                                         }: AIRecommendationProps) {
  // 5. 컴포넌트 내부 상태 변수들
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  const [isSaved, setIsSaved] = useState(false)
  const [aiGrade, setAiGrade] = useState<Grade | null>(null)
  const [aiScore, setAiScore] = useState<number | null>(null)
  const { toast } = useToast()

  /**
   * AI 추천 번호 생성 및 *자동 서버 저장*
   * "AI 추천 받기" 버튼 클릭 시 (isGenerating=true) 호출됩니다.
   */
  const generateAIRecommendation = async () => {
    // 1. (수행) 상태 초기화
    setIsSaved(false)
    setRecommendedNumbers([])
    setAiGrade(null)
    setAiScore(null)

    // 2. (수행) UI 멈춤 방지를 위한 비동기 처리
    await new Promise((resolve) => setTimeout(resolve, 0))

    // 3. (수행) 10만번의 시뮬레이션을 통해 최적의 조합을 찾는 Promise 실행
    const finalCombination = await new Promise<number[]>((resolve) => {
      // 3-1. 분석 데이터 및 상수 설정
      const {
        weightedNumberList,
        pairFrequencies,
        tripletFrequencies,
        quadrupletLastSeen,
        recentFrequencies,
        gapMap,
        latestDrawNumbers,
      } = analyticsData

      const RECENT_THRESHOLD = 156 // 4쌍둥이 페널티 기준 (3년)
      const ITERATIONS = 100000 // 10만 번의 조합을 테스트
      const TOP_K = 50 // 상위 50개 조합 저장
      const topCandidates: { combination: number[]; score: number }[] = []

      // 3-2. (수행) 10만번 반복
      for (let i = 0; i < ITERATIONS; i++) {
        const currentNumbers = generateCombination(weightedNumberList)
        const combinationKey = currentNumbers.join("-")

        if (winningNumbersSet.has(combinationKey)) {
          continue
        }

        // 3-2-1. (수정) 밸런스 점수(0~200점)를 직접 계산
        const balanceScore = calculateBalanceScore(currentNumbers, analyticsData)

        // 3-2-2. (기존) 다른 점수들 계산
        const pairScore = getPairScore(currentNumbers, pairFrequencies)
        const tripletScore = getTripletScore(currentNumbers, tripletFrequencies)
        const quadrupletScore = getQuadrupletScore(
          currentNumbers,
          quadrupletLastSeen,
          latestDrawNo,
          RECENT_THRESHOLD,
        )
        const recentScore = getRecentFrequencyScore(currentNumbers, recentFrequencies)
        const gapScore = getGapScore(currentNumbers, gapMap)
        const carryOverCount = currentNumbers.filter((num) => latestDrawNumbers.includes(num)).length
        let carryOverScore = 0
        if (carryOverCount === 0) carryOverScore = 20
        else if (carryOverCount === 1) carryOverScore = 15
        else if (carryOverCount === 2) carryOverScore = -10
        else carryOverScore = -30

        // 3-2-2-1. [신규] AI 인기 페널티/보너스 점수 계산
        const aiPopularityScore = getAiPopularityScore(currentNumbers, generatedStats)

        // 3-2-3. (수정) totalScore 가중치 조정 + [신규] AI 인기 점수 추가
        const totalScore =
          balanceScore * 0.08 +
          quadrupletScore * 0.1 +
          aiPopularityScore * 0.1 +
          (pairScore / 150) * 50 * 0.2 +
          (tripletScore / 20) * 50 * 0.15 +
          (recentScore / 30) * 50 * 0.05 +
          (gapScore / 600) * 50 * 0.1 +
          (carryOverScore / 20) * 50 * 0.1

        // 3-2-4. (기존) 상위 TOP_K 후보군 관리
        if (topCandidates.length < TOP_K) {
          topCandidates.push({ combination: currentNumbers, score: totalScore })
        } else {
          let minScore = topCandidates[0].score
          let minIndex = 0
          for (let j = 1; j < topCandidates.length; j++) {
            if (topCandidates[j].score < minScore) {
              minScore = topCandidates[j].score
              minIndex = j
            }
          }
          if (totalScore > minScore) {
            topCandidates[minIndex] = { combination: currentNumbers, score: totalScore }
          }
        }
      }

      // 3-3. (기존) 최종 조합 선택
      let combination: number[]
      if (topCandidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * topCandidates.length)
        combination = topCandidates[randomIndex].combination
      } else {
        combination = generateCombination(analyticsData.weightedNumberList)
      }

      // 3-4. (기존) 최종 조합 반환
      resolve(combination)
    })

    // --- 4단계: 결과 처리 및 *자동 서버 저장* ---
    const finalBalanceScore = calculateBalanceScore(finalCombination, analyticsData)
    const finalGrade = scoreToGrade(finalBalanceScore)

    setRecommendedNumbers(finalCombination)
    setAiGrade(finalGrade)
    setAiScore(finalBalanceScore)

    // 4-4. [수정] 서버 DB에 자동으로 저장 (통계 수집용)
    try {
      const response = await fetch("/api/log-draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numbers: finalCombination,
          source: "ai",
          score: finalBalanceScore,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || "서버 통계 저장 실패")
      }

      console.log("AI 추천 번호가 서버 통계 DB에 자동으로 저장되었습니다.")
    } catch (error: any) {
      console.error("자동 서버 저장 실패:", error.message)
      toast({
        title: "서버 통계 자동 저장 실패",
        description: "AI 번호 생성은 완료되었으나, 서버 통계 기록 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }

    if (onRecommendationGenerated) {
      onRecommendationGenerated(finalCombination)
    }
  }

  // 10. (기존) 'isGenerating' prop이 true가 되면 AI 추천 로직 실행
  useEffect(() => {
    if (isGenerating) {
      generateAIRecommendation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating])

  /**
   * [수정] "AI 번호 저장" 버튼 클릭 시 *로컬*에만 저장합니다.
   * 저장 시 다음 회차 정보(targetDrawNo)를 포함합니다.
   */
  const handleSaveToHistory = () => {
    if (recommendedNumbers.length === 6 && !isSaved) {
      // [추가] 다음 회차 번호 계산 (최신 회차 + 1)
      const targetDrawNo = latestDrawNo + 1

      // [수정] saveLottoResult 호출 시 targetDrawNo 전달
      const localSaveSuccess = saveLottoResult(recommendedNumbers, true, targetDrawNo)

      if (localSaveSuccess) {
        setIsSaved(true)
        toast({
          title: "기록 저장 완료",
          description: `${targetDrawNo}회차 AI 추천 번호가 '추첨 기록'에 저장되었습니다.`,
        })
      } else {
        toast({
          title: "저장 건너뜀",
          description: "이 번호는 이미 최근에 저장되었습니다.",
          variant: "destructive",
        })
      }
    }
  }

  /**
   * "당첨 패턴 보기" 버튼 클릭 시 (상위 컴포넌트로 이벤트 전달)
   */
  const handleAnalyzeAINumbers = () => {
    if (recommendedNumbers.length === 6 && onAnalyzeNumbers) {
      onAnalyzeNumbers(recommendedNumbers)
    }
  }

  if (recommendedNumbers.length === 0) {
    return null
  }

  return (
    <div className="p-4 bg-gray-200 dark:bg-[rgb(36,36,36)] rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-gray-800 dark:text-gray-200">AI 번호 추천</h3>
        </div>
      </div>
      <div>
        {/* AI 등급 및 번호 표시 영역 */}
        <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 mt-4">
          <div className="flex flex-col mb-3">
            <div className="flex justify-between items-center w-full gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                과거 당첨 패턴과 함께 등장한 번호 분석을 기반으로 생성된 추천 번호입니다.
              </p>
              {/* AI 등급 표시 (UI용) */}
              {aiGrade && (
                <div
                  className={`px-3 py-1.5 rounded-lg font-semibold text-sm whitespace-nowrap ${getGradeColor(
                    aiGrade,
                  )}`}
                >
                  {aiGrade}
                </div>
              )}
            </div>
            {/* AI 등급 설명 */}
            {aiGrade && (
              <div className="text-xs p-2 bg-white dark:bg-[#464646] rounded-lg text-gray-700 dark:text-gray-200 mt-3">
                <p className="font-medium mb-1">
                  추천 등급 안내 (밸런스 점수: {aiScore}점):
                </p>
                <p>
                  • {aiGrade}: {getGradeDescription(aiGrade)}
                </p>
              </div>
            )}
          </div>
          {/* AI 추천 번호 표시 */}
          <AINumberDisplay numbers={recommendedNumbers} />

          <div className="mt-4 flex flex-col items-center gap-3 md:flex-row md:justify-between md:items-center md:gap-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              * 이 추천은 과거 데이터 패턴을 기반으로 하며, 당첨을 보장하지 않습니다.
            </div>
          </div>
        </div>
        {/* 버튼 영역 (당첨 패턴 보기 / AI 번호 저장) */}
        <div className="mt-3 flex justify-between">
          <Button
            onClick={handleAnalyzeAINumbers}
            variant="outline"
            className="bg-white dark:bg-[#464646] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            당첨 패턴 보기
          </Button>
          {isSaved ? (
            <div className="text-sm text-green-600 flex items-center justify-center md:w-24 md:justify-end">
              <Check className="w-4 h-4 mr-1" />
              기록 저장됨
            </div>
          ) : (
            <Button
              onClick={handleSaveToHistory}
              className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white whitespace-nowrap"
            >
              <Save className="w-4 h-4 mr-1" />
              AI 번호 저장
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}