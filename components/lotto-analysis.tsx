"use client"

import { useState, useEffect } from "react"
import type { WinningLottoNumbers } from "@/types/lotto"
import { supabase } from "@/lib/supabaseClient"
import AdvancedAnalysis from "./lotto-analysis/advanced-analysis"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Info } from "lucide-react"

interface LottoAnalysisProps {
  numbers: number[]
}

// 다중 번호 타입 정의
type MultipleNumberType = {
  numbers: number[]
  count: number
  type: "2쌍둥이" | "3쌍둥이" | "4쌍둥이" | "5쌍둥이"
  appearances: {
    drawNo: number
    date: string
  }[]
}

export default function LottoAnalysis({ numbers }: LottoAnalysisProps) {
  const [winningNumbers, setWinningNumbers] = useState<WinningLottoNumbers[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [similarDraws, setSimilarDraws] = useState<
      {
        drawNo: number
        date: string
        numbers: number[]
        bonusNo: number
        matchCount: number
      }[]
  >([])
  const [multipleNumbers, setMultipleNumbers] = useState<MultipleNumberType[]>([])
  const [analysisNumbers, setAnalysisNumbers] = useState<number[]>(numbers)

  useEffect(() => {
    const fetchWinningNumbers = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
          .from("winning_numbers")
          .select("*")
          .order("drawNo", { ascending: true })

      if (error) {
        console.error("Error fetching winning numbers:", error)
        setWinningNumbers([])
      } else if (data) {
        setWinningNumbers(data as WinningLottoNumbers[])
      }
      setIsLoading(false)
    }
    fetchWinningNumbers()
  }, [])

  useEffect(() => {
    setAnalysisNumbers(numbers)
  }, [numbers])

  useEffect(() => {
    if (analysisNumbers.length === 6 && winningNumbers.length > 0) {
      findSimilarDraws(analysisNumbers)
      setMultipleNumbers(findMultiplesFromSelectedNumbers(analysisNumbers))
    }
  }, [analysisNumbers, winningNumbers])

  const findSimilarDraws = (nums: number[]) => {
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
        .slice(0, 5)

    setSimilarDraws(similar)
  }

  // 선택한 번호에서 가능한 모든 조합을 찾고 과거 당첨 번호와 비교하는 함수
  const findMultiplesFromSelectedNumbers = (selectedNumbers: number[]) => {
    if (selectedNumbers.length !== 6) return []

    const sortedNumbers = [...selectedNumbers].sort((a, b) => a - b)
    const results: MultipleNumberType[] = []

    // 헬퍼 함수: 특정 조합이 과거 메인 번호(6개)와 몇 번 일치했는지 계산
    const getAppearances = (subSet: number[]) => {
      const appearances: { drawNo: number; date: string }[] = []
      for (const draw of winningNumbers) {
        // [수정] 보너스 번호를 제외한 메인 당첨 번호 6개에서만 검색
        if (subSet.every((num) => draw.numbers.includes(num))) {
          appearances.push({
            drawNo: draw.drawNo,
            date: draw.date,
          })
        }
      }
      return appearances
    }

    // 5쌍둥이 조합 생성
    for (let a = 0; a < sortedNumbers.length - 4; a++) {
      for (let b = a + 1; b < sortedNumbers.length - 3; b++) {
        for (let c = b + 1; c < sortedNumbers.length - 2; c++) {
          for (let d = c + 1; d < sortedNumbers.length - 1; d++) {
            for (let e = d + 1; e < sortedNumbers.length; e++) {
              const quint = [sortedNumbers[a], sortedNumbers[b], sortedNumbers[c], sortedNumbers[d], sortedNumbers[e]]
              const appearances = getAppearances(quint)
              results.push({
                numbers: quint,
                count: appearances.length,
                appearances: appearances.sort((a, b) => b.drawNo - a.drawNo),
                type: "5쌍둥이",
              })
            }
          }
        }
      }
    }

    // 4쌍둥이 조합 생성
    for (let a = 0; a < sortedNumbers.length - 3; a++) {
      for (let b = a + 1; b < sortedNumbers.length - 2; b++) {
        for (let c = b + 1; c < sortedNumbers.length - 1; c++) {
          for (let d = c + 1; d < sortedNumbers.length; d++) {
            const quad = [sortedNumbers[a], sortedNumbers[b], sortedNumbers[c], sortedNumbers[d]]
            const appearances = getAppearances(quad)
            results.push({
              numbers: quad,
              count: appearances.length,
              appearances: appearances.sort((a, b) => b.drawNo - a.drawNo),
              type: "4쌍둥이",
            })
          }
        }
      }
    }

    // 3쌍둥이 조합 생성
    for (let a = 0; a < sortedNumbers.length - 2; a++) {
      for (let b = a + 1; b < sortedNumbers.length - 1; b++) {
        for (let c = b + 1; c < sortedNumbers.length; c++) {
          const triplet = [sortedNumbers[a], sortedNumbers[b], sortedNumbers[c]]
          const appearances = getAppearances(triplet)
          results.push({
            numbers: triplet,
            count: appearances.length,
            appearances: appearances.sort((a, b) => b.drawNo - a.drawNo),
            type: "3쌍둥이",
          })
        }
      }
    }

    // 2쌍둥이 조합 생성
    for (let a = 0; a < sortedNumbers.length - 1; a++) {
      for (let b = a + 1; b < sortedNumbers.length; b++) {
        const pair = [sortedNumbers[a], sortedNumbers[b]]
        const appearances = getAppearances(pair)
        results.push({
          numbers: pair,
          count: appearances.length,
          appearances: appearances.sort((a, b) => b.drawNo - a.drawNo),
          type: "2쌍둥이",
        })
      }
    }

    return results.sort((a, b) => {
      const typeOrder = { "5쌍둥이": 0, "4쌍둥이": 1, "3쌍둥이": 2, "2쌍둥이": 3 }
      // @ts-ignore
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        // @ts-ignore
        return typeOrder[a.type] - typeOrder[b.type]
      }
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

  return (
      <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f] space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">추천 번호 정보</h2>
        </div>

        {isLoading ? (
            <div className="space-y-6">
              <div className="p-4 bg-gray-200 dark:bg-[rgb(36,36,36)] rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center gap-3">
                    <Skeleton className="h-5 w-full max-w-sm" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                  <div className="p-2 bg-white dark:bg-[#464646] rounded-lg space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="pt-4 pb-4 pl-2 pr-2">
                    <div className="flex max-w-xs mx-auto gap-2">
                      <Skeleton className="w-full aspect-square rounded-full" />
                      <Skeleton className="w-full aspect-square rounded-full" />
                      <Skeleton className="w-full aspect-square rounded-full" />
                      <Skeleton className="w-full aspect-square rounded-full" />
                      <Skeleton className="w-full aspect-square rounded-full" />
                      <Skeleton className="w-full aspect-square rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-between">
                  <Skeleton className="h-10 w-36 rounded-md" />
                  <Skeleton className="h-10 w-36 rounded-md" />
                </div>
              </div>
              <div className="p-4 bg-gray-200 dark:bg-[rgb(36,36,36)] rounded-lg space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <Skeleton className="h-6 w-40" />
                  </div>
                  <Skeleton className="h-8 w-48 rounded-md" />
                </div>
                <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 mt-4 space-y-3">
                  <Skeleton className="h-5 w-full max-w-md" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    <Skeleton className="h-20 rounded-lg" />
                    <Skeleton className="h-20 rounded-lg" />
                    <Skeleton className="h-20 rounded-lg" />
                    <Skeleton className="h-20 rounded-lg" />
                    <Skeleton className="h-20 rounded-lg" />
                    <Skeleton className="h-20 rounded-lg" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <Skeleton className="h-10" />
                      <Skeleton className="h-10" />
                      <Skeleton className="h-10" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-[rgb(38,38,38)] rounded-lg p-4 mt-6 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
        ) : (
            <AdvancedAnalysis
                numbers={analysisNumbers}
                userDrawnNumbers={numbers}
                winningNumbers={winningNumbers}
                multipleNumbers={multipleNumbers}
                similarDraws={similarDraws}
                winningNumbersCount={winningNumbers.length}
                getBallColor={getBallColor}
                onNumbersChange={setAnalysisNumbers}
            />
        )}

        <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
            <p className="font-semibold text-amber-900 dark:text-amber-100">분석 유의사항</p>
            <p className="opacity-90">
              이 분석은 과거 <span className="font-medium">{winningNumbers.length}회</span>의 실제 로또 당첨번호를 기반으로 합니다.
              통계 데이터는 참고용으로만 사용하시기 바랍니다.
            </p>
            <p className="opacity-90">
              로또 번호는 매 회차마다 무작위로 추첨되며, <span className="font-medium">과거의 통계가 미래 당첨 확률에 영향을 미치지 않습니다.</span>
            </p>
          </div>
        </div>
      </div>
  )
}