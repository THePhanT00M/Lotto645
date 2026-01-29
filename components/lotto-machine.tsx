"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import LottoBall from "@/components/lotto-ball"
import LottoCanvas from "@/components/lotto-canvas"
import LottoControls from "@/components/lotto-controls"
import LottoCongratulation from "@/components/lotto-congratulation"
import LottoNumberDisplay from "@/components/lotto-number-display"
import { getRandomNumber } from "@/utils/lotto-utils"
import { saveLottoResult } from "@/utils/lotto-storage"
import { supabase } from "@/lib/supabaseClient"
import { getApiUrl } from "@/lib/api-config"
import { useToast } from "@/hooks/use-toast"

interface LottoMachineProps {
  onDrawComplete: (numbers: number[]) => void
  onReset: () => void
  targetDrawNo?: number // [추가] 부모로부터 받는 회차 번호
}

export default function LottoMachine({ onDrawComplete, onReset, targetDrawNo }: LottoMachineProps) {
  // 1. 상태 변수 정의
  const [balls, setBalls] = useState<number[]>([])
  const [availableBalls, setAvailableBalls] = useState<number[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isDrawingAll, setIsDrawingAll] = useState(false)
  const [showCongrats, setShowCongrats] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  // [삭제] const [targetDrawNo, setTargetDrawNo] = useState<number | undefined>(undefined)

  const hasNotifiedRef = useRef(false)
  const lastSaveTimeRef = useRef(0)
  const resultsRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()

  // [삭제] 내부 useEffect fetchTargetDrawNo 로직 전체 삭제

  // 3. 컴포넌트 마운트 시 초기화
  useEffect(() => {
    resetMachine()
    hasNotifiedRef.current = false
    lastSaveTimeRef.current = 0
  }, [])

  // 4. '한번에 뽑기' 로직
  useEffect(() => {
    if (isDrawingAll && !isDrawing && balls.length < 6 && !isComplete) {
      const timer = setTimeout(() => {
        drawBall()
      }, 300)

      return () => clearTimeout(timer)
    }

    if (balls.length >= 6 && isDrawingAll) {
      setIsDrawingAll(false)
    }
  }, [isDrawingAll, isDrawing, balls.length, isComplete])

  // 6. 추첨 완료 시 저장 및 로깅 (targetDrawNo는 prop에서 온 값을 사용)
  useEffect(() => {
    if (isComplete && balls.length === 6 && !isSaved) {
      const sortedBalls = [...balls].sort((a, b) => a - b)

      if (!hasNotifiedRef.current) {
        onDrawComplete(sortedBalls)
        hasNotifiedRef.current = true

        const handleStorageAndLogging = async () => {
          const currentTime = Date.now()
          if (currentTime - lastSaveTimeRef.current > 5000) {

            const { data: { session } } = await supabase.auth.getSession();
            const isLoggedIn = !!session;
            let savedLocally = false;

            if (!isLoggedIn) {
              savedLocally = saveLottoResult(sortedBalls, false, targetDrawNo);
            }

            if (savedLocally || isLoggedIn) {
              lastSaveTimeRef.current = currentTime;
            }

            try {
              const headers: HeadersInit = { 'Content-Type': 'application/json' };
              if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
              }

              await fetch(getApiUrl("/api/log-draw"), {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                  numbers: sortedBalls,
                  source: 'machine',
                  userId: session?.user?.id
                }),
              });
            } catch (err) {
              console.error("서버 통계 저장 실패 (machine):", err);
            }
          }
        };

        handleStorageAndLogging();
      }

      setIsSaved(true)

      const timer = setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
          setTimeout(() => {
            setShowCongrats(true)
          }, 800)
        } else {
          setShowCongrats(true)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isComplete, balls, isSaved, onDrawComplete, targetDrawNo, toast])

  const resetMachine = () => {
    setBalls([])
    const initialAvailableBalls = Array.from({ length: 45 }, (_, i) => i + 1)
    setAvailableBalls(initialAvailableBalls)
    setIsDrawing(false)
    setIsComplete(false)
    setIsAnimating(false)
    setIsDrawingAll(false)
    setShowCongrats(false)
    setIsSaved(false)
    hasNotifiedRef.current = false
    lastSaveTimeRef.current = 0
    onReset()
    setTimeout(() => {
      setIsAnimating(true)
    }, 50)
  }

  const drawBall = () => {
    if (availableBalls.length === 0 || balls.length >= 6 || isDrawing) return
    setIsDrawing(true)
    const randomIndex = getRandomNumber(0, availableBalls.length - 1)
    const drawnBall = availableBalls[randomIndex]
    setAvailableBalls((prev) => prev.filter((ball) => ball !== drawnBall))
    setBalls((prev) => [...prev, drawnBall])
    if (balls.length === 5) {
      setTimeout(() => {
        setIsComplete(true)
        setIsDrawing(false)
        setBalls((prev) => [...prev].sort((a, b) => a - b))
      }, 1000)
    } else {
      setTimeout(() => {
        setIsDrawing(false)
      }, 500)
    }
  }

  const drawAllBalls = () => {
    if (balls.length > 0 || isDrawing || isDrawingAll) return
    setIsDrawingAll(true)
    drawBall()
  }

  return (
      <div className="flex flex-col items-center w-full">
        <div className="relative w-full aspect-square max-w-md mb-6 bg-white rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
          <LottoCanvas availableBalls={availableBalls} isAnimating={isAnimating} />
          <motion.div
              initial={{ y: 0, opacity: 0, scale: 0.5 }}
              animate={isDrawing ? { y: -100, opacity: 1, scale: 1 } : { y: 0, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
          >
            {isDrawing && <LottoBall number={balls[balls.length - 1] || 0} />}
          </motion.div>
        </div>

        <LottoControls
            balls={balls}
            isDrawing={isDrawing}
            isComplete={isComplete}
            isDrawingAll={isDrawingAll}
            onDrawBall={drawBall}
            onDrawAllBalls={drawAllBalls}
            onReset={resetMachine}
        />

        {(isDrawing || isDrawingAll || isComplete || balls.length > 0) && (
            <div className="w-full mt-6 space-y-6">
              {showCongrats && (
                  <div>
                    <LottoCongratulation show={showCongrats} className="w-full max-w-none" />
                  </div>
              )}
              <LottoNumberDisplay ref={resultsRef} numbers={balls} isSaved={isSaved} />
            </div>
        )}
      </div>
  )
}