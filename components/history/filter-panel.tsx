"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, XCircle } from "lucide-react"

interface FilterPanelProps {
  showOnlyAiRecommended: boolean
  filterNumbers: number[]
  onToggleAiRecommended: () => void
  onToggleFilterNumber: (num: number) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function FilterPanel({
  showOnlyAiRecommended,
  filterNumbers,
  onToggleAiRecommended,
  onToggleFilterNumber,
  onClearFilters,
  hasActiveFilters,
}: FilterPanelProps) {
  // Generate numbers 1-45 for the number selector
  const allNumbers = Array.from({ length: 45 }, (_, i) => i + 1)

  return (
    <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">필터 옵션</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-gray-500 h-8">
            <XCircle className="w-4 h-4 mr-1" />
            필터 초기화
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* AI 추천 필터 */}
        <div>
          <Button
            variant={showOnlyAiRecommended ? "default" : "outline"}
            size="sm"
            onClick={onToggleAiRecommended}
            className={showOnlyAiRecommended ? "bg-blue-500 hover:bg-blue-600" : ""}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            AI 추천 번호만 보기
          </Button>
        </div>

        {/* 특정 번호 포함 필터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">특정 번호 포함 결과만 보기</label>

          {/* 번호 선택 그리드 */}
          <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 sm:gap-3 place-items-center">
            {allNumbers.map((num) => (
              <button
                key={num}
                onClick={() => onToggleFilterNumber(num)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  filterNumbers.includes(num) ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
