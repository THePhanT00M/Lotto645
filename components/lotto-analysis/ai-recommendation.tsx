"use client"

import { useState, useEffect } from "react"
import { Sparkles, Save, Check, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
// import { winningNumbers } from "@/data/winning-numbers" // 정적 데이터 import 제거
import { saveLottoResult } from "@/utils/lotto-storage"
import AINumberDisplay from "@/components/lotto-analysis/ai-number-display"

// --- 1단계: 타입 및 헬퍼 함수 (이제 상위에서 props로 받음) ---
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
  latestDrawNo: number // (NEW)
  winningNumbersSet: Set<string> // (NEW)
}

// --- 3단계: 컴포넌트 구현 ---

interface AIRecommendationProps {
  analyticsData: LottoAnalytics
  calculateGrade: (numbers: number[], stats: LottoAnalytics) => Grade
  getGradeColor: (grade: Grade) => string
  getGradeDescription: (grade: Grade) => string
  // AI 생성 헬퍼
  generateCombination: (weightedList: number[]) => number[]
  getGradeScore: (grade: Grade) => number
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
  winningNumbersSet: Set<string> // (MODIFIED) 부모로부터 직접 받음
  latestDrawNo: number // (NEW) 부모로부터 직접 받음
  // 콜백
  onRecommendationGenerated?: (numbers: number[]) => void
  onAnalyzeNumbers?: (numbers: number[]) => void
  isGenerating: boolean // 로딩 상태를 props로 받음
}

export default function AIRecommendation({
                                           analyticsData,
                                           calculateGrade,
                                           getGradeColor,
                                           getGradeDescription,
                                           generateCombination,
                                           getGradeScore,
                                           getPairScore,
                                           getTripletScore,
                                           getRecentFrequencyScore,
                                           getGapScore,
                                           getQuadrupletScore,
                                           winningNumbersSet, // (MODIFIED)
                                           latestDrawNo, // (NEW)
                                           onRecommendationGenerated,
                                           onAnalyzeNumbers,
                                           isGenerating,
                                         }: AIRecommendationProps) {
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  // const [isGenerating, setIsGenerating] = useState(false) // 로딩 상태를 prop으로 받음
  const [isSaved, setIsSaved] = useState(false)
  const [aiGrade, setAiGrade] = useState<Grade | null>(null)

  // userSelectedNumbers 관련 로직 모두 제거

  /**
   * AI 추천 번호 생성 (고급 알고리즘)
   */
  const generateAIRecommendation = async () => {
    // --- 1단계: 상태 초기화 ---
    // setIsGenerating(true) // 로딩 상태 관리를 부모로 이동
    setIsSaved(false)
    setRecommendedNumbers([])
    setAiGrade(null)

    // --- 2단계: UI가 멈추지 않도록 비동기 처리 ---
    // 현재 함수를 비동기로 실행하여 로딩 스피너 등 UI가 멈추지 않고 렌더링될 시간을 줍니다.
    await new Promise((resolve) => setTimeout(resolve, 0))

    // --- 3단계: 조합 생성 및 평가 (핵심 로직) ---
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
      } = analyticsData // (MODIFIED) analyticsData에서 모두 가져옴

      const RECENT_THRESHOLD = 156 // 4쌍둥이 페널티 기준 (3년)
      // const latestDrawNo = winningNumbers[winningNumbers.length - 1].drawNo // (REMOVED) prop으로 받음

      const ITERATIONS = 100000 // 10만 번의 조합을 테스트
      const TOP_K = 50 // 가장 점수가 높은 상위 50개의 조합을 저장
      const topCandidates: { combination: number[]; score: number }[] = []

      // 3-2. 설정한 횟수(ITERATIONS)만큼 조합 생성 및 평가 반복
      for (let i = 0; i < ITERATIONS; i++) {
        // 3-2-1. 통계적 가중치에 따라 6개 번호 조합 생성
        const currentNumbers = generateCombination(weightedNumberList)
        const combinationKey = currentNumbers.join("-")

        // 3-2-2. 과거 1등 당첨 번호와 동일한 조합인지 확인 (동일하면 폐기)
        if (winningNumbersSet.has(combinationKey)) { // (MODIFIED) prop 사용
          continue
        }

        // 3-2-3. 생성된 조합의 각종 통계 점수 계산
        // A. 조합 등급 (밸런스) 점수
        const grade = calculateGrade(currentNumbers, analyticsData)
        const gradeScore = getGradeScore(grade)
        // B. 2개 번호(궁합) 점수
        const pairScore = getPairScore(currentNumbers, pairFrequencies)
        // C. 3개 번호(궁합) 점수
        const tripletScore = getTripletScore(currentNumbers, tripletFrequencies)
        // D. 4개 번호(궁합) 페널티 (최근 3년 내 나온 4쌍둥이 조합이면 큰 페널티)
        const quadrupletScore = getQuadrupletScore(
          currentNumbers,
          quadrupletLastSeen,
          latestDrawNo, // (MODIFIED) prop 사용
          RECENT_THRESHOLD,
        )
        // E. 최근 출현 빈도 점수 (최근 2년)
        const recentScore = getRecentFrequencyScore(currentNumbers, recentFrequencies)
        // F. 미출현 기간(Gap) 점수
        const gapScore = getGapScore(currentNumbers, gapMap)

        // G. (NEW) 이월수 점수
        const carryOverCount = currentNumbers.filter(num => latestDrawNumbers.includes(num)).length;
        let carryOverScore = 0;
        if (carryOverCount === 0) carryOverScore = 20;      // 0개 (가장 흔함)
        else if (carryOverCount === 1) carryOverScore = 15; // 1개 (두번째로 흔함)
        else if (carryOverCount === 2) carryOverScore = -10; // 2개 (드묾)
        else carryOverScore = -30;                          // 3개 이상 (매우 드묾)

        // 3-2-4. 최종 점수 계산 (각 점수에 가중치를 부여하여 합산)
        // --- (MODIFIED) ---
        const totalScore =
          gradeScore * 0.2 + // 밸런스(등급) 20%
          quadrupletScore * 0.1 + // 4쌍둥이 페널티 10%
          (pairScore / 150) * 50 * 0.30 + // 2쌍둥이 점수 30% (기존 35%)
          (tripletScore / 20) * 50 * 0.15 + // 3쌍둥이 점수 15% (기존 20%)
          (recentScore / 30) * 50 * 0.05 + // 최근 빈도 점수 5%
          (gapScore / 600) * 50 * 0.1 + // 미출현 기간 점수 10%
          (carryOverScore / 20) * 50 * 0.1; // (NEW) 이월수 점수 10%

        // 3-2-5. 상위 TOP_K 후보군 관리
        if (topCandidates.length < TOP_K) {
          // 아직 50개가 안 찼으면 그냥 추가
          topCandidates.push({ combination: currentNumbers, score: totalScore })
        } else {
          // 50개가 찼으면, 현재 후보군 중 가장 낮은 점수와 비교
          let minScore = topCandidates[0].score
          let minIndex = 0
          for (let j = 1; j < topCandidates.length; j++) {
            if (topCandidates[j].score < minScore) {
              minScore = topCandidates[j].score
              minIndex = j
            }
          }
          // 현재 생성된 조합이 후보군 중 가장 낮은 점수보다 높으면 교체
          if (totalScore > minScore) {
            topCandidates[minIndex] = { combination: currentNumbers, score: totalScore }
          }
        }
      } // End of ITERATIONS loop

      // 3-3. 최종 조합 선택
      let combination: number[]
      if (topCandidates.length > 0) {
        // 10만 번의 테스트 중 가장 우수했던 상위 50개 조합 중 하나를 무작위로 선택
        const randomIndex = Math.floor(Math.random() * topCandidates.length)
        combination = topCandidates[randomIndex].combination
      } else {
        // (예외 처리) 만약 후보군이 비어있다면(예: ITERATIONS가 0), 그냥 하나 생성
        combination = generateCombination(analyticsData.weightedNumberList)
      }

      // 3-4. 최종 조합 반환
      resolve(combination)
    })

    // --- 4단계: 결과 처리 ---
    // 4-1. 최종 선택된 조합의 등급 계산
    const finalGrade = calculateGrade(finalCombination, analyticsData)

    // 4-2. React 상태 업데이트 (UI 변경)
    setRecommendedNumbers(finalCombination)
    setAiGrade(finalGrade)

    // 4-3. 부모 컴포넌트(advanced-analysis)에 생성된 번호 전달
    if (onRecommendationGenerated) {
      onRecommendationGenerated(finalCombination)
    }

    // setIsGenerating(false) // 로딩 상태 관리를 부모로 이동
  }

  // 'AI 추천 받기' 버튼이 상위로 이동했으므로,
  // 이 컴포넌트가 렌더링 될 때 isGenerating prop을 확인하여
  // 추천 번호 생성을 트리거합니다.
  useEffect(() => {
    if (isGenerating) {
      generateAIRecommendation()
    }
    // isGenerating이 true가 될 때만 이 함수를 실행합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating])

  const handleSaveToHistory = () => {
    if (recommendedNumbers.length > 0) {
      saveLottoResult(recommendedNumbers, true)
      setIsSaved(true)
    }
  }

  const handleAnalyzeAINumbers = () => {
    if (recommendedNumbers.length === 6 && onAnalyzeNumbers) {
      onAnalyzeNumbers(recommendedNumbers)
    }
  }

  // '추첨 번호' 카드 JSX 및 플레이스홀더 JSX 제거됨

  // AI 추천 번호가 있을 때만 이 카드를 렌더링합니다.
  if (recommendedNumbers.length === 0) {
    // 상위 컴포넌트의 '추첨 번호' 카드에 있는 플레이스홀더가
    // 이 컴포넌트가 비어있을 때 표시되므로 여기서는 null을 반환합니다.
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
        <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 mt-4">
          <div className="flex flex-col mb-3">
            <div className="flex justify-between items-center w-full gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                과거 당첨 패턴과 함께 등장한 번호 분석을 기반으로 생성된 추천 번호입니다.
              </p>
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
            {aiGrade && (
              <div className="text-xs p-2 bg-white dark:bg-[#464646] rounded-lg text-gray-700 dark:text-gray-200 mt-3">
                <p className="font-medium mb-1">추천 등급 안내:</p>
                <p>
                  • {aiGrade}: {getGradeDescription(aiGrade)}
                </p>
              </div>
            )}
          </div>
          <AINumberDisplay numbers={recommendedNumbers} />

          <div className="mt-4 flex flex-col items-center gap-3 md:flex-row md:justify-between md:items-center md:gap-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              * 이 추천은 과거 데이터 패턴을 기반으로 하며, 당첨을 보장하지 않습니다.
            </div>
          </div>
        </div>
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