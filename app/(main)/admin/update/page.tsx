"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertTriangle, DatabaseZap } from "lucide-react"

export default function UpdateDrawPage() {
  const [status, setStatus] = useState("업데이트 대기 중...")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [resultData, setResultData] = useState<any>(null)

  // 업데이트 함수
  const runUpdate = async () => {
    setIsLoading(true)
    setStatus("최신 회차 확인 및 업데이트 시작...")
    setError(null)
    setResultData(null)

    try {
      const response = await fetch("/api/update-draw")
      const result = await response.json()

      if (response.ok && result.success) {
        setStatus(result.message)
        setResultData(result.data)
      } else {
        setError(result.message || "알 수 없는 오류가 발생했습니다.")
        setStatus("업데이트 실패")
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "네트워크 오류 발생"
      setError(errorMessage)
      setStatus("업데이트 중 오류 발생")
    } finally {
      setIsLoading(false)
    }
  }

  // 페이지 로드 시 자동으로 업데이트 실행
  useEffect(() => {
    runUpdate()
  }, []) // 빈 의존성 배열로 마운트 시 1회 실행

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
          <DatabaseZap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          당첨 번호 업데이트
        </h1>
        <p className="text-[#606060] dark:text-[#aaaaaa] text-sm">
          동행복권 API를 확인하여 최신 당첨 번호를 업데이트 진행합니다.
        </p>
      </div>

      {/* 메인 컨텐츠 카드 */}
      <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-6 border border-[#e5e5e5] dark:border-[#3f3f3f]">

        {/* 업데이트 버튼 */}
        <Button
          onClick={runUpdate}
          disabled={isLoading}
          className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              업데이트 중...
            </>
          ) : (
            "수동으로 다시 업데이트"
          )}
        </Button>

        {/* 상태 표시 영역 */}
        <div className={`mt-6 p-5 rounded-lg border transition-colors ${
          error
            ? "bg-[#fff0f0] dark:bg-[#3e1b1b] border-[#ffcdcd] dark:border-[#5c2b2b]"
            : resultData
              ? "bg-[#f2f8ff] dark:bg-[#1e2a3b] border-[#d3e3fd] dark:border-[#2b3a55]"
              : "bg-[#f2f2f2] dark:bg-[#272727] border-[#e5e5e5] dark:border-[#3f3f3f]"
        }`}>
          <h2 className={`font-semibold mb-3 flex items-center ${
            error
              ? "text-[#cc0000] dark:text-[#ff9999]"
              : resultData
                ? "text-[#065fd4] dark:text-[#3ea6ff]"
                : "text-[#0f0f0f] dark:text-[#f1f1f1]"
          }`}>
            업데이트 상태:
          </h2>

          {isLoading && (
            <div className="flex items-center text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>{status}</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex items-center text-[#cc0000] dark:text-[#ff9999]">
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>
                <strong>오류:</strong> {error}
              </span>
            </div>
          )}

          {!isLoading && !error && (
            <div className={`flex items-center ${resultData ? "text-green-600 dark:text-green-400" : "text-[#606060] dark:text-[#aaaaaa]"}`}>
              {resultData ? <CheckCircle className="w-4 h-4 mr-2" /> : null}
              <span>{status}</span>
            </div>
          )}

          {resultData && (
            <div className="mt-4 pt-4 border-t border-[#d3e3fd] dark:border-[#2b3a55]">
              <h3 className="font-medium text-[#0f0f0f] dark:text-[#f1f1f1] mb-2">
                {resultData.drawNo}회 데이터가 삽입되었습니다:
              </h3>
              <div className="space-y-1 text-sm text-[#606060] dark:text-[#aaaaaa]">
                <p>
                  <span className="font-medium text-[#0f0f0f] dark:text-[#f1f1f1] mr-2">날짜:</span>
                  {resultData.date}
                </p>
                <p>
                  <span className="font-medium text-[#0f0f0f] dark:text-[#f1f1f1] mr-2">번호:</span>
                  {resultData.numbers.join(", ")}
                </p>
                <p>
                  <span className="font-medium text-[#0f0f0f] dark:text-[#f1f1f1] mr-2">보너스:</span>
                  {resultData.bonusNo}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}