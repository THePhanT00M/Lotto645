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

        // 2. 최신 당첨 번호 가져오기 (비교 분석용)
        const { data: latestDrawData } = await supabase
          .from("winning_numbers")
          .select("*")
          .order("drawNo", { ascending: false })
          .limit(1)
          .single()

        if (latestDrawData) {
          setLatestDraw(latestDrawData as WinningLottoNumbers)
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

  // 등수 계산 함수 (최신 회차 기준 시뮬레이션)
  const calculateRank = (numbers: number[]) => {
    if (!latestDraw) return null

    const matchCount = numbers.filter((n) => latestDraw.numbers.includes(n)).length
    const bonusMatch = numbers.includes(latestDraw.bonusNo)

    if (matchCount === 6) return { rank: "1등", color: "text-yellow-600 bg-yellow-50 border-yellow-200" }
    if (matchCount === 5 && bonusMatch) return { rank: "2등", color: "text-orange-600 bg-orange-50 border-orange-200" }
    if (matchCount === 5) return { rank: "3등", color: "text-green-600 bg-green-50 border-green-200" }
    if (matchCount === 4) return { rank: "4등", color: "text-blue-600 bg-blue-50 border-blue-200" }
    if (matchCount === 3) return { rank: "5등", color: "text-purple-600 bg-purple-50 border-purple-200" }

    return { rank: "미당첨", color: "text-gray-500 bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400" }
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
            저장된 번호 목록과 최신 회차({latestDraw?.drawNo}회) 기준 가상 결과를 확인하세요.
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
                {/* 취소 버튼 스타일 적용 */}
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
            <span className="font-medium">최신 회차({latestDraw?.drawNo}회) 당첨 가능성</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {history.filter(item => {
              const rank = calculateRank(item.numbers)?.rank;
              return rank && rank !== "미당첨";
            }).length}
            <span className="text-sm font-normal text-gray-500 ml-1">건 (5등 이상)</span>
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
            const rankInfo = calculateRank(item.numbers)

            return (
              <div
                key={item.id}
                className="relative bg-white dark:bg-[#262626] rounded-xl p-5 border border-gray-200 dark:border-gray-800"
              >
                {/* [수정] 모바일 전용 삭제 버튼 (텍스트 포함, 우측 상단 절대 배치) */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-3 right-3 md:hidden h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-xs">삭제</span>
                </Button>

                {/* [수정] 모바일에서 텍스트(날짜/뱃지)가 삭제 버튼과 겹치지 않도록 pr-20 (충분한 여백) 추가 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pr-20 md:pr-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
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

                  {rankInfo && (
                    <div className={`px-3 py-1 rounded-md text-sm font-bold border ${rankInfo.color} self-start md:self-auto`}>
                      {latestDraw?.drawNo}회 기준: {rankInfo.rank}
                    </div>
                  )}
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

      {/* 안내 문구 */}
      <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex items-start gap-3 text-sm text-blue-700 dark:text-blue-300">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">안내사항</p>
          <ul className="list-disc list-inside mt-1 space-y-1 opacity-90">
            <li>이 기록은 브라우저(로컬 스토리지)에 저장되므로, 캐시를 삭제하면 기록이 사라질 수 있습니다.</li>
            <li>당첨 결과 시뮬레이션은 현재 DB에 저장된 <strong>최신 회차({latestDraw?.drawNo}회)</strong>를 기준으로 계산됩니다. 실제 구매한 복권의 회차와 다를 수 있으니 참고용으로만 확인하세요.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}