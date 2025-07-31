"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getBallColor } from "@/utils/lotto-utils"
import { saveLottoResult } from "@/utils/lotto-storage"
import { useToast } from "@/hooks/use-toast"
import { Check, Lock, X } from "lucide-react"
import { motion } from "framer-motion"
import LottoCongratulation from "@/components/lotto-congratulation"

interface NumberSelectorProps {
  onSelectComplete: (numbers: number[]) => void
  onReset: () => void
  drawnNumbers?: number[]
}

interface LottoCongratulationProps {
  show: boolean
}

export default function NumberSelector({ onSelectComplete, onReset, drawnNumbers }: NumberSelectorProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [mode, setMode] = useState<"select" | "exclude" | "fix">("select")
  const [excludedNumbers, setExcludedNumbers] = useState<number[]>([])
  const [fixedNumbers, setFixedNumbers] = useState<number[]>([])
  const [isSaved, setIsSaved] = useState(false)
  const [showCongrats, setShowCongrats] = useState(false)

  // 결과 통지 여부를 추적하는 ref
  const hasNotifiedRef = useRef(false)

  // 마지막 저장 시간을 추적하는 ref
  const lastSaveTimeRef = useRef(0)

  // Add a new ref for the drawn numbers section
  const drawnNumbersSectionRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()

  // 컴포넌트가 마운트될 때 통지 상태 초기화
  useEffect(() => {
    hasNotifiedRef.current = false
    lastSaveTimeRef.current = 0
  }, [])

  // 랜덤 번호 생성 함수
  const generateRandomNumbers = (count: number) => {
    if (count <= 0) return

    // 고정된 번호만 유지하고 나머지는 초기화
    setSelectedNumbers([...fixedNumbers])

    // 제외된 번호와 고정된 번호를 제외한 번호 풀 생성
    const availableNumbers = Array.from({ length: 45 }, (_, i) => i + 1).filter(
      (n) => !excludedNumbers.includes(n) && !fixedNumbers.includes(n),
    )

    // 필요한 개수만큼 랜덤 번호 선택
    const newNumbers: number[] = []
    const tempAvailable = [...availableNumbers]

    for (let i = 0; i < count && tempAvailable.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * tempAvailable.length)
      newNumbers.push(tempAvailable[randomIndex])
      tempAvailable.splice(randomIndex, 1)
    }

    // 고정된 번호와 새로 선택된 번호를 합쳐서 설정
    setSelectedNumbers([...fixedNumbers, ...newNumbers])

    // 저장 상태 초기화
    setIsSaved(false)

    // 통지 상태 초기화
    hasNotifiedRef.current = false
    lastSaveTimeRef.current = 0
  }

  // Toggle a number in the appropriate array based on the current mode
  const toggleNumber = (number: number) => {
    if (mode === "select") {
      if (selectedNumbers.includes(number)) {
        // 고정된 번호는 선택 해제할 수 없음
        if (!fixedNumbers.includes(number)) {
          setSelectedNumbers(selectedNumbers.filter((n) => n !== number))
          // 선택 해제 시 통지 상태 초기화
          hasNotifiedRef.current = false
          setIsSaved(false)
          lastSaveTimeRef.current = 0

          // 번호가 6개에서 5개로 줄어들 때 부모 컴포넌트에 초기화 이벤트 전달
          if (selectedNumbers.length === 6) {
            onReset()
          }
        }
      } else {
        // 고정된 번호 개수를 고려하여 선택 가능한 번호 개수 제한
        if (selectedNumbers.length < 6) {
          setSelectedNumbers([...selectedNumbers, number])
          // 새 번호 선택 시 통지 상태 초기화
          hasNotifiedRef.current = false
          setIsSaved(false)
          lastSaveTimeRef.current = 0
        }
      }
    } else if (mode === "exclude") {
      if (excludedNumbers.includes(number)) {
        setExcludedNumbers(excludedNumbers.filter((n) => n !== number))
      } else {
        // Can't exclude a fixed number
        if (!fixedNumbers.includes(number)) {
          setExcludedNumbers([...excludedNumbers, number])
          // Also remove from selected if it's there
          if (selectedNumbers.includes(number)) {
            setSelectedNumbers(selectedNumbers.filter((n) => n !== number))
            // 선택 해제 시 통지 상태 초기화
            hasNotifiedRef.current = false
            setIsSaved(false)
            lastSaveTimeRef.current = 0

            // 번호가 6개에서 5개로 줄어들 때 부모 컴포넌트에 초기화 이벤트 전달
            if (selectedNumbers.length === 6) {
              onReset()
            }
          }
        }
      }
    } else if (mode === "fix") {
      if (fixedNumbers.includes(number)) {
        setFixedNumbers(fixedNumbers.filter((n) => n !== number))
        // 고정 해제 시 선택된 번호에서도 제거
        setSelectedNumbers(selectedNumbers.filter((n) => n !== number))
        // 선택 해제 시 통지 상태 초기화
        hasNotifiedRef.current = false
        setIsSaved(false)
        lastSaveTimeRef.current = 0

        // 번호가 6개에서 5개로 줄어들 때 부모 컴포넌트에 초기화 이벤트 전달
        if (selectedNumbers.length === 6) {
          onReset()
        }
      } else {
        // 고정 번호 추가 시 총 선택 가능한 번호(6개)를 초과하지 않도록 제한
        const nonFixedSelectedCount = selectedNumbers.filter((n) => !fixedNumbers.includes(n)).length

        if (fixedNumbers.length < 6 && fixedNumbers.length + nonFixedSelectedCount < 6) {
          // Can't fix an excluded number
          if (!excludedNumbers.includes(number)) {
            setFixedNumbers([...fixedNumbers, number])
            // Also add to selected if it's not there
            if (!selectedNumbers.includes(number)) {
              setSelectedNumbers([...selectedNumbers, number])
              // 새 번호 선택 시 통지 상태 초기화
              hasNotifiedRef.current = false
              setIsSaved(false)
              lastSaveTimeRef.current = 0
            }
          }
        }
      }
    }
  }

  // Reset all selections
  const resetAll = () => {
    setSelectedNumbers([])
    setExcludedNumbers([])
    setFixedNumbers([])
    setIsSaved(false)
    setShowCongrats(false)
    hasNotifiedRef.current = false
    lastSaveTimeRef.current = 0

    // 부모 컴포넌트에 초기화 이벤트 전달
    onReset()
  }

  // Get the appropriate class for a number based on its state
  const getNumberClass = (number: number) => {
    if (fixedNumbers.includes(number)) {
      return "bg-green-100 shadow-md"
    } else if (excludedNumbers.includes(number)) {
      return "bg-gray-100"
    } else if (selectedNumbers.includes(number)) {
      return "bg-blue-500 text-white shadow-md"
    }
    return "bg-gray-100 hover:bg-gray-200"
  }

  // Auto-save when 6 numbers are selected
  useEffect(() => {
    if (selectedNumbers.length === 6 && !isSaved) {
      // Sort the selected numbers
      const sortedNumbers = [...selectedNumbers].sort((a, b) => a - b)

      // 결과를 한 번만 통지
      if (!hasNotifiedRef.current) {
        onSelectComplete(sortedNumbers)
        hasNotifiedRef.current = true

        // 현재 시간과 마지막 저장 시간 사이에 최소 3초 이상 경과했는지 확인
        const currentTime = Date.now()
        if (currentTime - lastSaveTimeRef.current > 3000) {
          // 충분한 시간이 경과했으면 저장 진행
          const saved = saveLottoResult(sortedNumbers)

          // 저장에 성공한 경우에만 토스트 메시지 표시
          if (saved) {
            // Show toast notification
            toast({
              title: "저장 완료",
              description: "선택한 번호가 기록에 저장되었습니다.",
            })

            // 마지막 저장 시간 업데이트
            lastSaveTimeRef.current = currentTime
          }
        }
      }

      // Mark as saved
      setIsSaved(true)

      // Scroll to the drawn numbers section and then show congratulation message
      setTimeout(() => {
        if (drawnNumbersSectionRef.current) {
          drawnNumbersSectionRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })

          // Show congratulation message after scrolling
          setTimeout(() => {
            setShowCongrats(true)
          }, 500)
        }
      }, 100)
    } else if (selectedNumbers.length < 6) {
      // Reset saved state when numbers change
      setIsSaved(false)
      setShowCongrats(false)
    }
  }, [selectedNumbers, isSaved, toast, onSelectComplete])

  // 부모 컴포넌트에서 전달받은 번호 처리
  useEffect(() => {
    if (drawnNumbers && drawnNumbers.length === 6) {
      setSelectedNumbers(drawnNumbers)
      setIsSaved(true)
      hasNotifiedRef.current = true

      // Scroll to the drawn numbers section and then show congratulation message
      setTimeout(() => {
        if (drawnNumbersSectionRef.current) {
          drawnNumbersSectionRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })

          // Show congratulation message after scrolling
          setTimeout(() => {
            setShowCongrats(true)
          }, 500)
        }
      }, 100)

      // 부모 컴포넌트에서 전달받은 번호는 이미 저장되었다고 가정
      lastSaveTimeRef.current = Date.now()
    }
  }, [drawnNumbers])

  return (
    <div className="w-full">
      <div className="mb-6">
        <Tabs defaultValue="select" onValueChange={(value) => setMode(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="select" className="flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>번호 선택</span>
            </TabsTrigger>
            <TabsTrigger value="fix" className="flex items-center gap-1">
              <Lock className="w-4 h-4" />
              <span>번호 고정</span>
            </TabsTrigger>
            <TabsTrigger value="exclude" className="flex items-center gap-1">
              <X className="w-4 h-4" />
              <span>번호 제외</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="select" className="mt-2">
            <p className="text-sm text-gray-600 mb-2">원하는 번호를 선택하세요. 최대 6개까지 선택할 수 있습니다.</p>
          </TabsContent>
          <TabsContent value="fix" className="mt-2">
            <p className="text-sm text-gray-600 mb-2">
              고정할 번호를 선택하세요. 고정된 번호는 항상 선택 결과에 포함됩니다.
            </p>
          </TabsContent>
          <TabsContent value="exclude" className="mt-2">
            <p className="text-sm text-gray-600 mb-2">
              제외할 번호를 선택하세요. 제외된 번호는 선택 결과에 포함되지 않습니다.
            </p>
          </TabsContent>
        </Tabs>

        <div className="w-full bg-gray-50 rounded-lg p-3 mt-4">
          {/* 상태 표시 영역 */}
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div className="bg-white rounded-md p-2 shadow-sm">
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Check className="w-3 h-3 text-blue-500" />
                <span>선택</span>
              </div>
              <div className="font-medium text-lg">
                {selectedNumbers.filter((n) => !fixedNumbers.includes(n)).length}/{6 - fixedNumbers.length}
              </div>
            </div>
            <div className="bg-white rounded-md p-2 shadow-sm">
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-green-500" />
                <span>고정</span>
              </div>
              <div className="font-medium text-lg text-green-600">{fixedNumbers.length}</div>
            </div>
            <div className="bg-white rounded-md p-2 shadow-sm">
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <X className="w-3 h-3 text-red-500" />
                <span>제외</span>
              </div>
              <div className="font-medium text-lg text-red-600">{excludedNumbers.length}</div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={resetAll} className="h-10 text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
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
              className="h-10 bg-blue-500 hover:bg-blue-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
              </svg>
              {fixedNumbers.length}개 + {6 - fixedNumbers.length}개 자동
            </Button>
          </div>
        </div>
      </div>

      {/* Number Grid */}
      <div className="mb-6">
        {/* 전체 번호 그리드 (1-45) */}
        <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 sm:gap-3 place-items-center">
          {Array.from({ length: 45 }, (_, i) => i + 1).map((number) => {
            const isSelected = selectedNumbers.includes(number)
            const isFixed = fixedNumbers.includes(number)
            const isExcluded = excludedNumbers.includes(number)

            // 동적 크기 계산
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
                className={`relative ${ballSize} rounded-full flex items-center justify-center font-medium text-sm sm:text-base transition-all ${getNumberClass(
                  number,
                )}`}
                style={{
                  backgroundColor: isSelected && !isFixed ? getBallColor(number) : "",
                }}
              >
                {number}

                {/* 상태 아이콘 표시 */}
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

      {/* Congratulatory Message */}
      {showCongrats && (
        <div className="w-full">
          <LottoCongratulation show={showCongrats} className="w-full max-w-none" />
        </div>
      )}

      {/* Selected Numbers Display - Separate Section */}
      {selectedNumbers.length > 0 && (
        <motion.div
          ref={drawnNumbersSectionRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 bg-gray-50 border border-gray-100 rounded-lg shadow-sm"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="w-24"></div> {/* Spacer for balance */}
            <h3 className="text-lg font-medium text-center">추첨 번호</h3>
            {selectedNumbers.length === 6 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-green-600 flex items-center w-24 justify-end"
              >
                <Check className="w-4 h-4 mr-1" />
                기록 저장됨
              </motion.div>
            ) : (
              <div className="w-24"></div> /* Spacer when no text */
            )}
          </div>
          <div className="flex flex-nowrap justify-center gap-2">
            {selectedNumbers
              .sort((a, b) => a - b)
              .map((number, index) => (
                <motion.div
                  key={number}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="relative flex-shrink-0"
                >
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-black font-bold text-sm sm:text-base"
                    style={{
                      backgroundColor: getBallColor(number),
                    }}
                  >
                    {number}
                    {fixedNumbers.includes(number) && (
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                        <Lock className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            {/* Empty slots for remaining numbers */}
            {Array.from({ length: 6 - selectedNumbers.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0"
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
