"use client"

import { BallRow } from "@/components/lotto/ball-row"
import { PAGE_SIZE, type useDrawBrowser } from "@/hooks/use-draw-browser"
import type { WinningLottoNumbers } from "@/lib/lotto/types"
import { useTranslation } from "@/components/i18n/locale-provider"
import { cn } from "@/lib/utils"

export type DrawBrowser = ReturnType<typeof useDrawBrowser>

interface DrawListProps {
  browser: DrawBrowser
}

/** 회차별 목록. 위아래 양방향으로 무한 스크롤한다. */
export default function DrawList({ browser }: DrawListProps) {
  const { t } = useTranslation()
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
          <h3 className="text-ink font-bold"><sk-t>{t.winning.listTitle}</sk-t></h3>
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
                <p className="text-ink-muted py-4 text-center text-xs"><sk-t>{t.winning.allLoaded}</sk-t></p>
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
  registerItem: DrawBrowser["registerItem"]
}

function DrawRow({ draw, isSelected, onSelect, registerItem }: DrawRowProps) {
  const { t } = useTranslation()
  return (
      <div
          ref={(element) => registerItem(draw.drawNo, element)}
          onClick={onSelect}
          data-sk-tone={isSelected || undefined}
          className={cn(
              "flex h-[92px] cursor-pointer flex-col justify-between gap-3 rounded-lg border p-3 transition-all sm:h-[62px] sm:flex-row sm:items-center",
              isSelected
                  ? "border-blue-200 bg-blue-50 ring-1 ring-blue-500/20 dark:border-blue-800 dark:bg-[#1e2a3b]"
                  : "bg-surface border-line hover:border-blue-300",
          )}
      >
        <div className="flex min-w-[120px] items-center gap-4">
          <span className={cn("text-lg font-bold", isSelected ? "text-blue-600" : "text-ink")}>
            <sk-t>{t.winning.drawNoShort(draw.drawNo)}</sk-t>
          </span>
          <span className="text-ink-muted text-xs"><sk-t>{draw.date}</sk-t></span>
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

/** 목록 끝에서 더 불러오는 동안 붙이는 줄. 회차는 흔한 네 자리로 둔다. */
const LOADING_DRAW: WinningLottoNumbers = { drawNo: 1000, date: "2022-01-29", numbers: [12, 18, 25, 29, 31, 40], bonusNo: 19 }

const noop = () => {}

/**
 * 목록을 더 불러오는 동안의 자리표시. 같은 줄(DrawRow)을 자리표시 값으로 그리고 글자만 가린다.
 *
 * 한 번에 불러오는 만큼(PAGE_SIZE) 줄을 두어, 불러온 줄이 자리표시와 1:1 로 바뀌게 한다.
 */
export function DrawListSkeleton({ rows = PAGE_SIZE }: { rows?: number }) {
  return (
      <div className="is-sk space-y-2" aria-hidden inert>
        {Array.from({ length: rows }, (_, index) => (
            <DrawRow key={index} draw={LOADING_DRAW} isSelected={false} onSelect={noop} registerItem={noop} />
        ))}
      </div>
  )
}
