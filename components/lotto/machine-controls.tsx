"use client"

import { Play, RefreshCcw, Zap } from "lucide-react"
import { useTranslation } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { PICK_COUNT } from "@/lib/lotto/constants"

interface MachineControlsProps {
  drawnCount: number
  isDrawing: boolean
  isAutoDrawing: boolean
  isComplete: boolean
  onDraw: () => void
  onDrawAll: () => void
  onReset: () => void
}

/** 추첨기 하단의 조작 버튼 묶음. */
export default function MachineControls({
                                          drawnCount,
                                          isDrawing,
                                          isAutoDrawing,
                                          isComplete,
                                          onDraw,
                                          onDrawAll,
                                          onReset,
                                        }: MachineControlsProps) {
  const { t } = useTranslation()
  const isIdle = drawnCount === 0

  return (
      <div className="flex flex-wrap justify-center gap-3">
        {!isComplete && (
            <Button
                onClick={onDraw}
                disabled={isDrawing || isAutoDrawing || drawnCount >= PICK_COUNT}
                className="rounded-full bg-blue-600 px-6 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <Play className="mr-2 h-4 w-4" />
              {isIdle ? t.draw.start : t.draw.again}
            </Button>
        )}

        {isIdle && !isAutoDrawing && (
            <Button
                onClick={onDrawAll}
                variant="outline"
                className="rounded-full border-blue-600 px-6 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Zap className="mr-2 h-4 w-4" />
              한번에 뽑기
            </Button>
        )}

        {!isIdle && (
            <Button
                onClick={onReset}
                variant="ghost"
                className="rounded-full bg-gray-200 px-6 text-gray-900 transition-colors hover:bg-gray-300 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20"
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${isDrawing || isAutoDrawing ? "animate-spin" : ""}`} />
              다시 뽑기
            </Button>
        )}
      </div>
  )
}
