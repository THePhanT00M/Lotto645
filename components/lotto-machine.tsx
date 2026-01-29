"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import LottoBall from "@/components/lotto-ball"
import LottoCanvas from "@/components/lotto-canvas"
import LottoControls from "@/components/lotto-controls"
import LottoCongratulation from "@/components/lotto-congratulation"
import LottoNumberDisplay from "@/components/lotto-number-display"
import { getRandomNumber, getBallColor } from "@/utils/lotto-utils" // getBallColor는 필요한 경우 사용
import { saveLottoResult } from "@/utils/lotto-storage"
import { supabase } from "@/lib/supabaseClient"
import { getApiUrl } from "@/lib/api-config"
import { useToast } from "@/hooks/use-toast" // 토스트 훅 임포트

interface LottoMachineProps {
  onDrawComplete: (numbers: number[]) => void
  onReset: () => void
}

export default function LottoMachine({ onDrawComplete, onReset }: LottoMachineProps) {
  // 1. 상태 변수 정의
  const [balls, setBalls] = useState<number[]>([]) // 추첨된 공들
  const [availableBalls, setAvailableBalls] = useState<number[]>([]) // 추첨기에 남은 공들
  const [isDrawing, setIsDrawing] = useState(false) // 개별 공 추첨 애니메이션 진행 중 여부
  const [isComplete, setIsComplete] = useState(false) // 6개 공 추첨 완료 여부
  const [isAnimating, setIsAnimating] = useState(false) // 캔버스 애니메이션 활성화 여부
  const [isDrawingAll, setIsDrawingAll] = useState(false) // '한번에 뽑기' 진행 중 여부
  const [showCongrats, setShowCongrats] = useState(false) // 축하 메시지 표시 여부
  const [isSaved, setIsSaved] = useState(false) // 저장 완료 여부
  const [targetDrawNo, setTargetDrawNo] = useState<number | undefined>(undefined) // 목표 회차 상태

  // 2. DOM 참조 및 통지/저장 상태 관리
  const hasNotifiedRef = useRef(false) // 상위 컴포넌트로 완료 통지를 한 번만 보내기 위한 Ref
  const lastSaveTimeRef = useRef(0) // 중복 저장을 방지하기 위한 마지막 저장 시간 Ref
  const resultsRef = useRef<HTMLDivElement>(null) // 추첨 완료 시 스크롤할 결과 영역 Ref

  const { toast } = useToast() // toast 훅 사용 선언

  // [추가] 컴포넌트 마운트 시 최신 회차 정보 가져오기
  useEffect(() => {
    const fetchTargetDrawNo = async () => {
      try {
        const { data, error } = await supabase
            .from("winning_numbers")
            .select("drawNo")
            .order("drawNo", { ascending: false })
            .limit(1)
            .single()

        if (data) {
          setTargetDrawNo(data.drawNo + 1) // 다음 회차 = 최신 회차 + 1
        }
      } catch (e) {
        console.error("Failed to fetch latest draw number:", e)
      }
    }
    fetchTargetDrawNo()
  }, [])

  // 3. 컴포넌트 마운트 시 추첨기 및 저장 상태 초기화
  useEffect(() => {
    resetMachine()
    hasNotifiedRef.current = false
    lastSaveTimeRef.current = 0 // 저장 시간 초기화
  }, [])

  // 4. '한번에 뽑기' (isDrawingAll) 상태를 감지하는 useEffect
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

  // 6. [수정됨] 추첨 완료(isComplete) 시 저장 및 결과 처리를 하는 useEffect (number-selector.tsx 로직 동기화)
  useEffect(() => {
    // 6-1. 6개 공 추첨이 완료되었고, 아직 저장 처리가 되지 않았을 때
    if (isComplete && balls.length === 6 && !isSaved) {

      // 6-2. 번호를 오름차순으로 정렬
      const sortedBalls = [...balls].sort((a, b) => a - b)

      // 6-3. 상위 컴포넌트로 '추첨 완료' 통지를 한 번만 보냄
      if (!hasNotifiedRef.current) {
        onDrawComplete(sortedBalls)
        hasNotifiedRef.current = true

        // 6-4. 중복 방지 및 저장/로깅 로직 실행
        const handleStorageAndLogging = async () => {
          const currentTime = Date.now()
          if (currentTime - lastSaveTimeRef.current > 5000) {

            // 6-4-1. 세션 확인 (로그인 여부)
            const { data: { session } } = await supabase.auth.getSession();
            const isLoggedIn = !!session;

            let savedLocally = false;

            // 6-4-2. 로그인하지 않은 경우에만 로컬 스토리지에 저장
            if (!isLoggedIn) {
              savedLocally = saveLottoResult(sortedBalls, false, targetDrawNo);
            }

            // 6-4-3. 토스트 알림 표시 (로컬 저장 성공 시 혹은 로그인 상태일 때)
            if (savedLocally || isLoggedIn) {
              lastSaveTimeRef.current = currentTime;
            }

            // 6-4-4. 서버 DB에 비동기 저장 (통계 수집용)
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
                  userId: session?.user?.id // 사용자 ID 포함
                }),
              });
            } catch (err) {
              console.error("서버 통계 저장 실패 (machine):", err);
            }
          }
        };

        handleStorageAndLogging();
      }

      // 6-5. UI 상태를 '저장됨'으로 변경
      setIsSaved(true)

      // 6-6. 지연 후 결과 영역 스크롤 및 축하 메시지 표시
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

  /**
   * 8. 추첨기 초기화 함수
   */
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
    lastSaveTimeRef.current = 0 // 중복 저장 시간 초기화

    onReset()

    setTimeout(() => {
      setIsAnimating(true)
    }, 50)
  }

  /**
   * 9. 공 하나 뽑기 함수
   */
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

  /**
   * 10. 공 한번에 모두 뽑기 함수
   */
  const drawAllBalls = () => {
    if (balls.length > 0 || isDrawing || isDrawingAll) return
    setIsDrawingAll(true)
    drawBall()
  }

  // 11. JSX 렌더링
  return (
      <div className="flex flex-col items-center w-full">
        {/* 11-1. 로또 머신 캔버스 */}
        <div className="relative w-full aspect-square max-w-md mb-6 bg-white rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
          <LottoCanvas availableBalls={availableBalls} isAnimating={isAnimating} />

          {/* 11-2. 공이 뽑힐 때 나오는 애니메이션용 공 (Framer Motion) */}
          <motion.div
              initial={{ y: 0, opacity: 0, scale: 0.5 }}
              animate={isDrawing ? { y: -100, opacity: 1, scale: 1 } : { y: 0, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
          >
            {isDrawing && <LottoBall number={balls[balls.length - 1] || 0} />}
          </motion.div>
        </div>

        {/* 11-3. 컨트롤 버튼 (뽑기, 한번에 뽑기, 다시 뽑기) */}
        <LottoControls
            balls={balls}
            isDrawing={isDrawing}
            isComplete={isComplete}
            isDrawingAll={isDrawingAll}
            onDrawBall={drawBall}
            onDrawAllBalls={drawAllBalls}
            onReset={resetMachine}
        />

        {/* 11-4. 추첨 중 혹은 완료 시 결과 표시 영역 노출 조건 추가 */}
        {(isDrawing || isDrawingAll || isComplete || balls.length > 0) && (
            <div className="w-full mt-6 space-y-6">
              {/* 11-4-1. 축하 메시지 (완료 시 표시) */}
              {showCongrats && (
                  <div>
                    <LottoCongratulation show={showCongrats} className="w-full max-w-none" />
                  </div>
              )}

              {/* 11-4-2. 추첨된 번호 표시 (Ref를 연결하여 스크롤 대상으로 지정) */}
              <LottoNumberDisplay ref={resultsRef} numbers={balls} isSaved={isSaved} />
            </div>
        )}
      </div>
  )
}