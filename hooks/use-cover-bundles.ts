"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { authorizedFetch } from "@/lib/auth/client"
import type { DrawPrize } from "@/lib/lotto/prizes"

/** 서버에 쌓인 3개 보장 묶음 한 벌 (장 목록 제외) */
export interface CoverBundle {
  id: number
  created_at: string
  draw_no: number
  mean_percentile: number | null
  quiet_tickets: number | null
  model_version: string
  best_matched: number | null
  /** 적중 0~6개인 장 수 */
  match_counts: number[] | null
  /** 1~5등인 장 수 */
  rank_counts: number[] | null
  scored_at: string | null
}

/** 회차 하나(또는 전체)의 묶음 성적 */
export interface CoverDrawRow {
  drawNo: number | null
  bundles: number
  scored: number
  /** 가장 잘 맞은 한 장이 3개 미만인 묶음 수. 보장대로라면 늘 0이다. */
  belowThree: number
  /** 가장 잘 맞은 한 장이 3개·4개·5개 이상인 묶음 수 */
  best: [number, number, number]
  /** 묶음당 평균 5등·4등 장 수 */
  fifth: number | null
  fourth: number | null
  /** 묶음당 평균 당첨금(원). 그 회차 당첨금 발표가 없으면 null. */
  back: number | null
}

export interface CoverSummary {
  total: number
  scored: number
  /** 최근 회차가 먼저 온다. */
  draws: CoverDrawRow[]
  overall: CoverDrawRow | null
}

/** 묶음 기록을 불러와 회차별로 집계한다. */
export function useCoverBundles(prizes: readonly DrawPrize[]) {
  const [bundles, setBundles] = useState<CoverBundle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authorizedFetch("/api/picks/cover")
      const data = await response.json()

      if (!data.success) throw new Error(data.message ?? "묶음 기록을 불러오지 못했습니다.")
      setBundles(Array.isArray(data.bundles) ? data.bundles : [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const summary = useMemo(() => summarizeBundles(bundles, prizes), [bundles, prizes])

  return { summary, isLoading, error, reload: load }
}

export const summarizeBundles = (bundles: readonly CoverBundle[], prizes: readonly DrawPrize[]): CoverSummary => {
  const amountsByDraw = new Map(prizes.map((prize) => [prize.drawNo, prize.amounts]))
  const byDraw = new Map<number, CoverBundle[]>()
  for (const bundle of bundles) byDraw.set(bundle.draw_no, [...(byDraw.get(bundle.draw_no) ?? []), bundle])

  const draws = [...byDraw.entries()]
      .sort(([a], [b]) => b - a)
      .map(([drawNo, rows]) => tally(drawNo, rows, amountsByDraw))

  return {
    total: bundles.length,
    scored: bundles.filter((bundle) => bundle.scored_at !== null).length,
    draws,
    overall: bundles.length > 0 ? tally(null, bundles, amountsByDraw) : null,
  }
}

const tally = (
    drawNo: number | null,
    rows: readonly CoverBundle[],
    amountsByDraw: ReadonlyMap<number, number[]>,
): CoverDrawRow => {
  // 1. 채점된 묶음만 성적에 넣는다.
  const scored = rows.filter((row) => row.scored_at !== null && Array.isArray(row.rank_counts))
  const best = (min: number, max = Infinity) =>
      scored.filter((row) => (row.best_matched ?? 0) >= min && (row.best_matched ?? 0) <= max).length

  // 2. 당첨금은 그 회차 1인당 당첨금 × 등수별 장 수. 발표가 하나라도 없으면 비운다.
  const backs = scored.map((row) => {
    const amounts = amountsByDraw.get(row.draw_no)
    const ranks = Array.isArray(row.rank_counts) ? row.rank_counts : []
    return amounts ? ranks.reduce((sum, count, index) => sum + count * (amounts[index] ?? 0), 0) : null
  })
  const average = (values: readonly number[]) =>
      scored.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / scored.length

  return {
    drawNo,
    bundles: rows.length,
    scored: scored.length,
    belowThree: best(0, 2),
    best: [best(3, 3), best(4, 4), best(5)],
    fifth: average(scored.map((row) => row.rank_counts?.[4] ?? 0)),
    fourth: average(scored.map((row) => row.rank_counts?.[3] ?? 0)),
    back: backs.some((value) => value === null) ? null : average(backs as number[]),
  }
}
