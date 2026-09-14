"use client"

import AiLabSkeleton from "@/components/admin/ai-lab-skeleton"
import AiLabView from "@/components/admin/ai-lab-view"
import { toCsv, usePickInsights } from "@/hooks/use-pick-insights"

/**
 * AI 추천 데이터 (관리자)
 *
 * 추천할 때마다 남긴 번호·기하 특징·모델 정보를 모아 보여준다.
 * 회차가 발표되면 채점 결과가 채워지므로, 실제 성적을 무작위 기대값과
 * 견주거나 기록을 내려받아 다시 학습시키는 데 쓴다.
 */
export default function AiLabPage() {
  const { records, summary, isLoading, error, reload } = usePickInsights()

  const download = () => {
    const blob = new Blob([toCsv(records)], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `pick-insights-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <AiLabSkeleton />

  return <AiLabView records={records} summary={summary} error={error} onReload={reload} onDownload={download} />
}
