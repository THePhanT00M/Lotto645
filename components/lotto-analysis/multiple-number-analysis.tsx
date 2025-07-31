"use client"

import { useState, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"
import type { MultipleNumberType, CommonProps } from "./types"

interface MultipleNumberAnalysisProps extends CommonProps {
  multipleNumbers: MultipleNumberType[]
}

export default function MultipleNumberAnalysis({ multipleNumbers, getBallColor }: MultipleNumberAnalysisProps) {
  const [currentMultipleType, setCurrentMultipleType] = useState<"2쌍둥이" | "3쌍둥이" | "4쌍둥이">("4쌍둥이")
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const isMobile = useMobile()

  // 현재 표시할 다중 번호 필터링 및 페이지네이션 적용
  const filteredMultipleNumbers = multipleNumbers.filter((item) => item.type === currentMultipleType)

  // 현재 페이지에 표시할 항목만 선택
  const paginatedMultipleNumbers = filteredMultipleNumbers.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage,
  )

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredMultipleNumbers.length / itemsPerPage)

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(0)
  }, [currentMultipleType])

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-600 mr-2"
          >
            <path d="M16 16v-4a4 4 0 0 0-8 0v4"></path>
            <path d="M12 12h8"></path>
            <path d="M8 12H4"></path>
            <path d="M4 8v8"></path>
            <path d="M20 8v8"></path>
            <path d="M8 16h8"></path>
          </svg>
          <h3 className="font-medium text-gray-800">다중 번호 분석</h3>
        </div>

        {/* 필터 컨트롤 */}
        <div className="flex items-center space-x-2">
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setCurrentMultipleType("4쌍둥이")}
              className={`px-2 py-1 text-xs ${
                currentMultipleType === "4쌍둥이" ? "bg-blue-100 text-blue-700" : "bg-white text-gray-700"
              }`}
            >
              4쌍둥이
            </button>
            <button
              onClick={() => setCurrentMultipleType("3쌍둥이")}
              className={`px-2 py-1 text-xs ${
                currentMultipleType === "3쌍둥이" ? "bg-blue-100 text-blue-700" : "bg-white text-gray-700"
              }`}
            >
              3쌍둥이
            </button>
            <button
              onClick={() => setCurrentMultipleType("2쌍둥이")}
              className={`px-2 py-1 text-xs ${
                currentMultipleType === "2쌍둥이" ? "bg-blue-100 text-blue-700" : "bg-white text-gray-700"
              }`}
            >
              2쌍둥이
            </button>
          </div>
        </div>
      </div>

      <p className="text-gray-700 mb-3">
        선택한 번호에서 가능한 모든 조합과 각 조합이 과거 당첨번호에 등장한 횟수입니다.
      </p>

      {/* 다중 번호 분석 영역 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1">
        {paginatedMultipleNumbers.map((item, index) => {
          return (
            <div
              key={index}
              className={`flex flex-col p-3 rounded-lg ${
                item.count > 0 ? "bg-blue-50 border border-blue-200" : "bg-white border border-gray-200"
              }`}
            >
              <div className="flex flex-wrap gap-1 mb-2 justify-center">
                {item.numbers.map((num, idx) => (
                  <div
                    key={idx}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: getBallColor(num) }}
                  >
                    {num}
                  </div>
                ))}
              </div>
              <div className={`text-xs font-medium text-center ${item.count > 0 ? "text-blue-600" : "text-gray-600"}`}>
                {item.count > 0 ? `${item.count}회 함께 등장` : "함께 등장한 적 없음"}
              </div>

              {/* 모든 쌍둥이 타입에 대해 등장 회차 정보 표시 */}
              {item.count > 0 && (
                <div className="mt-2 max-h-24 overflow-y-auto text-xs text-gray-500 bg-white rounded-md p-1">
                  {item.appearances.map((appearance, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-0.5 border-b border-gray-100 last:border-0"
                    >
                      <span>{appearance.drawNo}회</span>
                      <span>{appearance.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 페이지네이션 컨트롤 - 모바일 최적화 */}
      {totalPages > 1 && (
        <div className={`mt-4 ${isMobile ? "flex flex-col space-y-2" : "flex items-center justify-between"}`}>
          {/* 총 항목 수 정보 */}
          <div className="text-xs text-gray-500">
            총 {filteredMultipleNumbers.length}개 중 {currentPage * itemsPerPage + 1}-
            {Math.min((currentPage + 1) * itemsPerPage, filteredMultipleNumbers.length)}개 표시
          </div>

          {/* 페이지네이션 컨트롤 */}
          <div className={`flex items-center ${isMobile ? "justify-center mt-2" : ""}`}>
            <button
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
              className={`p-1 rounded ${currentPage === 0 ? "text-gray-300" : "text-gray-600 hover:bg-gray-200"}`}
              aria-label="첫 페이지"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="11 17 6 12 11 7"></polyline>
                <polyline points="18 17 13 12 18 7"></polyline>
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className={`p-1 rounded ${currentPage === 0 ? "text-gray-300" : "text-gray-600 hover:bg-gray-200"}`}
              aria-label="이전 페이지"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div className="text-sm px-2 min-w-[60px] text-center">
              {currentPage + 1} / {totalPages || 1}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1}
              className={`p-1 rounded ${
                currentPage >= totalPages - 1 ? "text-gray-300" : "text-gray-600 hover:bg-gray-200"
              }`}
              aria-label="다음 페이지"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className={`p-1 rounded ${
                currentPage >= totalPages - 1 ? "text-gray-300" : "text-gray-600 hover:bg-gray-200"
              }`}
              aria-label="마지막 페이지"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
            </button>
          </div>

          {/* 표시 항목 수 선택 */}
          <div className={`flex items-center ${isMobile ? "justify-center mt-2" : ""}`}>
            <span className="text-xs text-gray-500 mr-1">표시:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(0)
              }}
              className="text-xs border border-gray-300 rounded p-1"
              aria-label="페이지당 항목 수"
            >
              <option value="15">15개</option>
              <option value="30">30개</option>
              <option value="50">50개</option>
            </select>
          </div>
        </div>
      )}

      {/* 다중 번호 통계 요약 */}
      <div className="mt-3 p-3 bg-blue-50 rounded-md text-sm">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-medium text-blue-700">4쌍둥이</div>
            <div className="text-gray-600">
              {multipleNumbers.filter((item) => item.type === "4쌍둥이" && item.count > 0).length}개 조합이 과거 당첨
            </div>
          </div>
          <div>
            <div className="font-medium text-blue-700">3쌍둥이</div>
            <div className="text-gray-600">
              {multipleNumbers.filter((item) => item.type === "3쌍둥이" && item.count > 0).length}개 조합이 과거 당첨
            </div>
          </div>
          <div>
            <div className="font-medium text-blue-700">2쌍둥이</div>
            <div className="text-gray-600">
              {multipleNumbers.filter((item) => item.type === "2쌍둥이" && item.count > 0).length}개 조합이 과거 당첨
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
