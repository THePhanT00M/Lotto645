"use client"

import { motion } from "framer-motion"

/** 첫 로딩 동안 보여주는 스플래시 화면. */
export default function SplashScreen() {
  return (
      <div className="bg-canvas fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative mb-6"
          >
            <div className="border-line bg-surface flex h-24 w-24 items-center justify-center rounded-3xl border shadow-2xl">
              <motion.div
                  animate={{
                    scale: [1, 0.85, 1],
                    rotate: [0, 0, 180, 180, 0],
                    borderRadius: ["20%", "50%", "20%", "50%", "20%"],
                  }}
                  transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5 }}
                  className="h-10 w-10 rounded-lg bg-black dark:bg-white"
              />
            </div>
          </motion.div>

          <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
          >
            <h1 className="text-ink text-2xl font-bold tracking-[0.2em] uppercase">Lotto645</h1>
            <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-ink-muted mt-2 text-[10px] font-medium tracking-widest"
            >
              PREMIUM
            </motion.p>
          </motion.div>
        </div>
      </div>
  )
}
