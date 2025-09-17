"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getBallColor } from "@/utils/lotto-utils"
import { useMobile } from "@/hooks/use-mobile"
import { winningNumbers } from "@/data/winning-numbers"

export default function WinningNumbersPage() {
  const [currentDrawIndex, setCurrentDrawIndex] = useState(0)
  const [visibleDraws, setVisibleDraws] = useState<any[]>([])
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })
  const [searchValue, setSearchValue] = useState("")
  const [pendingScrollIndex, setPendingScrollIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const selectedDrawRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()

  // Get reversed winning numbers for display (newest first)
  const reversedWinningNumbers = [...winningNumbers].reverse()
  const currentDraw = reversedWinningNumbers[currentDrawIndex]

  useEffect(() => {
    // Initialize data
    setCurrentDrawIndex(0)
    updateVisibleDraws(0, 0, 50)
    setIsLoading(false)
  }, [])

  // Handle pending scroll after visible draws update
  useEffect(() => {
    if (pendingScrollIndex !== null) {
      // Use multiple timeouts with increasing delays to ensure scrolling works
      const scrollToSelectedDraw = () => {
        if (selectedDrawRef.current && scrollContainerRef.current) {
          // On mobile, scroll the container instead of using scrollIntoView
          if (isMobile) {
            // Calculate the position to scroll to
            const containerRect = scrollContainerRef.current.getBoundingClientRect()
            const selectedRect = selectedDrawRef.current.getBoundingClientRect()
            const relativeTop = selectedRect.top - containerRect.top

            // Scroll the container to position the selected item at the top with some padding
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollTop + relativeTop - 20
          } else {
            // On desktop, use scrollIntoView
            selectedDrawRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            })
          }

          // Clear the pending scroll
          setPendingScrollIndex(null)
        }
      }

      // Try scrolling after different delays to ensure it works
      // Use longer delays on mobile
      const delays = isMobile ? [300, 600, 900] : [100, 300, 500]
      const timeouts = delays.map((delay) => setTimeout(scrollToSelectedDraw, delay))

      return () => {
        // Clean up timeouts
        timeouts.forEach((timeout) => clearTimeout(timeout))
      }
    }
  }, [pendingScrollIndex, visibleDraws, isMobile])

  // Update visible draws when currentDrawIndex changes
  useEffect(() => {
    // Ensure the selected draw is in the visible range
    if (currentDrawIndex < visibleRange.start || currentDrawIndex >= visibleRange.end) {
      // Calculate new visible range centered around the current draw
      const newStart = Math.max(0, currentDrawIndex - 25)
      const newEnd = Math.min(reversedWinningNumbers.length, newStart + 50)
      updateVisibleDraws(currentDrawIndex, newStart, newEnd)
    }

    // Set pending scroll to ensure we scroll after render
    setPendingScrollIndex(currentDrawIndex)
  }, [currentDrawIndex])

  // Handle scroll events to load more draws
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const scrollPosition = scrollTop + clientHeight

    // Load more draws when scrolling down
    if (scrollPosition > scrollHeight - 200 && visibleRange.end < reversedWinningNumbers.length) {
      const newEnd = Math.min(reversedWinningNumbers.length, visibleRange.end + 20)
      updateVisibleDraws(currentDrawIndex, visibleRange.start, newEnd)
    }

    // Load more draws when scrolling up
    if (scrollTop < 200 && visibleRange.start > 0) {
      const newStart = Math.max(0, visibleRange.start - 20)
      updateVisibleDraws(currentDrawIndex, newStart, visibleRange.end)
    }
  }

  // Update visible draws
  const updateVisibleDraws = (currentIdx: number, start: number, end: number) => {
    // Ensure current draw is visible
    let newStart = start
    let newEnd = end

    if (currentIdx < start) {
      newStart = Math.max(0, currentIdx - 10)
    } else if (currentIdx >= end) {
      newEnd = Math.min(reversedWinningNumbers.length, currentIdx + 10)
    }

    // Update visible range
    setVisibleRange({ start: newStart, end: newEnd })

    // Update visible draws
    setVisibleDraws(reversedWinningNumbers.slice(newStart, newEnd))
  }

  // Handle navigation
  const goToPreviousDraw = () => {
    if (currentDrawIndex < reversedWinningNumbers.length - 1) {
      setCurrentDrawIndex(currentDrawIndex + 1)
    }
  }

  const goToNextDraw = () => {
    if (currentDrawIndex > 0) {
      setCurrentDrawIndex(currentDrawIndex - 1)
    }
  }

  // Jump to specific draw
  const jumpToDraw = (drawNo: number) => {
    const index = reversedWinningNumbers.findIndex((draw) => draw.drawNo === drawNo)
    if (index !== -1) {
      setCurrentDrawIndex(index)
    }
  }

  // Handle quick navigation
  const handleQuickNavigation = (startIdx: number) => {
    setCurrentDrawIndex(startIdx)
    // Force a refresh of visible draws
    const newStart = Math.max(0, startIdx - 25)
    const newEnd = Math.min(reversedWinningNumbers.length, newStart + 50)
    updateVisibleDraws(startIdx, newStart, newEnd)
    // Set pending scroll
    setPendingScrollIndex(startIdx)
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, "")
    setSearchValue(value)
  }

  // Handle search
  const handleSearch = () => {
    const drawNo = Number.parseInt(searchValue)
    if (!isNaN(drawNo) && drawNo > 0) {
      jumpToDraw(drawNo)
      setSearchValue("")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">당첨번호를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">역대 당첨번호</h1>
        </div>
      </div>

      {/* Historical Winning Numbers Slider */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {currentDraw && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousDraw}
                disabled={currentDrawIndex >= reversedWinningNumbers.length - 1}
                className="px-2 py-1 h-8"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                이전 회차
              </Button>
              <div className="text-center">
                <div className="font-medium text-lg">{currentDraw.drawNo}회</div>
                <div className="text-sm text-gray-500">{currentDraw.date}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextDraw}
                disabled={currentDrawIndex <= 0}
                className="px-2 py-1 h-8 bg-transparent"
              >
                다음 회차
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="flex items-center justify-center mb-4 py-2">
              <div className="grid grid-cols-8 gap-1 xs:gap-2 sm:gap-3 md:gap-4 w-full max-w-md">
                {currentDraw.numbers.map((number: number) => (
                  <div
                    key={number}
                    className="w-full aspect-square rounded-full flex items-center justify-center text-black font-bold text-xs xs:text-sm sm:text-base shadow-md"
                    style={{ backgroundColor: getBallColor(number) }}
                  >
                    {number}
                  </div>
                ))}
                <div className="flex items-center justify-center">
                  <span className="text-gray-500 text-sm xs:text-base md:text-lg font-medium">+</span>
                </div>
                <div
                  className="w-full aspect-square rounded-full flex items-center justify-center text-black font-bold text-xs xs:text-sm sm:text-base shadow-md relative"
                  style={{ backgroundColor: getBallColor(currentDraw.bonusNo) }}
                >
                  {currentDraw.bonusNo}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">빠른 이동</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1 text-center">
            {[...Array(10)].map((_, idx) => {
              const pageNum = idx + 1
              const startIdx = (pageNum - 1) * 100
              const endIdx = Math.min(startIdx + 99, reversedWinningNumbers.length - 1)

              if (startIdx >= reversedWinningNumbers.length) return null

              return (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] xs:text-xs px-1 sm:px-2 bg-transparent"
                  onClick={() => handleQuickNavigation(startIdx)}
                >
                  <span className="block truncate">
                    {reversedWinningNumbers[startIdx]?.drawNo || "?"}&nbsp;-&nbsp;
                    {reversedWinningNumbers[endIdx]?.drawNo || "?"}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Search for specific draw */}
        <div className="mt-4 mb-4 flex items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="회차 번호 입력"
              className="w-full h-9 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchValue}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch()
                }
              }}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <Button variant="outline" size="sm" className="ml-2 whitespace-nowrap bg-transparent" onClick={handleSearch}>
            회차 검색
          </Button>
        </div>

        {/* All Draws List (Scrollable) */}
        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">전체 당첨번호 목록</h3>
          <div
            className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            <div className="space-y-2">
              {visibleDraws.map((draw, idx) => {
                const actualIdx = idx + visibleRange.start
                return (
                  <div
                    key={draw.drawNo}
                    ref={actualIdx === currentDrawIndex ? selectedDrawRef : null}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      actualIdx === currentDrawIndex
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => setCurrentDrawIndex(actualIdx)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">{draw.drawNo}회</div>
                      <div className="text-sm text-gray-500">{draw.date}</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {draw.numbers.map((number: number) => (
                        <div
                          key={number}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-black font-bold text-xs shadow-sm"
                          style={{ backgroundColor: getBallColor(number) }}
                        >
                          {number}
                        </div>
                      ))}
                      <div className="flex items-center">
                        <span className="text-gray-500 mx-0.5">+</span>
                      </div>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-black font-bold text-xs shadow-sm"
                        style={{ backgroundColor: getBallColor(draw.bonusNo) }}
                      >
                        {draw.bonusNo}
                      </div>
                    </div>
                  </div>
                )
              })}
              {visibleRange.end < reversedWinningNumbers.length && (
                <div className="py-4 text-center text-gray-500 text-sm">스크롤하여 더 많은 당첨번호 보기</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-white rounded-xl p-4 text-sm text-gray-500 mt-8">
        <p>
          * 이 데이터는 실제 로또 당첨번호를 기반으로 합니다. 정확한 당첨번호는 공식 로또 사이트에서 확인하시기
          바랍니다.
        </p>
        <p className="mt-1">
          * 로또 번호는 매 회차마다 무작위로 추첨되며, 과거의 당첨번호가 미래 당첨 확률에 영향을 미치지 않습니다.
        </p>
      </div>
    </div>
  )
}
