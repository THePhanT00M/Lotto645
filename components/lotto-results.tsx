"use client"

import { motion } from "framer-motion"
import LottoBall from "@/components/lotto-ball"
import { useMobile } from "@/hooks/use-mobile"
import { useEffect, useState } from "react"

interface LottoResultsProps {
  balls: number[]
}

export default function LottoResults({ balls }: LottoResultsProps) {
  const isMobile = useMobile()
  const [ballSize, setBallSize] = useState("")
  const [iconSize, setIconSize] = useState("w-5 h-5")

  // Dynamic sizing based on screen width
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth

      // Dynamic sizing for different device widths
      if (width < 360) {
        // Very small phones
        setBallSize("w-9 h-9")
        setIconSize("w-4 h-4")
      } else if (width < 390) {
        // iPhone SE / Small phones
        setBallSize("w-10 h-10")
        setIconSize("w-5 h-5")
      } else if (width < 500) {
        // Medium phones (iPhone X, etc)
        setBallSize("w-12 h-12")
        setIconSize("w-5 h-5")
      } else if (width < 640) {
        // Large phones (iPhone Pro Max, etc)
        setBallSize("w-14 h-14")
        setIconSize("w-6 h-6")
      } else {
        // Small tablets
        setBallSize("w-14 h-14")
        setIconSize("w-6 h-6")
      }
    }

    // Set initial size
    updateSize()

    // Update size when window resizes
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  return (
    <div className="w-full flex justify-center mb-4">
      <div className="flex flex-nowrap justify-center" style={{ gap: "clamp(0.5rem, 2vw, 1rem)" }}>
        {balls.map((ball, index) => (
          <motion.div
            key={`ball-${index}-${ball}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: index * 0.1,
            }}
            className="transform-none"
          >
            <LottoBall number={ball} customSize={ballSize} />
          </motion.div>
        ))}
        {Array.from({ length: 6 - balls.length }).map((_, index) => (
          <motion.div
            key={`empty-${index}`}
            className={`${ballSize} rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center flex-shrink-0 bg-gray-50`}
            initial={{ y: 0 }}
            animate={{ y: [0, -3, 0] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 1.5,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  )
}
