"use client"

import { useEffect, useState } from "react"
import type { LottoResult, WinningLottoNumbers } from "@/types/lotto"
// 1. 필요한 아이콘 임포트 (AlertTriangle 포함)
import { BarChart3, TrendingUp, Award, Target, Sparkles, Calendar, AlertTriangle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// 2. 스켈레톤 UI 컴포넌트 임포트
import { Skeleton } from "@/components/ui/skeleton"

/**
 * 분석 결과를 저장하기 위한 인터페이스
 */
interface AnalysisResult {
  result: LottoResult
  matchCount: number
  bonusMatch: boolean
  rank: string
  targetDraw: WinningLottoNumbers | null
  isPending: boolean
}

/**
 * 결과 대기 중인(다음 회차) 추첨 기록을 위한 타입 (LottoResult와 동일)
 */
type PendingResult = LottoResult

/**
 * 관리자용 통계 페이지 컴포넌트
 */
export default function AdminStatsPage() {
  // 3. 상태 변수 정의
  const [history, setHistory] = useState<LottoResult[]>([]) // '완료된' 추첨 기록
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]) // '완료된' 기록의 분석 결과
  const [loading, setLoading] = useState(true) // 페이지 로딩 상태 (스켈레톤 UI 제어)
  const [latestDraw, setLatestDraw] = useState<WinningLottoNumbers | null>(null) // 가장 최근 '당첨 완료'된 회차 정보
  const [error, setError] = useState<string | null>(null) // API fetching 에러 메시지
  const [pendingHistory, setPendingHistory] = useState<PendingResult[]>([]) // '결과 대기 중인' (다음 회차) 추첨 기록
  const [upcomingDrawNo, setUpcomingDrawNo] = useState<number | null>(null) // 다음 추첨 회차 번호

  // 4. 페이지 마운트 시 API로부터 통계 데이터를 가져오는 useEffect
  useEffect(() => {
    // 4-1. API 요청 시작 전, 로딩 상태를 true로 설정하고 에러 메시지를 초기화합니다.
    setLoading(true)
    setError(null)

    // 4-2. 통계 데이터를 비동기(async)로 가져오는 내부 함수를 정의합니다.
    const fetchData = async () => {
      try {
        // 4-3. 서버의 어드민 통계 API 엔드포인트('/api/admin/stats')를 호출합니다.
        const response = await fetch('/api/stats')

        // 4-4. API 응답이 404나 500 등 (ok=false)일 경우,
        //      JSON 파싱을 시도하지 않고 HTTP 에러를 발생시켜 catch 블록으로 넘깁니다.
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`)
        }

        // 4-5. 응답이 정상이면, JSON 데이터를 파싱합니다.
        const data = await response.json()

        // 4-6. API가 보낸 JSON에 success: false가 포함된 경우, API가 보낸 에러 메시지를 사용해 에러를 발생시킵니다.
        if (!data.success) throw new Error(data.message)

        // 4-7. API로부터 4가지 주요 데이터(완료된 기록, 대기 중인 기록, 최신 당첨 번호, 다음 회차 번호)를 추출합니다.
        const { completedHistoryData, pendingHistoryData, latestDrawData, upcomingDrawNo } = data

        // 4-8. 최신 당첨 번호 데이터를 WinningLottoNumbers 타입으로 할당합니다.
        const loadedLatestDraw: WinningLottoNumbers = latestDrawData

        // 4-9. '완료된' 추첨 기록(DB 데이터)을 프론트엔드 LottoResult 타입 배열로 변환합니다. (e.g., source -> isAiRecommended)
        const loadedCompletedHistory: LottoResult[] = completedHistoryData
          ? completedHistoryData.map((row: any) => ({
            id: row.id.toString(),
            numbers: row.numbers,
            timestamp: new Date(row.created_at).getTime(),
            memo: row.memo || undefined,
            isAiRecommended: row.source === 'ai', // source 컬럼 기반으로 변환
          }))
          : []

        // 4-10. '대기 중인' 추첨 기록(DB 데이터)을 프론트엔드 PendingResult 타입 배열로 변환합니다.
        const loadedPendingHistory: PendingResult[] = pendingHistoryData
          ? pendingHistoryData.map((row: any) => ({
            id: row.id.toString(),
            numbers: row.numbers,
            timestamp: new Date(row.created_at).getTime(),
            memo: row.memo || undefined,
            isAiRecommended: row.source === 'ai',
          }))
          : []

        // 4-11. 변환된 데이터로 React 상태(state)를 일괄 업데이트합니다.
        setHistory(loadedCompletedHistory)     // 완료된 기록
        setPendingHistory(loadedPendingHistory) // 대기중인 기록
        setLatestDraw(loadedLatestDraw)         // 최신 회차
        setUpcomingDrawNo(upcomingDrawNo)       // 다음 회차 번호

        // 4-12. '완료된' 기록과 '최신 당첨 번호'를 비교 분석하는 함수를 호출합니다.
        const results = analyzeSingleDrawResults(loadedCompletedHistory, loadedLatestDraw)

        // 4-13. 분석 결과를 상태에 저장합니다.
        setAnalysisResults(results)

      } catch (error: any) {
        // 4-14. fetchData 함수 내에서 발생한 모든 에러(네트워크, 파싱, API 에러)를 처리하고, 에러 상태에 저장합니다.
        console.error("통계 데이터 로딩 실패:", error.message)
        setError(error.message)
      } finally {
        // 4-15. 데이터 요청이 성공하든 실패하든, 로딩 상태를 false로 변경하여 스켈레톤 UI를 숨깁니다.
        setLoading(false)
      }
    }

    // 4-16. 정의된 비동기 함수를 실행합니다.
    fetchData()
  }, []) // 페이지 마운트 시 1회만 실행

  /**
   * (완료된) 추첨 기록 배열을 받아, (최신) 당첨 번호와 비교하여 등수와 일치 여부를 계산하는 함수
   * @param results '완료된' 추첨 기록 (LottoResult[])
   * @param targetDraw 비교 대상이 될 '최신' 당첨 번호 (WinningLottoNumbers)
   * @returns 분석 완료된 결과 배열 (AnalysisResult[])
   */
  const analyzeSingleDrawResults = (
    results: LottoResult[],
    targetDraw: WinningLottoNumbers
  ): AnalysisResult[] => {

    // 1. 모든 '완료된' 기록을 순회합니다.
    return results.map((result) => {
      // 2. 기록의 번호와 최신 당첨 번호를 비교하여 일치하는 개수를 계산합니다.
      const matchCount = result.numbers.filter((num) => targetDraw.numbers.includes(num)).length
      // 3. 보너스 번호 일치 여부를 확인합니다.
      const bonusMatch = result.numbers.includes(targetDraw.bonusNo)

      // 4. 일치 개수와 보너스 여부를 기준으로 1등부터 5등, 미당첨까지 등급을 매깁니다.
      let rank = "미당첨"
      if (matchCount === 6) rank = "1등"
      else if (matchCount === 5 && bonusMatch) rank = "2등"
      else if (matchCount === 5) rank = "3등"
      else if (matchCount === 4) rank = "4등"
      else if (matchCount === 3) rank = "5등"

      // 5. 분석이 완료된 객체를 반환합니다.
      return {
        result,
        matchCount,
        bonusMatch,
        rank,
        targetDraw, // 비교 대상은 항상 이 최신 회차
        isPending: false, // 이 데이터는 이미 추첨이 완료된 것들임
      }
    })
  }

  // UI 렌더링을 위한 변수 계산
  const completedAnalysis = analysisResults // 분석 완료된 결과 목록 (UI 표시에 사용)
  const pendingAnalysis = pendingHistory    // 분석 대기중인 결과 목록 (UI 표시에 사용)
  const totalPicks = history.length         // 통계 카드: '완료된' 추첨의 총 횟수
  const analyzedPicks = completedAnalysis.length
  const aiRecommendedCount = completedAnalysis.filter((r) => r.result.isAiRecommended).length
  const regularDrawCount = completedAnalysis.filter((r) => !r.result.isAiRecommended).length

  // 전체 당첨률 계산
  const winningResults = completedAnalysis.filter((r) => r.rank !== "미당첨")
  const winRate = analyzedPicks > 0 ? ((winningResults.length / analyzedPicks) * 100).toFixed(2) : "0.00"

  // AI 추천 당첨률 계산
  const aiWinningResults = completedAnalysis.filter((r) => r.result.isAiRecommended && r.rank !== "미당첨")
  const aiWinRate = aiRecommendedCount > 0 ? ((aiWinningResults.length / aiRecommendedCount) * 100).toFixed(2) : "0.00"

  // 일반 추첨 당첨률 계산
  const regularWinningResults = completedAnalysis.filter((r) => !r.result.isAiRecommended && r.rank !== "미당첨")
  const regularWinRate =
    regularDrawCount > 0 ? ((regularWinningResults.length / regularDrawCount) * 100).toFixed(2) : "0.00"

  // 등수별 통계 데이터 (전체)
  const rankStats = [
    { rank: "1등", count: completedAnalysis.filter((r) => r.rank === "1등").length, color: "yellow" },
    { rank: "2등", count: completedAnalysis.filter((r) => r.rank === "2등").length, color: "orange" },
    { rank: "3등", count: completedAnalysis.filter((r) => r.rank === "3등").length, color: "green" },
    { rank: "4등", count: completedAnalysis.filter((r) => r.rank === "4등").length, color: "blue" },
    { rank: "5등", count: completedAnalysis.filter((r) => r.rank === "5등").length, color: "purple" },
    { rank: "미당첨", count: completedAnalysis.filter((r) => r.rank === "미당첨").length, color: "gray" },
  ]

  // 일치 개수별 통계 데이터 (전체)
  const matchCountStats = [0, 1, 2, 3, 4, 5, 6].map((count) => ({
    count,
    occurrences: completedAnalysis.filter((r) => r.matchCount === count).length,
    percentage:
      analyzedPicks > 0
        ? ((completedAnalysis.filter((r) => r.matchCount === count).length / analyzedPicks) * 100).toFixed(1)
        : "0.0",
  }))

  // 등수별 통계 데이터 (AI)
  const aiRankStats = [
    { rank: "1등", count: completedAnalysis.filter((r) => r.result.isAiRecommended && r.rank === "1등").length },
    { rank: "2등", count: completedAnalysis.filter((r) => r.result.isAiRecommended && r.rank === "2등").length },
    { rank: "3등", count: completedAnalysis.filter((r) => r.result.isAiRecommended && r.rank === "3등").length },
    { rank: "4등", count: completedAnalysis.filter((r) => r.result.isAiRecommended && r.rank === "4등").length },
    { rank: "5등", count: completedAnalysis.filter((r) => r.result.isAiRecommended && r.rank === "5등").length },
    { rank: "미당첨", count: completedAnalysis.filter((r) => r.result.isAiRecommended && r.rank === "미당첨").length },
  ]

  // 등수별 통계 데이터 (일반)
  const regularRankStats = [
    { rank: "1등", count: completedAnalysis.filter((r) => !r.result.isAiRecommended && r.rank === "1등").length },
    { rank: "2등", count: completedAnalysis.filter((r) => !r.result.isAiRecommended && r.rank === "2등").length },
    { rank: "3등", count: completedAnalysis.filter((r) => !r.result.isAiRecommended && r.rank === "3등").length },
    { rank: "4등", count: completedAnalysis.filter((r) => !r.result.isAiRecommended && r.rank === "4등").length },
    { rank: "5등", count: completedAnalysis.filter((r) => !r.result.isAiRecommended && r.rank === "5등").length },
    { rank: "미당첨", count: completedAnalysis.filter((r) => !r.result.isAiRecommended && r.rank === "미당첨").length },
  ]

  /**
   * 번호에 따라 다른 공 색상을 반환하는 헬퍼 함수
   */
  const getBallColor = (number: number): string => {
    if (number >= 1 && number <= 10) return "#FBC400"
    if (number >= 11 && number <= 20) return "#69C8F2"
    if (number >= 21 && number <= 30) return "#FF7272"
    if (number >= 31 && number <= 40) return "#AAA"
    return "#B0D840"
  }

  // 로딩 상태(true)일 때 스켈레톤 UI를 렌더링합니다.
  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6  max-w-5xl space-y-6 animate-pulse">
        {/* (스켈레톤) 페이지 제목 */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" /> {/* h1 title */}
          <Skeleton className="h-5 w-80" /> {/* p description */}
        </div>

        {/* (스켈레톤) 최신 회차 카드 */}
        <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-6 w-56" />
          </div>
          <div className="space-y-4">
            <div className="relative flex items-center justify-center py-1">
              <Skeleton className="h-8 w-20" /> {/* 회차 */}
              <Skeleton className="absolute right-0 h-5 w-24" /> {/* 날짜 */}
            </div>
            <div className="flex items-center justify-center">
              <div className="grid grid-cols-8 gap-2 sm:gap-3 md:gap-4 w-full max-w-md">
                <Skeleton className="w-full aspect-square rounded-full" />
                <Skeleton className="w-full aspect-square rounded-full" />
                <Skeleton className="w-full aspect-square rounded-full" />
                <Skeleton className="w-full aspect-square rounded-full" />
                <Skeleton className="w-full aspect-square rounded-full" />
                <Skeleton className="w-full aspect-square rounded-full" />
                <div className="flex items-center justify-center">
                  {/* + sign */}
                </div>
                <Skeleton className="w-full aspect-square rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* (스켈레톤) 상단 통계 카드 4개 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>

        {/* (스켈레톤) 탭 UI */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" /> {/* TabsList */}
          <Skeleton className="h-64 w-full rounded-lg" /> {/* TabsContent */}
        </div>
      </div>
    )
  }

  // 에러 상태가 null이 아닐 때, 에러 메시지를 렌더링합니다.
  if (error) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 p-8 rounded-lg border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-700 dark:text-red-300">데이터 로딩 실패</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-center">
            통계 데이터를 불러오는 중 오류가 발생했습니다.
          </p>
          <code className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm text-red-600 dark:text-red-400 w-full text-center">
            {error}
          </code>
        </div>
      </div>
    )
  }

  // 메인 페이지 UI 렌더링
  return (
    <div className="container mx-auto p-4 sm:p-6  max-w-5xl space-y-6">
      {/* 페이지 제목 */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          관리자 통계 대시보드
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          최신 회차({latestDraw?.drawNo}회)에 대한 사이트 당첨 비율 및 분석 데이터
        </p>
      </div>

      {/* 최신 회차 당첨 번호 섹션 */}
      {latestDraw && (
        <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">최신 회차 당첨 번호</h2>
          </div>
          <div className="space-y-4">
            {/* 회차 번호(중앙)와 날짜(우측) 레이아웃 */}
            <div className="relative flex items-center justify-center py-1">
              <div className="text-2xl font-bold text-blue-600 text-center">
                {latestDraw.drawNo}회
              </div>
              <div className="absolute right-0 text-sm text-gray-600 dark:text-gray-400">
                {latestDraw.date}
              </div>
            </div>
            {/* 당첨 번호 공 */}
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

      {/* 상단 통계 카드 (총 추첨, 전체 당첨률, AI 당첨률, 일반 당첨률) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg">
          <div className="p-4 sm:p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Target className="w-4 h-4" />총 추첨 횟수 ({latestDraw?.drawNo}회)
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-3">{totalPicks}</div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg">
          <div className="p-4 sm:p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Award className="w-4 h-4" />
              전체 당첨률
            </div>
            <div className="text-3xl font-bold text-green-600 mt-3">{winRate}%</div>
            <p className="text-xs text-gray-500 mt-1">{winningResults.length}개 당첨</p>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg">
          <div className="p-4 sm:p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI 추천 당첨률
            </div>
            <div className="text-3xl font-bold text-blue-600 mt-3">{aiWinRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {aiWinningResults.length}/{aiRecommendedCount}개 당첨
            </p>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg">
          <div className="p-4 sm:p-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              일반 추첨 당첨률
            </div>
            <div className="text-3xl font-bold text-purple-600 mt-3">{regularWinRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {regularWinningResults.length}/{regularDrawCount}개 당첨
            </p>
          </div>
        </div>
      </div>

      {/* 탭 UI (등수별, 일치 개수, AI vs 일반) */}
      <Tabs defaultValue="ranks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-[#262626]">
          <TabsTrigger value="ranks">등수별 통계</TabsTrigger>
          <TabsTrigger value="matches">일치 개수</TabsTrigger>
          <TabsTrigger value="comparison">AI vs 일반</TabsTrigger>
        </TabsList>

        {/* "등수별 통계" 탭 패널 */}
        <TabsContent value="ranks" className="space-y-4">
          <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg">
            <div className="p-4 sm:p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">당첨 등수별 분포</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {latestDraw?.drawNo}회차 대상 추첨의 등수별 통계
              </p>
            </div>
            <div className="p-4 sm:p-6 pt-0">
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

        {/* "일치 개수" 탭 패널 */}
        <TabsContent value="matches" className="space-y-4">
          <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg">
            <div className="p-4 sm:p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">번호 일치 개수 분포</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {latestDraw?.drawNo}회차 당첨 번호와 일치하는 개수별 통계
              </p>
            </div>
            <div className="p-4 sm:p-6 pt-0">
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

        {/* "AI vs 일반" 탭 패널 */}
        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg">
              <div className="p-4 sm:p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  AI 추천 등수별 통계
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {latestDraw?.drawNo}회차 AI 추천 번호의 당첨 등수 분포
                </p>
              </div>
              <div className="p-4 sm:p-6 pt-0">
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

            <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg">
              <div className="p-4 sm:p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  일반 추첨 등수별 통계
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {latestDraw?.drawNo}회차 일반 추첨 번호의 당첨 등수 분포
                </p>
              </div>
              <div className="p-4 sm:p-6 pt-0">
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

      {/* '결과 대기 중인' 추첨이 1개 이상 있을 경우, 해당 섹션을 렌더링합니다. */}
      {pendingAnalysis.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {/* 다음 회차 번호를 표시합니다. */}
              {upcomingDrawNo}회 결과 대기 중인 추첨
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mt-3">
              {/* 대기 중인 추첨 건수를 표시합니다. */}
              {pendingAnalysis.length}개의 추첨이 아직 당첨 결과 발표를 기다리고 있습니다. 다음 회차 추첨 후 자동으로
              분석됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}