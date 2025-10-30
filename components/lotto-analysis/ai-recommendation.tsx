"use client"

import { useState, useEffect } from "react"
import { Sparkles, Save, Check, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRandomNumber } from "@/utils/lotto-utils"
import { saveLottoResult } from "@/utils/lotto-storage"
import AINumberDisplay from "@/components/lotto-analysis/ai-number-display"

interface AIRecommendationProps {
  userSelectedNumbers?: number[]
  onRecommendationGenerated?: (numbers: number[]) => void
  onAnalyzeNumbers?: (numbers: number[]) => void // Add callback for analyzing numbers
}

type Grade = "하" | "중하" | "보통" | "중" | "중상" | "상" | "최상"

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

  useEffect(() => {
    if (userSelectedNumbers && userSelectedNumbers.length === 6 && originalUserNumbers.length === 0) {
      setOriginalUserNumbers([...userSelectedNumbers])
    }
  }, [userSelectedNumbers, originalUserNumbers.length])

  const generateAIRecommendation = () => {
    setIsGenerating(true)
    setIsSaved(false)

    if (originalUserNumbers.length === 6) {
      const sortedUserNumbers = [...originalUserNumbers].sort((a, b) => a - b)
      setUserGrade(calculateGrade(sortedUserNumbers))
      setShowUserAnalysis(true)
    }

    setTimeout(() => {
      const numbers: number[] = []
      const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1)

      for (let i = 0; i < 6; i++) {
        const randomIndex = getRandomNumber(0, availableNumbers.length - 1)
        numbers.push(availableNumbers[randomIndex])
        availableNumbers.splice(randomIndex, 1)
      }

      const sortedNumbers = numbers.sort((a, b) => a - b)
      setRecommendedNumbers(sortedNumbers)
      setAiGrade(calculateGrade(sortedNumbers))

      if (onRecommendationGenerated) {
        onRecommendationGenerated(sortedNumbers)
      }

      setIsGenerating(false)
    }, 1500)
  }

  const handleSaveToHistory = () => {
    if (recommendedNumbers.length > 0) {
      saveLottoResult(recommendedNumbers, true)
      setIsSaved(true)
    }
  }

  const getGradeDescription = (grade: Grade): string => {
    switch (grade) {
      case "최상":
        return "번호 분포, 홀짝 균형, 구간 분포가 매우 우수"
      case "상":
        return "번호 분포와 균형이 우수"
      case "중상":
        return "번호 분포와 균형이 양호"
      case "중":
        return "번호 분포와 균형이 보통"
      case "보통":
        return "번호 분포와 균형이 평균적"
      case "중하":
        return "번호 분포와 균형이 다소 부족"
      case "하":
        return "번호 분포와 균형이 부족"
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
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1" />
              AI 추천 받기
            </>
          )}
        </Button>
      </div>

      {showUserAnalysis && originalUserNumbers.length === 6 && userGrade && (
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
              <BarChart3 className="w-4 h-4 mr-1" />이 번호로 분석하기
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
              <BarChart3 className="w-4 h-4 mr-1" />이 번호로 분석하기
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
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white rounded-xl">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">AI가 분석한 추천 번호를 받아보세요</p>
        </div>
      )}
    </div>
  )
}
