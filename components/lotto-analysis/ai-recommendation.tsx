"use client"

import { useState, useEffect, useMemo } from "react"
import { Sparkles, Save, Check, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { winningNumbers } from "@/data/winning-numbers" // 전체 당첨 번호 데이터
import { saveLottoResult } from "@/utils/lotto-storage"
import AINumberDisplay from "@/components/lotto-analysis/ai-number-display"

interface AIRecommendationProps {
  userSelectedNumbers?: number[]
  onRecommendationGenerated?: (numbers: number[]) => void
  onAnalyzeNumbers?: (numbers: number[]) => void // Add callback for analyzing numbers
}

type Grade = "하" | "중하" | "보통" | "중" | "중상" | "상" | "최상"

// --- 1단계: 패턴 분석 로직 (useMemo로 캐시) ---
type FrequencyMap = Map<number, number>
type PairFrequencyMap = Map<string, number>

/**
 * data/winning-numbers.ts 데이터를 기반으로 번호별 빈도,
 * 동반출현 빈도, 가중치 리스트를 계산하고 캐시하는 훅
 */
const useLottoAnalytics = () => {
  return useMemo(() => {
    const numberFrequencies: FrequencyMap = new Map()
    const pairFrequencies: PairFrequencyMap = new Map()
    const weightedNumberList: number[] = []

    for (const draw of winningNumbers) {
      const drawNumbers = draw.numbers.sort((a, b) => a - b) // 분석을 위해 정렬

      // 1. 번호별 빈도 계산 및 가중치 리스트 추가
      for (const num of drawNumbers) {
        const freq = (numberFrequencies.get(num) || 0) + 1
        numberFrequencies.set(num, freq)
        weightedNumberList.push(num) // 가중치 샘플링을 위해 리스트에 추가
      }
      // 보너스 번호도 빈도에 추가
      const bonusFreq = (numberFrequencies.get(draw.bonusNo) || 0) + 1
      numberFrequencies.set(draw.bonusNo, bonusFreq)
      weightedNumberList.push(draw.bonusNo)

      // 2. 동반 출현(궁합수) 빈도 계산 (6개 번호의 모든 2-조합)
      for (let i = 0; i < drawNumbers.length; i++) {
        for (let j = i + 1; j < drawNumbers.length; j++) {
          const key = `${drawNumbers[i]}-${drawNumbers[j]}`
          pairFrequencies.set(key, (pairFrequencies.get(key) || 0) + 1)
        }
      }
    }

    // 1~45번까지 모든 번호가 최소 1의 빈도를 갖도록 보장 (한 번도 안 나온 번호도 뽑힐 수 있게)
    for (let i = 1; i <= 45; i++) {
      if (!numberFrequencies.has(i)) {
        numberFrequencies.set(i, 1)
        weightedNumberList.push(i) // 가중치 리스트에도 최소 1번 추가
      }
    }

    return { numberFrequencies, pairFrequencies, weightedNumberList }
  }, [])
}

// --- 2단계: 신규 AI 추천 로직 ---

/**
 * 가중치 리스트에서 무작위로 번호 하나를 뽑는 함수
 * @param list - 빈도에 따라 가중치가 적용된 번호 배열
 */
const getWeightedRandomNumber = (list: number[]): number => {
  const randomIndex = Math.floor(Math.random() * list.length)
  return list[randomIndex]
}

/**
 * 가중치 기반으로 6개 번호 조합 생성
 * @param weightedList - 빈도 가중치가 적용된 번호 배열
 */
const generateCombination = (weightedList: number[]): number[] => {
  const numbers = new Set<number>()
  while (numbers.size < 6) {
    numbers.add(getWeightedRandomNumber(weightedList))
  }
  return Array.from(numbers).sort((a, b) => a - b)
}

/**
 * 조합의 등급 점수 계산 (기존 calculateGrade 활용)
 * @param grade - "최상" ~ "하" 등급
 */
const getGradeScore = (grade: Grade): number => {
  switch (grade) {
    case "최상":
      return 50
    case "상":
      return 30
    case "중상":
      return 15
    case "중":
      return 5
    case "보통":
      return 0
    case "중하":
      return -10
    case "하":
      return -20
  }
}

/**
 * 조합의 동반 출현(궁합수) 점수 계산
 * @param numbers - 6개 번호 조합 (정렬된 상태)
 * @param pairMap - 동반 출현 빈도 맵
 */
const getPairScore = (numbers: number[], pairMap: PairFrequencyMap): number => {
  let score = 0
  // 6개 번호로 만들 수 있는 15개의 2-조합을 모두 확인
  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      const key = `${numbers[i]}-${numbers[j]}` // 번호가 정렬되어 있으므로 키가 일치함
      score += pairMap.get(key) || 0 // 맵에 없으면 0점
    }
  }
  return score
}

// --- 기존 헬퍼 함수들 ---
const calculateGrade = (numbers: number[]): Grade => {
  const sum = numbers.reduce((acc, num) => acc + num, 0)
  const avg = sum / numbers.length

  let consecutiveCount = 0
  for (let i = 0; i < numbers.length - 1; i++) {
    if (numbers[i + 1] - numbers[i] === 1) {
      consecutiveCount++
    }
  }

  const oddCount = numbers.filter((n) => n % 2 === 1).length
  const evenCount = 6 - oddCount
  const oddEvenBalance = Math.abs(oddCount - evenCount)

  const section1 = numbers.filter((n) => n <= 15).length
  const section2 = numbers.filter((n) => n > 15 && n <= 30).length
  const section3 = numbers.filter((n) => n > 30).length
  const sectionBalance = Math.max(section1, section2, section3) - Math.min(section1, section2, section3)

  let score = 50

  score += 10 - Math.abs(avg - 23)
  score -= consecutiveCount * 5
  score -= oddEvenBalance * 3
  score -= sectionBalance * 4

  if (score >= 70) return "최상"
  if (score >= 60) return "상"
  if (score >= 50) return "중상"
  if (score >= 40) return "중"
  if (score >= 30) return "보통"
  if (score >= 20) return "중하"
  return "하"
}

const getGradeColor = (grade: Grade): string => {
  switch (grade) {
    case "최상":
      return "border border-purple-100 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950"
    case "상":
      return "border border-blue-100 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950"
    case "중상":
      return "border border-green-100 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950"
    case "중":
      return "border border-teal-100 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950"
    case "보통":
      return "border border-yellow-100 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950"
    case "중하":
      return "border border-orange-100 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950"
    case "하":
      return "border border-red-100 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950"
  }
}

const getGradeDescription = (grade: Grade): string => {
  switch (grade) {
    case "최상":
      return "번호 총합, 홀짝 비율(3:3), 구간별 분포가 통계적으로 가장 이상적인 황금 비율에 가깝습니다."
    case "상":
      return "전체적인 균형이 매우 뛰어난 조합입니다. 통계적으로 안정적인 패턴을 보입니다."
    case "중상":
      return "균형이 잘 잡힌 좋은 조합입니다. 대부분의 통계적 기준을 양호하게 만족합니다."
    case "중":
      return "평균적인 조합입니다. 한두 가지 요소(예: 홀짝 비율)가 다소 치우쳤을 수 있습니다."
    case "보통":
      return "통계적 기준에서 약간 벗어나는 경향을 보이지만, 여전히 가능성이 있는 조합입니다."
    case "중하":
      return "번호가 특정 구간에 몰려있거나 홀짝 비율의 균형이 다소 맞지 않는 조합입니다."
    case "하":
      return "연속 번호가 많거나, 번호가 한 곳에 집중되는 등 통계적 평균에서 많이 벗어난 조합입니다."
  }
}

// --- 3단계: 컴포넌트 구현 ---
export default function AIRecommendation({
                                           userSelectedNumbers,
                                           onRecommendationGenerated,
                                           onAnalyzeNumbers,
                                         }: AIRecommendationProps) {
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [aiGrade, setAiGrade] = useState<Grade | null>(null)
  const [userGrade, setUserGrade] = useState<Grade | null>(null)
  const [showUserAnalysis, setShowUserAnalysis] = useState(false)
  const [originalUserNumbers, setOriginalUserNumbers] = useState<number[]>([])

  // 1단계: 패턴 데이터 캐싱
  const { pairFrequencies, weightedNumberList } = useLottoAnalytics()

  useEffect(() => {
    if (userSelectedNumbers && userSelectedNumbers.length === 6 && originalUserNumbers.length === 0) {
      setOriginalUserNumbers([...userSelectedNumbers])
    }
  }, [userSelectedNumbers, originalUserNumbers.length])

  /**
   * AI 추천 번호 생성 (고급 알고리즘)
   */
  const generateAIRecommendation = () => {
    setIsGenerating(true)
    setIsSaved(false)

    // 사용자 번호가 있다면 등급 계산
    if (originalUserNumbers.length === 6) {
      const sortedUserNumbers = [...originalUserNumbers].sort((a, b) => a - b)
      setUserGrade(calculateGrade(sortedUserNumbers))
      setShowUserAnalysis(true)
    }

    // AI가 연산 중임을 보여주기 위해 setTimeout 사용 (UX)
    setTimeout(() => {
      const ITERATIONS = 5000 // 5000개의 후보 조합 생성 및 테스트
      let bestCombination: number[] = []
      let bestScore = -Infinity

      // '생성 및 평가' 시작
      for (let i = 0; i < ITERATIONS; i++) {
        // 1. 후보 조합 생성 (가중치 기반)
        const currentNumbers = generateCombination(weightedNumberList)

        // 2. 후보 조합 평가
        const grade = calculateGrade(currentNumbers)
        const gradeScore = getGradeScore(grade)
        const pairScore = getPairScore(currentNumbers, pairFrequencies)

        // AI 종합 점수 = (등급 점수 70%) + (궁합수 점수 30%)
        // 궁합수 점수는 조합마다 편차가 크므로 정규화(예: 0~50)가 필요할 수 있으나,
        // 여기서는 가중치로 조절하여 간단히 구현합니다.
        const totalScore = gradeScore * 0.7 + (pairScore / 50) * 0.3 // pairScore를 50으로 나누어 영향력 조절

        // 3. 최고 점수 갱신
        if (totalScore > bestScore) {
          bestScore = totalScore
          bestCombination = currentNumbers
        }
      }

      // 최고 점수 조합을 결과로 설정
      const finalGrade = calculateGrade(bestCombination)
      setRecommendedNumbers(bestCombination)
      setAiGrade(finalGrade)

      if (onRecommendationGenerated) {
        onRecommendationGenerated(bestCombination)
      }

      setIsGenerating(false)
    }, 500) // 0.5초 딜레이로 "연산 중" 느낌을 줍니다.
  }

  const handleSaveToHistory = () => {
    if (recommendedNumbers.length > 0) {
      saveLottoResult(recommendedNumbers, true)
      setIsSaved(true)
    }
  }

  const handleAnalyzeUserNumbers = () => {
    if (originalUserNumbers.length === 6 && onAnalyzeNumbers) {
      onAnalyzeNumbers(originalUserNumbers)
    }
  }

  const handleAnalyzeAINumbers = () => {
    if (recommendedNumbers.length === 6 && onAnalyzeNumbers) {
      onAnalyzeNumbers(recommendedNumbers)
    }
  }

  return (
    <div className="p-4 bg-gray-200 dark:bg-[rgb(36,36,36)] rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-gray-800 dark:text-gray-200">AI 번호 추천</h3>
        </div>
        <Button
          onClick={generateAIRecommendation}
          disabled={isGenerating}
          className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-4 h-4 mr-1 animate-spin" />
              패턴 연산 중...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1" />
              AI 추천 받기
            </>
          )}
        </Button>
      </div>

      {showUserAnalysis && originalUserNumbers.length === 6 && userGrade && recommendedNumbers.length > 0 && (
        <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 mb-4">
          <div className="flex items-center mb-3">
            <h4 className="font-medium text-gray-800 dark:text-gray-200">추첨 번호 분석</h4>
          </div>
          <div className="flex flex-col mb-3">
            <div className="flex justify-between items-center w-full gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                추첨기에서 선택한 번호의 분석 결과입니다.
              </p>
              <div
                className={`px-3 py-1.5 rounded-lg font-semibold text-sm whitespace-nowrap ${getGradeColor(userGrade)}`}
              >
                {userGrade}
              </div>
            </div>
            <div className="text-xs p-2 bg-white dark:bg-[#464646] rounded-lg text-gray-700 dark:text-gray-200 mt-3">
              <p className="font-medium mb-1">추첨 번호 등급 안내:</p>
              <p>
                • {userGrade}: {getGradeDescription(userGrade)}
              </p>
            </div>
          </div>
          <AINumberDisplay numbers={originalUserNumbers} />
          <div className="mt-3 flex justify-center">
            <Button
              onClick={handleAnalyzeUserNumbers}
              variant="outline"
              className="bg-white dark:bg-[#464646] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-1" />추첨 번호로 분석하기
            </Button>
          </div>
        </div>
      )}

      {recommendedNumbers.length > 0 && (
        <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 mt-4">
          <div className="flex items-center mb-3">
            <h4 className="font-medium text-gray-800 dark:text-gray-200">AI 추천 번호</h4>
          </div>
          <div className="flex flex-col mb-3">
            <div className="flex justify-between items-center w-full gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                과거 당첨 패턴과 함께 등장한 번호 분석을 기반으로 생성된 추천 번호입니다.
              </p>
              {aiGrade && (
                <div
                  className={`px-3 py-1.5 rounded-lg font-semibold text-sm whitespace-nowrap ${getGradeColor(aiGrade)}`}
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
          <div className="mt-3 flex justify-center">
            <Button
              onClick={handleAnalyzeAINumbers}
              variant="outline"
              className="bg-white dark:bg-[#464646] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-1" />AI 추천 번호 로 분석하기
            </Button>
          </div>
          <div className="mt-4 flex flex-col items-center gap-3 md:flex-row md:justify-between md:items-center md:gap-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              * 이 추천은 과거 데이터 패턴을 기반으로 하며, 당첨을 보장하지 않습니다.
            </div>
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
                AI 추천 번호 저장
              </Button>
            )}
          </div>
        </div>
      )}

      {recommendedNumbers.length === 0 && !showUserAnalysis && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-xl">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">AI가 분석한 추천 번호를 받아보세요</p>
        </div>
      )}
    </div>
  )
}