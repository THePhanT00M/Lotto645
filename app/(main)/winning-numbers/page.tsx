"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react"
import { ChevronLeft, ChevronRight, Search, Trophy, Calendar, Hash, ListFilter, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getBallColor } from "@/utils/lotto-utils"
import { supabase } from "@/lib/supabaseClient"
import type { WinningLottoNumbers } from "@/types/lotto"
import { useIsMobile } from "@/hooks/use-mobile"

const ITEMS_PER_PAGE = 20

export default function WinningNumbersPage() {
  // --- 상태 관리 ---
  const [latestDrawNo, setLatestDrawNo] = useState<number>(0)
  const [draws, setDraws] = useState<WinningLottoNumbers[]>([])

  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [isLoadingNewer, setIsLoadingNewer] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const [hasMoreOlder, setHasMoreOlder] = useState(true)
  const [hasMoreNewer, setHasMoreNewer] = useState(false)

  const [searchValue, setSearchValue] = useState("")
  const [currentDraw, setCurrentDraw] = useState<WinningLottoNumbers | null>(null)

  // [수정] 스크롤 대상 회차 상태 추가
  const [targetScrollNo, setTargetScrollNo] = useState<number | null>(null)

  // --- Refs ---
  const listContainerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const topTriggerRef = useRef<HTMLDivElement>(null)
  const bottomTriggerRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef<number>(0)
  const prevScrollTopRef = useRef<number>(0)
  const isPrependActionRef = useRef(false)

  // --- 1. 초기 로드 ---
  useEffect(() => {
    const fetchLatestInfo = async () => {
      try {
        const { data } = await supabase
          .from("winning_numbers")
          .select("*")
          .order("drawNo", { ascending: false })
          .limit(1)
          .single()

        if (data) {
          setLatestDrawNo(data.drawNo)
          setCurrentDraw(data as WinningLottoNumbers)
          await fetchDraws(data.drawNo, "initial")
        }
      } catch (err) {
        console.error("Failed to fetch latest info:", err)
      } finally {
        setIsInitialLoading(false)
      }
    }
    fetchLatestInfo()
  }, [])

  // --- 2. 데이터 가져오기 ---
  const fetchDraws = useCallback(async (baseDrawNo: number, mode: "initial" | "older" | "newer") => {
    if (mode === "older") setIsLoadingOlder(true)
    if (mode === "newer") setIsLoadingNewer(true)
    if (mode === "initial") setIsLoadingOlder(true)

    try {
      let query = supabase.from("winning_numbers").select("*")

      if (mode === "newer") {
        query = query
          .gt("drawNo", baseDrawNo)
          .order("drawNo", { ascending: true })
          .limit(ITEMS_PER_PAGE)
      } else {
        query = query
          .lte("drawNo", baseDrawNo)
          .order("drawNo", { ascending: false })
          .limit(ITEMS_PER_PAGE)
      }

      const { data, error } = await query
      if (error) throw error

      if (data) {
        const fetchedDraws = data as WinningLottoNumbers[]

        if (mode === "initial") {
          setDraws(fetchedDraws)
          setHasMoreOlder(fetchedDraws.length === ITEMS_PER_PAGE)
          setHasMoreNewer(fetchedDraws.length > 0 && fetchedDraws[0].drawNo < latestDrawNo)
        } else if (mode === "newer") {
          const sortedNewer = fetchedDraws.sort((a, b) => b.drawNo - a.drawNo)
          if (sortedNewer.length > 0) {
            isPrependActionRef.current = true
            if (listContainerRef.current) {
              prevScrollHeightRef.current = listContainerRef.current.scrollHeight
              prevScrollTopRef.current = listContainerRef.current.scrollTop
            }
            setDraws(prev => {
              const existingIds = new Set(prev.map(d => d.drawNo))
              const filtered = sortedNewer.filter(d => !existingIds.has(d.drawNo))
              return [...filtered, ...prev]
            })
          }
          if (fetchedDraws.length < ITEMS_PER_PAGE) setHasMoreNewer(false)
        } else if (mode === "older") {
          setDraws(prev => {
            const existingIds = new Set(prev.map(d => d.drawNo))
            const filtered = fetchedDraws.filter(d => !existingIds.has(d.drawNo))
            return [...prev, ...filtered]
          })
          if (fetchedDraws.length < ITEMS_PER_PAGE) setHasMoreOlder(false)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingOlder(false)
      setIsLoadingNewer(false)
    }
  }, [latestDrawNo])

  // --- 3. 스크롤 위치 보정 ---
  useLayoutEffect(() => {
    if (isPrependActionRef.current && listContainerRef.current) {
      const currentScrollHeight = listContainerRef.current.scrollHeight
      const heightDifference = currentScrollHeight - prevScrollHeightRef.current
      listContainerRef.current.scrollTop = prevScrollTopRef.current + heightDifference
      isPrependActionRef.current = false
    }
  }, [draws])

  // --- [수정] 3-1. 점프 시 타겟 회차 중앙 정렬 (즉시) ---
  useLayoutEffect(() => {
    if (targetScrollNo !== null) {
      const element = itemRefs.current.get(targetScrollNo)
      if (element) {
        // 'auto' behavior는 브라우저 기본 동작으로 즉시 이동합니다.
        element.scrollIntoView({ block: "center", behavior: "auto" })
        setTargetScrollNo(null) // 이동 후 상태 초기화
      }
    }
  }, [draws, targetScrollNo])

  // --- 4. 무한 스크롤 옵저버 ---
  useEffect(() => {
    const container = listContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        if (entry.target === topTriggerRef.current && !isLoadingNewer && hasMoreNewer && draws.length > 0) {
          fetchDraws(draws[0].drawNo, "newer")
        }
        if (entry.target === bottomTriggerRef.current && !isLoadingOlder && hasMoreOlder && draws.length > 0) {
          fetchDraws(draws[draws.length - 1].drawNo - 1, "older")
        }
      })
    }, { root: container, threshold: 0.1, rootMargin: "50px" })

    if (topTriggerRef.current) observer.observe(topTriggerRef.current)
    if (bottomTriggerRef.current) observer.observe(bottomTriggerRef.current)

    return () => observer.disconnect()
  }, [draws, hasMoreOlder, hasMoreNewer, isLoadingOlder, isLoadingNewer, fetchDraws])

  // --- 5. 네비게이션 및 검색 ---
  const jumpToDraw = async (targetNo: number) => {
    if (targetNo < 1 || targetNo > latestDrawNo) {
      alert("존재하지 않는 회차입니다.")
      return
    }
    const offset = Math.floor(ITEMS_PER_PAGE / 2)
    const startCursor = Math.min(latestDrawNo, targetNo + offset)

    setIsLoadingOlder(true)
    setDraws([]) // 리스트 초기화

    try {
      const { data } = await supabase
        .from("winning_numbers")
        .select("*")
        .lte("drawNo", startCursor)
        .order("drawNo", { ascending: false })
        .limit(ITEMS_PER_PAGE)

      if (data) {
        const newDraws = data as WinningLottoNumbers[]
        setDraws(newDraws)
        setHasMoreNewer(startCursor < latestDrawNo)
        const minDraw = Math.min(...newDraws.map(d => d.drawNo))
        setHasMoreOlder(minDraw > 1)

        const targetDrawData = newDraws.find(d => d.drawNo === targetNo)
        if (targetDrawData) {
          setCurrentDraw(targetDrawData)
          // [수정] 스크롤 애니메이션 함수 대신 상태 설정 -> useLayoutEffect에서 즉시 처리
          setTargetScrollNo(targetNo)
        }
      }
    } finally {
      setIsLoadingOlder(false)
    }
  }

  const handleSearch = () => {
    const drawNo = Number.parseInt(searchValue)
    if (!isNaN(drawNo)) {
      jumpToDraw(drawNo)
      setSearchValue("")
    }
  }

  const handleQuickNavigation = (endRange: number) => {
    jumpToDraw(endRange)
  }

  const goToNextDraw = () => {
    if (currentDraw && currentDraw.drawNo < latestDrawNo) jumpToDraw(currentDraw.drawNo + 1)
  }

  const goToPreviousDraw = () => {
    if (currentDraw && currentDraw.drawNo > 1) jumpToDraw(currentDraw.drawNo - 1)
  }

  // 리스트 아이템 스켈레톤
  const ListSkeleton = () => (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="p-3 rounded-lg border border-[#e5e5e5] dark:border-[#3f3f3f] bg-white dark:bg-[#272727] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* 좌측: 회차 및 날짜 */}
          <div className="flex items-center gap-4 min-w-[120px]">
            <Skeleton className="h-7 w-16 bg-gray-200 dark:bg-[#3f3f3f] rounded-md" />
            <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-[#3f3f3f] rounded-md" />
          </div>
          {/* 우측: 공 리스트 */}
          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            {[...Array(6)].map((_, j) => (
              <Skeleton key={j} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#3f3f3f]" />
            ))}
            <span className="text-[#a0a0a0] mx-1 font-light">+</span>
            <Skeleton className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#3f3f3f]" />
          </div>
        </div>
      ))}
    </div>
  )

  // 전체 페이지 초기 로딩 스켈레톤
  if (isInitialLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded-full bg-gray-200 dark:bg-[#272727]" />
            <Skeleton className="h-8 w-48 bg-gray-200 dark:bg-[#272727]" />
          </div>
          <Skeleton className="h-4 w-64 bg-gray-200 dark:bg-[#272727]" />
        </div>

        {/* 메인 당첨 번호 카드 */}
        <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 sm:p-8 border border-[#e5e5e5] dark:border-[#3f3f3f] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none">
            <Trophy className="w-32 h-32 text-gray-400" />
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <Skeleton className="h-10 w-24 rounded-md bg-white dark:bg-[#272727] border border-[#e5e5e5] dark:border-[#3f3f3f]" />
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-9 w-32 bg-gray-200 dark:bg-[#272727]" />
                <Skeleton className="h-6 w-28 rounded-full bg-white dark:bg-[#272727] border border-[#e5e5e5] dark:border-[#3f3f3f]" />
              </div>
              <Skeleton className="h-10 w-24 rounded-md bg-white dark:bg-[#272727] border border-[#e5e5e5] dark:border-[#3f3f3f]" />
            </div>

            <div className="flex flex-col items-center">
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 max-w-2xl">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-gray-200 dark:bg-[#272727]" />
                ))}
                <div className="flex items-center justify-center w-6 sm:w-10">
                  <span className="text-[#606060] dark:text-[#aaaaaa] text-xl sm:text-2xl font-light">+</span>
                </div>
                <Skeleton className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-gray-200 dark:bg-[#272727]" />
              </div>
            </div>
          </div>
        </div>

        {/* 하단 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측 패널 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 검색 카드 */}
            <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="w-4 h-4 rounded-full bg-gray-200 dark:bg-[#272727]" />
                <Skeleton className="h-5 w-24 bg-gray-200 dark:bg-[#272727]" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="flex-1 h-10 rounded-lg bg-white dark:bg-[#272727] border border-[#d1d1d1] dark:border-[#3f3f3f]" />
                <Skeleton className="h-10 w-16 rounded-md bg-blue-600/20" />
              </div>
            </div>

            {/* 빠른 이동 카드 */}
            <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="w-4 h-4 rounded-full bg-gray-200 dark:bg-[#272727]" />
                <Skeleton className="h-5 w-24 bg-gray-200 dark:bg-[#272727]" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="col-span-3 h-8 rounded bg-blue-50 dark:bg-blue-900/20" />
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="h-8 rounded bg-white dark:bg-[#272727] border border-[#e5e5e5] dark:border-[#3f3f3f]" />
                ))}
              </div>
            </div>
          </div>

          {/* 우측 리스트 패널 */}
          <div className="lg:col-span-2">
            <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f] h-[600px] flex flex-col relative">
              <div className="p-4 border-b border-[#e5e5e5] dark:border-[#3f3f3f] flex justify-between items-center bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-t-xl z-10">
                <Skeleton className="h-6 w-24 bg-gray-200 dark:bg-[#272727]" />
                <Skeleton className="h-8 w-24 bg-gray-200 dark:bg-[#272727]" />
              </div>
              <div className="flex-1 p-2 overflow-hidden">
                <ListSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
          <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          역대 당첨번호
        </h1>
        <p className="text-[#606060] dark:text-[#aaaaaa] text-sm">
          원하는 회차로 이동하여 당첨 번호를 확인하세요.
        </p>
      </div>

      {/* 메인 당첨 번호 카드 */}
      <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 sm:p-8 border border-[#e5e5e5] dark:border-[#3f3f3f] shadow-sm relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none">
          <Trophy className="w-32 h-32" />
        </div>

        {currentDraw && (
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <Button variant="outline" onClick={goToPreviousDraw} disabled={currentDraw.drawNo <= 1} className="bg-white dark:bg-[#272727] border-[#e5e5e5] dark:border-[#3f3f3f] hover:bg-gray-100 dark:hover:bg-[#333] h-10 px-3">
                <ChevronLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">이전 회차</span>
              </Button>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] tracking-tight mb-1">{currentDraw.drawNo}회</span>
                <div className="flex items-center text-sm text-[#606060] dark:text-[#aaaaaa] bg-white dark:bg-[#272727] px-3 py-1 rounded-full border border-[#e5e5e5] dark:border-[#3f3f3f]">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  {currentDraw.date}
                </div>
              </div>
              <Button variant="outline" onClick={goToNextDraw} disabled={currentDraw.drawNo >= latestDrawNo} className="bg-white dark:bg-[#272727] border-[#e5e5e5] dark:border-[#3f3f3f] hover:bg-gray-100 dark:hover:bg-[#333] h-10 px-3">
                <span className="hidden sm:inline">다음 회차</span>
                <ChevronRight className="w-4 h-4 sm:ml-2" />
              </Button>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 max-w-2xl">
                {currentDraw.numbers.map((number) => (
                  <div key={number} className="w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-black font-bold text-sm sm:text-xl shadow-md transform transition-transform hover:scale-110 duration-200" style={{ backgroundColor: getBallColor(number) }}>
                    {number}
                  </div>
                ))}
                <div className="flex items-center justify-center w-6 sm:w-10"><span className="text-[#606060] dark:text-[#aaaaaa] text-xl sm:text-2xl font-light">+</span></div>
                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-black font-bold text-sm sm:text-xl shadow-md relative" style={{ backgroundColor: getBallColor(currentDraw.bonusNo) }}>
                  {currentDraw.bonusNo}
                  <div className="absolute -top-1 -right-1 sm:top-0 sm:right-0 bg-[#0f0f0f] dark:bg-[#f1f1f1] text-white dark:text-black text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter border border-white dark:border-black">Bonus</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 검색 패널 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
            <h3 className="font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] mb-3 flex items-center gap-2">
              <Search className="w-4 h-4" /> 회차 검색
            </h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={`1 ~ ${latestDrawNo}`}
                  className="w-full h-10 pl-9 pr-3 bg-white dark:bg-[#272727] border border-[#d1d1d1] dark:border-[#3f3f3f] rounded-lg text-sm text-[#0f0f0f] dark:text-[#f1f1f1] placeholder-[#a0a0a0] dark:placeholder-[#606060] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value.replace(/[^0-9]/g, ""))}
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
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => jumpToDraw(latestDrawNo)}
                className="col-span-3 px-2 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
              >
                최신 회차 ({latestDrawNo}회)
              </button>
              {/* 내림차순 구간 버튼 생성 */}
              {Array.from({ length: Math.ceil(latestDrawNo / 100) }).map((_, idx) => {
                const end = Math.min(latestDrawNo, latestDrawNo - idx * 100)
                const start = Math.max(1, end - 99)
                if (end < 1 || idx > 14) return null
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuickNavigation(end)}
                    className="px-1 py-2 text-xs font-medium text-[#606060] dark:text-[#aaaaaa] bg-white dark:bg-[#272727] border border-[#e5e5e5] dark:border-[#3f3f3f] rounded hover:bg-blue-50 dark:hover:bg-[#333] hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                  >
                    {end}-{start}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 우측: 리스트 (양방향 무한 스크롤) */}
        <div className="lg:col-span-2">
          <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f] flex flex-col h-[600px] relative">
            <div className="p-4 border-b border-[#e5e5e5] dark:border-[#3f3f3f] flex justify-between items-center bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-t-xl z-10 sticky top-0">
              <h3 className="font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">회차별 목록</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => jumpToDraw(latestDrawNo)}
                className="h-8 text-xs text-[#606060] hover:text-blue-600"
              >
                <ArrowUp className="w-3 h-3 mr-1"/> 맨 위로 (최신)
              </Button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar"
              ref={listContainerRef}
            >
              {hasMoreNewer && (
                <div ref={topTriggerRef}>
                  {isLoadingNewer && <ListSkeleton />}
                </div>
              )}

              {draws.map((draw) => {
                const isSelected = currentDraw?.drawNo === draw.drawNo
                return (
                  <div
                    key={draw.drawNo}
                    ref={(el) => { if (el) itemRefs.current.set(draw.drawNo, el) }}
                    onClick={() => {
                      setCurrentDraw(draw)
                      // 클릭 시 중앙 정렬을 원하지 않으므로 스크롤 로직 제외 (단순 선택만)
                    }}
                    id={`draw-${draw.drawNo}`}
                    className={`group p-3 rounded-lg border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-blue-50 dark:bg-[#1e2a3b] border-blue-200 dark:border-blue-800 ring-1 ring-blue-500/20"
                        : "bg-white dark:bg-[#272727] border-[#e5e5e5] dark:border-[#3f3f3f] hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-[120px]">
                      <span className={`text-lg font-bold ${isSelected ? "text-blue-600" : "text-[#0f0f0f] dark:text-[#f1f1f1]"}`}>
                        {draw.drawNo}회
                      </span>
                      <span className="text-xs text-[#606060] dark:text-[#aaaaaa]">{draw.date}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 justify-end">
                      {draw.numbers.map((num) => (
                        <div key={num} className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold text-xs shadow-sm" style={{ backgroundColor: getBallColor(num) }}>{num}</div>
                      ))}
                      <span className="text-[#a0a0a0] mx-1 font-light">+</span>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold text-xs shadow-sm" style={{ backgroundColor: getBallColor(draw.bonusNo) }}>{draw.bonusNo}</div>
                    </div>
                  </div>
                )
              })}

              <div ref={bottomTriggerRef}>
                {isLoadingOlder && <ListSkeleton />}
                {!hasMoreOlder && draws.length > 0 && (
                  <div className="text-center py-4 text-xs text-[#606060]">모든 데이터를 불러왔습니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}