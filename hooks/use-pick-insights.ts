"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { authorizedFetch } from "@/lib/auth/client"
import {
  compareWithRandom,
  EXPECTED_MATCHED,
  matchProbability,
  tallyByDraw,
  type DrawTally,
  type RandomComparison,
} from "@/lib/lotto/baseline"
import { PICK_COUNT } from "@/lib/lotto/constants"
import { FEATURE_KEYS, type PatternFeatures } from "@/lib/lotto/features"
import type { Rank } from "@/lib/lotto/rank"

/** 서버에 쌓인 추천 근거 한 건 */
export interface PickInsight {
  id: number
  created_at: string
  draw_no: number
  numbers: number[]
  score: number
  network_score: number
  typicality: number
  features: PatternFeatures
  /** 추천 당시의 모델 메타데이터 */
  model: {
    drawCount?: number
    featureCount?: number
    ensembleSize?: number
    accuracy?: number
    trainAccuracy?: number
    brierBefore?: number
    brierAfter?: number
    maxPastOverlap?: number
  } | null
  model_version: string | null
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

/** 회차 하나의 AI 추천과 대조군 성적 */
export interface DrawRow {
  drawNo: number
  ai: RandomComparison | null
  /** 같은 회차의 직접 선택·추첨기 기록. 없으면 null. */
  control: RandomComparison | null
}

export interface InsightSummary {
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
  /** 채점된 회차 전체를 무작위 기준과 견준 결과 */
  overall: { ai: RandomComparison | null; control: RandomComparison | null }
  /** 회차별 성적. 최근 회차가 먼저 온다. */
  draws: DrawRow[]
}

/** 수집된 AI 추천 근거를 불러와 집계한다. */
export function usePickInsights(limit = 500) {
  const [records, setRecords] = useState<PickInsight[]>([])
  const [controls, setControls] = useState<DrawTally[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authorizedFetch(`/api/picks/insights?limit=${limit}`)
      const data = await response.json()

      if (!data.success) throw new Error(data.message ?? "기록을 불러오지 못했습니다.")
      setRecords(Array.isArray(data.records) ? data.records : [])
      setControls(Array.isArray(data.controls) ? data.controls : [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    void load()
  }, [load])

  const summary = useMemo<InsightSummary>(() => {
    const scoredRecords = records.filter((record) => record.scored_at !== null)
    const matchedTotal = scoredRecords.reduce((sum, record) => sum + (record.matched_count ?? 0), 0)

    const buckets: MatchBucket[] = Array.from({ length: PICK_COUNT + 1 }, (_, matchCount) => {
      const count = scoredRecords.filter((record) => record.matched_count === matchCount).length
      return {
        matchCount,
        count,
        ratio: scoredRecords.length === 0 ? 0 : count / scoredRecords.length,
        expected: matchProbability(matchCount),
      }
    })

    const featureAverages = FEATURE_KEYS.map((key) => ({
      key,
      value:
          records.length === 0
              ? 0
              : records.reduce((sum, record) => sum + (record.features?.[key] ?? 0), 0) / records.length,
    }))

    const aiTallies = tallyByDraw(scoredRecords).sort((a, b) => b.drawNo - a.drawNo)
    const controlByDraw = new Map(controls.map((tally) => [tally.drawNo, tally]))
    const pairedControls = aiTallies
        .map((tally) => controlByDraw.get(tally.drawNo))
        .filter((tally): tally is DrawTally => tally !== undefined)

    const draws = aiTallies.map((tally) => {
      const control = controlByDraw.get(tally.drawNo)
      return {
        drawNo: tally.drawNo,
        ai: compareWithRandom([tally]),
        control: control ? compareWithRandom([control]) : null,
      }
    })

    return {
      total: records.length,
      scored: scoredRecords.length,
      drawCount: new Set(records.map((record) => record.draw_no)).size,
      averageMatched: scoredRecords.length === 0 ? 0 : matchedTotal / scoredRecords.length,
      expectedMatched: EXPECTED_MATCHED,
      winCount: scoredRecords.filter((record) => record.prize_rank !== null).length,
      buckets,
      featureAverages,
      overall: { ai: compareWithRandom(aiTallies), control: compareWithRandom(pairedControls) },
      draws,
    }
  }, [records, controls])

  return { records, summary, isLoading, error, reload: load }
}

/** 기록을 CSV로 만든다. 다른 도구에서 다시 학습시킬 때 쓴다. */
export const toCsv = (records: readonly PickInsight[]): string => {
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
