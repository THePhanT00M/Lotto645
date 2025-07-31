import { AlertTriangle } from "lucide-react"

interface BasicAnalysisProps {
  analysis: {
    sumAnalysis: string
    rangeAnalysis: string
    oddEvenAnalysis: string
    consecutiveAnalysis: string
    frequencyAnalysis: string
    historyAnalysis: {
      matchFound: boolean
      message: string
      drawNo?: number
      date?: string
    } | null
  }
}

export default function BasicAnalysis({ analysis }: BasicAnalysisProps) {
  return (
    <div className="space-y-4">
      {analysis.historyAnalysis?.matchFound && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-red-700 mb-1">1등 번호 중복 경고!</h3>
            <p className="text-red-700">{analysis.historyAnalysis.message}</p>
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">합계 분석</h3>
        <p className="text-gray-700">{analysis.sumAnalysis}</p>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">번호 범위 분석</h3>
        <p className="text-gray-700">{analysis.rangeAnalysis}</p>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">홀짝 분석</h3>
        <p className="text-gray-700">{analysis.oddEvenAnalysis}</p>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">연속 번호 분석</h3>
        <p className="text-gray-700">{analysis.consecutiveAnalysis}</p>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">빈도 분석</h3>
        <p className="text-gray-700">{analysis.frequencyAnalysis}</p>
      </div>
    </div>
  )
}
