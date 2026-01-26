"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getBallColor } from "@/utils/lotto-utils"
import { saveLottoResult } from "@/utils/lotto-storage" // 1. 로컬 저장 유틸 임포트
import { useToast } from "@/hooks/use-toast" // 2. 토스트 훅 임포트
import { Check, Lock, X } from "lucide-react"
import LottoCongratulation from "@/components/lotto-congratulation"
import LottoNumberDisplay from "@/components/lotto-number-display"
import { supabase } from "@/lib/supabaseClient" // Supabase 클라이언트 임포트

interface NumberSelectorProps {
  onSelectComplete: (numbers: number[]) => void
  onReset: () => void
  drawnNumbers?: number[]
}

export default function NumberSelector({ onSelectComplete, onReset, drawnNumbers }: NumberSelectorProps) {
  // 3. 상태 변수 정의
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]) // 현재 선택된 번호
  const [mode, setMode] = useState<"select" | "exclude" | "fix">("select") // 현재 탭 모드 (선택/제외/고정)
  const [excludedNumbers, setExcludedNumbers] = useState<number[]>([]) // 제외 번호
  const [fixedNumbers, setFixedNumbers] = useState<number[]>([]) // 고정 번호
  const [isSaved, setIsSaved] = useState(false) // 저장 완료(로컬) 여부
  const [showCongrats, setShowCongrats] = useState(false) // 축하 메시지 표시 여부
  const [targetDrawNo, setTargetDrawNo] = useState<number | undefined>(undefined) // 목표 회차 상태

  // 4. DOM 참조 및 통지/저장 상태 관리
  const hasNotifiedRef = useRef(false) // 상위 컴포넌트로 완료 통지를 한 번만 보내기 위한 Ref
  const lastSaveTimeRef = useRef(0) // 중복 저장을 방지하기 위한 마지막 저장 시간 Ref
  const drawnNumbersSectionRef = useRef<HTMLDivElement>(null) // 결과 영역 스크롤을 위한 Ref

  const { toast } = useToast() // 5. toast 훅 사용 선언

  // 6. 컴포넌트 마운트 시 통지 및 저장 상태 초기화
  useEffect(() => {
    hasNotifiedRef.current = false
    lastSaveTimeRef.current = 0
  }, [])

  // 최신 회차 정보 가져오기
  useEffect(() => {
    const fetchTargetDrawNo = async () => {
      try {
        const { data } = await supabase
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

  /**
   * 7. (반)자동 번호 생성 함수
   * @param count 고정 수를 제외하고 뽑을 번호의 개수
   */
  const generateRandomNumbers = (count: number) => {
    if (count <= 0) return

    // 7-1. 고정된 번호만 남기고 나머지 선택 해제
    setSelectedNumbers([...fixedNumbers])

    // 7-2. 뽑기 가능한 번호 풀 생성 (1~45 중, 제외된 번호와 고정된 번호를 뺀 나머지)
    const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1).filter(
        (n) => !excludedNumbers.includes(n) && !fixedNumbers.includes(n),
    )

    // 7-3. 필요한 개수(count)만큼 랜덤 번호 선택
    const newNumbers: number[] = []
    const tempAvailable = [...availableNumbers]
    for (let i = 0; i < count && tempAvailable.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * tempAvailable.length)
      newNumbers.push(tempAvailable[randomIndex])
      tempAvailable.splice(randomIndex, 1)
    }

    // 7-4. 고정된 번호와 새로 선택된 번호를 합쳐서 상태 업데이트
    setSelectedNumbers([...fixedNumbers, ...newNumbers])

    // 7-5. 저장 및 통지 상태 초기화
    setIsSaved(false)
    hasNotifiedRef.current = false
    lastSaveTimeRef.current = 0
  }

  /**
   * 8. 번호판(1~45) 클릭 시 번호 토글 함수
   * @param number 클릭된 번호
   */
  const toggleNumber = (number: number) => {
    if (mode === "select") { // 8-1. '번호 선택' 탭일 때
      if (selectedNumbers.includes(number)) {
        // 8-1-1. 이미 선택된 번호 클릭 시 (고정 번호가 아니라면)
        if (!fixedNumbers.includes(number)) {
          setSelectedNumbers(selectedNumbers.filter((n) => n !== number))
          hasNotifiedRef.current = false
          setIsSaved(false)
          lastSaveTimeRef.current = 0
          // 8-1-2. 6개에서 5개로 줄어들 때, 상위 컴포넌트(분석) 리셋
          if (selectedNumbers.length === 6) {
            onReset()
          }
        }
      } else {
        // 8-1-3. 새 번호 선택 시 (6개 미만일 때만)
        if (selectedNumbers.length < 6) {
          setSelectedNumbers([...selectedNumbers, number])
          hasNotifiedRef.current = false
          setIsSaved(false)
          lastSaveTimeRef.current = 0
        }
      }
    } else if (mode === "exclude") { // 8-2. '번호 제외' 탭일 때
      if (excludedNumbers.includes(number)) {
        setExcludedNumbers(excludedNumbers.filter((n) => n !== number))
      } else {
        // 8-2-1. 고정된 번호는 제외할 수 없음
        if (!fixedNumbers.includes(number)) {
          setExcludedNumbers([...excludedNumbers, number])
          // 8-2-2. 만약 선택된 번호였다면, 선택 목록에서도 제거
          if (selectedNumbers.includes(number)) {
            setSelectedNumbers(selectedNumbers.filter((n) => n !== number))
            hasNotifiedRef.current = false
            setIsSaved(false)
            lastSaveTimeRef.current = 0
            if (selectedNumbers.length === 6) {
              onReset()
            }
          }
        }
      }
    } else if (mode === "fix") { // 8-3. '번호 고정' 탭일 때
      if (fixedNumbers.includes(number)) {
        // 8-3-1. 고정 해제
        setFixedNumbers(fixedNumbers.filter((n) => n !== number))
        setSelectedNumbers(selectedNumbers.filter((n) => n !== number)) // 선택 목록에서도 제거
        hasNotifiedRef.current = false
        setIsSaved(false)
        lastSaveTimeRef.current = 0
        if (selectedNumbers.length === 6) {
          onReset()
        }
      } else {
        // 8-3-2. 고정 추가
        const nonFixedSelectedCount = selectedNumbers.filter((n) => !fixedNumbers.includes(n)).length
        // 8-3-3. 총 6개를 넘지 않고, 제외된 번호가 아닐 때만 고정 가능
        if (fixedNumbers.length < 6 && fixedNumbers.length + nonFixedSelectedCount < 6) {
          if (!excludedNumbers.includes(number)) {
            setFixedNumbers([...fixedNumbers, number])
            // 8-3-4. 선택 목록에도 자동 추가
            if (!selectedNumbers.includes(number)) {
              setSelectedNumbers([...selectedNumbers, number])
              hasNotifiedRef.current = false
              setIsSaved(false)
              lastSaveTimeRef.current = 0
            }
          }
        }
      }
    }
  }

  /**
   * 9. '초기화' 버튼 클릭 시 모든 상태 리셋
   */
  const resetAll = () => {
    setSelectedNumbers([])
    setExcludedNumbers([])
    setFixedNumbers([])
    setIsSaved(false)
    setShowCongrats(false)
    hasNotifiedRef.current = false
    lastSaveTimeRef.current = 0
    onReset() // 상위 컴포넌트(분석) 리셋
  }

  /**
   * 10. 번호판 UI 스타일 결정 함수
   */
  const getNumberClass = (number: number) => {
    if (fixedNumbers.includes(number)) {
      return "bg-green-200 dark:bg-green-900/50" // 고정됨
    } else if (excludedNumbers.includes(number)) {
      return "bg-red-200 dark:bg-red-900/50" // 제외됨
    } else if (selectedNumbers.includes(number)) {
      return "text-white dark:text-black" // 선택됨
    }
    // 기본 상태
    return "bg-white dark:bg-[rgb(38,38,38)] hover:bg-gray-200 dark:hover:bg-[rgb(100,100,100)]"
  }

  /**
   * 11. [수정됨] 6개 번호가 선택되면 자동으로 저장 및 DB 로깅을 처리하는 useEffect
   */
  useEffect(() => {
    // 11-1. 선택된 번호가 6개이고, 아직 저장되지 않았을 때
    if (selectedNumbers.length === 6 && !isSaved) {

      // 11-2. 번호 정렬
      const sortedNumbers = [...selectedNumbers].sort((a, b) => a - b)

      // 11-3. 상위 컴포넌트로 '선택 완료' 통지를 한 번만 보냄
      if (!hasNotifiedRef.current) {
        onSelectComplete(sortedNumbers)
        hasNotifiedRef.current = true

        // 11-4. 5초 이내 중복 저장을 방지하기 위해 시간 확인
        const currentTime = Date.now()
        if (currentTime - lastSaveTimeRef.current > 5000) {

          // saveLottoResult에 targetDrawNo 전달 (AI 아님 = false)
          const saved = saveLottoResult(sortedNumbers, false, targetDrawNo)

          // 11-6. 로컬 저장이 성공한 경우 (중복이 아닐 때)
          if (saved) {
            // 11-6-1. 토스트 알림 표시
            toast({
              title: "저장 완료",
              description: `${targetDrawNo ? targetDrawNo + "회차 " : ""}선택 번호가 기록에 저장되었습니다.`,
            })

            // 11-6-2. 마지막 저장 시간 업데이트
            lastSaveTimeRef.current = currentTime

            // --- [신규] 서버 DB에 비동기 저장 (인증 정보 포함) ---
            const logToServer = async () => {
              try {
                // 현재 세션에서 access_token을 가져옵니다.
                const { data: { session } } = await supabase.auth.getSession();
                const headers: HeadersInit = { 'Content-Type': 'application/json' };

                // 로그인 상태라면 Authorization 헤더에 Bearer 토큰을 추가합니다.
                if (session?.access_token) {
                  headers['Authorization'] = `Bearer ${session.access_token}`;
                }

                await fetch('/api/log-draw', {
                  method: 'POST',
                  headers: headers,
                  body: JSON.stringify({
                    numbers: sortedNumbers,
                    source: 'manual', // 출처: 'manual' (수동/반자동)
                    userId: session?.user?.id // 서버에서 토큰으로 검증하지만 명시적으로도 전달 가능
                  }),
                });
              } catch (err) {
                console.error("서버 통계 저장 실패 (manual):", err);
              }
            };

            logToServer();
            // ------------------------------------
          }
        }
      }

      // 11-7. UI 상태를 '저장됨'으로 변경
      setIsSaved(true)

      // 11-8. 잠시 후 결과 영역으로 스크롤하고 축하 메시지 표시
      setTimeout(() => {
        if (drawnNumbersSectionRef.current) {
          drawnNumbersSectionRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
          setTimeout(() => {
            setShowCongrats(true)
          }, 500) // 스크롤 시간 고려
        }
      }, 100)
    } else if (selectedNumbers.length < 6) {
      // 11-9. 번호가 6개 미만이 되면 저장/축하 상태 리셋
      setIsSaved(false)
      setShowCongrats(false)
    }
  }, [selectedNumbers, isSaved, toast, onSelectComplete, targetDrawNo]) // 의존성 유지

  /**
   * 13. 상위 컴포넌트(lotto-machine)에서 추첨한 번호를 받아오는 useEffect
   */
  useEffect(() => {
    // 13-1. 부모로부터 6개의 번호를 받으면, 이 컴포넌트의 상태도 동기화
    if (drawnNumbers && drawnNumbers.length === 6) {
      setSelectedNumbers(drawnNumbers)
      setIsSaved(true) // 부모가 보낸 번호는 이미 저장된 것으로 간주
      hasNotifiedRef.current = true

      // 13-2. 결과 영역으로 스크롤 및 축하 메시지 표시
      setTimeout(() => {
        if (drawnNumbersSectionRef.current) {
          drawnNumbersSectionRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
          setTimeout(() => {
            setShowCongrats(true)
          }, 500)
        }
      }, 100)

      // 13-3. 중복 저장 방지 시간 업데이트
      lastSaveTimeRef.current = Date.now()
    }
  }, [drawnNumbers])

  // 15. JSX 렌더링
  return (
      <div className="w-full space-y-6">
        {/* 15-1. 상단 탭 (선택/고정/제외) */}
        <div>
          <Tabs defaultValue="select" onValueChange={(value) => setMode(value as any)}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-200 dark:bg-[#262626] p-1 rounded-sm">
              <TabsTrigger
                  value="select"
                  className="flex items-center gap-1 rounded-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-500 dark:text-[rgb(163,163,163)] data-[state=active]:dark:bg-black data-[state=active]:dark:text-white"
              >
                <Check className="w-4 h-4" />
                <span>번호 선택</span>
              </TabsTrigger>
              <TabsTrigger
                  value="fix"
                  className="flex items-center gap-1 rounded-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-500 dark:text-[rgb(163,163,163)] data-[state=active]:dark:bg-black data-[state=active]:dark:text-white"
              >
                <Lock className="w-4 h-4" />
                <span>번호 고정</span>
              </TabsTrigger>
              <TabsTrigger
                  value="exclude"
                  className="flex items-center gap-1 rounded-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-500 dark:text-[rgb(163,163,163)] data-[state=active]:dark:bg-black data-[state=active]:dark:text-white"
              >
                <X className="w-4 h-4" />
                <span>번호 제외</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="select" className="mt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                원하는 번호를 선택하세요. 최대 6개까지 선택할 수 있습니다.
              </p>
            </TabsContent>
            <TabsContent value="fix" className="mt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                고정할 번호를 선택하세요. 고정된 번호는 항상 선택 결과에 포함됩니다.
              </p>
            </TabsContent>
            <TabsContent value="exclude" className="mt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                제외할 번호를 선택하세요. 제외된 번호는 선택 결과에 포함되지 않습니다.
              </p>
            </TabsContent>
          </Tabs>

          {/* 15-2. 컨트롤 패널 */}
          <div className="w-full bg-gray-200 dark:bg-[#262626] rounded-lg p-2 mt-4">
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="bg-white dark:bg-black rounded-md p-2">
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                  <Check className="w-3 h-3 text-blue-500" />
                  <span>선택</span>
                </div>
                <div className="font-medium text-lg dark:text-white">
                  {selectedNumbers.filter((n) => !fixedNumbers.includes(n)).length}/{6 - fixedNumbers.length}
                </div>
              </div>
              <div className="bg-white dark:bg-black rounded-md p-2">
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3 text-green-500" />
                  <span>고정</span>
                </div>
                <div className="font-medium text-lg text-green-600">{fixedNumbers.length}</div>
              </div>
              <div className="bg-white dark:bg-black rounded-md p-2">
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
                  <X className="w-3 h-3 text-red-500" />
                  <span>제외</span>
                </div>
                <div className="font-medium text-lg text-red-600">{excludedNumbers.length}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                  variant="outline"
                  onClick={resetAll}
                  className="h-10 text-gray-600 dark:text-gray-100 bg-gray-50 dark:bg-transparent border-gray-200 dark:border-[rgb(68,68,68)] hover:bg-gray-100 dark:hover:bg-[rgb(100,100,100)] hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M8 16H3v5"></path>
                </svg>
                초기화
              </Button>
              <Button
                  onClick={() => generateRandomNumbers(6 - fixedNumbers.length)}
                  disabled={fixedNumbers.length >= 6}
                  className="h-10 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                </svg>
                {fixedNumbers.length}개 + {6 - fixedNumbers.length}개 자동
              </Button>
            </div>
          </div>
        </div>

        {/* 15-3. 번호 선택 그리드 */}
        <div>
          <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 sm:gap-3 place-items-center">
            {Array.from({ length: 45 }, (_, i) => i + 1).map((number) => {
              const isSelected = selectedNumbers.includes(number)
              const isFixed = fixedNumbers.includes(number)
              const isExcluded = excludedNumbers.includes(number)
              const ballSize = "w-10 h-10"

              return (
                  <button
                      key={number}
                      onClick={() => toggleNumber(number)}
                      disabled={
                          (mode === "select" && selectedNumbers.length >= 6 && !selectedNumbers.includes(number)) ||
                          (mode === "select" && fixedNumbers.includes(number)) ||
                          (mode === "fix" && fixedNumbers.length >= 6 && !fixedNumbers.includes(number)) ||
                          (mode === "exclude" && fixedNumbers.includes(number)) ||
                          (mode === "fix" && excludedNumbers.includes(number))
                      }
                      className={`relative ${ballSize} rounded-full flex items-center justify-center font-medium text-sm sm:text-base transition-all ${getNumberClass(number)}`}
                      style={{ backgroundColor: isSelected && !isFixed ? getBallColor(number) : "" }}
                  >
                    {number}
                    {isFixed && (
                        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                          <Lock className="w-2.5 h-2.5 text-white" />
                        </div>
                    )}
                    {isExcluded && (
                        <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center">
                          <X className="w-2.5 h-2.5 text-white" />
                        </div>
                    )}
                    {isSelected && !isFixed && (
                        <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full w-4 h-4 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                    )}
                  </button>
              )
            })}
          </div>
        </div>

        {/* 15-4. 축하 메시지 */}
        {showCongrats && (
            <div>
              <LottoCongratulation show={showCongrats} className="w-full max-w-none" />
            </div>
        )}

        {/* 15-5. 선택된 번호 표시 */}
        <LottoNumberDisplay
            ref={drawnNumbersSectionRef}
            numbers={selectedNumbers}
            fixedNumbers={fixedNumbers}
            isSaved={isSaved}
            className="mt-6"
        />
      </div>
  )
}