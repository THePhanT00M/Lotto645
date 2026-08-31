"use client"

import { Brain, Ruler, Sigma, Sparkles, Waypoints } from "lucide-react"
import PaperPattern from "@/components/analysis/paper-pattern"
import { BallRow } from "@/components/lotto/ball-row"
import { Skeleton } from "@/components/ui/skeleton"
import { FEATURE_LABELS } from "@/lib/lotto/features"
import type { EngineStats, Recommendation } from "@/lib/lotto/engine"

interface AIRecommendationProps {
  recommendation: Recommendation | null
  stats: EngineStats | null
  isGenerating: boolean
}

/** 추천 결과와 그 근거가 된 용지 모양을 보여준다. */
export default function AIRecommendation({ recommendation, stats, isGenerating }: AIRecommendationProps) {
  if (isGenerating) return <GeneratingSkeleton />
  if (!recommendation || !stats) return null

  const { numbers, features, networkScore, typicality, nearestDraw } = recommendation

  return (
      <div className="bg-surface border-line rounded-lg border p-4">
        <div className="flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
          <h3 className="text-ink font-bold">AI 추천 번호</h3>
        </div>

        <p className="text-ink-muted mt-2 mb-4 text-sm leading-relaxed">
          역대 {stats.drawCount.toLocaleString()}회 당첨 번호를 로또 용지 위의 점으로 옮겨, 여섯 점이 만드는 모양을{" "}
          {stats.featureCount}가지 기하 특징으로 재고 학습한 결과입니다.
        </p>

        <div className="bg-surface-2 rounded-lg px-2 py-4">
          <BallRow numbers={numbers} size="fluid" className="mx-auto max-w-xs" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bg-surface-2 rounded-lg p-3">
            <h4 className="text-ink mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Waypoints className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              용지 위 모양
            </h4>
            <PaperPattern
                numbers={numbers}
                compare={nearestDraw?.numbers}
                className="mx-auto w-full max-w-[320px]"
            />
            {nearestDraw && (
                <p className="text-ink-muted mt-2 text-center text-xs">
                  점선은 모양이 가장 닮은 <span className="text-ink font-medium">{nearestDraw.drawNo}회</span> (
                  {nearestDraw.date})
                </p>
            )}
          </div>

          <div className="space-y-3">
            <ScoreBar
                icon={Brain}
                label="패턴 판별 점수"
                hint="규칙적으로 찍은 조합과 실제 당첨 조합을 가르도록 학습한 신경망의 출력"
                value={networkScore}
            />
            <ScoreBar
                icon={Sigma}
                label="분포 적합도"
                hint="역대 당첨 조합이 이루는 분포의 중심에서 얼마나 가까운지 (마할라노비스 거리)"
                value={typicality}
            />

            <div className="bg-surface-2 rounded-lg p-3">
              <h4 className="text-ink mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Ruler className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                모양 지표
              </h4>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <Metric label={FEATURE_LABELS.hullArea} value={features.hullArea.toFixed(1)} />
                <Metric label={FEATURE_LABELS.mstLength} value={features.mstLength.toFixed(1)} />
                <Metric label={FEATURE_LABELS.eccentricity} value={features.eccentricity.toFixed(2)} />
                <Metric label={FEATURE_LABELS.nearestMean} value={features.nearestMean.toFixed(2)} />
                <Metric label={FEATURE_LABELS.rowsUsed} value={`${features.rowsUsed}줄`} />
                <Metric label={FEATURE_LABELS.columnsUsed} value={`${features.columnsUsed}줄`} />
              </dl>
            </div>
          </div>
        </div>

        <p className="text-ink-muted mt-3 text-right text-[10px]">
          * 신경망 정확도 {(stats.accuracy * 100).toFixed(1)}% · 학습 {Math.round(stats.trainMs)}ms · 과거 데이터 기반
          예측이며 당첨을 보장하지 않습니다.
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

function GeneratingSkeleton() {
  return (
      <div className="bg-surface border-line space-y-4 rounded-lg border p-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-5 rounded-md" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="flex justify-center gap-2 py-4">
          {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-full sm:h-12 sm:w-12" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-[300px] rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
        </div>
      </div>
  )
}
