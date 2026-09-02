"use client"

import { rankStyle } from "@/components/common/rank-badge"
import { Panel } from "@/components/common/panel"
import type { StatsSummary } from "@/lib/lotto/stats"
import { useTranslation } from "@/components/i18n/locale-provider"

interface RankDistributionProps {
  summary: StatsSummary
  drawNo?: number
}

/** 등수별 당첨 분포를 카드 그리드로 보여준다. */
export default function RankDistribution({ summary, drawNo }: RankDistributionProps) {
  const { t } = useTranslation()
  return (
      <Panel className="space-y-5">
        <div>
          <h3 className="text-ink text-xl font-bold">{t.admin.stats.rankDistribution}</h3>
          <p className="text-ink-muted mt-1 text-sm">{t.admin.stats.rankHint(drawNo ?? 0)}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {summary.rankCounts.map(({ rank, count, percentage }) => (
              <div key={rank === null ? t.lotto.miss : t.lotto.rank(rank)} className={`rounded-lg border p-4 ${rankStyle(rank)}`}>
                <div className="mb-2 text-sm font-medium opacity-80">{rank === null ? t.lotto.miss : t.lotto.rank(rank)}</div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="mt-1 text-xs opacity-70">{percentage.toFixed(2)}%</div>
              </div>
          ))}
        </div>
      </Panel>
  )
}
