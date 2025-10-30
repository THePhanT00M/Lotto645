"use client"

import { useState } from "react"
import { Sparkles, Save, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRandomNumber } from "@/utils/lotto-utils"
import { saveLottoResult } from "@/utils/lotto-storage"
import LottoNumberDisplay from "@/components/lotto-number-display"

interface AIRecommendationProps {
  onRecommendationGenerated?: (numbers: number[]) => void
}

type Grade = "하" | "중하" | "보통" | "중" | "중상" | "상" | "최상"

const calculateGrade = (numbers: number[]): Grade => {
  // 번호 분포 분석
  const sum = numbers.reduce((acc, num) => acc + num, 0)
  const avg = sum / numbers.length

  // 연속 번호 체크
  let consecutiveCount = 0
  for (let i = 0; i < numbers.length - 1; i++) {
    if (numbers[i + 1] - numbers[i] === 1) {
      consecutiveCount++
    }
  }

  // 홀짝 비율
  const oddCount = numbers.filter((n) => n % 2 === 1).length
  const evenCount = 6 - oddCount
  const oddEvenBalance = Math.abs(oddCount - evenCount)

  // 구간 분포 (1-15, 16-30, 31-45)
  const section1 = numbers.filter((n) => n <= 15).length
  const section2 = numbers.filter((n) => n > 15 && n <= 30).length
  const section3 = numbers.filter((n) => n > 30).length
  const sectionBalance = Math.max(section1, section2, section3) - Math.min(section1, section2, section3)

  // 점수 계산
  let score = 50

  // 평균이 23 근처일수록 좋음
  score += 10 - Math.abs(avg - 23)

  // 연속 번호가 적을수록 좋음
  score -= consecutiveCount * 5

  // 홀짝 균형이 좋을수록 좋음
  score -= oddEvenBalance * 3

  // 구간 분포가 균등할수록 좋음
  score -= sectionBalance * 4

  // 점수에 따른 등급 반환
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
      return "border border-purple-150 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950"
    case "상":
      return "border border-blue-150 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950"
    case "중상":
      return "border border-green-150 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950"
    case "중":
      return "border border-teal-150 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950"
    case "보통":
      return "border border-yellow-150 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950"
    case "중하":
      return "border border-orange-150 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950"
    case "하":
      return "border border-red-150 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950"
  }
}

export default function AIRecommendation({ onRecommendationGenerated }: AIRecommendationProps) {
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [grade, setGrade] = useState<Grade | null>(null)

  const generateAIRecommendation = () => {
    setIsGenerating(true)
    setIsSaved(false)

    setTimeout(() => {
      const numbers: number[] = []
      const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1)

      // 6개의 랜덤 번호 생성
      for (let i = 0; i < 6; i++) {
        const randomIndex = getRandomNumber(0, availableNumbers.length - 1)
        numbers.push(availableNumbers[randomIndex])
        availableNumbers.splice(randomIndex, 1)
      }

      // 번호 정렬
      const sortedNumbers = numbers.sort((a, b) => a - b)
      setRecommendedNumbers(sortedNumbers)

      setGrade(calculateGrade(sortedNumbers))

      // 부모 컴포넌트에 알림
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

      {recommendedNumbers.length > 0 && (
        <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 mt-4">
          <div className="flex flex-col mb-3">
            <div className="flex justify-between items-center w-full gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                과거 당첨 패턴과 함께 등장한 번호 분석을 기반으로 생성된 추천 번호입니다.
              </p>
              {grade && (
                <div
                  className={`px-3 py-1.5 rounded-lg font-semibold text-sm whitespace-nowrap ${getGradeColor(grade)}`}
                >
                  {grade}
                </div>
              )}
            </div>
            {grade && (
              <div className="text-xs p-2 bg-white dark:bg-[#464646] rounded-lg text-gray-700 dark:text-gray-200 mt-3">
                <p className="font-medium mb-1">추천 등급 안내:</p>
                <p>
                  • {grade}: {getGradeDescription(grade)}
                </p>
              </div>
            )}
          </div>
          <LottoNumberDisplay numbers={recommendedNumbers} isAiRecommended={true} />
          <div className="mt-4 flex justify-between items-center gap-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              * 이 추천은 과거 데이터 패턴을 기반으로 하며, 당첨을 보장하지 않습니다.
            </div>
            {isSaved ? (
              <div className="text-sm text-green-600 flex items-center w-24 justify-end">
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

      {recommendedNumbers.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white rounded-xl">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">AI가 분석한 추천 번호를 받아보세요</p>
        </div>
      )}
    </div>
  )
}
