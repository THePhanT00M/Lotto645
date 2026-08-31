"use client"

import { motion } from "framer-motion"
import { Check, Lock, Sparkles } from "lucide-react"
import { forwardRef } from "react"
import { Ball, BallBadge, EmptyBall } from "@/components/lotto/ball"
import { PICK_COUNT } from "@/lib/lotto/constants"
import { cn } from "@/lib/utils"

interface NumberDisplayProps {
  numbers: number[]
  /** 자물쇠 표시를 붙일 고정 번호 */
  fixedNumbers?: number[]
  /** 기록 저장 완료 표시 */
  isSaved?: boolean
  /** AI 추천 결과로 표시 */
  isAiRecommended?: boolean
  className?: string
}

/** 현재 뽑힌 번호를 카드 형태로 보여준다. */
const NumberDisplay = forwardRef<HTMLDivElement, NumberDisplayProps>(function NumberDisplay(
    { numbers, fixedNumbers = [], isSaved = false, isAiRecommended = false, className },
    ref,
) {
  if (numbers.length === 0) return null

  // 6개가 다 모였을 때만 정렬해, 뽑히는 순서를 그대로 보여준다.
  const display = numbers.length === PICK_COUNT ? [...numbers].sort((a, b) => a - b) : numbers

  return (
      <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn("bg-surface rounded-lg p-4", className)}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="w-24" aria-hidden />
          <h3 className="flex items-center gap-2 text-lg font-medium">
            {isAiRecommended && <Sparkles className="h-5 w-5 text-blue-600" />}
            {isAiRecommended ? "AI 추천 번호" : "추첨 번호"}
          </h3>
          <div className="flex w-24 justify-end">
            {isSaved && numbers.length === PICK_COUNT && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center text-sm text-green-600"
                >
                  <Check className="mr-1 h-4 w-4" />
                  기록 저장됨
                </motion.span>
            )}
          </div>
        </div>

        <div className="flex flex-nowrap justify-center gap-2">
          {display.map((number, index) => (
              <motion.div
                  key={number}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Ball
                    number={number}
                    size="responsive"
                    badge={
                      fixedNumbers.includes(number) ? (
                          <BallBadge className="bg-green-500">
                            <Lock className="h-2.5 w-2.5" />
                          </BallBadge>
                      ) : undefined
                    }
                />
              </motion.div>
          ))}

          {Array.from({ length: PICK_COUNT - numbers.length }, (_, index) => (
              <EmptyBall key={`empty-${index}`} size="responsive" />
          ))}
        </div>
      </motion.div>
  )
})

export default NumberDisplay
