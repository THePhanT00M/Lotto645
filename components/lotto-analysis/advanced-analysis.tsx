"use client"

import { useState, useEffect, useRef } from "react"
import AIRecommendation from "./ai-recommendation"
import MultipleNumberAnalysis from "./multiple-number-analysis"
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
  const [forceRefresh, setForceRefresh] = useState(0)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      setForceRefresh((prev) => prev + 1)
    }
  }, [])

  const handleRecommendationGenerated = (newNumbers: number[]) => {
    setRecommendedNumbers(newNumbers)
  }

  return (
    <div className="space-y-6">
      <AIRecommendation
        userSelectedNumbers={numbers}
        onRecommendationGenerated={handleRecommendationGenerated}
        onAnalyzeNumbers={onNumbersChange}
      />

      <MultipleNumberAnalysis multipleNumbers={multipleNumbers} getBallColor={getBallColor} />
    </div>
  )
}
