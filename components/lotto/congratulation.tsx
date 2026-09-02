"use client"

import confetti from "canvas-confetti"
import { motion } from "framer-motion"
import { useEffect } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"

/** 폭죽이 터지기까지의 지연. 스크롤 이동이 끝난 뒤 보이도록 한다. */
const CONFETTI_DELAY_MS = 300

/** 추첨 완료 축하 배너. 표시될 때 한 번 폭죽을 터뜨린다. */
export default function Congratulation() {
  const { t } = useTranslation()
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    }, CONFETTI_DELAY_MS)

    return () => clearTimeout(timer)
  }, [])

  return (
      <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 p-4 text-center dark:border-blue-900/40 dark:from-blue-900/20 dark:to-purple-900/20"
      >
        <h2 className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent dark:from-blue-400 dark:to-purple-400">
          {t.draw.complete}
        </h2>
        <p className="text-gray-700 dark:text-gray-300">🍀 {t.draw.goodLuck} 🍀</p>
      </motion.div>
  )
}
