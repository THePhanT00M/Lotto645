"use client"

import { useEffect, useState } from "react"
import type { LottoResult, WinningLottoNumbers } from "@/types/lotto"
import { BarChart3, TrendingUp, Award, Target, Sparkles, Calendar, AlertTriangle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

interface AnalysisResult {
  result: LottoResult
  matchCount: number
  bonusMatch: boolean
  rank: string
  targetDraw: WinningLottoNumbers | null
  isPending: boolean
}

type PendingResult = LottoResult

export default function AdminStatsPage() {
  const [history, setHistory] = useState<LottoResult[]>([])
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [loading, setLoading] = useState(true)
  const [latestDraw, setLatestDraw] = useState<WinningLottoNumbers | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingHistory, setPendingHistory] = useState<PendingResult[]>([])
  const [upcomingDrawNo, setUpcomingDrawNo] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const fetchData = async () => {
      try {
        const response = await fetch('/api/stats')

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) throw new Error(data.message)

        const { completedHistoryData, pendingHistoryData, latestDrawData, upcomingDrawNo } = data

        const loadedLatestDraw: WinningLottoNumbers = latestDrawData

        const loadedCompletedHistory: LottoResult[] = completedHistoryData
          ? completedHistoryData.map((row: any) => ({
            id: row.id.toString(),
            numbers: row.numbers,
            timestamp: new Date(row.created_at).getTime(),
            memo: row.memo || undefined,
            isAiRecommended: row.source === 'ai',
          }))
          : []

        const loadedPendingHistory: PendingResult[] = pendingHistoryData
          ? pendingHistoryData.map((row: any) => ({
            id: row.id.toString(),
            numbers: row.numbers,
            timestamp: new Date(row.created_at).getTime(),
            memo: row.memo || undefined,
            isAiRecommended: row.source === 'ai',
          }))
          : []

        setHistory(loadedCompletedHistory)
        setPendingHistory(loadedPendingHistory)
        setLatestDraw(loadedLatestDraw)
        setUpcomingDrawNo(upcomingDrawNo)

        const results = analyzeSingleDrawResults(loadedCompletedHistory, loadedLatestDraw)
        setAnalysisResults(results)

      } catch (error: any) {
        console.error("통계 데이터 로딩 실패:", error.message)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const analyzeSingleDrawResults = (
    results: LottoResult[],
    targetDraw: WinningLottoNumbers
  ): AnalysisResult[] => {
    return results.map((result) => {
      const matchCount = result.numbers.filter((num) => targetDraw.numbers.includes(num)).length
      const bonusMatch = result.numbers.includes(targetDraw.bonusNo)

      let rank = "미당첨"
      if (matchCount === 6) rank = "1등"
      else if (matchCount === 5 && bonusMatch) rank = "2등"
      else if (matchCount === 5) rank = "3등"
      else if (matchCount === 4) rank = "4등"
      else if (matchCount === 3) rank = "5등"

      return {
        result,
        matchCount,
        bonusMatch,
        rank,
        targetDraw,
        isPending: false,
      }
    })
  }

  const completedAnalysis = analysisResults
  const pendingAnalysis = pendingHistory
  const totalPicks = history.length
  const analyzedPicks = completedAnalysis.length
  const aiRecommendedCount = completedAnalysis.filter((r) => r.result.isAiRecommended).length
  const regularDrawCount = completedAnalysis.filter((r) => !r.result.isAiRecommended).length

  const winningResults = completedAnalysis.filter((r) => r.rank !== "미당첨")
  const winRate = analyzedPicks > 0 ? ((winningResults.length / analyzedPicks) * 100).toFixed(2) : "0.00"

  const aiWinningResults = completedAnalysis.filter((r) => r.result.isAiRecommended && r.rank !== "미당첨")
  const aiWinRate = aiRecommendedCount > 0 ? ((aiWinningResults.length / aiRecommendedCount) * 100).toFixed(2) : "0.00"

  const regularWinningResults = completedAnalysis.filter((r) => !r.result.isAiRecommended && r.rank !== "미당첨")
  const regularWinRate =
    regularDrawCount > 0 ? ((regularWinningResults.length / regularDrawCount) * 100).toFixed(2) : "0.00"

  // 등수별 스타일 매핑 (History 페이지와 통일)
  const getRankStyle = (rank: string) => {
    switch (rank) {
      case "1등": return "text-[#0f0f0f] bg-[#fff8c5] border-[#f1e05a] dark:text-[#f1f1f1] dark:bg-[#5c4d00] dark:border-[#8b7500]";
      case "2등": return "text-[#0f0f0f] bg-[#ffebd4] border-[#ffcc99] dark:text-[#f1f1f1] dark:bg-[#5e3000] dark:border-[#995c00]";
      case "3등": return "text-[#0f0f0f] bg-[#dff0d8] border-[#d6e9c6] dark:text-[#f1f1f1] dark:bg-[#1e3a1e] dark:border-[#2b542c]";
      case "4등": return "text-[#0f0f0f] bg-[#d9edf7] border-[#bce8f1] dark:text-[#f1f1f1] dark:bg-[#103046] dark:border-[#1a4a6e]";
      case "5등": return "text-[#0f0f0f] bg-[#f3e5f5] border-[#e1bee7] dark:text-[#f1f1f1] dark:bg-[#341b3a] dark:border-[#5c2b66]";
      default: return "text-[#606060] bg-gray-100 border-[#e5e5e5] dark:text-[#aaaaaa] dark:bg-[#272727] dark:border-[#3f3f3f]";
    }
  }

  const rankStats = [
    { rank: "1등", count: completedAnalysis.filter((r) => r.rank === "1등").length },
    { rank: "2등", count: completedAnalysis.filter((r) => r.rank === "2등").length },
    { rank: "3등", count: completedAnalysis.filter((r) => r.rank === "3등").length },
    { rank: "4등", count: completedAnalysis.filter((r) => r.rank === "4등").length },
    { rank: "5등", count: completedAnalysis.filter((r) => r.rank === "5등").length },
    { rank: "미당첨", count: completedAnalysis.filter((r) => r.rank === "미당첨").length },
  ]

  const matchCountStats = [0, 1, 2, 3, 4, 5, 6].map((count) => ({
    count,
    occurrences: completedAnalysis.filter((r) => r.matchCount === count).length,
    percentage:
      analyzedPicks > 0
        ? ((completedAnalysis.filter((r) => r.matchCount === count).length / analyzedPicks) * 100).toFixed(1)
        : "0.0",
  }))

  const aiRankStats = [
    { rank: "1등", count: completedAnalysis.filter((r) => r.result.isAiRecommended && r.rank === "1등").length },
    { rank: "2등", count: completedAnalysis.filter((r) => r.result.isAiRecommended && r.rank === "2등").length },
    { rank: "3등", count: completedAnalysis.filter((r) => r.result.isAiRecommended && r.rank === "3등").length },
    { rank: "4등", count: completedAnalysis.filter((r) => r.result.isAiRecommended && r.rank === "4등").length },
    { rank: "5등", count: completedAnalysis.filter((r) => r.result.isAiRecommended && r.rank === "5등").length },
    { rank: "미당첨", count: completedAnalysis.filter((r) => r.result.isAiRecommended && r.rank === "미당첨").length },
  ]

  const regularRankStats = [
    { rank: "1등", count: completedAnalysis.filter((r) => !r.result.isAiRecommended && r.rank === "1등").length },
    { rank: "2등", count: completedAnalysis.filter((r) => !r.result.isAiRecommended && r.rank === "2등").length },
    { rank: "3등", count: completedAnalysis.filter((r) => !r.result.isAiRecommended && r.rank === "3등").length },
    { rank: "4등", count: completedAnalysis.filter((r) => !r.result.isAiRecommended && r.rank === "4등").length },
    { rank: "5등", count: completedAnalysis.filter((r) => !r.result.isAiRecommended && r.rank === "5등").length },
    { rank: "미당첨", count: completedAnalysis.filter((r) => !r.result.isAiRecommended && r.rank === "미당첨").length },
  ]

  const getBallColor = (number: number): string => {
    if (number >= 1 && number <= 10) return "#FBC400"
    if (number >= 11 && number <= 20) return "#69C8F2"
    if (number >= 21 && number <= 30) return "#FF7272"
    if (number >= 31 && number <= 40) return "#AAA"
    return "#B0D840"
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6 animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64 bg-gray-200 dark:bg-[#272727]" />
          <Skeleton className="h-6 w-80 bg-gray-200 dark:bg-[#272727]" />
        </div>
        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-lg p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-5 h-5 rounded-full bg-gray-200 dark:bg-[#272727]" />
            <Skeleton className="h-6 w-56 bg-gray-200 dark:bg-[#272727]" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-20 mx-auto bg-gray-200 dark:bg-[#272727]" />
            <div className="flex items-center justify-center gap-2">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#272727]" />
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-34 rounded-lg bg-gray-200 dark:bg-[#272727]" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center justify-center bg-[#fff0f0] dark:bg-[#3e1b1b] p-8 rounded-lg border border-[#ffcdcd] dark:border-[#5c2b2b]">
          <AlertTriangle className="w-16 h-16 text-[#cc0000] mb-4" />
          <h2 className="text-xl font-bold text-[#cc0000] dark:text-[#ff9999]">데이터 로딩 실패</h2>
          <p className="text-[#606060] dark:text-[#aaaaaa] mt-2 text-center">
            통계 데이터를 불러오는 중 오류가 발생했습니다.
          </p>
          <code className="mt-4 p-2 bg-gray-100 dark:bg-[#272727] rounded text-sm text-[#cc0000] dark:text-[#ff9999] w-full text-center">
            {error}
          </code>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          관리자 통계 대시보드
        </h1>
        <p className="text-[#606060] dark:text-[#aaaaaa] text-sm">
          최신 회차({latestDraw?.drawNo}회차)에 대한 사이트 당첨 비율 및 분석 데이터
        </p>
      </div>

      {/* 최신 회차 당첨 번호 섹션 */}
      {latestDraw && (
        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">최신 회차 당첨 번호</h2>
          </div>
          <div className="space-y-4">
            <div className="relative flex items-center justify-center py-1">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 text-center">
                {latestDraw.drawNo}회차
              </div>
              <div className="absolute right-0 text-sm text-[#606060] dark:text-[#aaaaaa]">
                {latestDraw.date}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="grid grid-cols-8 gap-2 sm:gap-3 md:gap-4 w-full max-w-md">
                {latestDraw.numbers.map((number) => (
                  <div
                    key={number}
                    className="w-full aspect-square rounded-full flex items-center justify-center text-black font-bold text-xs xs:text-sm sm:text-base shadow-sm"
                    style={{ backgroundColor: getBallColor(number) }}
                  >
                    {number}
                  </div>
                ))}
                <div className="flex items-center justify-center">
                  <span className="text-[#606060] dark:text-[#aaaaaa] text-sm xs:text-base md:text-lg font-medium">+</span>
                </div>
                <div
                  className="w-full aspect-square rounded-full flex items-center justify-center text-black font-bold text-xs xs:text-sm sm:text-base shadow-sm"
                  style={{ backgroundColor: getBallColor(latestDraw.bonusNo) }}
                >
                  {latestDraw.bonusNo}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f]">
          <div className="p-5">
            <div className="text-sm font-medium text-[#606060] dark:text-[#aaaaaa] flex items-center gap-2">
              <Target className="w-4 h-4" />총 추첨 횟수 ({latestDraw?.drawNo}회)
            </div>
            <div className="text-3xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] mt-3">{totalPicks}</div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f]">
          <div className="p-5">
            <div className="text-sm font-medium text-[#606060] dark:text-[#aaaaaa] flex items-center gap-2">
              <Award className="w-4 h-4" />
              전체 당첨률
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-500 mt-3">{winRate}%</div>
            <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-1">{winningResults.length}개 당첨</p>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f]">
          <div className="p-5">
            <div className="text-sm font-medium text-[#606060] dark:text-[#aaaaaa] flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI 추천 당첨률
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-3">{aiWinRate}%</div>
            <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-1">
              {aiWinningResults.length}/{aiRecommendedCount}개 당첨
            </p>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f]">
          <div className="p-5">
            <div className="text-sm font-medium text-[#606060] dark:text-[#aaaaaa] flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              일반 추첨 당첨률
            </div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-3">{regularWinRate}%</div>
            <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-1">
              {regularWinningResults.length}/{regularDrawCount}개 당첨
            </p>
          </div>
        </div>
      </div>

      {/* 탭 UI */}
      <Tabs defaultValue="ranks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-[#f2f2f2] dark:bg-[#0f0f0f] p-1 rounded-lg border dark:border-[#272727]">
          <TabsTrigger
            value="ranks"
            className="text-[#606060] data-[state=active]:bg-white data-[state=active]:text-[#0f0f0f] data-[state=active]:shadow-sm dark:text-[#aaaaaa] dark:data-[state=active]:bg-[#272727] dark:data-[state=active]:text-[#f1f1f1] rounded-md transition-colors font-medium"
          >
            등수별 통계
          </TabsTrigger>
          <TabsTrigger
            value="matches"
            className="text-[#606060] data-[state=active]:bg-white data-[state=active]:text-[#0f0f0f] data-[state=active]:shadow-sm dark:text-[#aaaaaa] dark:data-[state=active]:bg-[#272727] dark:data-[state=active]:text-[#f1f1f1] rounded-md transition-colors font-medium"
          >
            일치 개수
          </TabsTrigger>
          <TabsTrigger
            value="comparison"
            className="text-[#606060] data-[state=active]:bg-white data-[state=active]:text-[#0f0f0f] data-[state=active]:shadow-sm dark:text-[#aaaaaa] dark:data-[state=active]:bg-[#272727] dark:data-[state=active]:text-[#f1f1f1] rounded-md transition-colors font-medium"
          >
            AI vs 일반
          </TabsTrigger>
        </TabsList>

        {/* "등수별 통계" 탭 패널 */}
        <TabsContent value="ranks" className="space-y-4">
          <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f]">
            <div className="p-5">
              <h3 className="text-xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">당첨 등수별 분포</h3>
              <p className="text-sm text-[#606060] dark:text-[#aaaaaa] mt-1">
                {latestDraw?.drawNo}회차 대상 추첨의 등수별 통계
              </p>
            </div>
            <div className="p-5 pt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {rankStats.map((stat) => (
                  <div
                    key={stat.rank}
                    className={`p-4 rounded-lg border ${getRankStyle(stat.rank)}`}
                  >
                    <div className="text-sm font-medium mb-2 opacity-80">{stat.rank}</div>
                    <div className="text-2xl font-bold">{stat.count}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {analyzedPicks > 0 ? ((stat.count / analyzedPicks) * 100).toFixed(2) : 0}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* "일치 개수" 탭 패널 */}
        <TabsContent value="matches" className="space-y-4">
          <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f]">
            <div className="p-5">
              <h3 className="text-xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">번호 일치 개수 분포</h3>
              <p className="text-sm text-[#606060] dark:text-[#aaaaaa] mt-1">
                {latestDraw?.drawNo}회차 당첨 번호와 일치하는 개수별 통계
              </p>
            </div>
            <div className="p-5 pt-0">
              <div className="space-y-3">
                {matchCountStats.map((stat) => (
                  <div key={stat.count} className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium text-[#606060] dark:text-[#aaaaaa]">{stat.count}개 일치</div>
                    <div className="flex-1 bg-[#e5e5e5] dark:bg-[#3f3f3f] rounded-full h-8 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${Math.max(Number(stat.percentage), 0)}%` }}
                      >
                        {Number.parseFloat(stat.percentage) > 5 && (
                          <span className="text-xs font-medium text-white">{stat.occurrences}</span>
                        )}
                      </div>
                      {Number.parseFloat(stat.percentage) <= 5 && stat.occurrences > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#606060] dark:text-[#aaaaaa]">
                          {stat.occurrences}
                        </span>
                      )}
                    </div>
                    <div className="w-16 text-sm text-[#606060] dark:text-[#aaaaaa] text-right">{stat.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* "AI vs 일반" 탭 패널 */}
        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f]">
              <div className="p-5">
                <h3 className="text-xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  AI 추천 등수별 통계
                </h3>
                <p className="text-sm text-[#606060] dark:text-[#aaaaaa] mt-1">
                  {latestDraw?.drawNo}회차 AI 추천 번호의 당첨 등수 분포
                </p>
              </div>
              <div className="p-5 pt-0">
                <div className="space-y-2">
                  {aiRankStats.map((stat) => (
                    <div
                      key={stat.rank}
                      className="flex items-center justify-between p-2 bg-[#f2f8ff] dark:bg-[#263850] rounded border border-[#d3e3fd] dark:border-[#263850]"
                    >
                      <span className="text-sm font-medium text-[#0f0f0f] dark:text-[#f1f1f1]">{stat.rank}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{stat.count}</span>
                        <span className="text-xs text-[#606060] dark:text-[#aaaaaa]">
                          ({aiRecommendedCount > 0 ? ((stat.count / aiRecommendedCount) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f]">
              <div className="p-5">
                <h3 className="text-xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  일반 추첨 등수별 통계
                </h3>
                <p className="text-sm text-[#606060] dark:text-[#aaaaaa] mt-1">
                  {latestDraw?.drawNo}회차 일반 추첨 번호의 당첨 등수 분포
                </p>
              </div>
              <div className="p-5 pt-0">
                <div className="space-y-2">
                  {regularRankStats.map((stat) => (
                    <div
                      key={stat.rank}
                      className="flex items-center justify-between p-2 bg-[#f3e5f5] dark:bg-[#341b3a] rounded border border-[#e1bee7] dark:border-[#5c2b66]"
                    >
                      <span className="text-sm font-medium text-[#0f0f0f] dark:text-[#f1f1f1]">{stat.rank}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{stat.count}</span>
                        <span className="text-xs text-[#606060] dark:text-[#aaaaaa]">
                          ({regularDrawCount > 0 ? ((stat.count / regularDrawCount) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 결과 대기 중 섹션 */}
      {pendingAnalysis.length > 0 && (
        <div className="bg-[#fff8c5] dark:bg-[#3e3400] rounded-xl border border-[#f1e05a] dark:border-[#8b7500]">
          <div className="p-5">
            <h3 className="text-lg font-bold text-[#5c4d00] dark:text-[#ffd700] flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {upcomingDrawNo}회차 결과 대기 중인 추첨
            </h3>
            <p className="text-[#5c4d00] dark:text-[#e0e0e0] mt-3">
              {pendingAnalysis.length}개의 추첨이 아직 당첨 결과 발표를 기다리고 있습니다. 다음 회차 추첨 후 자동으로
              분석됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}