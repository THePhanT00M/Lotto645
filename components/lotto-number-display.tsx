"use client"

import { forwardRef } from "react"
import { motion } from "framer-motion"
import { Check, Lock } from "lucide-react"

interface LottoNumberDisplayProps {
  numbers: number[]
  fixedNumbers?: number[]
  isSaved?: boolean
  className?: string
}

const getBallColor = (number: number) => {
  if (number >= 1 && number <= 10) return "#fbc400"
  if (number >= 11 && number <= 20) return "#69c8f2"
  if (number >= 21 && number <= 30) return "#ff7272"
  if (number >= 31 && number <= 40) return "#aaa"
  if (number >= 41 && number <= 45) return "#b0d840"
  return "#000"
}

const LottoNumberDisplay = forwardRef<HTMLDivElement, LottoNumberDisplayProps>(
  ({ numbers, fixedNumbers = [], isSaved = false, className = "" }, ref) => {
    if (numbers.length === 0) return null

    // 6개가 모두 뽑혔을 때만 정렬, 그렇지 않으면 원래 순서 유지
    const displayNumbers = numbers.length === 6 ? [...numbers].sort((a, b) => a - b) : numbers

    return (
      <div className={className}>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 bg-gray-50 border border-gray-100 rounded-lg"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="w-24"></div> {/* Spacer for balance */}
            <h3 className="text-lg font-medium text-center">추첨 번호</h3>
            {isSaved && numbers.length === 6 ? (
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
          <div className="flex flex-nowrap justify-center gap-2">
            {displayNumbers.map((number, index) => (
              <motion.div
                key={number}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="relative flex-shrink-0"
              >
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-black font-bold text-sm sm:text-base"
                  style={{
                    backgroundColor: getBallColor(number),
                  }}
                >
                  {number}
                  {fixedNumbers.includes(number) && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                      <Lock className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {/* Empty slots for remaining numbers */}
            {Array.from({ length: 6 - numbers.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0"
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  },
)

LottoNumberDisplay.displayName = "LottoNumberDisplay"

export default LottoNumberDisplay
