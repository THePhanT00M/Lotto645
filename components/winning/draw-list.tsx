"use client"

import { BallRow } from "@/components/lotto/ball-row"
import { Skeleton } from "@/components/ui/skeleton"
import type { useDrawBrowser } from "@/hooks/use-draw-browser"
import type { WinningLottoNumbers } from "@/lib/lotto/types"
import { cn } from "@/lib/utils"

type Browser = ReturnType<typeof useDrawBrowser>

interface DrawListProps {
  browser: Browser
}

/** 회차별 목록. 위아래 양방향으로 무한 스크롤한다. */
export default function DrawList({ browser }: DrawListProps) {
  const {
    draws,
    currentDraw,
    setCurrentDraw,
    isLoadingOlder,
    isLoadingNewer,
    hasMoreOlder,
    hasMoreNewer,
    listRef,
    topTriggerRef,
    bottomTriggerRef,
    registerItem,
  } = browser

  return (
      <div className="bg-panel border-line flex h-[650px] flex-col rounded-xl border">
        <div className="border-line bg-panel sticky top-0 z-10 flex h-[69px] items-center justify-between rounded-t-xl border-b p-4">
          <h3 className="text-ink font-bold">회차별 목록</h3>
        </div>

        {/* overflow-anchor를 끄지 않으면 브라우저 자동 보정과 수동 스크롤 보정이 충돌한다. */}
        <div
            ref={listRef}
            className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-2 [overflow-anchor:none]"
        >
          {/* 트리거는 항상 렌더한다. 조건부로 없앴다 살리면 옵저버를 다시 붙여야 하고,
              그때마다 교차 상태가 즉시 콜백으로 들어와 로딩이 연쇄된다. */}
          <div ref={topTriggerRef}>{hasMoreNewer && isLoadingNewer && <DrawListSkeleton />}</div>

          {draws.map((draw) => (
              <DrawRow
                  key={draw.drawNo}
                  draw={draw}
                  isSelected={currentDraw?.drawNo === draw.drawNo}
                  onSelect={() => setCurrentDraw(draw)}
                  registerItem={registerItem}
              />
          ))}

          <div ref={bottomTriggerRef}>
            {isLoadingOlder && <DrawListSkeleton />}
            {!hasMoreOlder && draws.length > 0 && (
                <p className="text-ink-muted py-4 text-center text-xs">모든 데이터를 불러왔습니다.</p>
            )}
          </div>
        </div>
      </div>
  )
}

interface DrawRowProps {
  draw: WinningLottoNumbers
  isSelected: boolean
  onSelect: () => void
  registerItem: Browser["registerItem"]
}

function DrawRow({ draw, isSelected, onSelect, registerItem }: DrawRowProps) {
  return (
      <div
          ref={(element) => registerItem(draw.drawNo, element)}
          onClick={onSelect}
          className={cn(
              "flex h-[92px] cursor-pointer flex-col justify-between gap-3 rounded-lg border p-3 transition-all sm:h-[62px] sm:flex-row sm:items-center",
              isSelected
                  ? "border-blue-200 bg-blue-50 ring-1 ring-blue-500/20 dark:border-blue-800 dark:bg-[#1e2a3b]"
                  : "bg-surface border-line hover:border-blue-300",
          )}
      >
        <div className="flex min-w-[120px] items-center gap-4">
          <span className={cn("text-lg font-bold", isSelected ? "text-blue-600" : "text-ink")}>{draw.drawNo}회</span>
          <span className="text-ink-muted text-xs">{draw.date}</span>
        </div>

        <BallRow
            numbers={draw.numbers}
            bonusNo={draw.bonusNo}
            size="sm"
            className="flex-wrap justify-center gap-1.5 sm:justify-end"
            ballClassName="shadow-sm"
        />
      </div>
  )
}

/** 목록 항목과 같은 높이를 차지하는 자리표시자. */
export function DrawListSkeleton({ rows = 9 }: { rows?: number }) {
  return (
      <div className="space-y-2">
        {Array.from({ length: rows }, (_, i) => (
            <div
                key={i}
                className="bg-surface border-line flex h-[92px] flex-col justify-between gap-3 rounded-lg border p-3 sm:h-[62px] sm:flex-row sm:items-center"
            >
              <div className="flex min-w-[120px] items-center gap-4">
                <Skeleton className="h-7 w-20 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
                {Array.from({ length: 6 }, (_, j) => (
                    <Skeleton key={j} className="h-8 w-8 rounded-full" />
                ))}
                <span className="text-ink-muted mx-1 font-light">+</span>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
        ))}
      </div>
  )
}
