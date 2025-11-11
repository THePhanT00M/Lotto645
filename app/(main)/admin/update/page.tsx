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
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-lg p-6">
        <div className="flex items-center mb-4">
          <DatabaseZap className="w-6 h-6 mr-2 text-blue-600" />
          <h1 className="text-2xl font-bold">당첨 번호 업데이트</h1>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          동행복권 API를 확인하여 최신 당첨 번호를 업데이트 진행합니다.
        </p>

        <Button
          onClick={runUpdate}
          disabled={isLoading}
          className="w-full h-12 text-lg"
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

        <div className="mt-6 p-4 bg-gray-50 dark:bg-[rgb(38,38,38)] rounded-lg min-h-[100px]">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
            업데이트 상태:
          </h2>
          {isLoading && (
            <div className="flex items-center text-blue-600">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>{status}</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex items-center text-red-600">
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>
                <strong>오류:</strong> {error}
              </span>
            </div>
          )}

          {!isLoading && !error && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>{status}</span>
            </div>
          )}

          {resultData && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-medium">
                {resultData.drawNo}회 데이터가 삽입되었습니다:
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                날짜: {resultData.date}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                번호: {resultData.numbers.join(", ")}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                보너스: {resultData.bonusNo}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}