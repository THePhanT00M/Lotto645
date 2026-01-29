"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getBallColor } from "@/utils/lotto-utils"
import { saveLottoResult } from "@/utils/lotto-storage"
import { useToast } from "@/hooks/use-toast"
import { Check, Lock, X } from "lucide-react"
import LottoCongratulation from "@/components/lotto-congratulation"
import LottoNumberDisplay from "@/components/lotto-number-display"
import { supabase } from "@/lib/supabaseClient"

interface NumberSelectorProps {
  onSelectComplete: (numbers: number[]) => void
  onReset: () => void
  drawnNumbers?: number[]
  targetDrawNo?: number // [추가] 부모로부터 받는 회차 번호
}

export default function NumberSelector({ onSelectComplete, onReset, drawnNumbers, targetDrawNo }: NumberSelectorProps) {
  // 3. 상태 변수 정의
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [mode, setMode] = useState<"select" | "exclude" | "fix">("select")
  const [excludedNumbers, setExcludedNumbers] = useState<number[]>([])
  const [fixedNumbers, setFixedNumbers] = useState<number[]>([])
  const [isSaved, setIsSaved] = useState(false)
  const [showCongrats, setShowCongrats] = useState(false)
  // [삭제] const [targetDrawNo, setTargetDrawNo] = useState<number | undefined>(undefined)

  const hasNotifiedRef = useRef(false)
  const lastSaveTimeRef = useRef(0)
  const drawnNumbersSectionRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()

  // 6. 컴포넌트 마운트 시 초기화
  useEffect(() => {
    hasNotifiedRef.current = false
    lastSaveTimeRef.current = 0
  }, [])

  // [삭제] 내부 useEffect fetchTargetDrawNo 로직 전체 삭제

  // 7. (반)자동 번호 생성 함수
  const generateRandomNumbers = (count: number) => {
    if (count <= 0) return
    setSelectedNumbers([...fixedNumbers])
    const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1).filter(
        (n) => !excludedNumbers.includes(n) && !fixedNumbers.includes(n),
    )
    const newNumbers: number[] = []
    const tempAvailable = [...availableNumbers]
    for (let i = 0; i < count && tempAvailable.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * tempAvailable.length)
      newNumbers.push(tempAvailable[randomIndex])
      tempAvailable.splice(randomIndex, 1)
    }
    setSelectedNumbers([...fixedNumbers, ...newNumbers])
    setIsSaved(false)
    hasNotifiedRef.current = false
    lastSaveTimeRef.current = 0
  }

  // 8. 번호판 토글 함수 (기존 로직 유지)
  const toggleNumber = (number: number) => {
    if (mode === "select") {
      if (selectedNumbers.includes(number)) {
        if (!fixedNumbers.includes(number)) {
          setSelectedNumbers(selectedNumbers.filter((n) => n !== number))
          hasNotifiedRef.current = false
          setIsSaved(false)
          lastSaveTimeRef.current = 0
          if (selectedNumbers.length === 6) {
            onReset()
          }
        }
      } else {
        if (selectedNumbers.length < 6) {
          setSelectedNumbers([...selectedNumbers, number])
          hasNotifiedRef.current = false
          setIsSaved(false)
          lastSaveTimeRef.current = 0
        }
      }
    } else if (mode === "exclude") {
      if (excludedNumbers.includes(number)) {
        setExcludedNumbers(excludedNumbers.filter((n) => n !== number))
      } else {
        if (!fixedNumbers.includes(number)) {
          setExcludedNumbers([...excludedNumbers, number])
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
    } else if (mode === "fix") {
      if (fixedNumbers.includes(number)) {
        setFixedNumbers(fixedNumbers.filter((n) => n !== number))
        setSelectedNumbers(selectedNumbers.filter((n) => n !== number))
        hasNotifiedRef.current = false
        setIsSaved(false)
        lastSaveTimeRef.current = 0
        if (selectedNumbers.length === 6) {
          onReset()
        }
      } else {
        const nonFixedSelectedCount = selectedNumbers.filter((n) => !fixedNumbers.includes(n)).length
        if (fixedNumbers.length < 6 && fixedNumbers.length + nonFixedSelectedCount < 6) {
          if (!excludedNumbers.includes(number)) {
            setFixedNumbers([...fixedNumbers, number])
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

  const resetAll = () => {
    setSelectedNumbers([])
    setExcludedNumbers([])
    setFixedNumbers([])
    setIsSaved(false)
    setShowCongrats(false)
    hasNotifiedRef.current = false
    lastSaveTimeRef.current = 0
    onReset()
  }

  const getNumberClass = (number: number) => {
    if (fixedNumbers.includes(number)) {
      return "bg-green-200 dark:bg-green-900/50"
    } else if (excludedNumbers.includes(number)) {
      return "bg-red-200 dark:bg-red-900/50"
    } else if (selectedNumbers.includes(number)) {
      return "text-white dark:text-black"
    }
    return "bg-white dark:bg-[rgb(38,38,38)] hover:bg-gray-200 dark:hover:bg-[rgb(100,100,100)]"
  }

  // 11. 완료 시 저장 로직 (targetDrawNo는 prop에서 온 값을 사용)
  useEffect(() => {
    if (selectedNumbers.length === 6 && !isSaved) {
      const sortedNumbers = [...selectedNumbers].sort((a, b) => a - b)

      if (!hasNotifiedRef.current) {
        onSelectComplete(sortedNumbers)
        hasNotifiedRef.current = true

        const handleStorageAndLogging = async () => {
          const currentTime = Date.now()
          if (currentTime - lastSaveTimeRef.current > 5000) {

            const { data: { session } } = await supabase.auth.getSession();
            const isLoggedIn = !!session;
            let savedLocally = false;

            if (!isLoggedIn) {
              savedLocally = saveLottoResult(sortedNumbers, false, targetDrawNo);
            }

            if (savedLocally || isLoggedIn) {
              lastSaveTimeRef.current = currentTime;
            }

            try {
              const headers: HeadersInit = { 'Content-Type': 'application/json' };
              if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
              }

              await fetch('/api/log-draw', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                  numbers: sortedNumbers,
                  source: 'manual',
                  userId: session?.user?.id
                }),
              });
            } catch (err) {
              console.error("서버 통계 저장 실패 (manual):", err);
            }
          }
        };

        handleStorageAndLogging();
      }

      setIsSaved(true)

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
    } else if (selectedNumbers.length < 6) {
      setIsSaved(false)
      setShowCongrats(false)
    }
  }, [selectedNumbers, isSaved, toast, onSelectComplete, targetDrawNo])

  useEffect(() => {
    if (drawnNumbers && drawnNumbers.length === 6) {
      setSelectedNumbers(drawnNumbers)
      setIsSaved(true)
      hasNotifiedRef.current = true

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

      lastSaveTimeRef.current = Date.now()
    }
  }, [drawnNumbers])

  return (
      <div className="w-full space-y-6">
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

        {showCongrats && (
            <div>
              <LottoCongratulation show={showCongrats} className="w-full max-w-none" />
            </div>
        )}

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