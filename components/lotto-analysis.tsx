"use client"

import { useState, useEffect } from "react"
import { winningNumbers } from "@/data/winning-numbers"
import { Sparkles } from "lucide-react"
import AdvancedAnalysis from "./lotto-analysis/advanced-analysis"

interface LottoAnalysisProps {
  numbers: number[]
}

// 다중 번호 타입 정의 추가
type MultipleNumberType = {
  numbers: number[]
  count: number
  type: "2쌍둥이" | "3쌍둥이" | "4쌍둥이"
  appearances: {
    drawNo: number
    date: string
  }[]
}

export default function LottoAnalysis({ numbers }: LottoAnalysisProps) {
  // 유사한 당첨 번호 상태
  const [similarDraws, setSimilarDraws] = useState<
    {
      drawNo: number
      date: string
      numbers: number[]
      bonusNo: number
      matchCount: number
    }[]
  >([])

  // 다중 번호 상태
  const [multipleNumbers, setMultipleNumbers] = useState<MultipleNumberType[]>([])

  const [analysisNumbers, setAnalysisNumbers] = useState<number[]>(numbers)

  useEffect(() => {
    setAnalysisNumbers(numbers)
  }, [numbers])

  useEffect(() => {
    if (analysisNumbers.length === 6) {
      findSimilarDraws(analysisNumbers)
      setMultipleNumbers(findMultiplesFromSelectedNumbers(analysisNumbers))
    }
  }, [analysisNumbers])

  const findSimilarDraws = (nums: number[]) => {
    // 선택한 번호와 유사한 과거 당첨 번호 찾기 (4개 이상 일치)
    const similar = winningNumbers
      .map((draw) => {
        const matchCount = nums.filter((num) => draw.numbers.includes(num)).length
        return {
          ...draw,
          matchCount,
        }
      })
      .filter((draw) => draw.matchCount >= 4)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 5) // 상위 5개만 표시

    setSimilarDraws(similar)
  }

  // 선택한 번호에서 가능한 모든 조합을 찾고 과거 당첨 번호와 비교하는 함수
  const findMultiplesFromSelectedNumbers = (selectedNumbers: number[]) => {
    if (selectedNumbers.length !== 6) return []

    const sortedNumbers = [...selectedNumbers].sort((a, b) => a - b)
    const results: MultipleNumberType[] = []

    // 4쌍둥이 조합 생성 (6개 중 4개 선택 = 15가지 조합)
    for (let a = 0; a < sortedNumbers.length - 3; a++) {
      for (let b = a + 1; b < sortedNumbers.length - 2; b++) {
        for (let c = b + 1; c < sortedNumbers.length - 1; c++) {
          for (let d = c + 1; d < sortedNumbers.length; d++) {
            const quad = [sortedNumbers[a], sortedNumbers[b], sortedNumbers[c], sortedNumbers[d]]

            // 이 4쌍둥이 조합이 과거 당첨 번호에 몇 번 등장했는지 확인
            const appearances: { drawNo: number; date: string }[] = []

            for (const draw of winningNumbers) {
              // 4개 번호가 모두 포함되어 있는지 확인
              if (quad.every((num) => draw.numbers.includes(num))) {
                appearances.push({
                  drawNo: draw.drawNo,
                  date: draw.date,
                })
              }
            }

            // 결과에 추가 (등장 횟수가 0이어도 추가)
            results.push({
              numbers: quad,
              count: appearances.length,
              appearances: appearances.sort((a, b) => b.drawNo - a.drawNo), // 최신순 정렬
              type: "4쌍둥이",
            })
          }
        }
      }
    }

    // 3쌍둥이 조합 생성 (6개 중 3개 선택 = 20가지 조합)
    for (let a = 0; a < sortedNumbers.length - 2; a++) {
      for (let b = a + 1; b < sortedNumbers.length - 1; b++) {
        for (let c = b + 1; c < sortedNumbers.length; c++) {
          const triplet = [sortedNumbers[a], sortedNumbers[b], sortedNumbers[c]]

          // 이 3쌍둥이 조합이 과거 당첨 번호에 몇 번 등장했는지 확인
          const appearances: { drawNo: number; date: string }[] = []

          for (const draw of winningNumbers) {
            // 3개 번호가 모두 포함되어 있는지 확인
            if (triplet.every((num) => draw.numbers.includes(num))) {
              appearances.push({
                drawNo: draw.drawNo,
                date: draw.date,
              })
            }
          }

          // 결과에 추가 (등장 횟수가 0이어도 추가)
          results.push({
            numbers: triplet,
            count: appearances.length,
            appearances: appearances.sort((a, b) => b.drawNo - a.drawNo), // 최신순 정렬
            type: "3쌍둥이",
          })
        }
      }
    }

    // 2쌍둥이 조합 생성 (6개 중 2개 선택 = 15가지 조합)
    for (let a = 0; a < sortedNumbers.length - 1; a++) {
      for (let b = a + 1; b < sortedNumbers.length; b++) {
        const pair = [sortedNumbers[a], sortedNumbers[b]]

        // 이 2쌍둥이 조합이 과거 당첨 번호에 몇 번 등장했는지 인
        const appearances: { drawNo: number; date: string }[] = []

        for (const draw of winningNumbers) {
          // 2개 번호가 모두 포함되어 있는지 확인
          if (pair.every((num) => draw.numbers.includes(num))) {
            appearances.push({
              drawNo: draw.drawNo,
              date: draw.date,
            })
          }
        }

        // 결과에 추가 (등장 횟수가 0이어도 추가)
        results.push({
          numbers: pair,
          count: appearances.length,
          appearances: appearances.sort((a, b) => b.drawNo - a.drawNo), // 최신순 정렬
          type: "2쌍둥이",
        })
      }
    }

    // 결과를 타입별로 정렬하고, 같은 타입 내에서는 출현 횟수로 정렬
    return results.sort((a, b) => {
      // 먼저 타입별로 정렬 (4쌍둥이 > 3쌍둥이 > 2쌍둥이)
      const typeOrder = { "4쌍둥이": 0, "3쌍둥이": 1, "2쌍둥이": 2 }
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type]
      }

      // 같은 타입 내에서는 출현 횟수로 정렬
      return b.count - a.count
    })
  }

  const getBallColor = (number: number) => {
    if (number >= 1 && number <= 10) return "#fbc400"
    if (number >= 11 && number <= 20) return "#69c8f2"
    if (number >= 21 && number <= 30) return "#ff7272"
    if (number >= 31 && number <= 40) return "#aaa"
    if (number >= 41 && number <= 45) return "#b0d840"
    return "#000"
  }

  // 원래 번호와 현재 분석 번호가 다른지 확인하는 함수
  const isAnalyzingDifferentNumbers = () => {
    if (numbers.length !== analysisNumbers.length) return true
    const sortedOriginal = [...numbers].sort((a, b) => a - b)
    const sortedCurrent = [...analysisNumbers].sort((a, b) => a - b)
    return !sortedOriginal.every((num, index) => num === sortedCurrent[index])
  }

  // 원래 번호로 돌아가는 함수
  const resetToOriginalNumbers = () => {
    setAnalysisNumbers(numbers)
  }

  return (
    <div className="rounded-xl p-4 sm:p-6 bg-gray-100 dark:bg-[rgb(26,26,26)] ">
      <div className="mb-5">
        <p className="text-xl font-semibold text-black dark:text-white flex items-center gap-2 mb-0">번호 분석 결과</p>
      </div>

      {isAnalyzingDifferentNumbers() && (
        <div className="mb-4">
          <button
            onClick={resetToOriginalNumbers}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-100 bg-gray-200 dark:bg-[rgb(36,36,36)] border-gray-200 dark:border-[rgb(68,68,68)] hover:bg-gray-300 dark:hover:bg-[#363636] hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            원래 추첨 번호로 돌아가기
          </button>
        </div>
      )}

      <AdvancedAnalysis
        numbers={analysisNumbers}
        multipleNumbers={multipleNumbers}
        similarDraws={similarDraws}
        winningNumbersCount={winningNumbers.length}
        getBallColor={getBallColor}
        onNumbersChange={setAnalysisNumbers}
      />

      <div className="bg-white dark:bg-[rgb(38,38,38)] rounded-lg p-4 mt-6 text-sm text-gray-700 dark:text-gray-200">
        <p>
          * 이 분석은 과거 {winningNumbers.length}회의 실제 로또 당첨번호를 기반으로 합니다. 통계 데이터는 참고용으로만
          사용하시기 바랍니다.
        </p>
        <p className="mt-1">
          * 로또 번호는 매 회차마다 무작위로 추첨되며, 과거의 통계가 미래 당첨 확률에 영향을 미치지 않습니다.
        </p>
      </div>
    </div>
  )
}
