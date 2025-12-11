"use client"

import { useState, useEffect } from "react"
import { Trash2, History, Calendar, Trophy, AlertTriangle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getLottoHistory, deleteLottoResult, clearLottoHistory } from "@/utils/lotto-storage"
import { getBallColor } from "@/utils/lotto-utils"
import { supabase } from "@/lib/supabaseClient"
import type { LottoResult, WinningLottoNumbers } from "@/types/lotto"

export default function HistoryPage() {
  const [history, setHistory] = useState<LottoResult[]>([])
  // 전체 당첨 번호 목록 (개별 회차 비교용)
  const [allWinningNumbers, setAllWinningNumbers] = useState<WinningLottoNumbers[]>([])
  const [latestDraw, setLatestDraw] = useState<WinningLottoNumbers | null>(null)
  const [loading, setLoading] = useState(true)

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 1. 로컬 스토리지에서 내 기록 가져오기
        const storedHistory = getLottoHistory()
        setHistory(storedHistory)

        // 2. 전체 당첨 번호 가져오기
        const { data: allDrawsData } = await supabase
          .from("winning_numbers")
          .select("*")
          .order("drawNo", { ascending: false }) // 최신순 정렬

        if (allDrawsData && allDrawsData.length > 0) {
          const draws = allDrawsData as WinningLottoNumbers[]
          setAllWinningNumbers(draws)
          setLatestDraw(draws[0]) // 가장 첫 번째가 최신 회차
        }
      } catch (error) {
        console.error("데이터 로딩 실패:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 개별 삭제 핸들러
  const handleDelete = (id: string) => {
    if (deleteLottoResult(id)) {
      setHistory((prev) => prev.filter((item) => item.id !== id))
    }
  }

  // 전체 삭제 핸들러
  const handleClearAll = () => {
    clearLottoHistory()
    setHistory([])
  }

  /**
   * 등수 및 상태 계산 함수
   * item.drawNo(회차 정보)가 있으면 해당 회차의 당첨 번호와 비교합니다.
   */
  const calculateRank = (item: LottoResult) => {
    if (!latestDraw || allWinningNumbers.length === 0) return null

    let targetDraw: WinningLottoNumbers | undefined = latestDraw // 기본값은 최신 회차
    let isPending = false
    let comparisonDrawNo = latestDraw.drawNo // 비교 기준 회차 번호

    // 1. 저장된 회차 정보(drawNo)가 있는 경우: 해당 회차 데이터를 찾아서 비교
    if (item.drawNo) {
      comparisonDrawNo = item.drawNo
      targetDraw = allWinningNumbers.find(d => d.drawNo === item.drawNo)

      // 해당 회차 데이터가 아직 DB에 없다면 (미래 회차)
      if (!targetDraw) {
        if (item.drawNo > latestDraw.drawNo) {
          isPending = true
        } else {
          // 과거 회차인데 DB에 없는 경우 (데이터 누락 등)
          return {
            rank: "데이터 없음",
            color: "text-gray-400 border-gray-200 bg-gray-50",
            drawNo: item.drawNo
          }
        }
      }
    }
    // 2. 저장된 회차 정보가 없는 경우 (구 데이터): 날짜 기반 추정
    else {
      const [year, month, day] = latestDraw.date.split("-").map(Number)
      const drawEndDate = new Date(year, month - 1, day)
      drawEndDate.setHours(23, 59, 59, 999)

      if (item.timestamp > drawEndDate.getTime()) {
        isPending = true
      }
    }

    // 3. '추첨 대기' 상태 반환
    if (isPending) {
      return {
        rank: "추첨 대기",
        color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400",
        drawNo: comparisonDrawNo
      }
    }

    // 4. 당첨 결과 분석 (targetDraw가 존재하는 경우)
    if (targetDraw) {
      const numbers = item.numbers
      const matchCount = numbers.filter((n) => targetDraw!.numbers.includes(n)).length
      const bonusMatch = numbers.includes(targetDraw!.bonusNo)

      let rankResult = { rank: "미당첨", color: "text-gray-500 bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400" }

      if (matchCount === 6) rankResult = { rank: "1등", color: "text-yellow-600 bg-yellow-50 border-yellow-200" }
      else if (matchCount === 5 && bonusMatch) rankResult = { rank: "2등", color: "text-orange-600 bg-orange-50 border-orange-200" }
      else if (matchCount === 5) rankResult = { rank: "3등", color: "text-green-600 bg-green-50 border-green-200" }
      else if (matchCount === 4) rankResult = { rank: "4등", color: "text-blue-600 bg-blue-50 border-blue-200" }
      else if (matchCount === 3) rankResult = { rank: "5등", color: "text-purple-600 bg-purple-50 border-purple-200" }

      return {
        ...rankResult,
        drawNo: targetDraw.drawNo // 실제로 비교한 회차 번호 반환
      }
    }

    return null
  }

  // 로딩 스켈레톤
  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-[#262626] rounded-lg p-6 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <Skeleton key={j} className="w-10 h-10 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            나의 추첨 기록
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            나의 추첨 기록을 확인하고 당첨 결과를 확인하세요.
          </p>
        </div>

        {history.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" />
                전체 삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>모든 기록을 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  저장된 모든 추첨 기록이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-black dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                  취소
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-red-600 hover:bg-red-700">
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* 통계 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-100 dark:bg-[#262626] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
            <History className="w-4 h-4" />
            <span className="font-medium">총 저장된 기록</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {history.length}
            <span className="text-sm font-normal text-gray-500 ml-1">건</span>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-[#262626] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
            <Trophy className="w-4 h-4" />
            <span className="font-medium">당첨된 기록 (5등 이상)</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {/* 추첨 대기 상태 등은 당첨 횟수 카운트에서 제외 */}
            {history.filter(item => {
              const rankInfo = calculateRank(item);
              return rankInfo && rankInfo.rank !== "미당첨" && rankInfo.rank !== "추첨 대기" && rankInfo.rank !== "데이터 없음";
            }).length}
            <span className="text-sm font-normal text-gray-500 ml-1">건</span>
          </div>
        </div>
      </div>

      {/* 기록 목록 */}
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-[#262626] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">저장된 추첨 기록이 없습니다.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">번호를 추첨 하고 기록을 남겨보세요.</p>
          </div>
        ) : (
          history.map((item) => {
            const rankInfo = calculateRank(item)

            return (
              <div
                key={item.id}
                className="relative bg-white dark:bg-[#262626] rounded-xl p-5 border border-gray-200 dark:border-gray-800"
              >
                {/* 모바일 전용 삭제 버튼 (텍스트 포함, 우측 상단 절대 배치) */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-3 right-3 md:hidden h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-xs">삭제</span>
                </Button>

                {/* 정보 표시 영역 (좌: 날짜/타입, 우: 회차/등수) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pr-20 md:pr-0">

                  {/* 왼쪽 그룹: 날짜 + 추첨 타입 */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center text-xs text-gray-600 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      {new Date(item.timestamp).toLocaleString()}
                    </span>

                    {item.isAiRecommended ? (
                      <span className="flex items-center text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-md border border-purple-100 dark:border-purple-800">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI 추천
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                        일반/수동
                      </span>
                    )}
                  </div>

                  {/* 오른쪽 그룹: 회차 + 등수(결과) */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    {/* [이동됨] 회차 표시 */}
                    {item.drawNo && (
                      <span className="flex items-center text-sm font-semibold border text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 px-2 py-1 rounded-md">
                        {item.drawNo}회차
                      </span>
                    )}

                    {/* 등수 표시 */}
                    {rankInfo && (
                      <div className={`px-3 py-1 rounded-md text-sm font-semibold border ${rankInfo.color}`}>
                        {rankInfo.rank === "추첨 대기"
                          ? "추첨 대기"
                          : item.drawNo
                            ? `결과: ${rankInfo.rank}` // 회차가 표시되면 "결과: 1등" 등으로 간략히 표시
                            : `${rankInfo.drawNo}회 기준: ${rankInfo.rank}` // 회차가 없으면 기준 회차 명시
                        }
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  {/* 번호 표시 */}
                  <div className="flex w-full max-w-xs justify-center gap-3">
                    {item.numbers.map((num) => (
                      <div
                        key={num}
                        className="w-full max-w-10 aspect-square rounded-full flex items-center justify-center text-black font-bold text-sm shadow-sm"
                        style={{ backgroundColor: getBallColor(num) }}
                      >
                        {num}
                      </div>
                    ))}
                  </div>

                  {/* 데스크탑 전용 삭제 버튼 (모바일에서는 숨김) */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="hidden md:inline-flex text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    삭제
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 안내 문구 (수정됨) */}
      <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex items-start gap-3 text-sm text-blue-700 dark:text-blue-300">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">안내사항</p>
          <ul className="list-disc list-inside mt-1 space-y-1 opacity-90">
            <li>
              이 기록은 <strong>브라우저에만 저장</strong>됩니다. 캐시 삭제나 브라우저 변경 시 데이터가 유실될 수 있습니다.
            </li>
            <li>
              당첨 여부는 번호 저장 시 지정된 <strong>&#39;회차&#39;</strong>의 당첨 번호를 기준으로 자동 계산됩니다.
            </li>
            <li>
              <strong>&#39;추첨 대기&#39;</strong> 상태인 기록은 실제 추첨이 완료된 후 다시 접속하시면 결과가 업데이트됩니다.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}