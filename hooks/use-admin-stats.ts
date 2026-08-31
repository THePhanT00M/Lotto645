"use client"

import { useEffect, useMemo, useState } from "react"
import { getApiUrl } from "@/lib/api-config"
import { toLottoResult } from "@/lib/lotto/queries"
import { analyzeResults, listWinners, summarize } from "@/lib/lotto/stats"
import { countNumberFrequency } from "@/lib/lotto/analytics"
import type { LottoResult, WinningLottoNumbers } from "@/lib/lotto/types"

interface StatsResponse {
  success: boolean
  message?: string
  completedHistoryData?: unknown[]
  pendingHistoryData?: unknown[]
  latestDrawData?: WinningLottoNumbers
  upcomingDrawNo?: number
}

/**
 * 관리자 통계 화면의 데이터를 불러오고 집계한다.
 *
 * 서버 라우트가 최신 회차 기록과 다음 회차 대기 기록을 함께 내려주므로,
 * 여기서는 대조·집계만 담당한다.
 */
export function useAdminStats() {
  const [completed, setCompleted] = useState<LottoResult[]>([])
  const [pending, setPending] = useState<LottoResult[]>([])
  const [latestDraw, setLatestDraw] = useState<WinningLottoNumbers | null>(null)
  const [upcomingDrawNo, setUpcomingDrawNo] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await fetch(getApiUrl("/api/stats"))
        if (!response.ok) throw new Error(`요청 실패 (${response.status} ${response.statusText})`)

        const data: StatsResponse = await response.json()
        if (!data.success) throw new Error(data.message ?? "통계를 불러오지 못했습니다.")
        if (cancelled) return

        setCompleted((data.completedHistoryData ?? []).map((row) => toLottoResult(row as never)))
        setPending((data.pendingHistoryData ?? []).map((row) => toLottoResult(row as never)))
        setLatestDraw(data.latestDrawData ?? null)
        setUpcomingDrawNo(data.upcomingDrawNo ?? null)
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "알 수 없는 오류가 발생했습니다.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const analyzed = useMemo(
      () => (latestDraw ? analyzeResults(completed, latestDraw) : []),
      [completed, latestDraw],
  )

  const stats = useMemo(
      () => ({
        overall: summarize(analyzed),
        ai: summarize(analyzed.filter((item) => item.result.isAiRecommended)),
        manual: summarize(analyzed.filter((item) => !item.result.isAiRecommended)),
      }),
      [analyzed],
  )

  const winners = useMemo(() => listWinners(analyzed), [analyzed])

  /** 결과를 기다리는 번호들의 출현 빈도 (AI / 일반) */
  const pendingFrequency = useMemo(
      () => ({
        ai: countNumberFrequency(pending.filter((item) => item.isAiRecommended).map((item) => item.numbers)),
        manual: countNumberFrequency(pending.filter((item) => !item.isAiRecommended).map((item) => item.numbers)),
      }),
      [pending],
  )

  return { isLoading, error, latestDraw, upcomingDrawNo, stats, winners, pendingCount: pending.length, pendingFrequency }
}
