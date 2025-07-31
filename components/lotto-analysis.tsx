"use client"

import { useState, useEffect } from "react"
import { winningNumbers } from "@/data/winning-numbers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Sparkles } from "lucide-react"
import BasicAnalysis from "./lotto-analysis/basic-analysis"
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
  const [activeTab, setActiveTab] = useState("basic")
  const [analysis, setAnalysis] = useState({
    sumAnalysis: "",
    rangeAnalysis: "",
    oddEvenAnalysis: "",
    consecutiveAnalysis: "",
    frequencyAnalysis: "",
    historyAnalysis: null as {
      matchFound: boolean
      message: string
      drawNo?: number
      date?: string
    } | null,
  })

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
      analyzeNumbers(analysisNumbers)
      findSimilarDraws(analysisNumbers)
      setMultipleNumbers(findMultiplesFromSelectedNumbers(analysisNumbers))
    }
  }, [analysisNumbers])

  const analyzeNumbers = (nums: number[]) => {
    // 1. 합계 분석
    const sum = nums.reduce((acc, num) => acc + num, 0)

    // 실제 역대 당첨번호의 합계 범위 계산
    const historicalSums = winningNumbers.map((draw) => draw.numbers.reduce((acc, num) => acc + num, 0))

    const minSum = Math.min(...historicalSums)
    const maxSum = Math.max(...historicalSums)
    const avgSum = Math.round(historicalSums.reduce((acc, sum) => acc + sum, 0) / historicalSums.length)

    // 표준편차 계산
    const sumSquareDiffs = historicalSums.reduce((acc, sum) => acc + Math.pow(sum - avgSum, 2), 0)
    const stdDev = Math.round(Math.sqrt(sumSquareDiffs / historicalSums.length))

    // 일반적인 범위 (평균 ± 1 표준편차)
    const lowerBound = avgSum - stdDev
    const upperBound = avgSum + stdDev

    let sumAnalysis = ""
    if (sum < lowerBound) {
      sumAnalysis = `선택한 번호의 합은 ${sum}으로, 평균(${avgSum})보다 낮습니다. 역대 당첨번호의 합은 대부분 ${lowerBound}~${upperBound} 사이에 분포하며, 최소 ${minSum}에서 최대 ${maxSum}까지 기록되었습니다.`
    } else if (sum > upperBound) {
      sumAnalysis = `선택한 번호의 합은 ${sum}으로, 평균(${avgSum})보다 높습니다. 역대 당첨번호의 합은 대부분 ${lowerBound}~${upperBound} 사이에 분포하며, 최소 ${minSum}에서 최대 ${maxSum}까지 기록되었습니다.`
    } else {
      sumAnalysis = `선택한 번호의 합은 ${sum}으로, 역대 당첨번호의 일반적인 범위(${lowerBound}~${upperBound}) 내에 있습니다. 역대 평균은 ${avgSum}이며, 최소 ${minSum}에서 최대 ${maxSum}까지 기록되었습니다.`
    }

    // 2. 번호 범위 분석
    const ranges = [
      { name: "1-10", count: 0 },
      { name: "11-20", count: 0 },
      { name: "21-30", count: 0 },
      { name: "31-40", count: 0 },
      { name: "41-45", count: 0 },
    ]

    nums.forEach((num) => {
      if (num >= 1 && num <= 10) ranges[0].count++
      else if (num >= 11 && num <= 20) ranges[1].count++
      else if (num >= 21 && num <= 30) ranges[2].count++
      else if (num >= 31 && num <= 40) ranges[3].count++
      else if (num >= 41 && num <= 45) ranges[4].count++
    })

    const rangeText = ranges
      .filter((r) => r.count > 0)
      .map((r) => `${r.name}번대 ${r.count}개`)
      .join(", ")

    let rangeAnalysis = `선택한 번호의 범위 분포: ${rangeText}. `

    // 균형 분석 추가
    const filledRanges = ranges.filter((r) => r.count > 0).length
    if (filledRanges <= 2) {
      rangeAnalysis += "번호가 일부 범위에 집중되어 있습니다. 더 다양한 범위의 번호를 선택하는 것이 일반적입니다."
    } else if (filledRanges >= 4) {
      rangeAnalysis += "번호가 다양한 범위에 골고루 분포되어 있습니다."
    } else {
      rangeAnalysis += "번호 분포가 적절합니다."
    }

    // 3. 홀짝 분석
    const oddCount = nums.filter((num) => num % 2 === 1).length
    const evenCount = nums.filter((num) => num % 2 === 0).length
    let oddEvenAnalysis = `선택한 번호는 홀수 ${oddCount}개, 짝수 ${evenCount}개로 구성되어 있습니다. `

    if (oddCount === 6 || evenCount === 6) {
      oddEvenAnalysis += "모두 홀수 또는 짝수로만 구성된 번호는 당첨 확률이 매우 낮습니다."
    } else if (oddCount === 5 || evenCount === 5) {
      oddEvenAnalysis += "홀짝 비율이 5:1 또는 1:5인 경우는 드물게 당첨됩니다."
    } else if (oddCount === 3 && evenCount === 3) {
      oddEvenAnalysis += "홀짝 비율이 3:3으로 가장 이상적인 균형을 이루고 있습니다."
    } else {
      oddEvenAnalysis += "홀짝 비율이 4:2 또는 2:4로 적절한 균형을 이루고 있습니다."
    }

    // 4. 연속 번호 분석
    const sortedNums = [...nums].sort((a, b) => a - b)
    let consecutiveCount = 0
    for (let i = 0; i < sortedNums.length - 1; i++) {
      if (sortedNums[i + 1] - sortedNums[i] === 1) {
        consecutiveCount++
      }
    }

    let consecutiveAnalysis = ""
    if (consecutiveCount === 0) {
      consecutiveAnalysis = "선택한 번호에는 연속된 숫자가 없습니다."
    } else if (consecutiveCount === 1) {
      consecutiveAnalysis = "선택한 번호에는 1쌍의 연속된 숫자가 있습니다."
    } else if (consecutiveCount >= 4) {
      consecutiveAnalysis = `선택한 번호에는 ${consecutiveCount}개의 연속된 숫자가 있습니다. 이렇게 많은 연속 번호는 드물게 당첨됩니다.`
    } else {
      consecutiveAnalysis = `선택한 번호에는 ${consecutiveCount}쌍의 연속된 숫자가 있습니다.`
    }

    // 5. 빈도 분석
    const frequencyCounts: Record<number, number> = {}
    winningNumbers.forEach((draw) => {
      draw.numbers.forEach((num) => {
        frequencyCounts[num] = (frequencyCounts[num] || 0) + 1
      })
    })

    const totalDraws = winningNumbers.length
    const selectedFrequencies = nums.map((num) => ({
      number: num,
      count: frequencyCounts[num] || 0,
      frequency: (frequencyCounts[num] || 0) / totalDraws,
    }))

    // 평균 빈도 계산
    const avgFrequency = selectedFrequencies.reduce((acc, item) => acc + item.frequency, 0) / 6

    let frequencyAnalysis = ""
    if (avgFrequency > 0.15) {
      frequencyAnalysis = "선택한 번호들은 과거에 평균보다 자주 당첨된 번호들입니다."
    } else if (avgFrequency < 0.12) {
      frequencyAnalysis = "선택한 번호들은 과거에 평균보다 적게 당첨된 번호들입니다."
    } else {
      frequencyAnalysis = "선택한 번호들의 과거 당첨 빈도는 평균적입니다."
    }

    // 가장 많이/적게 나온 번호 추가
    const mostFrequent = selectedFrequencies.sort((a, b) => b.count - a.count)[0]
    const leastFrequent = selectedFrequencies.sort((a, b) => a.count - b.count)[0]
    frequencyAnalysis += ` 선택한 번호 중 ${mostFrequent.number}번이 가장 자주 당첨되었고(${mostFrequent.count}회), ${leastFrequent.number}번이 가장 적게 당첨되었습니다(${leastFrequent.count}회).`

    // 6. 역대 당첨 번호와 비교
    let historyAnalysis = null
    const sortedNumbers = [...nums].sort((a, b) => a - b)

    // 정확히 일치하는 당첨번호 찾기
    const matchingDraw = winningNumbers.find((draw) => {
      const drawNumbers = [...draw.numbers].sort((a, b) => a - b)
      return drawNumbers.every((num, index) => num === sortedNumbers[index])
    })

    if (matchingDraw) {
      const { drawNo, date } = matchingDraw
      historyAnalysis = {
        matchFound: true,
        message: `주의! 이 번호는 과거 ${drawNo}회차(${date})에 당첨된 번호와 동일합니다. 역대 1등 당첨번호는 지금까지 다시 당첨된 적이 없습니다.`,
        drawNo: drawNo,
        date: date,
      }
    }

    setAnalysis({
      sumAnalysis,
      rangeAnalysis,
      oddEvenAnalysis,
      consecutiveAnalysis,
      frequencyAnalysis,
      historyAnalysis,
    })
  }

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">번호 분석 결과</h2>
      {isAnalyzingDifferentNumbers() && (
        <div className="mb-4">
          <button
            onClick={resetToOriginalNumbers}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            원래 추첨 번호로 돌아가기
          </button>
        </div>
      )}

      <Tabs defaultValue="basic" className="w-full" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="basic" className="flex items-center gap-1">
            <BarChart className="w-4 h-4" />
            <span>일반 분석</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            <span>고급 분석</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" key={`basic-${activeTab}`}>
          <BasicAnalysis analysis={analysis} />
        </TabsContent>

        <TabsContent value="advanced" key={`advanced-${activeTab}`}>
          <AdvancedAnalysis
            numbers={analysisNumbers}
            multipleNumbers={multipleNumbers}
            similarDraws={similarDraws}
            winningNumbersCount={winningNumbers.length}
            getBallColor={getBallColor}
            onNumbersChange={setAnalysisNumbers}
          />
        </TabsContent>
      </Tabs>

      <div className="bg-gray-50 rounded-xl p-4 mt-6 text-sm text-gray-500">
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
