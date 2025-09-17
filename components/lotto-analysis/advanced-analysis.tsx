"use client"

import { useState, useEffect, useRef } from "react"
import AIRecommendation from "./ai-recommendation"
import MultipleNumberAnalysis from "./multiple-number-analysis"
import NumberDistribution from "./number-distribution"
import SimilarDraws from "./similar-draws"
import type { MultipleNumberType, SimilarDrawType } from "./types"

interface AdvancedAnalysisProps {
  numbers: number[]
  multipleNumbers: MultipleNumberType[]
  similarDraws: SimilarDrawType[]
  winningNumbersCount: number
  getBallColor: (number: number) => string
  onNumbersChange: (numbers: number[]) => void
}

export default function AdvancedAnalysis({
  numbers,
  multipleNumbers,
  similarDraws,
  winningNumbersCount,
  getBallColor,
  onNumbersChange,
}: AdvancedAnalysisProps) {
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  const [forceRefresh, setForceRefresh] = useState(0) // 강제 새로고침을 위한 상태 추가
  const isFirstRender = useRef(true)

  // 컴포넌트가 마운트될 때만 forceRefresh 값을 증가시킴
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      setForceRefresh((prev) => prev + 1)
    }
  }, [])

  const handleRecommendationGenerated = (newNumbers: number[]) => {
    setRecommendedNumbers(newNumbers)
  }

  // 추천 번호를 분석에 적용하는 핸들러
  const handleApplyToAnalysis = (numbers: number[]) => {
    if (onNumbersChange) {
      onNumbersChange(numbers)
    }
  }

  return (
    <div className="space-y-6">
      {/* AI 번호 추천 섹션 */}
      <AIRecommendation
        numbers={numbers}
        multipleNumbers={multipleNumbers}
        similarDraws={similarDraws}
        getBallColor={getBallColor}
        onRecommendationGenerated={handleRecommendationGenerated}
        forceRefresh={forceRefresh}
        onApplyToAnalysis={handleApplyToAnalysis} // 분석에 적용하는 콜백 전달
      />

      {/* 다중 번호 분석 섹션 */}
      <MultipleNumberAnalysis multipleNumbers={multipleNumbers} getBallColor={getBallColor} />

      {/* 번호 분포 시각화 섹션 */}
      <NumberDistribution numbers={numbers} getBallColor={getBallColor} />

      {/* 유사한 과거 당첨 번호 섹션 */}
      <SimilarDraws numbers={numbers} similarDraws={similarDraws} getBallColor={getBallColor} />
    </div>
  )
}
