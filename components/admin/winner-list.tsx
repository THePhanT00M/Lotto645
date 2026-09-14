"use client"

import { ListChecks } from "lucide-react"
import { rankStyle } from "@/components/common/rank-badge"
import { Panel } from "@/components/common/panel"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDate } from "@/lib/datetime"
import type { AnalyzedResult } from "@/lib/lotto/stats"
import { useTranslation } from "@/components/i18n/locale-provider"

interface WinnerListProps {
  winners: AnalyzedResult[]
}

/** 이번 회차에 당첨된 추첨 기록 목록. */
export default function WinnerList({ winners }: WinnerListProps) {
  const { t } = useTranslation()
  return (
      <Panel className="p-0">
        <div className="border-line border-b p-5">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-ink text-xl font-bold"><sk-t>{t.admin.stats.winners}</sk-t></h3>
          </div>
          <p className="text-ink-muted mt-1 text-sm"><sk-t>{t.admin.stats.winnersHint}</sk-t></p>
        </div>

        <ScrollArea className="max-h-[400px] w-full p-4">
          {winners.length === 0 ? (
              <p className="text-ink-muted flex h-40 items-center justify-center"><sk-t>{t.admin.stats.noWinners}</sk-t></p>
          ) : (
              <div className="grid gap-3">
                {winners.map(({ result, match }) => (
                    <div
                        key={result.id}
                        data-sk-tone
                        className={`flex flex-col items-center justify-between gap-3 rounded-lg border p-3 sm:flex-row ${rankStyle(match.rank)}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-black/5 px-2 py-1 text-sm font-bold whitespace-nowrap dark:bg-white/10">
                          <sk-t>{match.rank === null ? t.lotto.miss : t.lotto.rank(match.rank)}</sk-t>
                        </span>
                        {result.isAiRecommended ? (
                            <Badge
                                data-sk-tone
                                variant="secondary"
                                className="border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                            >
                              <sk-t>{t.admin.stats.ai}</sk-t>
                            </Badge>
                        ) : (
                            <Badge
                                data-sk-tone
                                variant="secondary"
                                className="border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                            >
                              <sk-t>{t.admin.stats.manual}</sk-t>
                            </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap justify-center gap-1.5">
                        {result.numbers.map((number) => (
                            <span
                                key={number}
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-white text-[10px] font-bold text-black shadow-sm sm:h-7 sm:w-7 sm:text-xs"
                            >
                              <sk-t data-sk-digits>{number}</sk-t>
                            </span>
                        ))}
                      </div>

                      <div className="hidden text-xs whitespace-nowrap opacity-70 sm:block">
                        <sk-t>{formatDate(result.timestamp)}</sk-t>
                      </div>
                    </div>
                ))}
              </div>
          )}
        </ScrollArea>
      </Panel>
  )
}
