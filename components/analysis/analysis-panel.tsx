"use client"

import { Info, MousePointerClick, RotateCcw, SearchCheck, Sparkles } from "lucide-react"
import { useMemo, useState } from "react"
import AIRecommendation from "@/components/analysis/ai-recommendation"
import { AnalysisSkeleton } from "@/components/analysis/analysis-skeleton"
import MultipleNumberAnalysis from "@/components/analysis/multiple-number-analysis"
import { Notice } from "@/components/common/notice"
import { Panel, Surface } from "@/components/common/panel"
import { SectionHeading } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { findMultiples } from "@/lib/lotto/analytics"
import { recordDraw } from "@/lib/lotto/draw-log"
import { recommendNumbers } from "@/lib/lotto/recommend"
import { useWinningDraws } from "@/hooks/use-winning-draws"

/** 스켈레톤이 한 프레임 이상 보이도록 두는 최소 지연 */
const GENERATE_DELAY_MS = 10

/** 지금 분석 중인 번호가 어디서 왔는지 */
type AnalysisTarget = "user" | "ai"

interface AnalysisPanelProps {
  /** 사용자가 방금 뽑은 번호 */
  numbers: number[]
}

/**
 * 뽑은 번호를 과거 당첨 이력과 대조하고, AI 추천 번호로 갈아 끼워 볼 수 있는 패널.
 */
export default function AnalysisPanel({ numbers }: AnalysisPanelProps) {
  const { draws, analytics, isLoading } = useWinningDraws()

  const [target, setTarget] = useState<AnalysisTarget>("user")
  const [aiNumbers, setAiNumbers] = useState<number[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const analyzed = target === "ai" && aiNumbers.length > 0 ? aiNumbers : numbers
  const multiples = useMemo(() => findMultiples(analyzed, draws), [analyzed, draws])

  const handleRecommend = async () => {
    setIsGenerating(true)
    setTarget("ai")

    // 상태 반영 뒤 계산해야 스켈레톤이 실제로 그려진다.
    await new Promise((resolve) => setTimeout(resolve, GENERATE_DELAY_MS))

    const recommended = recommendNumbers(analytics)
    setAiNumbers(recommended)
    setIsGenerating(false)

    void recordDraw({ numbers: recommended, source: "ai", drawNo: analytics.latestDrawNo + 1 })
  }

  return (
      <Panel className="space-y-4">
        <SectionHeading icon={Info} title="추천 번호 정보" />

        {isLoading ? (
            <AnalysisSkeleton />
        ) : (
            <div className="space-y-6">
              <Surface className="rounded-xl">
                <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <MousePointerClick className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-ink font-bold">번호 분석 및 AI 추천</h3>
                    </div>
                    <p className="text-ink-muted text-sm">
                      추첨된 번호를 분석하거나 AI의 새로운 추천을 받을 수 있습니다.
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                    {aiNumbers.length > 0 &&
                        (target === "ai" ? (
                            <ToggleButton icon={SearchCheck} onClick={() => setTarget("user")} disabled={isGenerating}>
                              추첨 번호 분석
                            </ToggleButton>
                        ) : (
                            <ToggleButton icon={RotateCcw} onClick={() => setTarget("ai")}>
                              AI 추천 번호 돌아가기
                            </ToggleButton>
                        ))}

                    <Button
                        onClick={handleRecommend}
                        disabled={isGenerating}
                        className="flex-1 bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 sm:flex-none"
                    >
                      <Sparkles className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                      {isGenerating ? "분석 중..." : "AI 추천"}
                    </Button>
                  </div>
                </div>
              </Surface>

              {/* 추첨 번호 분석으로 전환해도 추천 결과는 유지되도록 언마운트하지 않는다. */}
              <div className={target === "ai" ? "block" : "hidden"}>
                <AIRecommendation numbers={aiNumbers} isGenerating={isGenerating} />
              </div>

              <MultipleNumberAnalysis multiples={multiples} />
            </div>
        )}

        <Notice title="분석 유의사항" tone="warning">
          <p className="opacity-90">
            이 분석은 과거 <span className="font-medium">{draws.length}회</span>의 실제 로또 당첨번호를 기반으로 합니다.
            통계 데이터는 참고용으로만 사용하시기 바랍니다.
          </p>
          <p className="opacity-90">
            로또 번호는 매 회차마다 무작위로 추첨되며,{" "}
            <span className="font-medium">과거의 통계가 미래 당첨 확률에 영향을 미치지 않습니다.</span>
          </p>
        </Notice>
      </Panel>
  )
}

function ToggleButton({
                        icon: Icon,
                        onClick,
                        disabled,
                        children,
                      }: {
  icon: typeof SearchCheck
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
      <Button
          variant="outline"
          onClick={onClick}
          disabled={disabled}
          className="bg-surface text-ink border-line flex-1 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 sm:flex-none dark:hover:border-blue-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
      >
        <Icon className="mr-2 h-4 w-4" />
        {children}
      </Button>
  )
}
