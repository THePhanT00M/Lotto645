"use client"

import { MousePointerClick, RotateCcw, SearchCheck, Sparkles, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
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

  return (
      <div className="space-y-6">
        <Surface className="rounded-xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-ink font-bold"><sk-t>{t.analysis.heading}</sk-t></h3>
              </div>
              <p className="text-ink-muted text-sm">
                <sk-t>{t.analysis.analyzeHint}</sk-t>
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              <SetSizePicker value={setSize} onChange={onSetSizeChange} disabled={isGenerating} />

              {recommendations.length > 0 &&
                  (target === "ai" ? (
                      <ToggleButton icon={SearchCheck} onClick={() => onTargetChange("user")} disabled={isGenerating}>
                        {t.analysis.analyzeNumbers}
                      </ToggleButton>
                  ) : (
                      <ToggleButton icon={RotateCcw} onClick={() => onTargetChange("ai")}>
                        {t.analysis.backToAi}
                      </ToggleButton>
                  ))}

              {/* 학습은 첫 추천 때 한 번만 하므로, 당첨자 수가 도착하기 전에는 누를 수 없게 한다. */}
              <Button
                  data-sk-tone
                  onClick={onRecommend}
                  disabled={isGenerating || isRecommendBlocked}
                  className="flex-1 bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 sm:flex-none"
              >
                <Sparkles className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                <sk-t>{isGenerating ? t.analysis.generating : t.analysis.recommend}</sk-t>
              </Button>
            </div>
          </div>
        </Surface>

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

/** 한 번에 받을 장수. 여러 장이면 서로 번호가 겹치지 않게 짠다. */
function SetSizePicker({ value, onChange, disabled }: { value: number; onChange: (size: number) => void; disabled: boolean }) {
  const { t } = useTranslation()
  const sizes = Array.from({ length: MAX_SET_SIZE }, (_, index) => index + 1)

  return (
      <div role="radiogroup" aria-label={t.analysis.setSize} className="border-line bg-surface flex rounded-md border p-0.5">
        {sizes.map((size) => (
            <button
                key={size}
                type="button"
                role="radio"
                aria-checked={value === size}
                disabled={disabled}
                onClick={() => onChange(size)}
                className={cn(
                    "flex-1 rounded px-2.5 py-1 text-sm font-medium transition-colors sm:flex-none",
                    value === size ? "bg-blue-600 text-white" : "text-ink-muted hover:text-ink",
                )}
                data-sk-tone={value === size || undefined}
            >
              <sk-t>{t.analysis.setSizeOption(size)}</sk-t>
            </button>
        ))}
      </div>
  )
}

function ToggleButton({
  icon: Icon,
  onClick,
  disabled,
  children,
}: {
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
      <Button
          variant="outline"
          onClick={onClick}
          disabled={disabled}
          className="bg-surface text-ink border-line flex-1 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 sm:flex-none dark:hover:border-blue-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
      >
        <Icon className="mr-2 h-4 w-4" />
        <sk-t>{children}</sk-t>
      </Button>
  )
}
