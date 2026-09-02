"use client"

import { Panel } from "@/components/common/panel"
import type { StatsSummary } from "@/lib/lotto/stats"
import { useTranslation } from "@/components/i18n/locale-provider"

/** 막대 안쪽에 개수를 표기할 최소 비율 */
const INLINE_LABEL_THRESHOLD = 5

interface MatchDistributionProps {
  summary: StatsSummary
  drawNo?: number
}

/** 당첨 번호와 몇 개나 일치했는지를 막대 그래프로 보여준다. */
export default function MatchDistribution({ summary, drawNo }: MatchDistributionProps) {
  const { t } = useTranslation()
  return (
      <Panel className="space-y-5">
        <div>
          <h3 className="text-ink text-xl font-bold">{t.admin.stats.matchDistribution}</h3>
          <p className="text-ink-muted mt-1 text-sm">{t.admin.stats.matchHint(drawNo ?? 0)}</p>
        </div>

        <div className="space-y-3">
          {summary.matchCounts.map(({ matchCount, count, percentage }) => (
              <div key={matchCount} className="flex items-center gap-4">
                <div className="text-ink-muted w-16 text-sm font-medium">{t.admin.stats.matched(matchCount)}</div>

                <div className="border-line relative h-7 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-[#3f3f3f]">
                  <div
                      className="flex h-full items-center justify-end rounded-full bg-gradient-to-r from-purple-500 to-blue-500 pr-3 transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 0)}%` }}
                  >
                    {percentage > INLINE_LABEL_THRESHOLD && (
                        <span className="text-xs font-medium text-white">{count}</span>
                    )}
                  </div>
                  {percentage <= INLINE_LABEL_THRESHOLD && count > 0 && (
                      <span className="text-ink-muted absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium">
                        {count}
                      </span>
                  )}
                </div>

                <div className="text-ink-muted w-16 text-right text-sm">{percentage.toFixed(1)}%</div>
              </div>
          ))}
        </div>
      </Panel>
  )
}
