"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ALL_NUMBERS, PICK_COUNT } from "@/lib/lotto/constants"
import { recordDraw } from "@/lib/lotto/draw-log"
import { pickRandom } from "@/lib/lotto/random"

/** 공 하나가 추첨통에서 나오는 연출 시간 */
const DRAW_ANIMATION_MS = 500

/** 마지막 공이 나온 뒤 결과를 확정하기까지의 여유 */
const FINISH_DELAY_MS = 1000

/** '한번에 뽑기'에서 공 사이 간격 */
const AUTO_DRAW_INTERVAL_MS = 300

interface UseLottoMachineOptions {
  /** 6개가 모두 뽑혔을 때 호출된다. */
  onComplete: (numbers: number[]) => void
  /** 추첨을 처음부터 다시 시작할 때 호출된다. */
  onReset: () => void
  /** 이번 추첨이 겨냥하는 회차 */
  targetDrawNo?: number
}

/**
 * 추첨기의 상태 기계.
 *
 * 공을 하나씩 뽑는 흐름, 자동 추첨, 완료 시 기록 저장을 담당하고
 * 컴포넌트에는 렌더링에 필요한 값만 넘긴다.
 */
export function useLottoMachine({ onComplete, onReset, targetDrawNo }: UseLottoMachineOptions) {
  const [drawnBalls, setDrawnBalls] = useState<number[]>([])
  const [remainingBalls, setRemainingBalls] = useState<number[]>([...ALL_NUMBERS])
  const [isDrawing, setIsDrawing] = useState(false)
  const [isAutoDrawing, setIsAutoDrawing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  /** 완료 처리가 두 번 실행되지 않도록 하는 잠금 */
  const hasRecordedRef = useRef(false)

  const drawBall = useCallback(() => {
    if (isDrawing || drawnBalls.length >= PICK_COUNT) return

    const ball = pickRandom(remainingBalls)
    if (ball === undefined) return

    setIsDrawing(true)
    setRemainingBalls((prev) => prev.filter((n) => n !== ball))
    setDrawnBalls((prev) => [...prev, ball])

    const isLast = drawnBalls.length === PICK_COUNT - 1
    const timer = setTimeout(
        () => {
          setIsDrawing(false)
          if (isLast) {
            setDrawnBalls((prev) => [...prev].sort((a, b) => a - b))
            setIsComplete(true)
          }
        },
        isLast ? FINISH_DELAY_MS : DRAW_ANIMATION_MS,
    )

    return () => clearTimeout(timer)
  }, [drawnBalls.length, isDrawing, remainingBalls])

  const drawAll = useCallback(() => {
    if (drawnBalls.length > 0 || isDrawing || isAutoDrawing) return
    setIsAutoDrawing(true)
    drawBall()
  }, [drawBall, drawnBalls.length, isAutoDrawing, isDrawing])

  const reset = useCallback(() => {
    setDrawnBalls([])
    setRemainingBalls([...ALL_NUMBERS])
    setIsDrawing(false)
    setIsAutoDrawing(false)
    setIsComplete(false)
    hasRecordedRef.current = false
    onReset()
  }, [onReset])

  // 자동 추첨: 직전 공의 연출이 끝나면 다음 공을 뽑는다.
  useEffect(() => {
    if (!isAutoDrawing) return

    if (drawnBalls.length >= PICK_COUNT) {
      setIsAutoDrawing(false)
      return
    }

    if (isDrawing) return

    const timer = setTimeout(drawBall, AUTO_DRAW_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [drawBall, drawnBalls.length, isAutoDrawing, isDrawing])

  // 추첨이 끝나면 결과를 알리고 기록을 남긴다.
  useEffect(() => {
    if (!isComplete || drawnBalls.length !== PICK_COUNT || hasRecordedRef.current) return

    hasRecordedRef.current = true
    const numbers = [...drawnBalls].sort((a, b) => a - b)

    onComplete(numbers)
    void recordDraw({ numbers, source: "machine", drawNo: targetDrawNo })
  }, [drawnBalls, isComplete, onComplete, targetDrawNo])

  return {
    drawnBalls,
    remainingBalls,
    isDrawing,
    isAutoDrawing,
    isComplete,
    /** 결과가 기록됐는지 (UI에 '기록 저장됨' 표시용) */
    isRecorded: hasRecordedRef.current && isComplete,
    drawBall,
    drawAll,
    reset,
  }
}
