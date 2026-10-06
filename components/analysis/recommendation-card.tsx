"use client"

import { FlaskConical, Ruler, ShieldCheck, Sparkles, Users, Waypoints } from "lucide-react"
import { useTranslation } from "@/components/i18n/locale-provider"
import PaperPattern from "@/components/analysis/paper-pattern"
import { BallRow } from "@/components/lotto/ball-row"
import { independentHitRate, SPREAD_HIT_RATE, type EngineStats, type Recommendation } from "@/lib/lotto/engine"
import { extractFeatures } from "@/lib/lotto/features"
import { cn } from "@/lib/utils"

interface RecommendationCardProps {
  /** 서로 번호가 겹치지 않는 추천 장들 */
  recommendations: readonly Recommendation[]
  /** 자세히 보여 주는 장 */
  selected: number
  /** 생성 중 자리표시에 그릴 장수 */
  setSize: number
  /** 이번 회차에 이미 나간 조합 수. 자리표시의 제외 문장 유무를 실제와 맞춘다. */
  avoidedCount: number
  stats: EngineStats | null
  isGenerating: boolean
  onSelect: (index: number) => void
}

/*
 * 생성 중 자리표시 값. 카드를 그대로 그리고 글자만 가리므로 줄 수가 실제와 같으면 된다.
 * 제외 문장 유무는 패널이 추천 직전에 받아 둔 이번 회차 제외 수를 따른다.
 */
const PLACEHOLDER_SETS = [
  [3, 18, 25, 29, 31, 40],
  [1, 9, 14, 22, 36, 44],
  [5, 11, 19, 27, 33, 42],
  [2, 8, 16, 24, 35, 41],
  [6, 13, 20, 28, 37, 45],
]
const PLACEHOLDER_DRAW = { drawNo: 1241, date: "2026-09-12", numbers: [7, 13, 16, 23, 24, 43] }

const placeholderOf = (numbers: number[], avoidedCount: number): Recommendation => ({
  numbers,
  features: extractFeatures(numbers),
  popularity: 0,
  popularityPercentile: 0.2,
  nearestDraw: { ...PLACEHOLDER_DRAW, distance: 1 },
  closestPastDraw: { ...PLACEHOLDER_DRAW, overlap: 3 },
  avoidedCount,
})

const PLACEHOLDER_STATS: EngineStats = {
  drawCount: 1241,
  trainedDraws: 1241,
  featureCount: 66,
  maxPastOverlap: 4,
  maxPercentile: 0.4,
  validation: { draws: 248, correlation: 0.25, quietDraws: 99, quietShare: 0.9, allShare: 0.97 },
  trainMs: 300,
}

/** 추천 결과와, 그 조합을 사람들이 얼마나 살지에 대한 예측을 보여준다. */
export default function RecommendationCard({
  recommendations,
  selected,
  setSize,
  avoidedCount,
  stats,
  isGenerating,
  onSelect,
}: RecommendationCardProps) {
  const { t } = useTranslation()

  if (isGenerating) {
    return (
        <div role="status" aria-label={t.analysis.recommendation.building} aria-busy>
          <div className="is-sk" aria-hidden inert>
            <RecommendationBody
                recommendations={PLACEHOLDER_SETS.slice(0, setSize).map((numbers) => placeholderOf(numbers, avoidedCount))}
                selected={0}
                stats={PLACEHOLDER_STATS}
                onSelect={() => {}}
            />
          </div>
        </div>
    )
  }

  if (recommendations.length === 0 || !stats) return null

  return <RecommendationBody recommendations={recommendations} selected={selected} stats={stats} onSelect={onSelect} />
}

interface RecommendationBodyProps {
  recommendations: readonly Recommendation[]
  selected: number
  stats: EngineStats
  onSelect: (index: number) => void
}

/** 카드 본문. 생성 중 자리표시도 이 함수를 자리표시 값으로 부르므로 글자는 모두 <sk-t> 로 감싼다. */
function RecommendationBody({ recommendations, selected, stats, onSelect }: RecommendationBodyProps) {
  const { t } = useTranslation()
  const copy = t.analysis.recommendation
  const recommendation = recommendations[selected] ?? recommendations[0]
  const { numbers, features, popularityPercentile, nearestDraw, closestPastDraw, avoidedCount } = recommendation
  const { validation } = stats

  return (
      <div className="bg-surface border-line rounded-lg border p-4">
        <div className="flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
          <h3 className="text-ink font-bold"><sk-t>{copy.title}</sk-t></h3>
        </div>

        <p className="text-ink-muted mt-2 mb-4 text-sm leading-relaxed">
          <sk-t>
            {stats.trainedDraws > 0
                ? copy.intro(stats.trainedDraws, Math.round(stats.maxPercentile * 100))
                : copy.introWithoutCrowd}
          </sk-t>
        </p>

        {recommendations.length > 1 ? (
            <TicketPicker recommendations={recommendations} selected={selected} onSelect={onSelect} />
        ) : (
            <div className="bg-surface-2 rounded-lg px-2 py-4">
              <BallRow numbers={numbers} size="fluid" className="mx-auto max-w-xs" />
            </div>
        )}

        <div className="mt-4 grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          <div className="bg-surface-2 rounded-lg p-3">
            <h4 className="text-ink mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Waypoints className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <sk-t>{copy.shape}</sk-t>
            </h4>
            <PaperPattern numbers={numbers} compare={nearestDraw?.numbers} className="w-full" />
            {nearestDraw && (
                <p className="text-ink-muted mt-2 text-center text-xs">
                  <sk-t>{copy.nearest(nearestDraw.drawNo, nearestDraw.date)}</sk-t>
                </p>
            )}
          </div>

          <div className="space-y-3">
            {popularityPercentile !== null && <CrowdBar percentile={popularityPercentile} />}

            {/* 이 조합에만 해당하는 것을 위에, 모든 추천에 똑같이 붙는 모델 검증과 참고 수치를 아래에 둔다. */}
            <div className="bg-surface-2 rounded-lg p-3">
              <h4 className="text-ink mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                <sk-t>{copy.pastDistance}</sk-t>
              </h4>
              <p className="text-ink-muted text-xs leading-relaxed">
                <sk-t>
                  {closestPastDraw
                      ? copy.overlap(closestPastDraw.drawNo, closestPastDraw.overlap, stats.maxPastOverlap)
                      : copy.noOverlap}
                  {closestPastDraw && avoidedCount > 0 && <> {copy.avoided(avoidedCount)}</>}
                </sk-t>
              </p>
            </div>

            {validation && validation.quietDraws > 0 && (
                <div className="bg-surface-2 rounded-lg p-3">
                  <h4 className="text-ink mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <FlaskConical className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <sk-t>{copy.validation}</sk-t>
                  </h4>
                  <p className="text-ink-muted text-xs leading-relaxed">
                    <sk-t>
                      {copy.validationLine(
                          validation.draws,
                          validation.quietDraws,
                          validation.quietShare.toFixed(2),
                          validation.allShare.toFixed(2),
                      )}
                    </sk-t>
                  </p>
                </div>
            )}

            <div className="bg-surface-2 rounded-lg p-3">
              <h4 className="text-ink mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Ruler className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <sk-t>{copy.metrics}</sk-t>
              </h4>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <Metric label={t.features.hullArea} value={features.hullArea.toFixed(1)} />
                <Metric label={t.features.mstLength} value={features.mstLength.toFixed(1)} />
                <Metric label={t.features.eccentricity} value={features.eccentricity.toFixed(2)} />
                <Metric label={t.features.nearestMean} value={features.nearestMean.toFixed(2)} />
                <Metric label={t.features.rowsUsed} value={copy.lines(features.rowsUsed)} />
                <Metric label={t.features.columnsUsed} value={copy.lines(features.columnsUsed)} />
              </dl>
            </div>
          </div>
        </div>

        <p className="text-ink-muted mt-3 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right text-[10px]">
          {validation && <span><sk-t>{copy.correlationLine(validation.correlation.toFixed(2))}</sk-t></span>}
          <span><sk-t>{copy.trainTime(Math.round(stats.trainMs))}</sk-t></span>
          <span><sk-t>· {copy.disclaimer}</sk-t></span>
        </p>
      </div>
  )
}

/** 서로 번호가 겹치지 않는 여러 장. 누르면 아래 설명이 그 장으로 바뀐다. */
function TicketPicker({
  recommendations,
  selected,
  onSelect,
}: {
  recommendations: readonly Recommendation[]
  selected: number
  onSelect: (index: number) => void
}) {
  const { t } = useTranslation()
  const copy = t.analysis.recommendation
  const count = recommendations.length
  const percent = (rate: number) => (rate * 100).toFixed(1)

  return (
      <div className="bg-surface-2 rounded-lg p-3">
        <p className="text-ink-muted mb-3 text-xs leading-relaxed">
          <sk-t>{copy.setHint(count, percent(SPREAD_HIT_RATE[count]), percent(independentHitRate(count)))}</sk-t>
        </p>
        <ol className="space-y-1.5">
          {recommendations.map((item, index) => (
              <li key={item.numbers.join()}>
                <button
                    type="button"
                    aria-pressed={index === selected}
                    onClick={() => onSelect(index)}
                    className={cn(
                        "flex w-full items-center gap-2 rounded-md border px-2 py-1.5 transition-colors sm:gap-3",
                        index === selected ? "bg-surface border-blue-500" : "border-transparent hover:border-line",
                    )}
                >
                  <span className="text-ink-muted w-8 shrink-0 text-left text-xs"><sk-t>{copy.ticket(index + 1)}</sk-t></span>
                  <BallRow numbers={item.numbers} size="fluid" className="max-w-64 min-w-0 flex-1 justify-start gap-1.5" />
                </button>
              </li>
          ))}
        </ol>
      </div>
  )
}

/** 무작위 조합과 견준 구매 쏠림. 막대가 짧을수록 덜 몰리는 조합이다. */
function CrowdBar({ percentile }: { percentile: number }) {
  const { t } = useTranslation()
  const copy = t.analysis.recommendation
  const percent = Math.round(percentile * 100)

  return (
      <div className="bg-surface-2 rounded-lg p-3">
        <div className="mb-1 flex items-center justify-between">
          <h4 className="text-ink flex items-center gap-1.5 text-sm font-semibold">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <sk-t>{copy.crowd}</sk-t>
          </h4>
          <span className="text-ink text-sm font-bold"><sk-t>{copy.crowdValue(percent)}</sk-t></span>
        </div>
        <div className="bg-line h-2 overflow-hidden rounded-full">
          <div
              data-sk-tone
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500"
              style={{ width: `${Math.max(2, percent)}%` }}
          />
        </div>
        <p className="text-ink-muted mt-1.5 text-xs leading-relaxed"><sk-t>{copy.crowdHint}</sk-t></p>
      </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
      <>
        <dt className="text-ink-muted"><sk-t>{label}</sk-t></dt>
        <dd className="text-ink text-right font-medium"><sk-t>{value}</sk-t></dd>
      </>
  )
}
