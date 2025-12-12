// components/splash-screen.tsx
"use client"

import { motion } from "framer-motion"

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-black">
      <div className="flex flex-col items-center justify-center">
        {/* 로고 애니메이션 박스 */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 bg-white dark:bg-[#1a1a1a] rounded-3xl flex items-center justify-center border border-gray-100 dark:border-[#333] shadow-2xl">
            {/* 내부 아이콘이 회전하며 변하는 효과 */}
            <motion.div
              animate={{
                scale: [1, 0.85, 1],
                rotate: [0, 0, 180, 180, 0],
                borderRadius: ["20%", "50%", "20%", "50%", "20%"]
              }}
              transition={{
                duration: 3,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 0.5
              }}
              className="w-10 h-10 bg-black dark:bg-white rounded-lg"
            />
          </div>
        </motion.div>

        {/* 텍스트 애니메이션 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-[0.2em] uppercase">
            Lotto645
          </h1>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 tracking-widest font-medium"
          >
            PREMIUM
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}