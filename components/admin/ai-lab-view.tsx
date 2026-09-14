"use client"

import { Database, Download, FlaskConical, RefreshCw, Target, Trophy } from "lucide-react"
import { useTranslation } from "@/components/i18n/locale-provider"
import DrawBreakdown from "@/components/admin/draw-breakdown"
import ProspectiveSignals from "@/components/admin/prospective-signals"
import RecordCard from "@/components/admin/record-card"
import { StatTile } from "@/components/admin/stat-tiles"
import { EmptyState } from "@/components/common/empty-state"
import { Notice } from "@/components/common/notice"
import { PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import type { InsightSummary, MatchBucket, PickInsight } from "@/hooks/use-pick-insights"
import type { SignalTrack } from "@/lib/lotto/prospective"

/** 최근 기록에 보여 주는 개수 */
export const RECENT_LIMIT = 30

interface AiLabViewProps {
  records: readonly PickInsight[]
  summary: InsightSummary
  /** 사전 등록 신호의 성적. 당첨 이력을 불러오지 못하면 빈 배열이다. */
  signals: readonly SignalTrack[]
  error?: string | null
  onReload?: () => void
  onDownload?: () => void
}

/**
 * AI 추천 데이터 화면 본문
 *
 * 스켈레톤도 이 함수를 자리표시 값으로 부른다(ai-lab-skeleton). 화면을 고치면
 * 자리표시가 저절로 따라오도록, 글자는 모두 <sk-t> 로 감싼다.
 */
export default function AiLabView({ records, summary, signals, error = null, onReload, onDownload }: AiLabViewProps) {
  const { t } = useTranslation()
  const { overall } = summary

  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={FlaskConical}
            title={t.admin.aiLab.title}
            description={t.admin.aiLab.description}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={onReload} className="bg-surface border-line">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <sk-t>{t.common.refresh}</sk-t>
                </Button>
                <Button
                    data-sk-tone
                    onClick={onDownload}
                    disabled={records.length === 0}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  <sk-t>{t.admin.aiLab.download}</sk-t>
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
              hint={
                overall.ai
                    ? t.admin.aiLab.winRate(
                        ((overall.ai.winCount / overall.ai.count) * 100).toFixed(2),
                        ((overall.ai.expectedWins / overall.ai.count) * 100).toFixed(2),
                    )
                    : t.admin.aiLab.awaitingScore
              }
          />
          <StatTile
              icon={FlaskConical}
              label={t.admin.aiLab.averageMatched}
              value={summary.averageMatched.toFixed(3)}
              valueClass="text-blue-600 dark:text-blue-400"
              hint={
                overall.ai
                    ? t.admin.aiLab.expectedVerdict(summary.expectedMatched.toFixed(3), t.admin.aiLab.verdict[overall.ai.verdict])
                    : t.admin.aiLab.expected(summary.expectedMatched.toFixed(3))
              }
          />
        </div>

        {summary.draws.length > 0 && <DrawBreakdown rows={summary.draws} overall={overall} />}

        {signals.length > 0 && <ProspectiveSignals tracks={signals} />}

        {summary.scored > 0 && <MatchDistribution buckets={summary.buckets} />}

        <Panel className="space-y-4">
          <h3 className="text-ink text-xl font-bold"><sk-t>{t.admin.aiLab.featureAverages}</sk-t></h3>
          <p className="text-ink-muted text-sm"><sk-t>{t.admin.aiLab.featureAveragesHint(summary.total)}</sk-t></p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            {summary.featureAverages.map(({ key, value }) => (
                <div key={key} className="flex justify-between gap-2">
                  <dt className="text-ink-muted truncate"><sk-t>{t.features[key as keyof typeof t.features]}</sk-t></dt>
                  <dd className="text-ink font-medium"><sk-t>{value.toFixed(2)}</sk-t></dd>
                </div>
            ))}
          </dl>
        </Panel>

        <Panel className="space-y-4">
          <div>
            <h3 className="text-ink text-xl font-bold"><sk-t>{t.admin.aiLab.recent}</sk-t></h3>
            <p className="text-ink-muted mt-1 text-sm">
              <sk-t>{t.admin.aiLab.recentHint}</sk-t>
            </p>
          </div>

          {records.length === 0 ? (
              <EmptyState icon={Database} message={t.admin.aiLab.empty} />
          ) : (
              <div className="space-y-2">
                {records.slice(0, RECENT_LIMIT).map((record) => (
                    <RecordCard key={record.id} record={record} />
                ))}
              </div>
          )}
        </Panel>

        <Notice title={t.admin.aiLab.guideTitle}>
          <ul className="text-ink-muted mt-1 list-inside list-disc space-y-1 opacity-90">
            <li><sk-t>{t.admin.aiLab.guideSaved}</sk-t></li>
            <li><sk-t>{t.admin.aiLab.guideScored}</sk-t></li>
            <li><sk-t>{t.admin.aiLab.guideCsv}</sk-t></li>
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
          <h3 className="text-ink text-xl font-bold"><sk-t>{t.admin.aiLab.distribution}</sk-t></h3>
          <p className="text-ink-muted mt-1 text-sm"><sk-t>{t.admin.aiLab.distributionHint}</sk-t></p>
        </div>

        <div className="space-y-3">
          {buckets.map(({ matchCount, count, ratio, expected }) => (
              <div key={matchCount} className="flex items-center gap-3">
                <div className="text-ink-muted w-16 text-sm font-medium"><sk-t>{t.admin.aiLab.matched(matchCount)}</sk-t></div>

                <div className="relative h-7 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-[#3f3f3f]">
                  <div
                      data-sk-tone
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${Math.max(0, ratio * 100)}%` }}
                  />
                  {/* 무작위로 찍었을 때의 기대 위치를 눈금으로 표시한다. */}
                  <div
                      data-sk-tone
                      className="absolute top-0 h-full w-0.5 bg-amber-500"
                      style={{ left: `${Math.min(100, expected * 100)}%` }}
                      title={t.admin.aiLab.expectedMark((expected * 100).toFixed(2))}
                  />
                </div>

                <div className="text-ink-muted w-32 text-right text-sm">
                  <sk-t>{t.history.count(count)} · {(ratio * 100).toFixed(2)}%</sk-t>
                </div>
              </div>
          ))}
        </div>

        <p className="text-ink-muted text-xs"><sk-t>{t.admin.aiLab.markHint}</sk-t></p>
      </Panel>
  )
}
