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
          {/* 버튼이 늘어 제목과 한 줄에 안 들어가면 다음 줄로 내린다. 겹치지 않게 어느 것도 줄이지 않는다. */}
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

            <div className="flex w-full flex-col-reverse items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center [&>*]:shrink-0">
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

              {/* 몇 게임을 받을지와 추천 버튼은 한 동작이라 한 상자에 묶는다. */}
              <div className="border-line bg-surface flex flex-wrap items-center gap-1 rounded-lg border p-1 shadow-sm sm:flex-nowrap">
                <SetSizePicker value={setSize} onChange={onSetSizeChange} disabled={isGenerating} />
                <span aria-hidden className="bg-line mx-1 hidden h-6 w-px shrink-0 sm:block" />

                {/* 학습은 첫 추천 때 한 번만 하므로, 당첨자 수가 도착하기 전에는 누를 수 없게 한다. */}
                <Button
                    data-sk-tone
                    onClick={onRecommend}
                    disabled={isGenerating || isRecommendBlocked}
                    className="h-9 shrink-0 basis-full bg-blue-600 px-3 text-white hover:bg-blue-700 sm:h-8 sm:basis-auto"
                >
                  <Sparkles className={`mr-1.5 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                  <sk-t>{isGenerating ? t.analysis.generating : t.analysis.recommend}</sk-t>
                </Button>
              </div>
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
      <div role="radiogroup" aria-label={t.analysis.setSize} className="flex flex-1 items-center gap-0.5">
        <span className="text-ink-muted pr-1.5 pl-2 text-xs whitespace-nowrap"><sk-t>{t.analysis.setSizeUnit}</sk-t></span>
        {sizes.map((size) => (
            <button
                key={size}
                type="button"
                role="radio"
                aria-checked={value === size}
                aria-label={t.analysis.setSizeOption(size)}
                disabled={disabled}
                onClick={() => onChange(size)}
                className={cn(
                    "h-8 min-w-8 flex-1 rounded-md text-sm font-medium tabular-nums transition-colors sm:flex-none",
                    value === size ? "bg-blue-50 text-blue-700 ring-1 ring-blue-500 ring-inset dark:bg-blue-950 dark:text-blue-300" : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                )}
                data-sk-tone={value === size || undefined}
            >
              <sk-t>{size}</sk-t>
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
          variant="ghost"
          onClick={onClick}
          disabled={disabled}
          className="text-ink-muted h-10 border-transparent bg-transparent shadow-none transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
      >
        <Icon className="mr-2 h-4 w-4" />
        <sk-t>{children}</sk-t>
      </Button>
  )
}
