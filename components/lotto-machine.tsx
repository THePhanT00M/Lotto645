"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import LottoBall from "@/components/lotto-ball"
import LottoCanvas from "@/components/lotto-canvas"
import LottoControls from "@/components/lotto-controls"
import LottoResults from "@/components/lotto-results"
import LottoCongratulation from "@/components/lotto-congratulation"
import { getRandomNumber } from "@/utils/lotto-utils"
import { saveLottoResult } from "@/utils/lotto-storage"
import { Check } from "lucide-react"

interface LottoMachineProps {
  onDrawComplete: (numbers: number[]) => void
  onReset: () => void
}

export default function LottoMachine({ onDrawComplete, onReset }: LottoMachineProps) {
  const [balls, setBalls] = useState<number[]>([])
  const [availableBalls, setAvailableBalls] = useState<number[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isDrawingAll, setIsDrawingAll] = useState(false)
  const [showCongrats, setShowCongrats] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // 결과 통지 여부를 추적하는 ref
  const hasNotifiedRef = useRef(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Initialize available balls (1-45)
  useEffect(() => {
    resetMachine()
    // 컴포넌트가 마운트될 때마다 통지 상태 초기화
    hasNotifiedRef.current = false
  }, [])

  // Effect to handle drawing all balls
  useEffect(() => {
    // If we're drawing all and not currently drawing a ball and haven't completed yet
    if (isDrawingAll && !isDrawing && balls.length < 6 && !isComplete) {
      const timer = setTimeout(() => {
        drawBall()
      }, 300) // 더 빠른 추첨 속도를 위해 지연 시간 단축

      return () => clearTimeout(timer)
    }

    // If we've drawn all 6 balls, stop the drawing all process
    if (balls.length >= 6 && isDrawingAll) {
      setIsDrawingAll(false)
    }
  }, [isDrawingAll, isDrawing, balls.length, isComplete])

  // Show congratulatory message when all balls are drawn
  useEffect(() => {
    if (isComplete && balls.length === 6 && !showCongrats) {
      // Save the result to history
      const sortedBalls = [...balls].sort((a, b) => a - b)
      saveLottoResult(sortedBalls)
      setIsSaved(true)

      // 결과를 한 번만 통지
      if (!hasNotifiedRef.current) {
        onDrawComplete(sortedBalls)
        hasNotifiedRef.current = true
      }

      // Delay to allow the last ball animation to complete
      const timer = setTimeout(() => {
        // 결과 영역으로 스크롤
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })

          // 스크롤 후 폭죽 효과 표시 (스크롤 애니메이션 시간 고려)
          setTimeout(() => {
            setShowCongrats(true)
          }, 800)
        } else {
          setShowCongrats(true)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isComplete, balls, showCongrats, onDrawComplete])

  // Reset the machine
  const resetMachine = () => {
    setBalls([])

    // Initialize available balls (1-45)
    const initialAvailableBalls = Array.from({ length: 45 }, (_, i) => i + 1)
    setAvailableBalls(initialAvailableBalls)

    setIsDrawing(false)
    setIsComplete(false)
    setIsAnimating(false)
    setIsDrawingAll(false)
    setShowCongrats(false)
    setIsSaved(false)

    // 리셋할 때 통지 상태도 초기화
    hasNotifiedRef.current = false

    // 부모 컴포넌트에 초기화 이벤트 전달
    onReset()

    // Re-trigger animation after a small delay
    setTimeout(() => {
      setIsAnimating(true)
    }, 50)
  }

  // Draw a single ball
  const drawBall = () => {
    if (availableBalls.length === 0 || balls.length >= 6 || isDrawing) return

    setIsDrawing(true)

    // Randomly select a ball from available balls
    const randomIndex = getRandomNumber(0, availableBalls.length - 1)
    const drawnBall = availableBalls[randomIndex]

    // Remove the ball from available balls
    setAvailableBalls((prev) => prev.filter((ball) => ball !== drawnBall))

    // Add ball to drawn balls
    setBalls((prev) => [...prev, drawnBall])

    // Check if we've drawn all 6 balls
    if (balls.length === 5) {
      setTimeout(() => {
        setIsComplete(true)
        setIsDrawing(false)
        // Sort the balls when complete
        setBalls((prev) => [...prev].sort((a, b) => a - b))
      }, 1000)
    } else {
      setTimeout(() => {
        setIsDrawing(false)
      }, 500)
    }
  }

  // Draw all balls at once
  const drawAllBalls = () => {
    if (balls.length > 0 || isDrawing || isDrawingAll) return
    setIsDrawingAll(true)
    drawBall()
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Lottery Machine */}
      <div className="relative w-full aspect-square max-w-md mb-6 bg-white rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
        <LottoCanvas availableBalls={availableBalls} isAnimating={isAnimating} />

        {/* Drawn ball animation */}
        <motion.div
          initial={{ y: 0, opacity: 0, scale: 0.5 }}
          animate={isDrawing ? { y: -100, opacity: 1, scale: 1 } : { y: 0, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
        >
          {isDrawing && <LottoBall number={balls[balls.length - 1] || 0} />}
        </motion.div>
      </div>

      {/* Congratulatory Message */}
      {showCongrats && <LottoCongratulation show={showCongrats} />}

      {/* Controls */}
      <LottoControls
        balls={balls}
        isDrawing={isDrawing}
        isComplete={isComplete}
        isDrawingAll={isDrawingAll}
        onDrawBall={drawBall}
        onDrawAllBalls={drawAllBalls}
        onReset={resetMachine}
      />

      {/* Drawn Balls */}
      <div className="w-full">
        {/* Selected Numbers Display with Save Status */}
        {balls.length > 0 && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 bg-gray-50 border border-gray-100 rounded-lg shadow-sm mb-6"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="w-24"></div> {/* Spacer for balance */}
              <h3 className="text-lg font-medium text-center">추첨 번호</h3>
              {isSaved && balls.length === 6 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-green-600 flex items-center w-24 justify-end"
                >
                  <Check className="w-4 h-4 mr-1" />
                  기록 저장됨
                </motion.div>
              ) : (
                <div className="w-24"></div> /* Spacer when no text */
              )}
            </div>
            <LottoResults balls={balls} />
          </motion.div>
        )}
      </div>
    </div>
  )
}
