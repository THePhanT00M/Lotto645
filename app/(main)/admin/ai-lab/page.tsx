"use client"

import { Database, Download, FlaskConical, RefreshCw, Target, Trophy } from "lucide-react"
import { useTranslation } from "@/components/i18n/locale-provider"
import AiLabSkeleton from "@/components/admin/ai-lab-skeleton"
import RecordCard from "@/components/admin/record-card"
import { StatTile } from "@/components/admin/stat-tiles"
import { EmptyState } from "@/components/common/empty-state"
import { Notice } from "@/components/common/notice"
import { PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { toCsv, usePickInsights, type MatchBucket } from "@/hooks/use-pick-insights"

/**
 * AI 추천 데이터 (관리자)
 *
 * 추천할 때마다 남긴 번호·기하 특징·모델 정보를 모아 보여준다.
 * 회차가 발표되면 채점 결과가 채워지므로, 실제 성적을 무작위 기대값과
 * 견주거나 기록을 내려받아 다시 학습시키는 데 쓴다.
 */
export default function AiLabPage() {
  const { t } = useTranslation()
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

  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={FlaskConical}
            title={t.admin.aiLab.title}
            description={t.admin.aiLab.description}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={reload} className="bg-surface border-line">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t.common.refresh}
                </Button>
                <Button onClick={download} disabled={records.length === 0} className="bg-blue-600 text-white hover:bg-blue-700">
                  <Download className="mr-2 h-4 w-4" />
                  {t.admin.aiLab.download}
                </Button>
              </div>
            }
        />

        {error && (
            <Notice title={t.admin.aiLab.loadFailed} tone="danger">
              <p className="opacity-90">{error}</p>
              <p className="opacity-90">
                {t.admin.update.migrationHint}
              </p>
            </Notice>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={Database} label={t.admin.aiLab.collected} value={summary.total.toLocaleString()} hint={t.admin.aiLab.drawCount(summary.drawCount)} />
          <StatTile icon={Target} label={t.admin.aiLab.scored} value={summary.scored.toLocaleString()} hint={t.admin.aiLab.unscored(summary.total - summary.scored)} />
          <StatTile
              icon={Trophy}
              label={t.admin.aiLab.wins}
              value={summary.winCount.toLocaleString()}
              valueClass="text-green-600 dark:text-green-500"
              hint={summary.scored > 0 ? `${((summary.winCount / summary.scored) * 100).toFixed(2)}%` : t.admin.aiLab.awaitingScore}
          />
          <StatTile
              icon={FlaskConical}
              label={t.admin.aiLab.averageMatched}
              value={summary.averageMatched.toFixed(3)}
              valueClass="text-blue-600 dark:text-blue-400"
              hint={t.admin.aiLab.expected(summary.expectedMatched.toFixed(3))}
          />
        </div>

        {summary.scored > 0 && <MatchDistribution buckets={summary.buckets} />}

        <Panel className="space-y-4">
          <h3 className="text-ink text-xl font-bold">{t.admin.aiLab.featureAverages}</h3>
          <p className="text-ink-muted text-sm">{t.admin.aiLab.featureAveragesHint(summary.total)}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            {summary.featureAverages.map(({ key, value }) => (
                <div key={key} className="flex justify-between gap-2">
                  <dt className="text-ink-muted truncate">{t.features[key as keyof typeof t.features]}</dt>
                  <dd className="text-ink font-medium">{value.toFixed(2)}</dd>
                </div>
            ))}
          </dl>
        </Panel>

        <Panel className="space-y-4">
          <div>
            <h3 className="text-ink text-xl font-bold">{t.admin.aiLab.recent}</h3>
            <p className="text-ink-muted mt-1 text-sm">
              {t.admin.aiLab.recentHint}
            </p>
          </div>

          {records.length === 0 ? (
              <EmptyState icon={Database} message={t.admin.aiLab.empty} />
          ) : (
              <div className="space-y-2">
                {records.slice(0, 30).map((record) => (
                    <RecordCard key={record.id} record={record} />
                ))}
              </div>
          )}
        </Panel>

        <Notice title={t.admin.aiLab.guideTitle}>
          <ul className="text-ink-muted mt-1 list-inside list-disc space-y-1 opacity-90">
            <li>{t.admin.aiLab.guideSaved}</li>
            <li>{t.admin.aiLab.guideScored}</li>
            <li>{t.admin.aiLab.guideCsv}</li>
          </ul>
        </Notice>
      </div>
  )
}

function MatchDistribution({ buckets }: { buckets: MatchBucket[] }) {
  const { t } = useTranslation()

  return (
      <Panel className="space-y-4">
        <div>
          <h3 className="text-ink text-xl font-bold">{t.admin.aiLab.distribution}</h3>
          <p className="text-ink-muted mt-1 text-sm">{t.admin.aiLab.distributionHint}</p>
        </div>

        <div className="space-y-3">
          {buckets.map(({ matchCount, count, ratio, expected }) => (
              <div key={matchCount} className="flex items-center gap-3">
                <div className="text-ink-muted w-16 text-sm font-medium">{t.admin.aiLab.matched(matchCount)}</div>

                <div className="relative h-7 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-[#3f3f3f]">
                  <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${Math.max(0, ratio * 100)}%` }}
                  />
                  {/* 무작위로 찍었을 때의 기대 위치를 눈금으로 표시한다. */}
                  <div
                      className="absolute top-0 h-full w-0.5 bg-amber-500"
                      style={{ left: `${Math.min(100, expected * 100)}%` }}
                      title={t.admin.aiLab.expectedMark((expected * 100).toFixed(2))}
                  />
                </div>

                <div className="text-ink-muted w-32 text-right text-sm">
                  {t.history.count(count)} · {(ratio * 100).toFixed(2)}%
                </div>
              </div>
          ))}
        </div>

        <p className="text-ink-muted text-xs">{t.admin.aiLab.markHint}</p>
      </Panel>
  )
}
