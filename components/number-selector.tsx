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
}

export default function NumberSelector({ onSelectComplete, onReset, drawnNumbers }: NumberSelectorProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [mode, setMode] = useState<"select" | "exclude" | "fix">("select")
  const [excludedNumbers, setExcludedNumbers] = useState<number[]>([])
  const [fixedNumbers, setFixedNumbers] = useState<number[]>([])
  const [isSaved, setIsSaved] = useState(false)
  const [showCongrats, setShowCongrats] = useState(false)
  const [targetDrawNo, setTargetDrawNo] = useState<number | undefined>(undefined)

  const hasNotifiedRef = useRef(false)
  const lastSaveTimeRef = useRef(0)
  const drawnNumbersSectionRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()

  useEffect(() => {
    hasNotifiedRef.current = false
    lastSaveTimeRef.current = 0
  }, [])

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
          setTargetDrawNo(data.drawNo + 1)
        }
      } catch (e) {
        console.error("Failed to fetch latest draw number:", e)
      }
    }
    fetchTargetDrawNo()
  }, [])

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

  const toggleNumber = (number: number) => {
    if (mode === "select") {
      if (selectedNumbers.includes(number)) {
        if (!fixedNumbers.includes(number)) {
          setSelectedNumbers(selectedNumbers.filter((n) => n !== number))
          hasNotifiedRef.current = false
          setIsSaved(false)
          lastSaveTimeRef.current = 0
          if (selectedNumbers.length === 6) onReset()
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
      } else if (!fixedNumbers.includes(number)) {
        setExcludedNumbers([...excludedNumbers, number])
        if (selectedNumbers.includes(number)) {
          setSelectedNumbers(selectedNumbers.filter((n) => n !== number))
          hasNotifiedRef.current = false
          setIsSaved(false)
          lastSaveTimeRef.current = 0
          if (selectedNumbers.length === 6) onReset()
        }
      }
    } else if (mode === "fix") {
      if (fixedNumbers.includes(number)) {
        setFixedNumbers(fixedNumbers.filter((n) => n !== number))
        setSelectedNumbers(selectedNumbers.filter((n) => n !== number))
        hasNotifiedRef.current = false
        setIsSaved(false)
        lastSaveTimeRef.current = 0
        if (selectedNumbers.length === 6) onReset()
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
    if (fixedNumbers.includes(number)) return "bg-green-200 dark:bg-green-900/50"
    if (excludedNumbers.includes(number)) return "bg-red-200 dark:bg-red-900/50"
    if (selectedNumbers.includes(number)) return "text-white dark:text-black"
    return "bg-white dark:bg-[rgb(38,38,38)] hover:bg-gray-200 dark:hover:bg-[rgb(100,100,100)]"
  }

  // 번호 선택 완료 시 자동 저장 로직
  useEffect(() => {
    if (selectedNumbers.length === 6 && !isSaved) {
      const sortedNumbers = [...selectedNumbers].sort((a, b) => a - b)

      if (!hasNotifiedRef.current) {
        onSelectComplete(sortedNumbers)
        hasNotifiedRef.current = true

        const currentTime = Date.now()
        if (currentTime - lastSaveTimeRef.current > 5000) {

          const processStorage = async () => {
            // 1. 세션 확인
            const { data: { session } } = await supabase.auth.getSession();
            const isLoggedIn = !!session;

            // 2. 미로그인 시에만 로컬 스토리지 저장
            if (!isLoggedIn) {
              saveLottoResult(sortedNumbers, false, targetDrawNo);
            }

            // 3. 서버 DB 로깅 (회원/비회원 공통 호출)
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
                  userId: session?.user?.id || null // 로그인 시 ID, 미로그인 시 null 전달
                }),
              });

              toast({
                title: isLoggedIn ? "계정 저장 완료" : "저장 완료",
                description: `${targetDrawNo ? targetDrawNo + "회차 " : ""}번호가 기록되었습니다.`,
              });

              lastSaveTimeRef.current = currentTime;
            } catch (err) {
              console.error("Server logging failed:", err);
            }
          };

          processStorage();
        }
      }

      setIsSaved(true)
      setTimeout(() => {
        if (drawnNumbersSectionRef.current) {
          drawnNumbersSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
          setTimeout(() => setShowCongrats(true), 500)
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
          drawnNumbersSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
          setTimeout(() => setShowCongrats(true), 500)
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
              <TabsTrigger value="select" className="flex items-center gap-1 rounded-sm data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 dark:text-[rgb(163,163,163)] data-[state=active]:dark:bg-black data-[state=active]:dark:text-white">
                <Check className="w-4 h-4" /><span>번호 선택</span>
              </TabsTrigger>
              <TabsTrigger value="fix" className="flex items-center gap-1 rounded-sm data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 dark:text-[rgb(163,163,163)] data-[state=active]:dark:bg-black data-[state=active]:dark:text-white">
                <Lock className="w-4 h-4" /><span>번호 고정</span>
              </TabsTrigger>
              <TabsTrigger value="exclude" className="flex items-center gap-1 rounded-sm data-[state=active]:bg-white data-[state=active]:text-black text-gray-500 dark:text-[rgb(163,163,163)] data-[state=active]:dark:bg-black data-[state=active]:dark:text-white">
                <X className="w-4 h-4" /><span>번호 제외</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="select" className="mt-2"><p className="text-sm text-gray-600 dark:text-gray-400 mb-2">최대 6개까지 선택 가능합니다.</p></TabsContent>
            <TabsContent value="fix" className="mt-2"><p className="text-sm text-gray-600 dark:text-gray-400 mb-2">항상 포함할 번호를 고정하세요.</p></TabsContent>
            <TabsContent value="exclude" className="mt-2"><p className="text-sm text-gray-600 dark:text-gray-400 mb-2">추첨에서 제외할 번호를 선택하세요.</p></TabsContent>
          </Tabs>

          <div className="w-full bg-gray-200 dark:bg-[#262626] rounded-lg p-2 mt-4">
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="bg-white dark:bg-black rounded-md p-2">
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1"><Check className="w-3 h-3 text-blue-500" /><span>선택</span></div>
                <div className="font-medium text-lg dark:text-white">{selectedNumbers.filter((n) => !fixedNumbers.includes(n)).length}/{6 - fixedNumbers.length}</div>
              </div>
              <div className="bg-white dark:bg-black rounded-md p-2">
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1"><Lock className="w-3 h-3 text-green-500" /><span>고정</span></div>
                <div className="font-medium text-lg text-green-600">{fixedNumbers.length}</div>
              </div>
              <div className="bg-white dark:bg-black rounded-md p-2">
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1"><X className="w-3 h-3 text-red-500" /><span>제외</span></div>
                <div className="font-medium text-lg text-red-600">{excludedNumbers.length}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={resetAll} className="h-10 text-gray-600 dark:text-gray-100 bg-gray-50 dark:bg-transparent border-gray-200 dark:border-[rgb(68,68,68)] hover:bg-gray-100">초기화</Button>
              <Button onClick={() => generateRandomNumbers(6 - fixedNumbers.length)} disabled={fixedNumbers.length >= 6} className="h-10 text-white bg-blue-600 hover:bg-blue-700">자동 생성</Button>
            </div>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 sm:gap-3 place-items-center">
            {Array.from({ length: 45 }, (_, i) => i + 1).map((number) => {
              const isSelected = selectedNumbers.includes(number)
              const isFixed = fixedNumbers.includes(number)
              const isExcluded = excludedNumbers.includes(number)
              return (
                  <button
                      key={number}
                      onClick={() => toggleNumber(number)}
                      disabled={(mode === "select" && selectedNumbers.length >= 6 && !isSelected) || (mode === "fix" && fixedNumbers.length >= 6 && !isFixed) || (mode === "exclude" && isFixed) || (mode === "fix" && isExcluded)}
                      className={`relative w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all ${getNumberClass(number)}`}
                      style={{ backgroundColor: isSelected && !isFixed ? getBallColor(number) : "" }}
                  >
                    {number}
                    {isFixed && <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center"><Lock className="w-2.5 h-2.5 text-white" /></div>}
                    {isExcluded && <div className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center"><X className="w-2.5 h-2.5 text-white" /></div>}
                    {isSelected && !isFixed && <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full w-4 h-4 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
                  </button>
              )
            })}
          </div>
        </div>

        {showCongrats && <LottoCongratulation show={showCongrats} className="w-full max-w-none" />}
        <LottoNumberDisplay ref={drawnNumbersSectionRef} numbers={selectedNumbers} fixedNumbers={fixedNumbers} isSaved={isSaved} className="mt-6" />
      </div>
  )
}