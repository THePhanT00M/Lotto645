"use client"

import { useMemo } from "react"
import AiLabSkeleton from "@/components/admin/ai-lab-skeleton"
import AiLabView from "@/components/admin/ai-lab-view"
import { toCsv, usePickInsights } from "@/hooks/use-pick-insights"
import { useWinningDraws } from "@/hooks/use-winning-draws"
import { trackSignals } from "@/lib/lotto/prospective"

/**
 * AI 추천 데이터 (관리자)
 *
 * 추천할 때마다 남긴 번호·기하 특징·모델 정보를 모아 보여준다.
 * 회차가 발표되면 채점 결과가 채워지므로, 실제 성적을 무작위 기대값과
 * 견주거나 기록을 내려받아 다시 학습시키는 데 쓴다. 사전 등록한 적중 신호도
 * 당첨 이력으로 그 자리에서 채점해 함께 보여 준다.
 */
export default function AiLabPage() {
  const { records, summary, isLoading, error, reload } = usePickInsights()
  const { draws, isLoading: isDrawsLoading } = useWinningDraws()

  const signals = useMemo(() => (draws.length > 0 ? trackSignals(draws) : []), [draws])

  const download = () => {
    const blob = new Blob([toCsv(records)], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `pick-insights-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading || isDrawsLoading) return <AiLabSkeleton />

  return (
      <AiLabView
          records={records}
          summary={summary}
          signals={signals}
          error={error}
          onReload={reload}
          onDownload={download}
      />
  )
}
