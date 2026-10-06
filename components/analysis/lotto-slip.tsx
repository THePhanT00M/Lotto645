"use client"

import { useTranslation } from "@/components/i18n/locale-provider"
import { ALL_NUMBERS } from "@/lib/lotto/constants"
import type { Recommendation } from "@/lib/lotto/engine"
import { cn } from "@/lib/utils"

const gameName = (index: number) => String.fromCharCode(65 + index)

interface LottoSlipProps {
  recommendations: readonly Recommendation[]
  selected: number
  onSelect: (index: number) => void
}

/** 실제 마킹 용지처럼 A~E 게임 칸에 고른 번호를 칠해 보여준다. 칸을 누르면 그 게임을 고른다. */
export default function LottoSlip({ recommendations, selected, onSelect }: LottoSlipProps) {
  const { t } = useTranslation()
  const copy = t.analysis.recommendation

  return (
      // 실제 용지처럼 A~E 다섯 칸 자리를 고정한다. 장수가 적으면 남은 자리는 비워 둔다.
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {recommendations.map((item, index) => {
          const isSelected = index === selected
          const marked = new Set(item.numbers)

          return (
              <li key={item.numbers.join()}>
                <button
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={copy.ticket(gameName(index), item.numbers.join(", "))}
                    onClick={() => onSelect(index)}
                    className={cn(
                        "bg-surface flex w-full flex-col gap-2 rounded-md border p-2 text-left transition-colors",
                        isSelected ? "border-red-500 ring-1 ring-red-500" : "border-red-200 hover:border-red-400 dark:border-red-900/60",
                    )}
                >
                  <span className="flex items-center justify-between">
                    <span
                        data-sk-tone
                        className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-sm text-xs font-bold",
                            isSelected ? "bg-red-500 text-white" : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
                        )}
                    >
                      <sk-t>{gameName(index)}</sk-t>
                    </span>
                    {item.popularityPercentile !== null && (
                        <span className="text-ink-muted text-[11px]">
                          <sk-t>{copy.crowdValue(Math.round(item.popularityPercentile * 100))}</sk-t>
                        </span>
                    )}
                  </span>

                  {/* 1~45 를 용지처럼 한 줄 7칸으로 깔고 고른 번호만 칠한다. */}
                  <span aria-hidden className="grid grid-cols-7 gap-0.5">
                    {ALL_NUMBERS.map((number) => (
                        <span
                            key={number}
                            data-sk-tone={marked.has(number) || undefined}
                            className={cn(
                                "flex aspect-[4/5] items-center justify-center rounded-[2px] border text-[9px] leading-none tabular-nums",
                                marked.has(number)
                                    ? "border-neutral-900 bg-neutral-900 font-bold text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                                    : "border-red-200 text-red-400 dark:border-red-900/60 dark:text-red-400/70",
                            )}
                        >
                          <sk-t data-sk-digits>{number}</sk-t>
                        </span>
                    ))}
                  </span>

                  <span className="text-ink flex justify-between px-0.5 text-xs font-semibold tabular-nums">
                    {item.numbers.map((number) => (
                        <sk-t key={number} data-sk-digits>{String(number).padStart(2, "0")}</sk-t>
                    ))}
                  </span>
                </button>
              </li>
          )
        })}
      </ol>
  )
}
