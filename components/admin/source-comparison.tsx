import { Sparkles, Target } from "lucide-react"
import { Panel } from "@/components/common/panel"
import { rankLabel } from "@/lib/lotto/rank"
import type { StatsSummary } from "@/lib/lotto/stats"

interface SourceComparisonProps {
  ai: StatsSummary
  manual: StatsSummary
  drawNo?: number
}

/** AI 추천과 일반 추첨의 등수 분포를 나란히 비교한다. */
export default function SourceComparison({ ai, manual, drawNo }: SourceComparisonProps) {
  return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ComparisonPanel
            icon={Sparkles}
            title="AI 추천 등수별 통계"
            description={`${drawNo}회차 AI 추천 번호의 당첨 등수 분포`}
            summary={ai}
            iconClass="text-blue-600 dark:text-blue-400"
            rowClass="bg-accent-soft border-accent-line"
            valueClass="text-blue-600 dark:text-blue-400"
        />
        <ComparisonPanel
            icon={Target}
            title="일반 추첨 등수별 통계"
            description={`${drawNo}회차 일반 추첨 번호의 당첨 등수 분포`}
            summary={manual}
            iconClass="text-purple-600 dark:text-purple-400"
            rowClass="bg-[#f3e5f5] border-[#e1bee7] dark:bg-[#341b3a] dark:border-[#5c2b66]"
            valueClass="text-purple-600 dark:text-purple-400"
        />
      </div>
  )
}

interface ComparisonPanelProps {
  icon: typeof Sparkles
  title: string
  description: string
  summary: StatsSummary
  iconClass: string
  rowClass: string
  valueClass: string
}

function ComparisonPanel({
                           icon: Icon,
                           title,
                           description,
                           summary,
                           iconClass,
                           rowClass,
                           valueClass,
                         }: ComparisonPanelProps) {
  return (
      <Panel className="space-y-5">
        <div>
          <h3 className="text-ink flex items-center gap-2 text-xl font-bold">
            <Icon className={`h-5 w-5 ${iconClass}`} />
            {title}
          </h3>
          <p className="text-ink-muted mt-1 text-sm">{description}</p>
        </div>

        <div className="space-y-2">
          {summary.rankCounts.map(({ rank, count, percentage }) => (
              <div
                  key={rankLabel(rank)}
                  className={`flex items-center justify-between rounded border p-2 ${rowClass}`}
              >
                <span className="text-ink text-sm font-medium">{rankLabel(rank)}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${valueClass}`}>{count}</span>
                  <span className="text-ink-muted text-xs">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
          ))}
        </div>
      </Panel>
  )
}
