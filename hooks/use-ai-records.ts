"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getApiUrl } from "@/lib/api-config"
import { PICK_COUNT } from "@/lib/lotto/constants"
import { FEATURE_KEYS, type PatternFeatures } from "@/lib/lotto/features"
import type { Rank } from "@/lib/lotto/rank"

/** 서버에 쌓인 추천 기록 한 건 */
export interface AiRecord {
  id: number
  created_at: string
  draw_no: number
  numbers: number[]
  score: number
  network_score: number
  typicality: number
  features: PatternFeatures
  max_past_overlap: number | null
  matched_count: number | null
  bonus_matched: boolean | null
  prize_rank: Rank
  scored_at: string | null
}

/** 맞은 개수별 집계 한 줄 */
export interface MatchBucket {
  matchCount: number
  count: number
  ratio: number
  /** 무작위로 찍었을 때의 기대 비율 */
  expected: number
}

export interface AiSummary {
  total: number
  scored: number
  drawCount: number
  /** 채점된 기록의 평균 적중 개수 */
  averageMatched: number
  /** 무작위 조합의 이론적 평균 적중 개수 */
  expectedMatched: number
  winCount: number
  buckets: MatchBucket[]
  /** 특징별 평균값 */
  featureAverages: { key: string; value: number }[]
}

/** 조합론: nCk */
const choose = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0
  let result = 1
  for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1)
  return result
}

/** 무작위 조합이 당첨 번호와 k개 맞을 확률 (초기하분포) */
const expectedRatio = (k: number): number =>
    (choose(PICK_COUNT, k) * choose(45 - PICK_COUNT, PICK_COUNT - k)) / choose(45, PICK_COUNT)

/** 수집된 AI 추천 기록을 불러와 집계한다. */
export function useAiRecords(limit = 500) {
  const [records, setRecords] = useState<AiRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(getApiUrl(`/api/ai-recommendations?limit=${limit}`))
      const data = await response.json()

      if (!data.success) throw new Error(data.message ?? "기록을 불러오지 못했습니다.")
      setRecords(data.records ?? [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    void load()
  }, [load])

  const summary = useMemo<AiSummary>(() => {
    const scoredRecords = records.filter((record) => record.scored_at !== null)
    const matchedTotal = scoredRecords.reduce((sum, record) => sum + (record.matched_count ?? 0), 0)

    const buckets: MatchBucket[] = Array.from({ length: PICK_COUNT + 1 }, (_, matchCount) => {
      const count = scoredRecords.filter((record) => record.matched_count === matchCount).length
      return {
        matchCount,
        count,
        ratio: scoredRecords.length === 0 ? 0 : count / scoredRecords.length,
        expected: expectedRatio(matchCount),
      }
    })

    const featureAverages = FEATURE_KEYS.map((key) => ({
      key,
      value:
          records.length === 0
              ? 0
              : records.reduce((sum, record) => sum + (record.features?.[key] ?? 0), 0) / records.length,
    }))

    return {
      total: records.length,
      scored: scoredRecords.length,
      drawCount: new Set(records.map((record) => record.draw_no)).size,
      averageMatched: scoredRecords.length === 0 ? 0 : matchedTotal / scoredRecords.length,
      expectedMatched: (PICK_COUNT * PICK_COUNT) / 45,
      winCount: scoredRecords.filter((record) => record.prize_rank !== null).length,
      buckets,
      featureAverages,
    }
  }, [records])

  return { records, summary, isLoading, error, reload: load }
}

/** 기록을 CSV로 만든다. 다른 도구에서 다시 학습시킬 때 쓴다. */
export const toCsv = (records: readonly AiRecord[]): string => {
  const header = [
    "id",
    "created_at",
    "draw_no",
    "numbers",
    "score",
    "network_score",
    "typicality",
    "max_past_overlap",
    "matched_count",
    "prize_rank",
    ...FEATURE_KEYS,
  ]

  const rows = records.map((record) =>
      [
        record.id,
        record.created_at,
        record.draw_no,
        `"${record.numbers.join(" ")}"`,
        record.score,
        record.network_score,
        record.typicality,
        record.max_past_overlap ?? "",
        record.matched_count ?? "",
        record.prize_rank ?? "",
        ...FEATURE_KEYS.map((key) => record.features?.[key] ?? ""),
      ].join(","),
  )

  return [header.join(","), ...rows].join("\n")
}
