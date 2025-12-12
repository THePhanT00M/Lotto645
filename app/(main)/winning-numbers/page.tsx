"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Search, Trophy, Calendar, Hash, ListFilter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getBallColor } from "@/utils/lotto-utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { supabase } from "@/lib/supabaseClient"
import type { WinningLottoNumbers } from "@/types/lotto"

export default function WinningNumbersPage() {
  const [currentDrawIndex, setCurrentDrawIndex] = useState(0)
  const [visibleDraws, setVisibleDraws] = useState<WinningLottoNumbers[]>([])
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })
  const [searchValue, setSearchValue] = useState("")
  const [pendingScrollIndex, setPendingScrollIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [winningNumbers, setWinningNumbers] = useState<WinningLottoNumbers[]>([])

  const selectedDrawRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  // 데이터는 내림차순(최신순)으로 정렬되어 있다고 가정
  const currentDraw = winningNumbers[currentDrawIndex]

  useEffect(() => {
    const fetchWinningNumbers = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("winning_numbers")
          .select("*")
          .order("drawNo", { ascending: false }) // 최신 회차가 먼저 오도록

        if (error) {
          console.error("Error fetching winning numbers:", error)
          setWinningNumbers([])
        } else if (data) {
          setWinningNumbers(data as WinningLottoNumbers[])
        }
      } catch (err) {
        console.error("Unexpected error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWinningNumbers()
  }, [])

  useEffect(() => {
    if (winningNumbers.length > 0) {
      setCurrentDrawIndex(0)
      updateVisibleDraws(0, 0, 50)
    }
  }, [winningNumbers])

  // 선택된 회차로 스크롤 이동
  useEffect(() => {
    if (pendingScrollIndex !== null) {
      const scrollToSelectedDraw = () => {
        if (selectedDrawRef.current && scrollContainerRef.current) {
          if (isMobile) {
            const containerRect = scrollContainerRef.current.getBoundingClientRect()
            const selectedRect = selectedDrawRef.current.getBoundingClientRect()
            const relativeTop = selectedRect.top - containerRect.top
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollTop + relativeTop - 20
          } else {
            selectedDrawRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            })
          }
          setPendingScrollIndex(null)
        }
      }

      const delays = isMobile ? [300, 600, 900] : [100, 300]
      const timeouts = delays.map((delay) => setTimeout(scrollToSelectedDraw, delay))

      return () => timeouts.forEach((timeout) => clearTimeout(timeout))
    }
  }, [pendingScrollIndex, visibleDraws, isMobile])

  // 인덱스 변경 시 리스트 업데이트
  useEffect(() => {
    if (winningNumbers.length === 0) return

    if (currentDrawIndex < visibleRange.start || currentDrawIndex >= visibleRange.end) {
      const newStart = Math.max(0, currentDrawIndex - 25)
      const newEnd = Math.min(winningNumbers.length, newStart + 50)
      updateVisibleDraws(currentDrawIndex, newStart, newEnd)
    }
    setPendingScrollIndex(currentDrawIndex)
  }, [currentDrawIndex, winningNumbers.length])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const scrollPosition = scrollTop + clientHeight

    if (scrollPosition > scrollHeight - 200 && visibleRange.end < winningNumbers.length) {
      const newEnd = Math.min(winningNumbers.length, visibleRange.end + 20)
      updateVisibleDraws(currentDrawIndex, visibleRange.start, newEnd)
    }

    if (scrollTop < 200 && visibleRange.start > 0) {
      const newStart = Math.max(0, visibleRange.start - 20)
      updateVisibleDraws(currentDrawIndex, newStart, visibleRange.end)
    }
  }

  const updateVisibleDraws = (currentIdx: number, start: number, end: number) => {
    let newStart = start
    let newEnd = end

    if (currentIdx < start) {
      newStart = Math.max(0, currentIdx - 10)
    } else if (currentIdx >= end) {
      newEnd = Math.min(winningNumbers.length, currentIdx + 10)
    }

    setVisibleRange({ start: newStart, end: newEnd })
    setVisibleDraws(winningNumbers.slice(newStart, newEnd))
  }

  const goToPreviousDraw = () => {
    if (currentDrawIndex < winningNumbers.length - 1) {
      setCurrentDrawIndex(currentDrawIndex + 1)
    }
  }

  const goToNextDraw = () => {
    if (currentDrawIndex > 0) {
      setCurrentDrawIndex(currentDrawIndex - 1)
    }
  }

  const jumpToDraw = (drawNo: number) => {
    const index = winningNumbers.findIndex((draw) => draw.drawNo === drawNo)
    if (index !== -1) {
      setCurrentDrawIndex(index)
    }
  }

  const handleQuickNavigation = (startIdx: number) => {
    setCurrentDrawIndex(startIdx)
    const newStart = Math.max(0, startIdx - 25)
    const newEnd = Math.min(winningNumbers.length, newStart + 50)
    updateVisibleDraws(startIdx, newStart, newEnd)
    setPendingScrollIndex(startIdx)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "")
    setSearchValue(value)
  }

  const handleSearch = () => {
    const drawNo = Number.parseInt(searchValue)
    if (!isNaN(drawNo) && drawNo > 0) {
      jumpToDraw(drawNo)
      setSearchValue("")
    }
  }

  // --- 로딩 스켈레톤 뷰 ---
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6 animate-pulse">
        {/* 헤더 스켈레톤 */}
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-8 w-48 bg-gray-200 dark:bg-[#272727]" />
          <Skeleton className="h-5 w-64 bg-gray-200 dark:bg-[#272727]" />
        </div>

        {/* 메인 카드 스켈레톤 */}
        <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-6 border border-[#e5e5e5] dark:border-[#3f3f3f]">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-9 w-24 bg-gray-200 dark:bg-[#272727] rounded-md" />
            <div className="flex flex-col items-center gap-1">
              <Skeleton className="h-8 w-32 bg-gray-200 dark:bg-[#272727]" />
              <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-[#272727]" />
            </div>
            <Skeleton className="h-9 w-24 bg-gray-200 dark:bg-[#272727] rounded-md" />
          </div>
          <div className="flex justify-center gap-2 sm:gap-4 py-4">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gray-200 dark:bg-[#272727]" />
            ))}
          </div>
        </div>

        {/* 하단 그리드 스켈레톤 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
              <Skeleton className="h-5 w-24 mb-3 bg-gray-200 dark:bg-[#272727]" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1 bg-gray-200 dark:bg-[#272727] rounded-lg" />
                <Skeleton className="h-10 w-16 bg-gray-200 dark:bg-[#272727] rounded-md" />
              </div>
            </div>
            <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
              <Skeleton className="h-5 w-24 mb-3 bg-gray-200 dark:bg-[#272727]" />
              <div className="grid grid-cols-3 gap-2">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="h-8 bg-gray-200 dark:bg-[#272727] rounded-md" />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f] h-[600px] flex flex-col">
              <div className="p-4 border-b border-[#e5e5e5] dark:border-[#3f3f3f] flex justify-between items-center">
                <Skeleton className="h-6 w-32 bg-gray-200 dark:bg-[#272727]" />
                <Skeleton className="h-6 w-16 bg-gray-200 dark:bg-[#272727] rounded-md" />
              </div>
              <div className="p-2 space-y-2 flex-1 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-3 flex items-center justify-between gap-3 border border-transparent">
                    <div className="space-y-1">
                      <Skeleton className="h-6 w-16 bg-gray-200 dark:bg-[#272727]" />
                      <Skeleton className="h-3 w-24 bg-gray-200 dark:bg-[#272727]" />
                    </div>
                    <div className="flex gap-1.5">
                      {[...Array(7)].map((_, j) => (
                        <Skeleton key={j} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#272727]" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
          <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          역대 당첨번호
        </h1>
        <p className="text-[#606060] dark:text-[#aaaaaa] text-sm">
          역대 로또 당첨 번호를 확인하고 분석해보세요.
        </p>
      </div>

      {/* 메인 당첨 번호 카드 (슬라이더) */}
      <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 sm:p-8 border border-[#e5e5e5] dark:border-[#3f3f3f] shadow-sm relative overflow-hidden">
        {/* 장식용 배경 요소 */}
        <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none">
          <Trophy className="w-32 h-32" />
        </div>

        {currentDraw && (
          <div className="relative z-10">
            {/* 네비게이션 및 회차 정보 */}
            <div className="flex justify-between items-center mb-8">
              <Button
                variant="outline"
                onClick={goToPreviousDraw}
                disabled={currentDrawIndex >= winningNumbers.length - 1}
                // [수정] hover:text-[#0f0f0f] 및 dark:hover:text-[#f1f1f1] 추가하여 호버 시 텍스트 색상 고정
                className="bg-white dark:bg-[#272727] border-[#e5e5e5] dark:border-[#3f3f3f] hover:bg-gray-100 hover:text-[#0f0f0f] dark:hover:bg-[#333] dark:hover:text-[#f1f1f1] text-[#0f0f0f] dark:text-[#f1f1f1] h-10 px-3 sm:px-4"
              >
                <ChevronLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">이전 회차</span>
              </Button>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] tracking-tight">
                    {currentDraw.drawNo}회
                  </span>
                </div>
                <div className="flex items-center text-sm text-[#606060] dark:text-[#aaaaaa] bg-white dark:bg-[#272727] px-3 py-1 rounded-full border border-[#e5e5e5] dark:border-[#3f3f3f]">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  {currentDraw.date}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={goToNextDraw}
                disabled={currentDrawIndex <= 0}
                // [수정] hover:text-[#0f0f0f] 및 dark:hover:text-[#f1f1f1] 추가하여 호버 시 텍스트 색상 고정
                className="bg-white dark:bg-[#272727] border-[#e5e5e5] dark:border-[#3f3f3f] hover:bg-gray-100 hover:text-[#0f0f0f] dark:hover:bg-[#333] dark:hover:text-[#f1f1f1] text-[#0f0f0f] dark:text-[#f1f1f1] h-10 px-3 sm:px-4"
              >
                <span className="hidden sm:inline">다음 회차</span>
                <ChevronRight className="w-4 h-4 sm:ml-2" />
              </Button>
            </div>

            {/* 번호 볼 표시 */}
            <div className="flex flex-col items-center">
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 max-w-2xl">
                {currentDraw.numbers.map((number) => (
                  <div
                    key={number}
                    className="w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-black font-bold text-sm sm:text-xl shadow-md transform transition-transform hover:scale-110 duration-200"
                    style={{ backgroundColor: getBallColor(number) }}
                  >
                    {number}
                  </div>
                ))}
                <div className="flex items-center justify-center w-6 sm:w-10">
                  <span className="text-[#606060] dark:text-[#aaaaaa] text-xl sm:text-2xl font-light">+</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-black font-bold text-sm sm:text-xl shadow-md relative"
                    style={{ backgroundColor: getBallColor(currentDraw.bonusNo) }}
                  >
                    {currentDraw.bonusNo}
                    <div className="absolute -top-1 -right-1 sm:top-0 sm:right-0 bg-[#0f0f0f] dark:bg-[#f1f1f1] text-white dark:text-black text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter border border-white dark:border-black">
                      Bonus
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 검색 및 빠른 이동 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 검색 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
            <h3 className="font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] mb-3 flex items-center gap-2">
              <Search className="w-4 h-4" /> 회차 검색
            </h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="예: 1000"
                  className="w-full h-10 pl-9 pr-3 bg-white dark:bg-[#272727] border border-[#d1d1d1] dark:border-[#3f3f3f] rounded-lg text-sm text-[#0f0f0f] dark:text-[#f1f1f1] placeholder-[#a0a0a0] dark:placeholder-[#606060] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={searchValue}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#a0a0a0] dark:text-[#606060]" />
              </div>
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white h-10">
                검색
              </Button>
            </div>
          </div>

          <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
            <h3 className="font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] mb-3 flex items-center gap-2">
              <ListFilter className="w-4 h-4" /> 빠른 이동
            </h3>
            {/* [유지] grid-cols-3 사용 및 truncate 제거로 버튼 텍스트 잘림 방지 */}
            <div className="grid grid-cols-3 gap-2">
              {[...Array(8)].map((_, idx) => {
                const pageNum = idx + 1
                const startIdx = (pageNum - 1) * 100
                const endIdx = Math.min(startIdx + 99, winningNumbers.length - 1)
                if (startIdx >= winningNumbers.length) return null

                const rangeLabel = `${winningNumbers[startIdx]?.drawNo || "?"}~${winningNumbers[endIdx]?.drawNo || "?"}`

                return (
                  <button
                    key={idx}
                    onClick={() => handleQuickNavigation(startIdx)}
                    className="px-1 py-2 text-xs font-medium text-[#606060] dark:text-[#aaaaaa] bg-white dark:bg-[#272727] border border-[#e5e5e5] dark:border-[#3f3f3f] rounded hover:bg-blue-50 dark:hover:bg-[#333] hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                  >
                    {rangeLabel}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 리스트 */}
        <div className="lg:col-span-2">
          <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f] flex flex-col h-full max-h-[600px]">
            <div className="p-4 border-b border-[#e5e5e5] dark:border-[#3f3f3f] flex justify-between items-center">
              <h3 className="font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">전체 당첨번호 목록</h3>
              <span className="text-xs text-[#606060] dark:text-[#aaaaaa] bg-white dark:bg-[#272727] px-2 py-1 rounded border border-[#e5e5e5] dark:border-[#3f3f3f]">
                총 {winningNumbers.length}회
              </span>
            </div>

            <div
              className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar"
              ref={scrollContainerRef}
              onScroll={handleScroll}
            >
              {visibleDraws.map((draw, idx) => {
                const actualIdx = idx + visibleRange.start
                const isSelected = actualIdx === currentDrawIndex

                return (
                  <div
                    key={draw.drawNo}
                    ref={isSelected ? selectedDrawRef : null}
                    onClick={() => setCurrentDrawIndex(actualIdx)}
                    className={`group p-3 rounded-lg border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-blue-50 dark:bg-[#1e2a3b] border-blue-200 dark:border-blue-800 ring-1 ring-blue-500/20"
                        : "bg-white dark:bg-[#272727] border-[#e5e5e5] dark:border-[#3f3f3f] hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <div className="flex items-center justify-between sm:justify-start gap-4 min-w-[140px]">
                      <div className="flex flex-col">
                        <span className={`text-lg font-bold ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-[#0f0f0f] dark:text-[#f1f1f1]"}`}>
                          {draw.drawNo}회
                        </span>
                        <span className="text-xs text-[#606060] dark:text-[#aaaaaa]">{draw.date}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {draw.numbers.map((num: number) => (
                        <div
                          key={num}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold text-xs shadow-sm"
                          style={{ backgroundColor: getBallColor(num) }}
                        >
                          {num}
                        </div>
                      ))}
                      <span className="text-[#a0a0a0] dark:text-[#606060] mx-1 text-lg font-light">+</span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold text-xs shadow-sm"
                        style={{ backgroundColor: getBallColor(draw.bonusNo) }}
                      >
                        {draw.bonusNo}
                      </div>
                    </div>
                  </div>
                )
              })}

              {visibleRange.end < winningNumbers.length && (
                <div className="py-4 text-center text-[#606060] dark:text-[#aaaaaa] text-sm animate-pulse">
                  아래로 스크롤하여 더 보기...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}