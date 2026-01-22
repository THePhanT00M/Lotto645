"use client"

import { Button } from "@/components/ui/button"
import { RefreshCcw, Play, Zap } from "lucide-react"

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
  return (
      <div className="flex flex-wrap justify-center gap-3">
        {/* 번호 뽑기 버튼 */}
        {!isComplete && (
            <Button
                onClick={onDrawBall}
                disabled={isDrawing || isDrawingAll || balls.length >= 6}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
            >
              <Play className="w-4 h-4 mr-2" />
              {balls.length === 0 ? "시작하기" : "번호 뽑기"}
            </Button>
        )}

        {/* 한번에 뽑기 버튼 */}
        {balls.length === 0 && !isDrawingAll && (
            <Button
                onClick={onDrawAllBalls}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full px-6"
            >
              <Zap className="w-4 h-4 mr-2" />
              한번에 뽑기
            </Button>
        )}

        {/* 다시 뽑기 버튼 (유튜브 스타일 적용) */}
        {(isComplete || balls.length > 0) && (
            <Button
                onClick={onReset}
                variant="ghost"
                className="
            /* 라이트 모드: 연한 회색 배경 */
            bg-gray-100 hover:bg-gray-200 text-gray-900
            /* 다크 모드: 흰색 반투명 배경 */
            dark:bg-white/10 dark:hover:bg-white/20 dark:text-gray-100
            /* 공통 스타일 */
            rounded-full px-6 transition-colors duration-200
          "
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${isDrawing || isDrawingAll ? "animate-spin" : ""}`} />
              다시 뽑기
            </Button>
        )}
      </div>
  )
}