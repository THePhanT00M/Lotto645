"use client"

import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { useEffect, useRef } from "react"

interface LottoCongratulationProps {
  show: boolean
  className?: string
}

export default function LottoCongratulation({ show, className }: LottoCongratulationProps) {
  // Add a ref to track if confetti has been shown
  const confettiShownRef = useRef(false)

  useEffect(() => {
    if (show && !confettiShownRef.current) {
      // 컴포넌트가 표시된 후 약간의 지연 시간을 두고 폭죽 효과 생성
      const timer = setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })

        // Mark confetti as shown
        confettiShownRef.current = true
      }, 300)

      // Reset the ref when component unmounts or show becomes false
      return () => {
        clearTimeout(timer)
        if (!show) {
          confettiShownRef.current = false
        }
      }
    }
  }, [show])

  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`w-full ${className || "max-w-md"} mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 shadow-sm text-center`}
    >
      <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
        추첨 완료!
      </h2>
      <p className="text-gray-700">🍀 행운이 함께하길 바랍니다! 🍀</p>
    </motion.div>
  )
}
