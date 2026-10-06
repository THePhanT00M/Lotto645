"use client"

import { Info } from "lucide-react"
import { useMemo, useState } from "react"
import AnalysisBody, { type AnalysisTarget } from "@/components/analysis/analysis-body"
import { AnalysisSkeleton } from "@/components/analysis/analysis-skeleton"
import { Notice } from "@/components/common/notice"
import { useTranslation } from "@/components/i18n/locale-provider"
import { Panel } from "@/components/common/panel"
import { SectionHeading } from "@/components/common/page-header"
import { findMultiples } from "@/lib/lotto/analytics"
import { fetchAvoidInfo, recordPick } from "@/lib/lotto/pick-log"
import type { EngineStats, Recommendation } from "@/lib/lotto/engine"
import { useDrawPrizes } from "@/hooks/use-draw-prizes"
import { useRecommendationEngine } from "@/hooks/use-recommendation-engine"
import { useWinningDraws } from "@/hooks/use-winning-draws"

/** 스켈레톤이 화면에 그려질 틈을 주는 최소 지연 */
const GENERATE_DELAY_MS = 30

interface AnalysisPanelProps {
  /** 사용자가 방금 뽑은 번호 */
  numbers: number[]
}

/**
 * 뽑은 번호를 과거 당첨 이력과 대조하고, AI 추천 번호로 갈아 끼워 볼 수 있는 패널.
 */
export default function AnalysisPanel({ numbers }: AnalysisPanelProps) {
  const { t } = useTranslation()
  const { draws, latestDrawNo, isLoading } = useWinningDraws()
  const { prizes, isLoading: isPrizesLoading } = useDrawPrizes()

  const [target, setTarget] = useState<AnalysisTarget>("user")
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [selected, setSelected] = useState(0)
  const [setSize, setSetSize] = useState(1)
  /** 이번 회차에 이미 나간 조합 수. 스켈레톤이 제외 문장 유무까지 실제와 맞추는 데 쓴다. */
  const [avoidedCount, setAvoidedCount] = useState(0)
  const [stats, setStats] = useState<EngineStats | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // 학습은 워커에서 한 번만 하고, 이후 추천은 그 엔진을 다시 쓴다.
  const engine = useRecommendationEngine(draws, prizes)

  const recommendation = recommendations[selected] ?? null
  const aiNumbers = recommendation?.numbers ?? []
  const analyzed = target === "ai" && aiNumbers.length > 0 ? aiNumbers : numbers
  const multiples = useMemo(() => findMultiples(analyzed, draws), [analyzed, draws])

  const handleRecommend = async () => {
    setIsGenerating(true)
    setTarget("ai")

    // 상태 반영 뒤 계산해야 스켈레톤이 실제로 그려진다.
    await new Promise((resolve) => setTimeout(resolve, GENERATE_DELAY_MS))

    const targetDrawNo = latestDrawNo + 1

    // 이번 회차에 이미 내보낸 조합을 받아 두면 같은 번호를 다시 추천하지 않는다.
    const avoid = await fetchAvoidInfo(targetDrawNo)
    setAvoidedCount(avoid?.combinations.length ?? 0)

    try {
      const { recommendations: results, stats: engineStats } = await engine.recommend(setSize, avoid)

      setRecommendations(results)
      setSelected(0)
      setStats(engineStats)

      // 장마다 번호와 추천 근거를 한 번에 남긴다. 나중에 이 기록만으로 다시 학습할 수 있다.
      for (const result of results) {
        void recordPick({
          numbers: result.numbers,
          source: "ai",
          drawNo: targetDrawNo,
          insight: { recommendation: result, stats: engineStats },
        })
      }
    } catch (error) {
      console.error("추천을 만들지 못했습니다:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
      <Panel className="space-y-4">
        <SectionHeading icon={Info} title={t.analysis.title} />

        {isLoading ? (
            <AnalysisSkeleton numbers={numbers} />
        ) : (
            <AnalysisBody
                multiples={multiples}
                target={target}
                recommendations={recommendations}
                selected={selected}
                setSize={setSize}
                avoidedCount={avoidedCount}
                stats={stats}
                isGenerating={isGenerating}
                isRecommendBlocked={isPrizesLoading}
                onRecommend={() => void handleRecommend()}
                onSelect={setSelected}
                onSetSizeChange={setSetSize}
                onTargetChange={setTarget}
            />
        )}

        <Notice title={t.analysis.noticeTitle} tone="warning">
          <p className="opacity-90">
            {t.analysis.noticeReference(draws.length)}
          </p>
          <p className="opacity-90">
            {t.analysis.noticeRandom}
          </p>
        </Notice>
      </Panel>
  )
}
