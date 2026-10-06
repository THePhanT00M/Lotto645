"use client"

import { MousePointerClick, Minus, Plus, Sparkles } from "lucide-react"
import MultipleNumberAnalysis from "@/components/analysis/multiple-number-analysis"
import RecommendationCard from "@/components/analysis/recommendation-card"
import { Surface } from "@/components/common/panel"
import { useTranslation } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { MAX_SET_SIZE } from "@/lib/lotto/engine"
import { cn } from "@/lib/utils"
import type { MultipleNumber } from "@/lib/lotto/analytics"
import type { EngineStats, Recommendation } from "@/lib/lotto/engine"

/** 지금 분석 중인 번호가 어디서 왔는지 */
export type AnalysisTarget = "user" | "ai"

interface AnalysisBodyProps {
  multiples: MultipleNumber[]
  target: AnalysisTarget
  /** 이번에 받은 추천. 여러 장이면 서로 번호가 겹치지 않는다. */
  recommendations: readonly Recommendation[]
  /** 자세히 보고 있는 장 */
  selected: number
  /** 다음 추천에서 받을 장수 */
  setSize: number
  /** 이번 회차에 이미 나간 조합 수 (생성 중 자리표시용) */
  avoidedCount: number
  stats: EngineStats | null
  isGenerating: boolean
  /** 추천 버튼을 막을지. 학습에 쓸 당첨자 수가 아직 오지 않았으면 막는다. */
  isRecommendBlocked: boolean
  onRecommend: () => void
  onSelect: (index: number) => void
  onSetSizeChange: (size: number) => void
  onTargetChange: (target: AnalysisTarget) => void
}

/**
 * 분석 패널 본문
 *
 * 스켈레톤도 이 함수를 자리표시 값으로 부르므로(analysis-skeleton) 글자는 <sk-t> 로 감싼다.
 */
export default function AnalysisBody({
  multiples,
  target,
  recommendations,
  selected,
  setSize,
  avoidedCount,
  stats,
  isGenerating,
  isRecommendBlocked,
  onRecommend,
  onSelect,
  onSetSizeChange,
  onTargetChange,
}: AnalysisBodyProps) {
  const { t } = useTranslation()

  const hasResult = recommendations.length > 0 || isGenerating

  return (
      <div className="space-y-6">
        <Surface className="rounded-xl">
          {/* 폭이 모자라면 버튼 줄이 제목 아래로 내려간다. 어느 것도 줄이지 않아 겹치지 않는다. */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="flex min-w-0 flex-[1_1_16rem] flex-col gap-2">
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-ink font-bold"><sk-t>{t.analysis.heading}</sk-t></h3>
              </div>
              <p className="text-ink-muted text-sm">
                <sk-t>{t.analysis.analyzeHint}</sk-t>
              </p>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <SetSizeStepper value={setSize} onChange={onSetSizeChange} disabled={isGenerating} />

              {/* 학습은 첫 추천 때 한 번만 하므로, 당첨자 수가 도착하기 전에는 누를 수 없게 한다. */}
              <Button
                  data-sk-tone
                  onClick={onRecommend}
                  disabled={isGenerating || isRecommendBlocked}
                  className="h-10 flex-1 rounded-full bg-blue-600 px-5 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 sm:flex-none"
              >
                <Sparkles className={cn("mr-2 h-4 w-4", isGenerating && "animate-spin")} />
                <sk-t>{isGenerating ? t.analysis.generating : t.analysis.recommend}</sk-t>
              </Button>
            </div>
          </div>
        </Surface>

        {hasResult && <ResultTabs target={target} onChange={onTargetChange} disabled={isGenerating} />}

        {/* 추첨 번호 분석으로 전환해도 추천 결과는 유지되도록 언마운트하지 않는다. */}
        <div className={target === "ai" ? "block" : "hidden"}>
          <RecommendationCard
              recommendations={recommendations}
              selected={selected}
              setSize={setSize}
              avoidedCount={avoidedCount}
              stats={stats}
              isGenerating={isGenerating}
              onSelect={onSelect}
          />
        </div>

        <MultipleNumberAnalysis multiples={multiples} />
      </div>
  )
}

/** 결과를 AI 추천으로 볼지, 방금 뽑은 번호의 분석으로 볼지 */
function ResultTabs({
  target,
  onChange,
  disabled,
}: {
  target: AnalysisTarget
  onChange: (target: AnalysisTarget) => void
  disabled: boolean
}) {
  const { t } = useTranslation()
  const tabs: { value: AnalysisTarget; label: string }[] = [
    { value: "ai", label: t.analysis.recommendation.title },
    { value: "user", label: t.analysis.analyzeNumbers },
  ]

  return (
      <div role="tablist" className="bg-surface-2 inline-flex rounded-full p-1">
        {tabs.map(({ value, label }) => (
            <button
                key={value}
                type="button"
                role="tab"
                aria-selected={target === value}
                disabled={disabled}
                onClick={() => onChange(value)}
                className={cn(
                    "h-8 rounded-full px-4 text-sm font-medium transition-colors",
                    target === value ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
                )}
            >
              <sk-t>{label}</sk-t>
            </button>
        ))}
      </div>
  )
}

/** 한 번에 받을 게임 수. 여러 게임이면 서로 번호가 겹치지 않게 짠다. */
function SetSizeStepper({ value, onChange, disabled }: { value: number; onChange: (size: number) => void; disabled: boolean }) {
  const { t } = useTranslation()
  const step = (delta: number) => onChange(Math.min(MAX_SET_SIZE, Math.max(1, value + delta)))
  const stepClass =
      "text-ink-muted hover:bg-surface hover:text-ink flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-30"

  return (
      <div role="group" aria-label={t.analysis.setSize} className="bg-surface-2 flex h-10 shrink-0 items-center rounded-full px-1">
        <button type="button" aria-label={t.analysis.setSizeLess} disabled={disabled || value <= 1} onClick={() => step(-1)} className={stepClass}>
          <Minus className="h-4 w-4" />
        </button>
        <span aria-live="polite" className="text-ink min-w-14 text-center text-sm font-semibold tabular-nums">
          <sk-t>{t.analysis.setSizeOption(value)}</sk-t>
        </span>
        <button type="button" aria-label={t.analysis.setSizeMore} disabled={disabled || value >= MAX_SET_SIZE} onClick={() => step(1)} className={stepClass}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
  )
}
