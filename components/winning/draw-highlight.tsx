"use client"

import { Calendar, ChevronLeft, ChevronRight, Trophy } from "lucide-react"
import { useTranslation } from "@/components/i18n/locale-provider"
import { Panel } from "@/components/common/panel"
import { BallRow } from "@/components/lotto/ball-row"
import { Button } from "@/components/ui/button"
import type { WinningLottoNumbers } from "@/lib/lotto/types"

interface DrawHighlightProps {
  draw: WinningLottoNumbers
  latestDrawNo: number
  onNavigate: (drawNo: number) => void
}

/** 선택된 회차의 당첨 번호를 크게 보여주는 카드. */
export default function DrawHighlight({ draw, latestDrawNo, onNavigate }: DrawHighlightProps) {
  return (
      <Panel className="relative overflow-hidden shadow-sm sm:p-8">
        <div className="pointer-events-none absolute top-0 right-0 p-4 opacity-5 dark:opacity-10">
          <Trophy className="h-32 w-32" />
        </div>

        <div className="relative z-10">
          <div className="mb-8 flex items-center justify-between">
            <NavButton direction="prev" disabled={draw.drawNo <= 1} onClick={() => onNavigate(draw.drawNo - 1)} />

            <div className="flex flex-col items-center justify-center">
              <span className="text-ink mb-2 text-3xl leading-none font-bold tracking-tight">{draw.drawNo}회</span>
              <div className="text-ink-muted bg-surface border-line flex items-center rounded-full border px-3 py-1 text-sm">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                {draw.date}
              </div>
            </div>

            <NavButton
                direction="next"
                disabled={draw.drawNo >= latestDrawNo}
                onClick={() => onNavigate(draw.drawNo + 1)}
            />
          </div>

          <BallRow
              numbers={draw.numbers}
              bonusNo={draw.bonusNo}
              size="fluid"
              className="mx-auto w-full max-w-md gap-3"
              ballClassName="max-w-11 shadow-sm"
          />
        </div>
      </Panel>
  )
}

function NavButton({
                     direction,
                     disabled,
                     onClick,
                   }: {
  direction: "prev" | "next"
  disabled: boolean
  onClick: () => void
}) {
  const { t } = useTranslation()
  const isPrev = direction === "prev"

  return (
      <Button
          variant="outline"
          onClick={onClick}
          disabled={disabled}
          className="bg-surface border-line text-ink h-10 px-3 hover:bg-gray-100 dark:hover:bg-[#333]"
      >
        {isPrev && <ChevronLeft className="h-4 w-4 sm:mr-2" />}
        <span className="hidden sm:inline">{isPrev ? t.winning.previousDraw : t.winning.nextDraw}</span>
        {!isPrev && <ChevronRight className="h-4 w-4 sm:ml-2" />}
      </Button>
  )
}
