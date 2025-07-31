"use client"

import { TrendingUp } from "lucide-react"
import type { CommonProps } from "./types"

interface GapAnalysisProps extends CommonProps {
  numbers: number[]
}

export default function GapAnalysis({ numbers }: GapAnalysisProps) {
  const sortedNums = [...numbers].sort((a, b) => a - b)
  const gaps: number[] = []

  for (let i = 0; i < sortedNums.length - 1; i++) {
    gaps.push(sortedNums[i + 1] - sortedNums[i])
  }

  const avgGap = Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length)
  const maxGap = Math.max(...gaps)
  const minGap = Math.min(...gaps)

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center mb-3">
        <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="font-medium text-gray-800">번호 간격 분석</h3>
      </div>
      <div className="space-y-2">
        <p className="text-gray-700">
          <span className="font-medium">번호 간 간격:</span> {gaps.join(", ")}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">평균 간격:</span> {avgGap}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">최대 간격:</span> {maxGap}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">최소 간격:</span> {minGap}
        </p>
        <p className="text-gray-700 mt-2">
          {avgGap < 7
            ? "번호 간 간격이 좁은 편입니다. 번호가 특정 범위에 집중되어 있습니다."
            : avgGap > 10
              ? "번호 간 간격이 넓은 편입니다. 번호가 넓은 범위에 분포되어 있습니다."
              : "번호 간 간격이 적절합니다."}
        </p>
      </div>
    </div>
  )
}
