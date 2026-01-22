"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import LottoBall from "@/components/lotto-ball"
import LottoCanvas from "@/components/lotto-canvas"
import LottoControls from "@/components/lotto-controls"
import LottoCongratulation from "@/components/lotto-congratulation"
import LottoNumberDisplay from "@/components/lotto-number-display"
import { getRandomNumber } from "@/utils/lotto-utils"
import { saveLottoResult } from "@/utils/lotto-storage" // 1. 로컬 저장소 유틸 임포트
import { supabase } from "@/lib/supabaseClient" // [추가] Supabase 클라이언트 임포트

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
  const [isSaved, setIsSaved] = useState(false) // 저장 완료(로컬) 여부
  const [targetDrawNo, setTargetDrawNo] = useState<number | undefined>(undefined) // [추가] 목표 회차 상태

  // 2. DOM 참조 및 통지 상태 관리
  const hasNotifiedRef = useRef(false) // 상위 컴포넌트로 완료 통지를 한 번만 보내기 위한 Ref
  const resultsRef = useRef<HTMLDivElement>(null) // 추첨 완료 시 스크롤할 결과 영역 Ref

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

  // 3. 컴포넌트 마운트 시 추첨기 초기화
  useEffect(() => {
    resetMachine()
    hasNotifiedRef.current = false // 통지 상태 초기화
  }, [])

  // 4. '한번에 뽑기' (isDrawingAll) 상태를 감지하는 useEffect
  useEffect(() => {
    // 4-1. '한번에 뽑기'가 true이고, 개별 공 추첨이 아니며, 6개가 안됐고, 완료 전일 때
    if (isDrawingAll && !isDrawing && balls.length < 6 && !isComplete) {
      // 4-2. 0.3초마다 다음 공을 뽑도록 타이머 설정
      const timer = setTimeout(() => {
        drawBall()
      }, 300) // (기존 1000ms에서 300ms로 속도 향상)

      return () => clearTimeout(timer)
    }

    // 4-3. 6개 공이 모두 뽑혔으면 '한번에 뽑기' 상태를 false로 변경
    if (balls.length >= 6 && isDrawingAll) {
      setIsDrawingAll(false)
    }
  }, [isDrawingAll, isDrawing, balls.length, isComplete]) // 5. 의존성 배열

  // 6. [수정됨] 추첨 완료(isComplete) 상태를 감지하여 저장 및 결과 처리를 하는 useEffect
  useEffect(() => {
    // 6-1. 6개 공 추첨이 완료되었고(isComplete), 아직 축하 메시지가 표시되지 않았을 때
    if (isComplete && balls.length === 6 && !showCongrats) {

      // 6-2. 번호를 오름차순으로 정렬
      const sortedBalls = [...balls].sort((a, b) => a - b)

      // 6-3. 로컬 저장소에 먼저 저장 (사용자 히스토리 UI용)
      //      (utils/lotto-storage.ts의 5초 내 중복 저장 방지 로직 포함)
      // [수정] saveLottoResult에 targetDrawNo 전달 (AI 아님 = false)
      const saved = saveLottoResult(sortedBalls, false, targetDrawNo);

      // 6-4. 로컬 저장이 성공한 경우에만 (중복이 아닐 때)
      if (saved) {
        setIsSaved(true); // 6-4-1. UI를 '저장됨'으로 변경

        // 6-4-2. 서버 DB에 비동기 저장 (통계 수집용)
        fetch('/api/log-draw', { // '/api/log-draw' 엔드포인트 호출
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numbers: sortedBalls,
            source: 'machine', // 출처: 'machine' (자동 추첨기)
            // score는 AI가 아니므로 보내지 않음
            // device_info는 API 서버에서 헤더를 통해 자동으로 수집
          }),
        }).catch((err) => {
          // 6-4-3. 서버 저장 실패 시, 사용자 경험을 막지 않고 콘솔에만 에러 기록
          console.error("서버 통계 저장 실패 (machine):", err);
        });
      } else {
        // 6-5. 중복 등으로 로컬 저장이 안된 경우 (5초 이내 동일 번호 생성)
        console.warn("로컬 저장 건너뜀 (machine). 서버 저장도 건너뜁니다.");
      }

      // 6-6. 상위 컴포넌트로 '추첨 완료' 통지를 한 번만 보냄
      if (!hasNotifiedRef.current) {
        onDrawComplete(sortedBalls)
        hasNotifiedRef.current = true
      }

      // 6-7. 1초 지연 후, 결과 영역으로 스크롤하고 축하 메시지 표시
      const timer = setTimeout(() => {
        if (resultsRef.current) {
          // 6-7-1. 결과 영역(LottoNumberDisplay)으로 부드럽게 스크롤
          resultsRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })

          // 6-7-2. 스크롤 애니메이션 시간(0.8초) 후 폭죽 효과 표시
          setTimeout(() => {
            setShowCongrats(true)
          }, 800)
        } else {
          // 6-7-3. (예외 처리) 스크롤 대상이 없으면 바로 폭죽 효과 표시
          setShowCongrats(true)
        }
      }, 1000) // 마지막 공 애니메이션을 위한 1초 대기

      return () => clearTimeout(timer)
    }
  }, [isComplete, balls, showCongrats, onDrawComplete, targetDrawNo]) // 7. 의존성 배열 (targetDrawNo 추가)

  /**
   * 8. 추첨기 초기화 함수
   */
  const resetMachine = () => {
    setBalls([]) // 8-1. 추첨된 공 비우기

    // 8-2. 1부터 45까지의 공으로 다시 채우기
    const initialAvailableBalls = Array.from({ length: 45 }, (_, i) => i + 1)
    setAvailableBalls(initialAvailableBalls)

    // 8-3. 모든 상태 플래그 초기화
    setIsDrawing(false)
    setIsComplete(false)
    setIsAnimating(false)
    setIsDrawingAll(false)
    setShowCongrats(false)
    setIsSaved(false) // 8-4. 저장 상태 초기화

    // 8-5. 통지 상태 초기화
    hasNotifiedRef.current = false

    // 8-6. 상위 컴포넌트(Home)에 리셋 이벤트 전달
    onReset()

    // 8-7. 캔버스 애니메이션 다시 시작
    setTimeout(() => {
      setIsAnimating(true)
    }, 50)
  }

  /**
   * 9. 공 하나 뽑기 함수
   */
  const drawBall = () => {
    // 9-1. 추첨 불가능 상태(공이 없거나, 6개 다 뽑았거나, 현재 뽑는 중)이면 중단
    if (availableBalls.length === 0 || balls.length >= 6 || isDrawing) return

    setIsDrawing(true) // 9-2. '뽑는 중' 상태로 변경

    // 9-3. 남은 공 중에서 랜덤하게 인덱스 선택
    const randomIndex = getRandomNumber(0, availableBalls.length - 1)
    const drawnBall = availableBalls[randomIndex]

    // 9-4. '남은 공' 배열에서 뽑힌 공 제거
    setAvailableBalls((prev) => prev.filter((ball) => ball !== drawnBall))

    // 9-5. '추첨된 공' 배열에 뽑힌 공 추가
    setBalls((prev) => [...prev, drawnBall])

    // 9-6. 방금 뽑은 공이 6번째 공인지 확인
    if (balls.length === 5) { // (상태 변경 전이므로 5 === 6번째)
      // 9-6-1. 6번째 공이면 1초 후 '추첨 완료' 상태로 변경
      setTimeout(() => {
        setIsComplete(true)
        setIsDrawing(false)
        // 9-6-2. 완료 시 공을 정렬
        setBalls((prev) => [...prev].sort((a, b) => a - b))
      }, 1000) // 마지막 공 애니메이션 시간
    } else {
      // 9-6-3. 6번째 공이 아니면 0.5초 후 '뽑는 중' 상태 해제
      setTimeout(() => {
        setIsDrawing(false)
      }, 500)
    }
  }

  /**
   * 10. 공 한번에 모두 뽑기 함수
   */
  const drawAllBalls = () => {
    // 10-1. 이미 공이 있거나, 뽑는 중이면 중단
    if (balls.length > 0 || isDrawing || isDrawingAll) return
    // 10-2. '한번에 뽑기' 상태를 true로 변경 (-> 4번 useEffect가 이 상태를 감지함)
    setIsDrawingAll(true)
    // 10-3. 첫 번째 공 즉시 추첨 시작
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

      {/* 11-4. 추첨 완료 시 결과 표시 영역 */}
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
    </div>
  )
}