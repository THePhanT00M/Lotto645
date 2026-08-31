"use client"

import { Database, Download, FlaskConical, RefreshCw, Target, Trophy } from "lucide-react"
import RecordCard from "@/components/admin/record-card"
import { StatTile } from "@/components/admin/stat-tiles"
import { EmptyState } from "@/components/common/empty-state"
import { Notice } from "@/components/common/notice"
import { PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toCsv, useAiRecords, type MatchBucket } from "@/hooks/use-ai-records"
import { FEATURE_LABELS } from "@/lib/lotto/features"

/**
 * AI 추천 데이터 (관리자)
 *
 * 추천할 때마다 남긴 번호·기하 특징·모델 정보를 모아 보여준다.
 * 회차가 발표되면 채점 결과가 채워지므로, 실제 성적을 무작위 기대값과
 * 견주거나 기록을 내려받아 다시 학습시키는 데 쓴다.
 */
export default function AiLabPage() {
  const { records, summary, isLoading, error, reload } = useAiRecords()

  const download = () => {
    const blob = new Blob([toCsv(records)], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `ai-recommendations-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <LabSkeleton />

  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={FlaskConical}
            title="AI 추천 데이터"
            description="추천할 때마다 남긴 번호와 기하 특징을 모아 성적을 확인하고 내려받습니다."
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={reload} className="bg-surface border-line">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  새로고침
                </Button>
                <Button onClick={download} disabled={records.length === 0} className="bg-blue-600 text-white hover:bg-blue-700">
                  <Download className="mr-2 h-4 w-4" />
                  CSV 내려받기
                </Button>
              </div>
            }
        />

        {error && (
            <Notice title="기록을 불러오지 못했습니다" tone="danger">
              <p className="opacity-90">{error}</p>
              <p className="opacity-90">
                ai_recommendations 표가 아직 없다면 supabase/migrations의 SQL을 먼저 실행해 주세요.
              </p>
            </Notice>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={Database} label="수집된 추천" value={summary.total.toLocaleString()} hint={`${summary.drawCount}개 회차`} />
          <StatTile icon={Target} label="채점 완료" value={summary.scored.toLocaleString()} hint={`미채점 ${(summary.total - summary.scored).toLocaleString()}건`} />
          <StatTile
              icon={Trophy}
              label="5등 이상 당첨"
              value={summary.winCount.toLocaleString()}
              valueClass="text-green-600 dark:text-green-500"
              hint={summary.scored > 0 ? `${((summary.winCount / summary.scored) * 100).toFixed(2)}%` : "채점 대기"}
          />
          <StatTile
              icon={FlaskConical}
              label="평균 적중 개수"
              value={summary.averageMatched.toFixed(3)}
              valueClass="text-blue-600 dark:text-blue-400"
              hint={`무작위 기대값 ${summary.expectedMatched.toFixed(3)}`}
          />
        </div>

        {summary.scored > 0 && <MatchDistribution buckets={summary.buckets} />}

        <Panel className="space-y-4">
          <h3 className="text-ink text-xl font-bold">특징 평균</h3>
          <p className="text-ink-muted text-sm">수집된 추천 {summary.total.toLocaleString()}건의 용지 모양 지표 평균입니다.</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            {summary.featureAverages.map(({ key, value }) => (
                <div key={key} className="flex justify-between gap-2">
                  <dt className="text-ink-muted truncate">{FEATURE_LABELS[key as keyof typeof FEATURE_LABELS]}</dt>
                  <dd className="text-ink font-medium">{value.toFixed(2)}</dd>
                </div>
            ))}
          </dl>
        </Panel>

        <Panel className="space-y-4">
          <div>
            <h3 className="text-ink text-xl font-bold">최근 기록</h3>
            <p className="text-ink-muted mt-1 text-sm">
              기록을 누르면 그때의 용지 모양과 기하 특징이 펼쳐집니다.
            </p>
          </div>

          {records.length === 0 ? (
              <EmptyState icon={Database} message="아직 수집된 추천 기록이 없습니다." />
          ) : (
              <div className="space-y-2">
                {records.slice(0, 30).map((record) => (
                    <RecordCard key={record.id} record={record} />
                ))}
              </div>
          )}
        </Panel>

        <Notice title="데이터 활용 안내">
          <ul className="text-ink-muted mt-1 list-inside list-disc space-y-1 opacity-90">
            <li>추천할 때마다 번호와 함께 기하 특징 21가지, 그때의 모델 정보가 저장됩니다.</li>
            <li>회차가 발표되면 당첨 번호 업데이트와 함께 자동으로 채점됩니다.</li>
            <li>CSV로 내려받아 다른 도구에서 다시 학습시키거나 모델 버전별 성적을 견줄 수 있습니다.</li>
          </ul>
        </Notice>
      </div>
  )
}

function MatchDistribution({ buckets }: { buckets: MatchBucket[] }) {
  return (
      <Panel className="space-y-4">
        <div>
          <h3 className="text-ink text-xl font-bold">적중 개수 분포</h3>
          <p className="text-ink-muted mt-1 text-sm">채점된 추천의 실제 적중 개수를 무작위 기대값과 견줍니다.</p>
        </div>

        <div className="space-y-3">
          {buckets.map(({ matchCount, count, ratio, expected }) => (
              <div key={matchCount} className="flex items-center gap-3">
                <div className="text-ink-muted w-16 text-sm font-medium">{matchCount}개</div>

                <div className="relative h-7 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-[#3f3f3f]">
                  <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${Math.max(0, ratio * 100)}%` }}
                  />
                  {/* 무작위로 찍었을 때의 기대 위치를 눈금으로 표시한다. */}
                  <div
                      className="absolute top-0 h-full w-0.5 bg-amber-500"
                      style={{ left: `${Math.min(100, expected * 100)}%` }}
                      title={`무작위 기대 ${(expected * 100).toFixed(2)}%`}
                  />
                </div>

                <div className="text-ink-muted w-32 text-right text-sm">
                  {count}건 · {(ratio * 100).toFixed(2)}%
                </div>
              </div>
          ))}
        </div>

        <p className="text-ink-muted text-xs">주황색 눈금은 무작위로 찍었을 때의 기대 비율입니다.</p>
      </Panel>
  )
}

function LabSkeleton() {
  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
  )
}
