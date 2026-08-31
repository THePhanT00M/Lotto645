"use client"

import { Check, Lock, RotateCcw, X, Zap } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Congratulation from "@/components/lotto/congratulation"
import NumberDisplay from "@/components/lotto/number-display"
import NumberGrid from "@/components/lotto/number-grid"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNumberSelector, type SelectorMode } from "@/hooks/use-number-selector"
import { PICK_COUNT } from "@/lib/lotto/constants"

/** 선택 완료 후 결과 영역으로 스크롤하기까지의 대기 시간 */
const SCROLL_DELAY_MS = 100

/** 스크롤 뒤 축하 배너를 띄우기까지의 대기 시간 */
const CONGRATS_DELAY_MS = 500

const MODE_TABS: { value: SelectorMode; label: string; icon: typeof Check; hint: string }[] = [
  { value: "select", label: "번호 선택", icon: Check, hint: "원하는 번호를 선택하세요. 최대 6개까지 선택할 수 있습니다." },
  { value: "fix", label: "번호 고정", icon: Lock, hint: "고정할 번호를 선택하세요. 고정된 번호는 항상 선택 결과에 포함됩니다." },
  { value: "exclude", label: "번호 제외", icon: X, hint: "제외할 번호를 선택하세요. 제외된 번호는 선택 결과에 포함되지 않습니다." },
]

interface NumberSelectorProps {
  onSelectComplete: (numbers: number[]) => void
  onReset: () => void
  /** 추첨기에서 이미 뽑힌 번호를 이어받는다. */
  drawnNumbers?: number[]
  /** 이번 선택이 겨냥하는 회차 */
  targetDrawNo?: number
}

/** 번호를 직접 고르거나 일부만 고정해 자동으로 채우는 수동 추첨기. */
export default function NumberSelector({
                                         onSelectComplete,
                                         onReset,
                                         drawnNumbers,
                                         targetDrawNo,
                                       }: NumberSelectorProps) {
  const [showCongrats, setShowCongrats] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const selector = useNumberSelector({
    onComplete: onSelectComplete,
    onReset: () => {
      setShowCongrats(false)
      onReset()
    },
    targetDrawNo,
  })

  const { selected, fixed, excluded, isComplete, applyNumbers } = selector
  const activeHint = MODE_TABS.find((tab) => tab.value === selector.mode)?.hint

  // 추첨기 탭에서 넘어온 번호를 그대로 반영한다.
  useEffect(() => {
    if (drawnNumbers?.length === PICK_COUNT) applyNumbers(drawnNumbers)
  }, [applyNumbers, drawnNumbers])

  useEffect(() => {
    if (!isComplete) return

    const timer = setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      setShowCongrats(true)
    }, SCROLL_DELAY_MS + CONGRATS_DELAY_MS)

    return () => clearTimeout(timer)
  }, [isComplete])

  const autoFillCount = PICK_COUNT - fixed.length

  return (
      <div className="w-full space-y-6">
        <div>
          <Tabs value={selector.mode} onValueChange={(value) => selector.setMode(value as SelectorMode)}>
            <TabsList className="grid w-full grid-cols-3 rounded-sm bg-gray-200 p-1 dark:bg-[#262626]">
              {MODE_TABS.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                      key={value}
                      value={value}
                      className="text-ink-muted flex items-center gap-1 rounded-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm dark:data-[state=active]:bg-black dark:data-[state=active]:text-white"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <p className="text-ink-muted mt-2 mb-2 text-sm">{activeHint}</p>

          <div className="mt-4 w-full rounded-lg bg-gray-200 p-2 dark:bg-[#262626]">
            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              <CountTile icon={Check} iconClass="text-blue-500" label="선택">
                <span className="text-ink">
                  {selected.filter((n) => !fixed.includes(n)).length}/{autoFillCount}
                </span>
              </CountTile>
              <CountTile icon={Lock} iconClass="text-green-500" label="고정">
                <span className="text-green-600">{fixed.length}</span>
              </CountTile>
              <CountTile icon={X} iconClass="text-red-500" label="제외">
                <span className="text-red-600">{excluded.length}</span>
              </CountTile>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                  variant="outline"
                  onClick={selector.reset}
                  className="text-ink-muted h-10 bg-gray-50 hover:bg-gray-100 dark:bg-transparent dark:text-gray-100 dark:hover:bg-[#646464]"
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                초기화
              </Button>
              <Button
                  onClick={selector.autoFill}
                  disabled={autoFillCount <= 0}
                  className="h-10 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Zap className="mr-1 h-4 w-4" />
                {fixed.length}개 + {autoFillCount}개 자동
              </Button>
            </div>
          </div>
        </div>

        <NumberGrid
            selected={selected}
            fixed={fixed}
            excluded={excluded}
            onToggle={selector.toggle}
            isDisabled={selector.isDisabled}
        />

        {showCongrats && <Congratulation />}

        <NumberDisplay ref={resultRef} numbers={selected} fixedNumbers={fixed} isSaved={isComplete} className="mt-6" />
      </div>
  )
}

interface CountTileProps {
  icon: typeof Check
  iconClass: string
  label: string
  children: React.ReactNode
}

/** 선택·고정·제외 개수를 보여주는 작은 타일. */
function CountTile({ icon: Icon, iconClass, label, children }: CountTileProps) {
  return (
      <div className="rounded-md bg-white p-2 dark:bg-black">
        <div className="text-ink-muted flex items-center justify-center gap-1 text-sm">
          <Icon className={`h-3 w-3 ${iconClass}`} />
          <span>{label}</span>
        </div>
        <div className="text-lg font-medium">{children}</div>
      </div>
  )
}
