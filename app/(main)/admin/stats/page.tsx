"use client"

import { useEffect, useState } from "react"
import { getLottoHistory } from "@/utils/lotto-storage"
import { winningNumbers } from "@/data/winning-numbers"
import type { LottoResult, WinningLottoNumbers } from "@/types/lotto"
import { BarChart3, TrendingUp, Award, Target, Sparkles, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AnalysisResult {
  result: LottoResult
  matchCount: number
  bonusMatch: boolean
  rank: string
  targetDraw: WinningLottoNumbers | null
  isPending: boolean
}

export default function AdminStatsPage() {
  const [history, setHistory] = useState<LottoResult[]>([])
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [loading, setLoading] = useState(true)
  const [latestDraw, setLatestDraw] = useState<WinningLottoNumbers | null>(null)

  useEffect(() => {
    const loadedHistory = getLottoHistory()
    setHistory(loadedHistory)

    const sortedWinningNumbers = [...winningNumbers].sort((a, b) => b.drawNo - a.drawNo)
    if (sortedWinningNumbers.length > 0) {
      setLatestDraw(sortedWinningNumbers[0])
    }

    const results = analyzeAllResults(loadedHistory)
    setAnalysisResults(results)
    setLoading(false)
  }, [])

  const analyzeAllResults = (results: LottoResult[]): AnalysisResult[] => {
    const sortedWinningNumbers = [...winningNumbers].sort((a, b) => a.drawNo - b.drawNo)

    return results.map((result) => {
      const resultDate = new Date(result.timestamp)
      const targetDraw = findTargetDrawForDate(resultDate, sortedWinningNumbers)

      if (!targetDraw) {
        return {
          result,
          matchCount: 0,
          bonusMatch: false,
          rank: "미발표",
          targetDraw: null,
          isPending: true,
        }
      }

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

  const findTargetDrawForDate = (date: Date, draws: WinningLottoNumbers[]): WinningLottoNumbers | null => {
    const parseDrawDate = (dateStr: string): Date => {
      const [year, month, day] = dateStr.split("-").map(Number)
      return new Date(year, month - 1, day, 20, 0)
    }

    const drawsWithDates = draws.map((draw) => ({
      ...draw,
      dateObj: parseDrawDate(draw.date),
    }))

    for (const draw of drawsWithDates.sort((a, b) => a.drawNo - b.drawNo)) {
      if (date < draw.dateObj) {
        return draw
      }
    }

    return null
  }

  const completedAnalysis = analysisResults.filter((r) => !r.isPending)
  const pendingAnalysis = analysisResults.filter((r) => r.isPending)

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

  const rankStats = [
    { rank: "1등", count: completedAnalysis.filter((r) => r.rank === "1등").length, color: "yellow" },
    { rank: "2등", count: completedAnalysis.filter((r) => r.rank === "2등").length, color: "orange" },
    { rank: "3등", count: completedAnalysis.filter((r) => r.rank === "3등").length, color: "green" },
    { rank: "4등", count: completedAnalysis.filter((r) => r.rank === "4등").length, color: "blue" },
    { rank: "5등", count: completedAnalysis.filter((r) => r.rank === "5등").length, color: "purple" },
    { rank: "미당첨", count: completedAnalysis.filter((r) => r.rank === "미당첨").length, color: "gray" },
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
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">통계를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6  max-w-5xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          관리자 통계 대시보드
        </h1>
        <p className="text-gray-600 dark:text-gray-400">사이트 당첨 비율 및 분석 데이터</p>
      </div>

      {latestDraw && (
        <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">최신 회차 당첨 번호</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-2xl font-bold text-blue-600">{latestDraw.drawNo}회</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{latestDraw.date}</div>
            </div>
            <div className="flex items-center justify-center">
              <div className="grid grid-cols-8 gap-2 sm:gap-3 md:gap-4 w-full max-w-md">
                {latestDraw.numbers.map((number) => (
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
                  className="w-full aspect-square rounded-full flex items-center justify-center text-black font-bold text-xs xs:text-sm sm:text-base shadow-md"
                  style={{ backgroundColor: getBallColor(latestDraw.bonusNo) }}
                >
                  {latestDraw.bonusNo}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="p-6 pb-3">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Target className="w-4 h-4" />총 추첨 횟수
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalPicks}</div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="p-6 pb-3">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Award className="w-4 h-4" />
              전체 당첨률
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="text-3xl font-bold text-green-600">{winRate}%</div>
            <p className="text-xs text-gray-500 mt-1">{winningResults.length}개 당첨</p>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="p-6 pb-3">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI 추천 당첨률
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="text-3xl font-bold text-blue-600">{aiWinRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {aiWinningResults.length}/{aiRecommendedCount}개 당첨
            </p>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="p-6 pb-3">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              일반 추첨 당첨률
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="text-3xl font-bold text-purple-600">{regularWinRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {regularWinningResults.length}/{regularDrawCount}개 당첨
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="ranks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-[#262626]">
          <TabsTrigger value="ranks">등수별 통계</TabsTrigger>
          <TabsTrigger value="matches">일치 개수</TabsTrigger>
          <TabsTrigger value="comparison">AI vs 일반</TabsTrigger>
        </TabsList>

        <TabsContent value="ranks" className="space-y-4">
          <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">당첨 등수별 분포</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">전체 분석 완료된 추첨의 등수별 통계</p>
            </div>
            <div className="px-6 pb-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {rankStats.map((stat) => (
                  <div
                    key={stat.rank}
                    className={`p-4 rounded-lg border-2 ${
                      stat.color === "yellow"
                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                        : stat.color === "orange"
                          ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
                          : stat.color === "green"
                            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                            : stat.color === "blue"
                              ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                              : stat.color === "purple"
                                ? "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
                                : "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800"
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{stat.rank}</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.count}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {analyzedPicks > 0 ? ((stat.count / analyzedPicks) * 100).toFixed(2) : 0}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">번호 일치 개수 분포</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">당첨 번호와 일치하는 개수별 통계</p>
            </div>
            <div className="px-6 pb-6">
              <div className="space-y-3">
                {matchCountStats.map((stat) => (
                  <div key={stat.count} className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">{stat.count}개 일치</div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${stat.percentage}%` }}
                      >
                        {Number.parseFloat(stat.percentage) > 5 && (
                          <span className="text-xs font-medium text-white">{stat.occurrences}</span>
                        )}
                      </div>
                      {Number.parseFloat(stat.percentage) <= 5 && stat.occurrences > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-700 dark:text-gray-300">
                          {stat.occurrences}
                        </span>
                      )}
                    </div>
                    <div className="w-16 text-sm text-gray-600 dark:text-gray-400 text-right">{stat.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  AI 추천 등수별 통계
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">AI로 추천받은 번호의 당첨 등수 분포</p>
              </div>
              <div className="px-6 pb-6">
                <div className="space-y-2">
                  {aiRankStats.map((stat) => (
                    <div
                      key={stat.rank}
                      className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded"
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.rank}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-600">{stat.count}</span>
                        <span className="text-xs text-gray-500">
                          ({aiRecommendedCount > 0 ? ((stat.count / aiRecommendedCount) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  일반 추첨 등수별 통계
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">수동으로 추첨한 번호의 당첨 등수 분포</p>
              </div>
              <div className="px-6 pb-6">
                <div className="space-y-2">
                  {regularRankStats.map((stat) => (
                    <div
                      key={stat.rank}
                      className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded"
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.rank}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-purple-600">{stat.count}</span>
                        <span className="text-xs text-gray-500">
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

      {pendingAnalysis.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
          <div className="p-6">
            <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              결과 대기 중인 추첨
            </h3>
          </div>
          <div className="px-6 pb-6">
            <p className="text-yellow-700 dark:text-yellow-300">
              {pendingAnalysis.length}개의 추첨이 아직 당첨 결과 발표를 기다리고 있습니다. 다음 회차 추첨 후 자동으로
              분석됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
