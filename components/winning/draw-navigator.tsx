"use client"

import { Hash, ListFilter, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { Panel } from "@/components/common/panel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/components/i18n/locale-provider"

/** 빠른 이동 버튼 하나가 담당하는 회차 구간 */
interface DrawRange {
  start: number
  end: number
}

interface DrawNavigatorProps {
  latestDrawNo: number
  currentDrawNo?: number
  onJump: (drawNo: number) => void
}

/** 회차 검색 입력과 100회 단위 빠른 이동 버튼. */
export default function DrawNavigator({ latestDrawNo, currentDrawNo, onJump }: DrawNavigatorProps) {
  const { t } = useTranslation()
  const [keyword, setKeyword] = useState("")
  const ranges = useMemo(() => buildRanges(latestDrawNo), [latestDrawNo])

  const search = () => {
    const drawNo = Number.parseInt(keyword, 10)
    if (Number.isNaN(drawNo)) return

    onJump(drawNo)
    setKeyword("")
  }

  const isActive = (range: DrawRange) =>
      currentDrawNo !== undefined && currentDrawNo >= range.end && currentDrawNo <= range.start

  return (
      <div className="space-y-4">
        <Panel>
          <h3 className="text-ink mb-3 flex items-center gap-2 font-semibold">
            <Search className="h-4 w-4" /> {t.winning.searchDraw}
          </h3>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                  type="text"
                  inputMode="numeric"
                  placeholder={`1 ~ ${latestDrawNo}`}
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value.replace(/[^0-9]/g, ""))}
                  onKeyDown={(event) => event.key === "Enter" && search()}
                  className="bg-surface border-line text-ink h-10 w-full rounded-lg border pr-3 pl-9 text-sm transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Hash className="text-ink-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            </div>
            <Button onClick={search} className="h-10 bg-blue-600 text-white hover:bg-blue-700">
              {t.common.search}
            </Button>
          </div>
        </Panel>

        <Panel>
          <h3 className="text-ink mb-3 flex items-center gap-2 font-semibold">
            <ListFilter className="h-4 w-4" /> {t.winning.quickJump}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <button
                type="button"
                onClick={() => onJump(latestDrawNo)}
                className={cn(RANGE_BUTTON_CLASS, "col-span-3 font-bold", currentDrawNo === latestDrawNo && ACTIVE_CLASS)}
            >
              {t.winning.latest(latestDrawNo)}
            </button>

            {ranges.map((range) => (
                <button
                    key={range.start}
                    type="button"
                    onClick={() => onJump(range.start)}
                    className={cn(RANGE_BUTTON_CLASS, "font-medium", isActive(range) && ACTIVE_CLASS)}
                >
                  {range.start}-{range.end}
                </button>
            ))}
          </div>
        </Panel>
      </div>
  )
}

const RANGE_BUTTON_CLASS =
    "text-ink-muted bg-surface border-line rounded border px-1 py-2 text-xs transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:border-blue-800 dark:hover:bg-[#333] dark:hover:text-blue-400"

const ACTIVE_CLASS =
    "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500/20"

/**
 * 최신 회차부터 100회 단위로 끊어 구간 목록을 만든다.
 *
 * 최신 회차는 별도 버튼이 있으므로 그 아래 구간(예: 1180-1101)부터 시작한다.
 */
const buildRanges = (latestDrawNo: number): DrawRange[] => {
  if (latestDrawNo <= 0) return []

  const ranges: DrawRange[] = []
  const hundredBase = Math.floor((latestDrawNo - 1) / 100) * 100

  if (latestDrawNo - 1 >= hundredBase + 1) {
    ranges.push({ start: latestDrawNo - 1, end: hundredBase + 1 })
  }

  for (let start = hundredBase; start >= 100; start -= 100) {
    ranges.push({ start, end: start - 99 })
  }

  return ranges
}
