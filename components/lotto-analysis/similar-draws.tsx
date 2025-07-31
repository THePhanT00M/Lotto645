"use client"

import { Search, Target } from "lucide-react"
import type { SimilarDrawType, CommonProps } from "./types"

interface SimilarDrawsProps extends CommonProps {
  numbers: number[]
  similarDraws: SimilarDrawType[]
}

export default function SimilarDraws({ numbers, similarDraws, getBallColor }: SimilarDrawsProps) {
  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center mb-3">
        <Search className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="font-medium text-gray-800">유사한 과거 당첨 번호</h3>
      </div>
      {similarDraws.length > 0 ? (
        <div className="space-y-3">
          {similarDraws.map((draw) => (
            <div key={draw.drawNo} className="border border-gray-200 rounded-md p-3 bg-white">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium">
                  {draw.drawNo}회 ({draw.date})
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  <Target className="w-4 h-4 inline mr-1" />
                  {draw.matchCount}개 일치
                </div>
              </div>
              <div className="flex gap-2 max-w-xs mx-auto">
                {draw.numbers.map((number) => {
                  const isMatch = numbers.includes(number)
                  return (
                    <div
                      key={number}
                      className="relative w-full aspect-[1/1] rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: getBallColor(number) }}
                    >
                      {number}
                      {isMatch && (
                        <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full w-3.5 h-3.5 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5">
                            <path
                              fillRule="evenodd"
                              d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })}
                <div className="flex items-center mx-1">
                  <span className="text-gray-400">+</span>
                </div>
                <div
                  className="w-full aspect-[1/1] rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: getBallColor(draw.bonusNo) }}
                >
                  {draw.bonusNo}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-3">선택한 번호와 4개 이상 일치하는 과거 당첨 번호가 없습니다.</p>
      )}
    </div>
  )
}
