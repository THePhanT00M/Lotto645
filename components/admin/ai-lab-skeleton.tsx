import AiLabView, { RECENT_LIMIT } from "@/components/admin/ai-lab-view"
import { useTranslation } from "@/components/i18n/locale-provider"
import type { DrawRow, InsightSummary, PickInsight } from "@/hooks/use-pick-insights"
import { EXPECTED_MATCHED, matchProbability, WIN_PROBABILITY, type RandomComparison } from "@/lib/lotto/baseline"
import { extractFeatures, FEATURE_KEYS } from "@/lib/lotto/features"

/*
 * 자리표시 값
 *
 * 글자는 가려지므로 자릿수와 줄 수만 실제와 같으면 된다. 개수와 비율은
 * 지금 쌓인 데이터(142건, 2개 회차)의 모양을 따른다.
 */

const TOTAL = 142

const PLACEHOLDER_NUMBERS = [3, 18, 25, 29, 31, 40]

const comparison = (count: number, mean: number): RandomComparison => ({
  count,
  mean,
  winCount: 1,
  expectedWins: count * WIN_PROBABILITY,
  low: 0.671,
  high: 0.929,
  verdict: "within",
})

const DRAWS: DrawRow[] = [
  { drawNo: 1241, ai: comparison(63, 0.683), control: comparison(4, 1) },
  { drawNo: 1240, ai: comparison(79, 0.861), control: comparison(39, 0.872) },
]

/** 적중 개수별 비율. 채점된 142건의 실제 분포다. */
const BUCKET_RATIOS = [0.4225, 0.3873, 0.1761, 0.0141, 0, 0, 0]

const SUMMARY: InsightSummary = {
  total: TOTAL,
  scored: TOTAL,
  drawCount: DRAWS.length,
  averageMatched: 0.782,
  expectedMatched: EXPECTED_MATCHED,
  winCount: 2,
  buckets: BUCKET_RATIOS.map((ratio, matchCount) => ({
    matchCount,
    count: Math.round(ratio * TOTAL),
    ratio,
    expected: matchProbability(matchCount),
  })),
  featureAverages: FEATURE_KEYS.map((key) => ({ key, value: 4.92 })),
  overall: { ai: comparison(TOTAL, 0.782), control: comparison(43, 0.884) },
  draws: DRAWS,
}

/** 최근 기록은 실제 화면처럼 한 페이지 분량을 접힌 채로 채운다. */
const RECORDS: PickInsight[] = Array.from({ length: RECENT_LIMIT }, (_, index) => ({
  id: -(index + 1),
  created_at: "2026-01-01T00:00:00Z",
  draw_no: 1241,
  numbers: PLACEHOLDER_NUMBERS,
  score: 0.8,
  network_score: 0.8,
  typicality: 0.8,
  popularity: null,
  popularity_percentile: null,
  features: extractFeatures(PLACEHOLDER_NUMBERS),
  model: null,
  model_version: null,
  max_past_overlap: 4,
  matched_count: 0,
  bonus_matched: false,
  prize_rank: null,
  scored_at: "2026-01-01T00:00:00Z",
}))

/**
 * AI 추천 데이터 화면 자리표시
 *
 * 막대를 따로 그리지 않고 실제 화면(AiLabView)을 자리표시 값으로 그린 뒤 .is-sk 로 글자만 가린다.
 * 화면을 고치면 자리표시가 저절로 따라온다. 안의 버튼·기록은 inert 로 눌리지 않게 막는다.
 */
export default function AiLabSkeleton() {
  const { t } = useTranslation()

  return (
      <div role="status" aria-label={t.admin.aiLab.loading} aria-busy>
        <div className="is-sk" aria-hidden inert>
          <AiLabView records={RECORDS} summary={SUMMARY} />
        </div>
      </div>
  )
}
