"use client"

import { Sparkles } from "lucide-react"
import { BallRow } from "@/components/lotto/ball-row"
import { Skeleton } from "@/components/ui/skeleton"

interface AIRecommendationProps {
  numbers: number[]
  /** 추천 계산 중 스켈레톤을 보여준다. */
  isGenerating: boolean
}

/** AI가 추천한 번호 조합을 보여주는 카드. */
export default function AIRecommendation({ numbers, isGenerating }: AIRecommendationProps) {
  if (isGenerating) {
    return (
        <div className="bg-surface border-line space-y-5 rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-5 w-full" />
          <div className="flex justify-center gap-2 py-6">
            {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-10 rounded-full sm:h-12 sm:w-12" />
            ))}
          </div>
        </div>
    )
  }

  if (numbers.length === 0) return null

  return (
      <div className="bg-surface border-line relative overflow-hidden rounded-lg border p-4">
        <div className="pointer-events-none absolute right-0 bottom-0 p-4 opacity-5">
          <Sparkles className="h-30 w-30" />
        </div>

        <div className="flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
          <h3 className="text-ink font-bold">AI 추천 번호</h3>
        </div>

        <p className="text-ink-muted mt-2 mb-3 text-sm leading-relaxed">
          역대 당첨 번호 속에 숨겨진 흐름과 패턴을 AI가 다각도로 분석하여, 이번 주 당신에게 행운을 가져다줄 최적의 번호
          조합을 제안합니다.
        </p>

        <div className="bg-surface-2 rounded-lg px-2 py-4">
          <BallRow numbers={numbers} size="fluid" className="mx-auto max-w-xs" />
        </div>

        <p className="text-ink-muted mt-2 text-right text-[10px]">
          * 과거 데이터 기반 예측이며 당첨을 보장하지 않습니다.
        </p>
      </div>
  )
}
