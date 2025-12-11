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
   * 유튜브 스타일의 칩(Chip) 색상을 적용했습니다.
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
            color: "text-[#606060] border-[#e5e5e5] bg-[#f2f2f2] dark:text-[#aaaaaa] dark:border-[#3f3f3f] dark:bg-[#272727]",
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

    // 3. '추첨 대기' 상태 반환 (YouTube Blue style)
    if (isPending) {
      return {
        rank: "추첨 대기",
        color: "text-[#065fd4] bg-[#f2f8ff] border-[#d3e3fd] dark:text-[#3ea6ff] dark:bg-[#263850] dark:border-[#263850]",
        drawNo: comparisonDrawNo
      }
    }

    // 4. 당첨 결과 분석 (targetDraw가 존재하는 경우)
    if (targetDraw) {
      const numbers = item.numbers
      const matchCount = numbers.filter((n) => targetDraw!.numbers.includes(n)).length
      const bonusMatch = numbers.includes(targetDraw!.bonusNo)

      // 기본 미당첨 (유튜브 기본 Gray 칩 스타일)
      let rankResult = {
        rank: "미당첨",
        color: "text-[#606060] bg-[#f9f9f9] border-[#e5e5e5] dark:text-[#aaaaaa] dark:bg-[#272727] dark:border-[#3f3f3f]"
      }

      // 등수별 색상 (파스텔 톤 배경 + 진한 텍스트로 가독성 확보)
      if (matchCount === 6) rankResult = { rank: "1등", color: "text-[#0f0f0f] bg-[#fff8c5] border-[#f1e05a] dark:text-[#f1f1f1] dark:bg-[#5c4d00] dark:border-[#8b7500]" } // Gold/Yellow
      else if (matchCount === 5 && bonusMatch) rankResult = { rank: "2등", color: "text-[#0f0f0f] bg-[#ffebd4] border-[#ffcc99] dark:text-[#f1f1f1] dark:bg-[#5e3000] dark:border-[#995c00]" } // Orange
      else if (matchCount === 5) rankResult = { rank: "3등", color: "text-[#0f0f0f] bg-[#dff0d8] border-[#d6e9c6] dark:text-[#f1f1f1] dark:bg-[#1e3a1e] dark:border-[#2b542c]" } // Green
      else if (matchCount === 4) rankResult = { rank: "4등", color: "text-[#0f0f0f] bg-[#d9edf7] border-[#bce8f1] dark:text-[#f1f1f1] dark:bg-[#103046] dark:border-[#1a4a6e]" } // Blue
      else if (matchCount === 3) rankResult = { rank: "5등", color: "text-[#0f0f0f] bg-[#f3e5f5] border-[#e1bee7] dark:text-[#f1f1f1] dark:bg-[#341b3a] dark:border-[#5c2b66]" } // Purple

      return {
        ...rankResult,
        drawNo: targetDraw.drawNo // 실제로 비교한 회차 번호 반환
      }
    }

    return null
  }

  // 로딩 스켈레톤 (기존 구조 유지하되 색상 미세 조정)
  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-gray-200 dark:bg-[#272727]" />
            <Skeleton className="h-5 w-64 bg-gray-200 dark:bg-[#272727]" />
          </div>
          <Skeleton className="h-10 w-24 bg-gray-200 dark:bg-[#272727]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-lg bg-gray-200 dark:bg-[#272727]" />
          <Skeleton className="h-28 rounded-lg bg-gray-200 dark:bg-[#272727]" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-lg p-6 space-y-4 border border-[#e5e5e5] dark:border-[#3f3f3f]">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-32 bg-gray-200 dark:bg-[#272727]" />
                <Skeleton className="h-6 w-20 bg-gray-200 dark:bg-[#272727]" />
              </div>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <Skeleton key={j} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#272727]" />
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
          <h1 className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            나의 추첨 기록
          </h1>
          <p className="text-[#606060] dark:text-[#aaaaaa] text-sm">
            나의 추첨 기록을 확인하고 당첨 결과를 확인하세요.
          </p>
        </div>

        {history.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto bg-[#cc0000] hover:bg-[#990000] text-white border-none shadow-none">
                <Trash2 className="w-4 h-4 mr-2" />
                전체 삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white dark:bg-[#1e1e1e] border border-[#e5e5e5] dark:border-[#3f3f3f]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[#0f0f0f] dark:text-[#f1f1f1]">모든 기록을 삭제하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription className="text-[#606060] dark:text-[#aaaaaa]">
                  저장된 모든 추첨 기록이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-[#0f0f0f] dark:text-[#f1f1f1] border-[#e5e5e5] dark:border-[#3f3f3f] bg-transparent hover:bg-[#0000000d] dark:hover:bg-[#ffffff1a]">
                  취소
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-[#cc0000] hover:bg-[#990000] text-white">
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* 통계 요약 카드 (유튜브 카드 스타일 적용) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
          <div className="flex items-center gap-2 mb-2 text-[#606060] dark:text-[#aaaaaa]">
            <History className="w-4 h-4" />
            <span className="font-medium">총 저장된 기록</span>
          </div>
          <div className="text-3xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
            {history.length}
            <span className="text-sm font-normal text-[#606060] dark:text-[#aaaaaa] ml-1">건</span>
          </div>
        </div>

        <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
          <div className="flex items-center gap-2 mb-2 text-[#606060] dark:text-[#aaaaaa]">
            <Trophy className="w-4 h-4" />
            <span className="font-medium">당첨된 기록 (5등 이상)</span>
          </div>
          <div className="text-3xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
            {/* 추첨 대기 상태 등은 당첨 횟수 카운트에서 제외 */}
            {history.filter(item => {
              const rankInfo = calculateRank(item);
              return rankInfo && rankInfo.rank !== "미당첨" && rankInfo.rank !== "추첨 대기" && rankInfo.rank !== "데이터 없음";
            }).length}
            <span className="text-sm font-normal text-[#606060] dark:text-[#aaaaaa] ml-1">건</span>
          </div>
        </div>
      </div>

      {/* 기록 목록 */}
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl border border-dashed border-[#e5e5e5] dark:border-[#3f3f3f]">
            <History className="w-12 h-12 text-[#cccccc] dark:text-[#3f3f3f] mb-4" />
            <p className="text-lg font-medium text-[#606060] dark:text-[#aaaaaa]">저장된 추첨 기록이 없습니다.</p>
            <p className="text-sm text-[#909090] dark:text-[#606060] mt-1">번호를 추첨 하고 기록을 남겨보세요.</p>
          </div>
        ) : (
          history.map((item) => {
            const rankInfo = calculateRank(item)

            return (
              <div
                key={item.id}
                className="relative bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f] transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:pr-0">

                  <div className="flex justify-between items-center w-full md:w-auto">
                    {/* 왼쪽 그룹: 날짜 + 추첨 타입 */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center text-xs text-[#0f0f0f] dark:text-[#f1f1f1] bg-[#0000000d] dark:bg-[#ffffff1a] px-2 py-1 rounded-md border border-transparent font-medium">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#606060] dark:text-[#aaaaaa]" />
                        {new Date(item.timestamp).toLocaleString()}
                      </span>

                      {item.isAiRecommended ? (
                        <span className="flex items-center text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-md border border-purple-100 dark:border-purple-800/50">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI 추천
                        </span>
                      ) : (
                        <span className="font-medium text-xs text-[#0f0f0f] dark:text-[#f1f1f1] bg-[#0000000d] dark:bg-[#ffffff1a] px-2 py-1 rounded-md border border-transparent font-medium">
                          일반/수동
                        </span>
                      )}
                    </div>

                    {/* 모바일 전용 삭제 버튼 */}
                    <Button
                      variant="ghost"
                      size="custom"
                      onClick={() => handleDelete(item.id)}
                      className="md:hidden text-xs px-2 py-1 text-[#cc0000] bg-[#cc000010] dark:bg-[#cc000030] hover:bg-[#cc000020] dark:hover:bg-[#cc000040] border-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-xs ml-1">삭제</span>
                    </Button>
                  </div>

                  {/* 오른쪽 그룹: 회차 + 등수(결과) */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    {/* 회차 표시 */}
                    {item.drawNo && (
                      <span className="flex items-center text-sm font-semibold text-[#065fd4] dark:text-[#3ea6ff] bg-[#f2f8ff] dark:bg-[#263850] px-2 py-1 rounded-md border border-[#d3e3fd] dark:border-[#263850]">
                        {item.drawNo}회차
                      </span>
                    )}

                    {/* 등수 표시 */}
                    {rankInfo && (
                      <div className={`px-3 py-1 rounded-md text-sm font-semibold border ${rankInfo.color}`}>
                        {rankInfo.rank === "추첨 대기"
                          ? "추첨 대기"
                          : item.drawNo
                            ? `결과: ${rankInfo.rank}`
                            : `${rankInfo.drawNo}회 기준: ${rankInfo.rank}`
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
                        className="w-full max-w-10 aspect-square rounded-full flex items-center justify-center text-[#0f0f0f] font-bold text-sm shadow-sm"
                        style={{ backgroundColor: getBallColor(num) }}
                      >
                        {num}
                      </div>
                    ))}
                  </div>

                  {/* 데스크탑 전용 삭제 버튼 */}
                  <Button
                    variant="ghost"
                    size="custom"
                    onClick={() => handleDelete(item.id)}
                    className="hidden md:inline-flex text-xs text-[#cc0000] hover:text-[#cc0000] hover:bg-[#cc000010] dark:hover:bg-[#cc000030] shrink-0 px-2 py-1 bg-transparent border border-[#cc000030] dark:border-[#cc000050]"
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

      {/* 안내 문구 (가독성 개선 적용) */}
      <div className="bg-[#f2f8ff] dark:bg-[#1e1e1e] p-4 rounded-lg flex items-start gap-3 text-sm text-[#065fd4] dark:text-[#3ea6ff] border border-[#d3e3fd] dark:border-[#3f3f3f]">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]">안내사항</p>
          <ul className="list-disc list-inside mt-1 space-y-1 opacity-90 text-[#606060] dark:text-[#aaaaaa]">
            <li>
              이 기록은 <strong className="font-semibold text-blue-800 dark:text-blue-300">브라우저에만 저장</strong>됩니다. 캐시 삭제나 브라우저 변경 시 데이터가 유실될 수 있습니다.
            </li>
            <li>
              당첨 여부는 번호 저장 시 지정된 <strong className="font-semibold text-blue-800 dark:text-blue-300">&#39;회차&#39;</strong>의 당첨 번호를 기준으로 자동 계산됩니다.
            </li>
            <li>
              <strong className="font-semibold text-blue-800 dark:text-blue-300">&#39;추첨 대기&#39;</strong> 상태인 기록은 실제 추첨이 완료된 후 다시 접속하시면 결과가 업데이트됩니다.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}