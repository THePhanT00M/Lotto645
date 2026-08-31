"use client"

import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Ball } from "@/components/lotto/ball"
import Congratulation from "@/components/lotto/congratulation"
import MachineCanvas from "@/components/lotto/machine-canvas"
import MachineControls from "@/components/lotto/machine-controls"
import NumberDisplay from "@/components/lotto/number-display"
import { useLottoMachine } from "@/hooks/use-lotto-machine"

/** 결과 영역으로 스크롤을 옮기기까지의 대기 시간 */
const SCROLL_DELAY_MS = 1000

/** 스크롤이 끝난 뒤 축하 배너를 띄우기까지의 대기 시간 */
const CONGRATS_DELAY_MS = 800

interface LottoMachineProps {
  onDrawComplete: (numbers: number[]) => void
  onReset: () => void
  /** 이번 추첨이 겨냥하는 회차 */
  targetDrawNo?: number
}

/** 공이 도는 추첨통과 조작부, 결과 표시를 묶은 자동 추첨기. */
export default function LottoMachine({ onDrawComplete, onReset, targetDrawNo }: LottoMachineProps) {
  const [showCongrats, setShowCongrats] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const machine = useLottoMachine({
    onComplete: onDrawComplete,
    onReset: () => {
      setShowCongrats(false)
      onReset()
    },
    targetDrawNo,
  })

  const { drawnBalls, remainingBalls, isDrawing, isAutoDrawing, isComplete } = machine

  // 추첨이 끝나면 결과로 스크롤한 뒤 축하 배너를 띄운다.
  useEffect(() => {
    if (!isComplete) return

    const scrollTimer = setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      setShowCongrats(true)
    }, SCROLL_DELAY_MS + CONGRATS_DELAY_MS)

    return () => clearTimeout(scrollTimer)
  }, [isComplete])

  const latestBall = drawnBalls.at(-1)

  return (
      <div className="flex w-full flex-col items-center">
        <div className="relative mb-6 aspect-square w-full max-w-md overflow-hidden rounded-full border-4 border-gray-200 bg-white shadow-lg">
          <MachineCanvas remainingBalls={remainingBalls} isAnimating />

          <motion.div
              initial={{ y: 0, opacity: 0, scale: 0.5 }}
              animate={isDrawing ? { y: -100, opacity: 1, scale: 1 } : { y: 0, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5 }}
              className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          >
            {isDrawing && latestBall !== undefined && <Ball number={latestBall} size="lg" />}
          </motion.div>
        </div>

        <MachineControls
            drawnCount={drawnBalls.length}
            isDrawing={isDrawing}
            isAutoDrawing={isAutoDrawing}
            isComplete={isComplete}
            onDraw={machine.drawBall}
            onDrawAll={machine.drawAll}
            onReset={machine.reset}
        />

        {drawnBalls.length > 0 && (
            <div className="mt-6 w-full space-y-6">
              {showCongrats && <Congratulation />}
              <NumberDisplay ref={resultRef} numbers={drawnBalls} isSaved={isComplete} />
            </div>
        )}
      </div>
  )
}
