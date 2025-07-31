"use client"

import { useState } from "react"
import { Sparkles, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { getBallColor } from "@/utils/lotto-utils"
import { winningNumbers } from "@/data/winning-numbers"
import type { LottoResult, WinningLottoNumbers } from "@/types/lotto"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LottoAnalysisProps {
  history: LottoResult[]
}

export function LottoAnalysis({ history }: LottoAnalysisProps) {
  // 모든 추첨 기록을 분석 대상으로 설정
  const allResults = history

  // 회차 번호 기준으로 정렬된 당첨 번호 데이터
  const sortedWinningNumbers = [...winningNumbers].sort((a, b) => a.drawNo - b.drawNo)

  // 회차 선택 상태 추가
  const [selectedDrawNo, setSelectedDrawNo] = useState<string>("auto")
  const [analysisMode, setAnalysisMode] = useState<"auto" | "specific">("auto")
  const [visibleResultsCount, setVisibleResultsCount] = useState(5)

  // 분석 모드 변경 핸들러
  const handleAnalysisModeChange = (mode: "auto" | "specific") => {
    setAnalysisMode(mode)
    if (mode === "auto") {
      setSelectedDrawNo("auto")
    } else if (mode === "specific" && selectedDrawNo === "auto") {
      // 특정 회차 모드로 변경 시 기본값으로 가장 최근 회차 선택
      const latestDraw = [...sortedWinningNumbers].sort((a, b) => b.drawNo - a.drawNo)[0]
      setSelectedDrawNo(latestDraw.drawNo.toString())
    }
  }

  // 선택된 특정 회차 정보
  const selectedDraw =
    selectedDrawNo !== "auto" ? sortedWinningNumbers.find((draw) => draw.drawNo.toString() === selectedDrawNo) : null

  // 특정 회차 분석을 위한 날짜 범위 계산
  const getDateRangeForDraw = (draw: WinningLottoNumbers) => {
    const parseDrawDate = (dateStr: string): Date => {
      const [year, month, day] = dateStr.split("-").map(Number)
      return new Date(year, month - 1, day, 20, 0) // 판매 마감 시간 20시 00분으로 설정
    }

    const currentDrawDate = parseDrawDate(draw.date)

    // 이전 회차 찾기
    const previousDraw = sortedWinningNumbers.find((d) => d.drawNo === draw.drawNo - 1)

    let startDate: Date
    if (previousDraw) {
      // 이전 회차 판매 마감일 20시 00분 이후부터
      startDate = parseDrawDate(previousDraw.date)
    } else {
      // 첫 회차인 경우 충분히 이전 날짜부터
      startDate = new Date(currentDrawDate.getTime() - 7 * 24 * 60 * 60 * 1000) // 1주일 전
    }

    // 현재 회차 판매 마감일 20시 00분 이전까지
    const endDate = currentDrawDate

    return { startDate, endDate }
  }

  // 분석 모드에 따른 필터링된 결과
  const filteredResults =
    analysisMode === "specific" && selectedDraw
      ? (() => {
          const { startDate, endDate } = getDateRangeForDraw(selectedDraw)
          return allResults.filter((result) => {
            const resultDate = new Date(result.timestamp)
            return resultDate > startDate && resultDate < endDate
          })
        })()
      : allResults

  // 각 추첨 기록에 대한 일치도 분석
  const analysisResults = filteredResults.map((result) => {
    // 추첨 시점
    const resultDate = new Date(result.timestamp)

    let targetDraw: WinningLottoNumbers | null = null
    let isPending = false

    if (analysisMode === "specific" && selectedDraw) {
      // 특정 회차 모드: 선택된 회차와 비교
      targetDraw = selectedDraw
      isPending = false
    } else {
      // 자동 모드: 추첨 시점에 따른 적절한 당첨 회차 찾기
      targetDraw = findTargetDrawForDate(resultDate, sortedWinningNumbers)
      isPending = !targetDraw
    }

    if (!targetDraw) {
      // 아직 당첨 결과가 발표되지 않은 경우
      return {
        result,
        matchCount: 0,
        bonusMatch: false,
        rank: "미발표",
        matchingNumbers: [],
        date: resultDate,
        targetDraw: null,
        isPending: true,
      }
    }

    // 일치하는 번호 개수 계산
    const matchCount = result.numbers.filter((num) => targetDraw!.numbers.includes(num)).length

    // 보너스 번호 일치 여부
    const bonusMatch = result.numbers.includes(targetDraw.bonusNo)

    // 당첨 등수 계산
    let rank = "미당첨"
    if (matchCount === 6) rank = "1등"
    else if (matchCount === 5 && bonusMatch) rank = "2등"
    else if (matchCount === 5) rank = "3등"
    else if (matchCount === 4) rank = "4등"
    else if (matchCount === 3) rank = "5등"

    // 일치하는 번호 목록
    const matchingNumbers = result.numbers.filter((num) => targetDraw!.numbers.includes(num))

    return {
      result,
      matchCount,
      bonusMatch,
      rank,
      matchingNumbers,
      date: resultDate,
      targetDraw,
      isPending: false,
    }
  })

  // 아직 결과가 나오지 않은 추천과 결과가 나온 추천 분리
  const pendingAnalysis = analysisResults.filter((result) => result.isPending)
  const completedAnalysis = analysisResults.filter((result) => !result.isPending)

  // 일치 개수별 통계 (결과가 나온 추첨만 대상으로)
  const matchCountStats = [0, 1, 2, 3, 4, 5, 6].map((count) => {
    return {
      count,
      occurrences: completedAnalysis.filter((result) => result.matchCount === count).length,
    }
  })

  // 당첨 등수별 통계 (결과가 나온 추첨만 대상으로)
  const rankStats = [
    { rank: "1등", count: completedAnalysis.filter((result) => result.rank === "1등").length },
    { rank: "2등", count: completedAnalysis.filter((result) => result.rank === "2등").length },
    { rank: "3등", count: completedAnalysis.filter((result) => result.rank === "3등").length },
    { rank: "4등", count: completedAnalysis.filter((result) => result.rank === "4등").length },
    { rank: "5등", count: completedAnalysis.filter((result) => result.rank === "5등").length },
    { rank: "미당첨", count: completedAnalysis.filter((result) => result.rank === "미당첨").length },
  ]

  // AI 추천과 일반 추첨 통계
  const aiRecommendedCount = completedAnalysis.filter((result) => result.result.isAiRecommended).length
  const regularDrawCount = completedAnalysis.filter((result) => !result.result.isAiRecommended).length

  if (allResults.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center mb-6">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-purple-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">추첨 기록이 없습니다</h3>
        <p className="text-gray-500">로또 번호를 추첨하면 여기에서 분석 결과를 확인할 수 있습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex items-center mb-4">
        <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
        <h3 className="font-medium text-gray-800">로또 번호 분석</h3>
      </div>

      {/* 분석 모드 선택 탭 */}
      <div className="mb-4">
        <Tabs value={analysisMode} onValueChange={(value) => handleAnalysisModeChange(value as "auto" | "specific")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto">자동 분석</TabsTrigger>
            <TabsTrigger value="specific">특정 회차 분석</TabsTrigger>
          </TabsList>
          <TabsContent value="auto">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-sm text-purple-700">
                <span className="font-medium">각 추첨 번호와 해당 추첨 시점에 맞는 당첨 회차를 비교합니다.</span>
                <br />
                추첨 시점이 로또 판매 마감일 20시 이전이면 해당 회차와, 이후면 다음 회차와 비교됩니다.
              </p>
              <div className="mt-2 text-xs text-purple-600">분석 대상: 전체 {allResults.length}개 추첨 기록</div>
            </div>
          </TabsContent>
          <TabsContent value="specific">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">선택한 회차에 해당하는 기간에 뽑은 번호들만 분석합니다.</span>
                  <br />
                  이전 회차 판매 마감 이후부터 선택한 회차 판매 마감 이전까지의 번호들과 해당 회차 당첨 번호를
                  비교합니다.
                </p>
              </div>

              {/* 회차 선택 드롭다운 */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">회차 선택:</label>
                <Select value={selectedDrawNo} onValueChange={setSelectedDrawNo}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="회차를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>최근 회차</SelectLabel>
                      {[...sortedWinningNumbers]
                        .sort((a, b) => b.drawNo - a.drawNo)
                        .slice(0, 10)
                        .map((draw) => (
                          <SelectItem key={draw.drawNo} value={draw.drawNo.toString()}>
                            {draw.drawNo}회 ({draw.date})
                          </SelectItem>
                        ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>모든 회차</SelectLabel>
                      {[...sortedWinningNumbers]
                        .sort((a, b) => b.drawNo - a.drawNo)
                        .slice(10)
                        .map((draw) => (
                          <SelectItem key={draw.drawNo} value={draw.drawNo.toString()}>
                            {draw.drawNo}회 ({draw.date})
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* 선택된 회차 정보 및 분석 대상 기간 표시 */}
              {selectedDraw && (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">
                        {selectedDraw.drawNo}회 ({selectedDraw.date}) 당첨 번호:
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedDraw.numbers.map((number) => (
                        <div
                          key={number}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: getBallColor(number) }}
                        >
                          {number}
                        </div>
                      ))}
                      <div className="flex items-center">
                        <span className="text-gray-500 mx-1">+</span>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: getBallColor(selectedDraw.bonusNo) }}
                        >
                          {selectedDraw.bonusNo}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 분석 대상 기간 및 개수 표시 */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-sm text-blue-700">
                      <span className="font-medium">분석 대상 기간:</span>
                      <br />
                      {(() => {
                        const { startDate, endDate } = getDateRangeForDraw(selectedDraw)
                        const previousDraw = sortedWinningNumbers.find((d) => d.drawNo === selectedDraw.drawNo - 1)
                        return (
                          <>
                            {previousDraw ? `${previousDraw.drawNo}회 (${previousDraw.date}) 20:00 이후` : "이전 기간"}{" "}
                            ~ {selectedDraw.drawNo}회 ({selectedDraw.date}) 20:00 이전
                            <br />
                            <span className="text-xs">분석 대상: {filteredResults.length}개 추첨 기록</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {analysisMode === "auto" && pendingAnalysis.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-center text-yellow-700 mb-1">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="font-medium">아직 결과가 발표되지 않은 추첨이 {pendingAnalysis.length}개 있습니다.</span>
          </div>
          <p className="text-sm text-yellow-600">이 추첨들은 다음 로또 추첨 결과가 발표된 후에 분석될 예정입니다.</p>
        </div>
      )}

      {analysisMode === "specific" && filteredResults.length === 0 && selectedDraw && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center text-gray-700 mb-1">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="font-medium">선택한 회차에 해당하는 기간에 뽑은 번호가 없습니다.</span>
          </div>
          <p className="text-sm text-gray-600">다른 회차를 선택하거나 해당 기간에 번호를 추첨해보세요.</p>
        </div>
      )}

      {completedAnalysis.length > 0 ? (
        <>
          {/* 추첨 유형별 통계 */}
          {(aiRecommendedCount > 0 || regularDrawCount > 0) && (
            <div className="mb-5">
              <h4 className="text-sm font-medium text-gray-700 mb-2">추첨 유형별 통계</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
                  <div className="text-xs text-blue-600 mb-1">AI 추천</div>
                  <div className="text-lg font-bold text-blue-800">{aiRecommendedCount}</div>
                  <div className="text-xs text-blue-600">
                    {completedAnalysis.length > 0
                      ? Math.round((aiRecommendedCount / completedAnalysis.length) * 100)
                      : 0}
                    %
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                  <div className="text-xs text-gray-600 mb-1">일반 추첨</div>
                  <div className="text-lg font-bold text-gray-800">{regularDrawCount}</div>
                  <div className="text-xs text-gray-600">
                    {completedAnalysis.length > 0 ? Math.round((regularDrawCount / completedAnalysis.length) * 100) : 0}
                    %
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 일치 개수별 통계 */}
          <div className="mb-5">
            <h4 className="text-sm font-medium text-gray-700 mb-2">일치 개수별 통계</h4>
            <div className="grid grid-cols-7 gap-2">
              {matchCountStats.map((stat) => (
                <div key={stat.count} className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500 mb-1">{stat.count}개 일치</div>
                  <div className="text-lg font-bold text-gray-800">{stat.occurrences}</div>
                  <div className="text-xs text-gray-500">
                    {completedAnalysis.length > 0 ? Math.round((stat.occurrences / completedAnalysis.length) * 100) : 0}
                    %
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 당첨 등수별 통계 */}
          <div className="mb-5">
            <h4 className="text-sm font-medium text-gray-700 mb-2">당첨 등수별 통계</h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {rankStats.map((stat) => (
                <div
                  key={stat.rank}
                  className={`rounded-lg p-2 text-center ${
                    stat.rank === "1등"
                      ? "bg-yellow-50 border border-yellow-200"
                      : stat.rank === "2등"
                        ? "bg-orange-50 border border-orange-200"
                        : stat.rank === "3등"
                          ? "bg-green-50 border border-green-200"
                          : stat.rank === "4등"
                            ? "bg-blue-50 border border-blue-200"
                            : stat.rank === "5등"
                              ? "bg-purple-50 border border-purple-200"
                              : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="text-xs font-medium mb-1">{stat.rank}</div>
                  <div className="text-lg font-bold">{stat.count}</div>
                  <div className="text-xs text-gray-500">
                    {completedAnalysis.length > 0 ? Math.round((stat.count / completedAnalysis.length) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : analysisMode === "auto" && pendingAnalysis.length > 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">아직 분석할 수 있는 결과가 없습니다. 다음 추첨 결과를 기다려주세요.</p>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500">분석할 추첨 결과가 없습니다.</p>
        </div>
      )}

      {/* 최근 추첨 번호 분석 결과 */}
      {analysisResults.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">추첨 번호 분석 결과</h4>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {analysisResults.slice(0, visibleResultsCount).map((result, index) => (
              <div key={index} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-500">
                      {format(result.date, "yyyy년 MM월 dd일 a h:mm", { locale: ko })}
                    </div>
                    {result.result.isAiRecommended && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                        AI
                      </span>
                    )}
                  </div>
                  {result.isPending ? (
                    <div className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                      결과 대기 중
                    </div>
                  ) : (
                    <div
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        result.rank === "1등"
                          ? "bg-yellow-100 text-yellow-800"
                          : result.rank === "2등"
                            ? "bg-orange-100 text-orange-800"
                            : result.rank === "3등"
                              ? "bg-green-100 text-green-800"
                              : result.rank === "4등"
                                ? "bg-blue-100 text-blue-800"
                                : result.rank === "5등"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {result.matchCount}개 일치 ({result.rank}){result.bonusMatch && " + 보너스"}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                  {result.result.numbers.map((number) => (
                    <div
                      key={number}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        !result.isPending && result.matchingNumbers.includes(number)
                          ? "ring-2 ring-green-500 ring-offset-1"
                          : ""
                      }`}
                      style={{ backgroundColor: getBallColor(number) }}
                    >
                      {number}
                    </div>
                  ))}
                </div>

                {!result.isPending && (
                  <>
                    {result.targetDraw && (
                      <div className="text-xs text-gray-600 mb-1">
                        비교 회차: {result.targetDraw.drawNo}회 ({result.targetDraw.date})
                      </div>
                    )}
                    {result.matchingNumbers.length > 0 && (
                      <div className="text-xs text-green-600">
                        일치 번호: {result.matchingNumbers.join(", ")}
                        {result.bonusMatch && ` + 보너스(${result.targetDraw?.bonusNo})`}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {analysisResults.length > visibleResultsCount ? (
              <div className="text-center py-2">
                <button
                  onClick={() => setVisibleResultsCount((prev) => Math.min(prev + 5, analysisResults.length))}
                  className="inline-flex items-center px-4 py-2 bg-transparent border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  더 많은 결과 보기 ({analysisResults.length - visibleResultsCount}개 더)
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

// 추첨 시점에 따른 적절한 당첨 회차를 찾는 함수
function findTargetDrawForDate(date: Date, draws: WinningLottoNumbers[]): WinningLottoNumbers | null {
  // 날짜 문자열을 Date 객체로 변환하는 함수
  const parseDrawDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Date(year, month - 1, day, 20, 0) // 판매 마감 시간 20시 00분으로 설정
  }

  // 각 당첨 회차의 날짜를 Date 객체로 변환
  const drawsWithDates = draws.map((draw) => ({
    ...draw,
    dateObj: parseDrawDate(draw.date),
  }))

  // 추첨 시점을 기준으로 적절한 회차 찾기
  for (const draw of drawsWithDates.sort((a, b) => a.drawNo - b.drawNo)) {
    // 추첨 시점이 해당 회차의 판매 마감 시간(20시 00분) 이전이면 해당 회차와 비교
    if (date < draw.dateObj) {
      return draw
    }
  }

  // 모든 회차보다 늦은 시점이면 아직 결과가 없음
  return null
}
