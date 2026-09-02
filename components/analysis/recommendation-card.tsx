"use client"

import { Brain, Layers, Ruler, ShieldCheck, Sigma, Sparkles, Waypoints } from "lucide-react"
import { Fragment } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"
import PaperPattern from "@/components/analysis/paper-pattern"
import { BallRow } from "@/components/lotto/ball-row"
import { LINE, SkeletonLine, SkeletonLines } from "@/components/common/skeleton-text"
import { Skeleton } from "@/components/ui/skeleton"
import { ALL_NUMBERS } from "@/lib/lotto/constants"
import { GRID_COLUMNS } from "@/lib/lotto/grid"
import { cn } from "@/lib/utils"
import type { EngineStats, Recommendation } from "@/lib/lotto/engine"

interface RecommendationCardProps {
  recommendation: Recommendation | null
  stats: EngineStats | null
  isGenerating: boolean
}

/** 추천 결과와 그 근거가 된 용지 모양을 보여준다. */
export default function RecommendationCard({ recommendation, stats, isGenerating }: RecommendationCardProps) {
  const { t } = useTranslation()

  if (isGenerating) return <GeneratingSkeleton />
  if (!recommendation || !stats) return null

  const { numbers, features, networkScore, typicality, nearestDraw, closestPastDraw, avoidedCount } =
      recommendation

  return (
      <div className="bg-surface border-line rounded-lg border p-4">
        <div className="flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
          <h3 className="text-ink font-bold">{t.analysis.recommendation.title}</h3>
        </div>

        <p className="text-ink-muted mt-2 mb-4 text-sm leading-relaxed">
          역대 {stats.drawCount.toLocaleString()}회 당첨 번호를 로또 용지 위의 점으로 옮겨, 여섯 점이 만드는 모양을{" "}
          {stats.featureCount}가지 기하 특징으로 재고 학습한 결과입니다. 이미 나온 조합과 지나치게 닮은 번호는
          제외했습니다.
        </p>

        <div className="bg-surface-2 rounded-lg px-2 py-4">
          <BallRow numbers={numbers} size="fluid" className="mx-auto max-w-xs" />
        </div>

        <div className="mt-4 grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          <div className="bg-surface-2 rounded-lg p-3">
            <h4 className="text-ink mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Waypoints className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              {t.analysis.recommendation.shape}
            </h4>
            <PaperPattern numbers={numbers} compare={nearestDraw?.numbers} className="w-full" />
            {nearestDraw && (
                <p className="text-ink-muted mt-2 text-center text-xs">
                  {t.analysis.recommendation.nearest(nearestDraw.drawNo, nearestDraw.date)}
                </p>
            )}
          </div>

          <div className="space-y-3">
            <ScoreBar
                icon={Brain}
                label={t.analysis.recommendation.networkScore}
                hint={t.analysis.recommendation.networkHint}
                value={networkScore}
            />
            <ScoreBar
                icon={Sigma}
                label={t.analysis.recommendation.typicality}
                hint={t.analysis.recommendation.typicalityHint}
                value={typicality}
            />

            <div className="bg-surface-2 rounded-lg p-3">
              <h4 className="text-ink mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                {t.analysis.recommendation.pastDistance}
              </h4>
              <p className="text-ink-muted text-xs leading-relaxed">
                {closestPastDraw ? (
                    <>
                      가장 많이 겹치는 회차는{" "}
                      <span className="text-ink font-medium">
                        {closestPastDraw.drawNo}회에서 {closestPastDraw.overlap}개
                      </span>
                      입니다. 이미 나온 조합과 {stats.maxPastOverlap}개를 넘게 겹치지 않도록 걸러냅니다.
                      {avoidedCount > 0 && (
                          <> 이번 회차에 이미 추천한 {avoidedCount.toLocaleString()}개 조합도 후보에서 뺐습니다.</>
                      )}
                    </>
                ) : (
                    <>{t.analysis.recommendation.noOverlap}</>
                )}
              </p>
            </div>

            <div className="bg-surface-2 rounded-lg p-3">
              <h4 className="text-ink mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Ruler className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {t.analysis.recommendation.metrics}
              </h4>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <Metric label={t.features.hullArea} value={features.hullArea.toFixed(1)} />
                <Metric label={t.features.mstLength} value={features.mstLength.toFixed(1)} />
                <Metric label={t.features.eccentricity} value={features.eccentricity.toFixed(2)} />
                <Metric label={t.features.nearestMean} value={features.nearestMean.toFixed(2)} />
                <Metric label={t.features.rowsUsed} value={t.analysis.recommendation.lines(features.rowsUsed)} />
                <Metric label={t.features.columnsUsed} value={t.analysis.recommendation.lines(features.columnsUsed)} />
              </dl>
            </div>
          </div>
        </div>

        <p className="text-ink-muted mt-3 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right text-[10px]">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            신경망 {stats.ensembleSize}개 평균
          </span>
          <span>
            검증 정확도 {(stats.accuracy * 100).toFixed(1)}% (학습 {(stats.trainAccuracy * 100).toFixed(1)}%)
          </span>
          <span>
            점수 보정 Brier {stats.brierBefore.toFixed(3)} → {stats.brierAfter.toFixed(3)}
          </span>
          <span>학습 {Math.round(stats.trainMs)}ms</span>
          <span>· {t.analysis.recommendation.disclaimer}</span>
        </p>
      </div>
  )
}

interface ScoreBarProps {
  icon: typeof Brain
  label: string
  hint: string
  value: number
}

function ScoreBar({ icon: Icon, label, hint, value }: ScoreBarProps) {
  return (
      <div className="bg-surface-2 rounded-lg p-3">
        <div className="mb-1 flex items-center justify-between">
          <h4 className="text-ink flex items-center gap-1.5 text-sm font-semibold">
            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            {label}
          </h4>
          <span className="text-ink text-sm font-bold">{(value * 100).toFixed(1)}%</span>
        </div>
        <div className="bg-line h-2 overflow-hidden rounded-full">
          <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.max(2, value * 100)}%` }}
          />
        </div>
        <p className="text-ink-muted mt-1.5 text-xs leading-relaxed">{hint}</p>
      </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
      <>
        <dt className="text-ink-muted">{label}</dt>
        <dd className="text-ink text-right font-medium">{value}</dd>
      </>
  )
}

/**
 * 생성 중 자리표시
 *
 * 완성된 카드와 같은 골격·같은 여백으로 그린다. 큰 사각형 몇 개로 때우면
 * 결과가 들어오는 순간 높이가 튀어 화면이 흔들리고, 무엇이 만들어지는 중인지도
 * 알 수 없다. 글줄 수와 항목 수는 실제로 감기는 만큼 잡았다.
 */
function GeneratingSkeleton() {
  const { t } = useTranslation()

  return (
      <div
          role="status"
          aria-label={t.analysis.recommendation.building}
          className="bg-surface border-line rounded-lg border p-4"
      >
        <div className="flex h-6 items-center">
          <Skeleton className="mr-2 h-5 w-5 rounded-md" />
          <Skeleton className="h-4 w-28" />
        </div>

        <SkeletonLines
            className="mt-2 mb-4"
            line={LINE.smRelaxed}
            bar="h-3.5"
            widths={["w-full", "w-full md:w-24"]}
            narrowWidths={["w-2/5"]}
            narrowUntil="md"
        />

        <div className="bg-surface-2 rounded-lg px-2 py-4">
          <div className="mx-auto flex max-w-xs items-center gap-2">
            {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="aspect-square w-full min-w-0 rounded-full" />
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          <div className="bg-surface-2 rounded-lg p-3">
            <BlockHeading width="w-24" />

            {/* 용지 칸을 그대로 깔아 둔다. 사각형 하나로는 무엇이 그려질지 짐작할 수 없다. */}
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))` }}>
              {ALL_NUMBERS.map((number) => (
                  <Skeleton key={number} className="aspect-square w-full rounded-[3px]" />
              ))}
            </div>

<SkeletonLine className="mt-2" align="center" width="w-2/3" />
          </div>

          <div className="space-y-3">
            <ScoreBarSkeleton labelWidth="w-24" hintWidths={["w-full", "w-3/4"]} />
            <ScoreBarSkeleton labelWidth="w-20" hintWidths={["w-full lg:w-4/5"]} narrowHintWidths={["w-1/3"]} />

            <div className="bg-surface-2 rounded-lg p-3">
              <BlockHeading width="w-32" />
              <SkeletonLines
                  line={LINE.xsRelaxed}
                  widths={["w-full", "w-full lg:w-11/12"]}
                  narrowWidths={["w-1/2"]}
              />
            </div>

            <div className="bg-surface-2 rounded-lg p-3">
              <BlockHeading width="w-16" />

              {/* 이름과 값이 각각 한 칸을 차지하므로 두 칸씩 여섯 줄이 된다. */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {Array.from({ length: 6 }, (_, index) => (
                    <Fragment key={index}>
                      <div className={cn("flex items-center", LINE.xs)}>
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <div className={cn("flex items-center justify-end", LINE.xs)}>
                        <Skeleton className="h-3 w-10" />
                      </div>
                    </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 꼬리말은 폭이 좁으면 저절로 여러 줄로 감기므로 높이를 고정하지 않는다. */}
        <div className="mt-3 flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
          {["w-20", "w-36", "w-32", "w-14", "w-56"].map((width) => (
              <div key={width} className="flex h-[15px] items-center">
                <Skeleton className={cn("h-2.5", width)} />
              </div>
          ))}
        </div>
      </div>
  )
}

/** 아이콘과 제목이 나란히 놓이는 소제목 자리 */
function BlockHeading({ width }: { width: string }) {
  return (
      <div className="mb-2 flex h-5 items-center gap-1.5">
        <Skeleton className="h-4 w-4 rounded-md" />
        <Skeleton className={cn("h-3.5", width)} />
      </div>
  )
}

/** ScoreBar 자리. 제목·수치·막대·설명까지 같은 순서로 놓는다. */
function ScoreBarSkeleton({
                            labelWidth,
                            hintWidths,
                            narrowHintWidths,
                          }: {
  labelWidth: string
  hintWidths: readonly string[]
  narrowHintWidths?: readonly string[]
}) {
  return (
      <div className="bg-surface-2 rounded-lg p-3">
        <div className="mb-1 flex h-5 items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded-md" />
            <Skeleton className={cn("h-3.5", labelWidth)} />
          </div>
          <Skeleton className="h-3.5 w-12" />
        </div>

        <Skeleton className="h-2 w-full rounded-full" />

        <SkeletonLines className="mt-1.5" line={LINE.xsRelaxed} widths={hintWidths} narrowWidths={narrowHintWidths} />
      </div>
  )
}
