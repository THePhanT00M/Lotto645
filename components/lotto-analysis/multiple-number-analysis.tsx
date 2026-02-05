"use client"

import { useState, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"
import type { MultipleNumberType, CommonProps } from "./types"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart3 } from "lucide-react"

interface MultipleNumberAnalysisProps extends CommonProps {
  multipleNumbers: MultipleNumberType[]
  isGenerating?: boolean // 스켈레톤 상태 제어를 위해 추가
}

export default function MultipleNumberAnalysis({ multipleNumbers, getBallColor, isGenerating }: MultipleNumberAnalysisProps) {
  // [수정] 5쌍둥이 타입 추가 및 기본값 설정 (원하면 기본값을 5쌍둥이로 변경 가능)
  const [currentMultipleType, setCurrentMultipleType] = useState<"5쌍둥이" | "4쌍둥이" | "3쌍둥이" | "2쌍둥이">("5쌍둥이")
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

  // 스켈레톤 로딩 상태 처리
  if (isGenerating) {
    return (
        <div className="p-4 bg-white dark:bg-[rgb(36,36,36)] rounded-lg border border-gray-200 dark:border-[rgb(36,36,36)] space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-4 w-full max-w-md mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
    )
  }

  return (
      <div className="p-4 bg-white dark:bg-[rgb(36,36,36)] rounded-lg border border-gray-200 dark:border-[rgb(36,36,36)]">
        {/* [수정] 모바일 레이아웃 대응: flex-col sm:flex-row 적용 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
          <div className="flex items-center">
            {/* [수정] 통계 아이콘으로 변경 (BarChart3) */}
            <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200">당첨 패턴 통계</h3>
          </div>

          {/* 필터 컨트롤 */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              {/* [추가] 5쌍둥이 버튼 */}
              <button
                  onClick={() => setCurrentMultipleType("5쌍둥이")}
                  className={`px-2 py-1 text-xs ${
                      currentMultipleType === "5쌍둥이"
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
              >
                5쌍둥이
              </button>
              <button
                  onClick={() => setCurrentMultipleType("4쌍둥이")}
                  className={`px-2 py-1 text-xs ${
                      currentMultipleType === "4쌍둥이"
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
              >
                4쌍둥이
              </button>
              <button
                  onClick={() => setCurrentMultipleType("3쌍둥이")}
                  className={`px-2 py-1 text-xs ${
                      currentMultipleType === "3쌍둥이"
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
              >
                3쌍둥이
              </button>
              <button
                  onClick={() => setCurrentMultipleType("2쌍둥이")}
                  className={`px-2 py-1 text-xs ${
                      currentMultipleType === "2쌍둥이"
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
              >
                2쌍둥이
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col relative z-10">
          <div className="flex justify-between items-center w-full gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-300 flex-1 leading-relaxed mt-2">
              선택한 번호에서 가능한 모든 조합과 각 조합이 과거에 등장한 횟수입니다.
            </p>
          </div>

          {/* 다중 번호 분석 영역 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto mt-4">
            {paginatedMultipleNumbers.map((item, index) => {
              return (
                  <div
                      key={index}
                      className={`flex flex-col p-3 rounded-lg border ${
                          item.count > 0
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50"
                              : "bg-white dark:bg-[#363636] border-gray-200 dark:border-[#464646]"
                      }`}
                  >
                    <div className="flex flex-wrap gap-1 mb-2 justify-center">
                      {item.numbers.map((num, idx) => (
                          <div
                              key={idx}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold dark:text-black"
                              style={{ backgroundColor: getBallColor(num) }}
                          >
                            {num}
                          </div>
                      ))}
                    </div>
                    <div
                        className={`text-xs font-medium text-center ${
                            item.count > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                        }`}
                    >
                      {item.count > 0 ? `${item.count}회 함께 등장` : "함께 등장한 적 없음"}
                    </div>

                    {/* 모든 쌍둥이 타입에 대해 등장 회차 정보 표시 */}
                    {item.count > 0 && (
                        <div className="mt-2 max-h-24 overflow-y-auto text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-md p-1">
                          {item.appearances.map((appearance, idx) => (
                              <div
                                  key={idx}
                                  className="flex justify-between items-center py-0.5 border-b border-gray-100 dark:border-gray-700 last:border-0"
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
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  총 {filteredMultipleNumbers.length}개 중 {currentPage * itemsPerPage + 1}-
                  {Math.min((currentPage + 1) * itemsPerPage, filteredMultipleNumbers.length)}개 표시
                </div>

                <div className={`flex items-center ${isMobile ? "justify-center mt-2" : ""}`}>
                  <button
                      onClick={() => setCurrentPage(0)}
                      disabled={currentPage === 0}
                      className={`p-1 rounded ${
                          currentPage === 0
                              ? "text-gray-300 dark:text-gray-600"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
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
                      className={`p-1 rounded ${
                          currentPage === 0
                              ? "text-gray-300 dark:text-gray-600"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
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

                  <div className="text-sm px-2 min-w-[60px] text-center text-gray-700 dark:text-gray-300">
                    {currentPage + 1} / {totalPages || 1}
                  </div>

                  <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className={`p-1 rounded ${
                          currentPage >= totalPages - 1
                              ? "text-gray-300 dark:text-gray-600"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
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
                          currentPage >= totalPages - 1
                              ? "text-gray-300 dark:text-gray-600"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
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

                <div className={`flex items-center ${isMobile ? "justify-center mt-2" : ""}`}>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">표시:</span>
                  <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value))
                        setCurrentPage(0)
                      }}
                      className="text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded p-1"
                  >
                    <option value="15">15개</option>
                    <option value="30">30개</option>
                    <option value="50">50개</option>
                  </select>
                </div>
              </div>
          )}

          {/* 다중 번호 통계 요약 - [수정] 4열 그리드 적용 */}
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-md text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
              <div>
                <div className="font-medium text-blue-700 dark:text-blue-400">5쌍둥이</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {multipleNumbers.filter((item) => item.type === "5쌍둥이" && item.count > 0).length}개 조합이 과거 당첨
                </div>
              </div>
              <div>
                <div className="font-medium text-blue-700 dark:text-blue-400">4쌍둥이</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {multipleNumbers.filter((item) => item.type === "4쌍둥이" && item.count > 0).length}개 조합이 과거 당첨
                </div>
              </div>
              <div>
                <div className="font-medium text-blue-700 dark:text-blue-400">3쌍둥이</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {multipleNumbers.filter((item) => item.type === "3쌍둥이" && item.count > 0).length}개 조합이 과거 당첨
                </div>
              </div>
              <div>
                <div className="font-medium text-blue-700 dark:text-blue-400">2쌍둥이</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {multipleNumbers.filter((item) => item.type === "2쌍둥이" && item.count > 0).length}개 조합이 과거 당첨
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}