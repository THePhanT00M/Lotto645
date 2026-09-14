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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminStats } from "@/hooks/use-admin-stats"
import { ALL_NUMBERS } from "@/lib/lotto/constants"
import type { Rank } from "@/lib/lotto/rank"
import type { AnalyzedResult, StatsSummary } from "@/lib/lotto/stats"
import type { WinningLottoNumbers } from "@/lib/lotto/types"

/**
 * 관리자 통계 대시보드
 *
 * 최신 회차를 기준으로 사이트에서 생성된 번호의 당첨 성과를 집계하고,
 * AI 추천과 일반 추첨을 비교한다. 다음 회차 대기 번호의 빈도도 함께 본다.
 */
export default function AdminStatsPage() {
  const { isLoading, error, latestDraw, upcomingDrawNo, stats, winners, pendingCount, pendingFrequency } =
      useAdminStats()

  if (isLoading) return <StatsSkeleton />
  if (error) return <StatsError message={error} />

  return (
      <StatsView
          latestDraw={latestDraw}
          upcomingDrawNo={upcomingDrawNo}
          stats={stats}
          winners={winners}
          pendingCount={pendingCount}
          pendingFrequency={pendingFrequency}
      />
  )
}

type FrequencyEntry = { number: number; count: number }

interface StatsViewProps {
  latestDraw: WinningLottoNumbers | null
  upcomingDrawNo: number | null
  stats: { overall: StatsSummary; ai: StatsSummary; manual: StatsSummary }
  winners: AnalyzedResult[]
  pendingCount: number
  pendingFrequency: { ai: FrequencyEntry[]; manual: FrequencyEntry[] }
}

/** 화면 본문. 스켈레톤도 이 함수를 자리표시 값으로 부르므로 글자는 <sk-t> 로 감싼다. */
function StatsView({ latestDraw, upcomingDrawNo, stats, winners, pendingCount, pendingFrequency }: StatsViewProps) {
  const { t } = useTranslation()
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
                  <sk-t>{t.lotto.drawNo(latestDraw.drawNo)}</sk-t>
                </div>
                <div className="text-ink-muted absolute right-0 text-sm"><sk-t>{latestDraw.date}</sk-t></div>
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
              <sk-t>{t.admin.stats.tabRanks}</sk-t>
            </TabsTrigger>
            <TabsTrigger value="matches" className={TAB_TRIGGER_CLASS}>
              <sk-t>{t.admin.stats.tabMatches}</sk-t>
            </TabsTrigger>
            <TabsTrigger value="comparison" className={TAB_TRIGGER_CLASS}>
              <sk-t>{t.admin.stats.tabCompare}</sk-t>
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
                  <sk-t>{t.admin.stats.waitingTitle(upcomingDrawNo ?? 0)}</sk-t>
                </h3>
                <p className="text-ink-muted text-sm">
                  <sk-t>{t.admin.stats.waitingBody(pendingCount)}</sk-t>
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

/*
 * 자리표시 값
 *
 * 글자는 가려지므로 자릿수와 줄 수만 실제와 같으면 된다. 대기 번호는 다음 회차에 번호가
 * 쌓여 있는 쪽이 보통이라 빈도 두 칸을 그대로 둔다. 한 회차에 나오는 당첨 기록은 대개
 * 한두 건이라 한 건으로 둔다.
 */
const PLACEHOLDER_NUMBERS = [12, 18, 25, 29, 31, 40]

const PLACEHOLDER_DRAW: WinningLottoNumbers = { drawNo: 1241, date: "2026-09-12", numbers: PLACEHOLDER_NUMBERS, bonusNo: 19 }

const RANKS: Rank[] = [1, 2, 3, 4, 5, null]

const placeholderSummary = (total: number): StatsSummary => ({
  total,
  winCount: 2,
  winRate: "1.41",
  rankCounts: RANKS.map((rank) => ({ rank, count: rank === 5 ? 2 : rank === null ? total - 2 : 0, percentage: 0 })),
  matchCounts: Array.from({ length: 7 }, (_, matchCount) => ({ matchCount, count: 0, percentage: 0 })),
})

const PLACEHOLDER_WINNERS: AnalyzedResult[] = [
  {
    result: { id: "placeholder", numbers: PLACEHOLDER_NUMBERS, timestamp: Date.UTC(2026, 8, 10), isAiRecommended: true },
    match: { matchCount: 3, bonusMatch: false, rank: 5 },
  },
]

const PLACEHOLDER_FREQUENCY: FrequencyEntry[] = ALL_NUMBERS.map((number) => ({ number, count: 12 }))

/** 통계를 불러오는 동안 실제 화면(StatsView)을 자리표시 값으로 그리고 글자만 가린다. */
function StatsSkeleton() {
  const { t } = useTranslation()

  return (
      <div role="status" aria-label={t.admin.stats.title} aria-busy>
        <div className="is-sk" aria-hidden inert>
          <StatsView
              latestDraw={PLACEHOLDER_DRAW}
              upcomingDrawNo={PLACEHOLDER_DRAW.drawNo + 1}
              stats={{ overall: placeholderSummary(142), ai: placeholderSummary(100), manual: placeholderSummary(42) }}
              winners={PLACEHOLDER_WINNERS}
              pendingCount={100}
              pendingFrequency={{ ai: PLACEHOLDER_FREQUENCY, manual: PLACEHOLDER_FREQUENCY }}
          />
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
