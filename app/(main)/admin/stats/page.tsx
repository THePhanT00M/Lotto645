"use client"

import { Award, BarChart3, Calendar, Sparkles, Target, TrendingUp } from "lucide-react"
import { useTranslation } from "@/components/i18n/locale-provider"
import MatchDistribution from "@/components/admin/match-distribution"
import PendingFrequency from "@/components/admin/pending-frequency"
import RankDistribution from "@/components/admin/rank-distribution"
import SourceComparison from "@/components/admin/source-comparison"
import { StatTile } from "@/components/admin/stat-tiles"
import WinnerList from "@/components/admin/winner-list"
import { PageHeader, SectionHeading } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { BallRow } from "@/components/lotto/ball-row"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminStats } from "@/hooks/use-admin-stats"

/**
 * 관리자 통계 대시보드
 *
 * 최신 회차를 기준으로 사이트에서 생성된 번호의 당첨 성과를 집계하고,
 * AI 추천과 일반 추첨을 비교한다. 다음 회차 대기 번호의 빈도도 함께 본다.
 */
export default function AdminStatsPage() {
  const { t } = useTranslation()
  const { isLoading, error, latestDraw, upcomingDrawNo, stats, winners, pendingCount, pendingFrequency } =
      useAdminStats()

  if (isLoading) return <StatsSkeleton />
  if (error) return <StatsError message={error} />

  const drawNo = latestDraw?.drawNo

  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={BarChart3}
            title={t.admin.stats.title}
            description={t.admin.stats.description(drawNo ?? 0)}
        />

        {latestDraw && (
            <Panel>
              <SectionHeading icon={Calendar} title={t.admin.stats.latestDraw} />
              <div className="relative flex items-center justify-center py-1">
                <div className="text-center text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {latestDraw.drawNo}회차
                </div>
                <div className="text-ink-muted absolute right-0 text-sm">{latestDraw.date}</div>
              </div>
              <BallRow
                  numbers={latestDraw.numbers}
                  bonusNo={latestDraw.bonusNo}
                  size="fluid"
                  className="mx-auto mt-4 w-full max-w-md gap-2 sm:gap-3"
                  ballClassName="shadow-sm"
              />
            </Panel>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={Target} label={t.admin.stats.totalDraws(drawNo ?? 0)} value={String(stats.overall.total)} />
          <StatTile
              icon={Award}
              label={t.admin.stats.overallRate}
              value={`${stats.overall.winRate}%`}
              valueClass="text-green-600 dark:text-green-500"
              hint={t.admin.stats.overallHint(stats.overall.winCount)}
          />
          <StatTile
              icon={Sparkles}
              label={t.admin.stats.aiRate}
              value={`${stats.ai.winRate}%`}
              valueClass="text-blue-600 dark:text-blue-400"
              hint={t.admin.stats.aiHint(stats.ai.winCount, stats.ai.total)}
          />
          <StatTile
              icon={TrendingUp}
              label={t.admin.stats.manualRate}
              value={`${stats.manual.winRate}%`}
              valueClass="text-purple-600 dark:text-purple-400"
              hint={t.admin.stats.manualHint(stats.manual.winCount, stats.manual.total)}
          />
        </div>

        <Tabs defaultValue="ranks" className="space-y-4">
          <TabsList className="border-line grid w-full grid-cols-3 rounded-lg border bg-gray-100 p-1 dark:bg-[#0f0f0f]">
            <TabsTrigger value="ranks" className={TAB_TRIGGER_CLASS}>
              등수별 통계
            </TabsTrigger>
            <TabsTrigger value="matches" className={TAB_TRIGGER_CLASS}>
              일치 개수
            </TabsTrigger>
            <TabsTrigger value="comparison" className={TAB_TRIGGER_CLASS}>
              AI vs 일반
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ranks" className="space-y-4">
            <RankDistribution summary={stats.overall} drawNo={drawNo} />
            <WinnerList winners={winners} />
          </TabsContent>

          <TabsContent value="matches">
            <MatchDistribution summary={stats.overall} drawNo={drawNo} />
          </TabsContent>

          <TabsContent value="comparison">
            <SourceComparison ai={stats.ai} manual={stats.manual} drawNo={drawNo} />
          </TabsContent>
        </Tabs>

        {pendingCount > 0 && (
            <>
              <div className="border-accent-line bg-accent-soft flex flex-col gap-2 rounded-xl border p-4">
                <h3 className="text-accent flex items-center gap-2 font-semibold">
                  <Calendar className="h-5 w-5" />
                  {upcomingDrawNo}회차 결과 대기 중
                </h3>
                <p className="text-ink-muted text-sm">
                  {pendingCount}개의 추첨 번호가 당첨 결과 발표를 기다리고 있습니다. 다음 회차 발표 후 자동으로
                  분석됩니다.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <PendingFrequency
                    title={t.admin.stats.aiFrequency}
                    description={t.admin.stats.aiFrequencyHint}
                    entries={pendingFrequency.ai}
                    iconClass="text-blue-600 dark:text-blue-400"
                />
                <PendingFrequency
                    title={t.admin.stats.manualFrequency}
                    description={t.admin.stats.manualFrequencyHint}
                    entries={pendingFrequency.manual}
                    iconClass="text-purple-600 dark:text-purple-400"
                />
              </div>
            </>
        )}
      </div>
  )
}

const TAB_TRIGGER_CLASS =
    "text-ink-muted rounded-md font-medium transition-colors data-[state=active]:bg-white data-[state=active]:text-ink data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#272727]"

function StatsSkeleton() {
  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-6 w-80" />
        </div>
        <Panel className="space-y-4">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mx-auto h-8 w-20" />
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-10 rounded-full" />
            ))}
          </div>
        </Panel>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-34 rounded-xl" />
          ))}
        </div>
      </div>
  )
}

function StatsError({ message }: { message: string }) {
  const { t } = useTranslation()

  return (
      <div className="mx-auto w-full max-w-shell flex min-h-[50vh] items-center justify-center p-6">
        <div className="flex flex-col items-center rounded-lg border border-red-200 bg-[#fff0f0] p-8 dark:border-[#5c2b2b] dark:bg-[#3e1b1b]">
          <BarChart3 className="text-danger mb-4 h-16 w-16" />
          <h2 className="text-danger text-xl font-bold">{t.admin.stats.loadFailed}</h2>
          <p className="text-ink-muted mt-2 text-center">{t.admin.stats.loadFailedHint}</p>
          <code className="text-danger mt-4 w-full rounded bg-gray-100 p-2 text-center text-sm dark:bg-[#272727]">
            {message}
          </code>
        </div>
      </div>
  )
}
