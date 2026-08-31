import { rankStyle } from "@/components/common/rank-badge"
import { Panel } from "@/components/common/panel"
import { rankLabel } from "@/lib/lotto/rank"
import type { StatsSummary } from "@/lib/lotto/stats"

interface RankDistributionProps {
  summary: StatsSummary
  drawNo?: number
}

/** 등수별 당첨 분포를 카드 그리드로 보여준다. */
export default function RankDistribution({ summary, drawNo }: RankDistributionProps) {
  return (
      <Panel className="space-y-5">
        <div>
          <h3 className="text-ink text-xl font-bold">당첨 등수별 분포</h3>
          <p className="text-ink-muted mt-1 text-sm">{drawNo}회차 대상 추첨의 등수별 통계</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {summary.rankCounts.map(({ rank, count, percentage }) => (
              <div key={rankLabel(rank)} className={`rounded-lg border p-4 ${rankStyle(rank)}`}>
                <div className="mb-2 text-sm font-medium opacity-80">{rankLabel(rank)}</div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="mt-1 text-xs opacity-70">{percentage.toFixed(2)}%</div>
              </div>
          ))}
        </div>
      </Panel>
  )
}
