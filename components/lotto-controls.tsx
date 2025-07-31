"use client"

import { Button } from "@/components/ui/button"
import { RotateCcw, Sparkles, CirclePlus, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

interface LottoControlsProps {
  balls: number[]
  isDrawing: boolean
  isComplete: boolean
  isDrawingAll: boolean
  onDrawBall: () => void
  onDrawAllBalls: () => void
  onReset: () => void
}

export default function LottoControls({
  balls,
  isDrawing,
  isComplete,
  isDrawingAll,
  onDrawBall,
  onDrawAllBalls,
  onReset,
}: LottoControlsProps) {
  // 애니메이션용 텍스트 배열
  const animationTexts = ["추첨 중", "행운을 찾는 중", "번호 생성 중", "당첨 기원 중"]
  const [textIndex, setTextIndex] = useState(0)
  const [dots, setDots] = useState("")

  // 애니메이션 텍스트 변경 효과
  useEffect(() => {
    if (isDrawingAll) {
      // 텍스트 순환 타이머
      const textTimer = setInterval(() => {
        setTextIndex((prev) => (prev + 1) % animationTexts.length)
      }, 2000)

      // 점 애니메이션 타이머
      const dotsTimer = setInterval(() => {
        setDots((prev) => {
          if (prev === "...") return ""
          return prev + "."
        })
      }, 500)

      return () => {
        clearInterval(textTimer)
        clearInterval(dotsTimer)
      }
    }
  }, [isDrawingAll, animationTexts.length])

  return (
    <div className="flex flex-row gap-2 w-full max-w-md mb-6 justify-between">
      {/* 번호 뽑기 버튼 - 추첨이 완료되지 않았고 전체 추첨 중이 아닐 때 표시 */}
      {balls.length < 6 && !isDrawingAll && (
        <Button
          onClick={onDrawBall}
          disabled={isDrawing || isComplete}
          className="flex-1 bg-teal-500 hover:bg-teal-600 text-white shadow-sm h-12 transition-colors text-sm"
        >
          <CirclePlus className="mr-1 h-4 w-4" />
          <span className="whitespace-nowrap">번호 뽑기</span>
        </Button>
      )}

      {/* 한번에 뽑기 버튼 - 아직 공이 하나도 뽑히지 않았을 때만 표시 */}
      {balls.length === 0 && !isDrawingAll && (
        <Button
          onClick={onDrawAllBalls}
          disabled={isDrawing || isComplete}
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white shadow-sm h-12 transition-colors text-sm"
        >
          <Sparkles className="mr-1 h-4 w-4" />
          <span className="whitespace-nowrap">한번에 뽑기</span>
        </Button>
      )}

      {/* 한번에 뽑기 진행 중일 때 애니메이션 텍스트 */}
      {isDrawingAll && (
        <Button disabled={true} className="w-full bg-amber-500 text-white shadow-sm h-12 text-sm">
          <motion.div
            className="flex items-center justify-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            <motion.span
              key={textIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="inline-block whitespace-nowrap"
            >
              {animationTexts[textIndex]}
              <span className="inline-block w-6 text-left">{dots}</span>
            </motion.span>
          </motion.div>
        </Button>
      )}

      {/* 다시 뽑기 버튼 - 하나라도 공이 뽑혔을 때 표시 */}
      {balls.length > 0 && !isDrawingAll && (
        <Button
          onClick={onReset}
          variant="outline"
          className="flex-1 border-gray-300 hover:bg-gray-100 h-12 transition-colors text-sm"
        >
          <RotateCcw className="mr-1 h-4 w-4 text-gray-600" />
          <span className="whitespace-nowrap">다시 뽑기</span>
        </Button>
      )}
    </div>
  )
}
