"use client"

import { useState, useEffect } from "react"
import type { WinningLottoNumbers } from "@/types/lotto" // 타입 import
import { supabase } from "@/lib/supabaseClient" // Supabase 클라이언트 import
import AdvancedAnalysis from "./lotto-analysis/advanced-analysis"
import { Skeleton } from "@/components/ui/skeleton" // 로딩 스켈레톤 추가

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

// [신규] 숫자별 빈도 맵 타입 (advanced-analysis.tsx와 동일하게)
type FrequencyMap = Map<number, number>

export default function LottoAnalysis({ numbers }: LottoAnalysisProps) {
  // DB에서 가져온 당첨 번호 상태
  const [winningNumbers, setWinningNumbers] = useState<WinningLottoNumbers[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // [수정] AI 생성 통계 상태 (유지)
  const [generatedStats, setGeneratedStats] = useState<FrequencyMap>(new Map())

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

  // [수정] Supabase에서 당첨 번호 데이터 및 API에서 생성 통계 가져오기
  useEffect(() => {
    const fetchAllData = async () => { // 1. 함수 이름 변경
      setIsLoading(true)

      // 2. (기존) winning_numbers 가져오기 (Supabase 클라이언트 사용)
      const { data, error } = await supabase
        .from("winning_numbers")
        .select("*")
        .order("drawNo", { ascending: true }) // 분석을 위해 오름차순으로 정렬

      if (error) {
        console.error("Error fetching winning numbers:", error)
        setWinningNumbers([])
      } else if (data) {
        setWinningNumbers(data as WinningLottoNumbers[])
      }

      // --- [수정] API를 통해 generated_numbers 통계 가져오기 ---
      try {
        // 3. [수정] /api/generated-stats 엔드포인트 호출
        const response = await fetch('/api/generated-stats');
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to fetch generated stats");
        }

        // 4. [수정] API에서 반환된 객체(stats)를 Map으로 변환
        const statsMap: FrequencyMap = new Map();
        if (result.stats) {
          for (const [key, value] of Object.entries(result.stats)) {
            statsMap.set(Number(key), value as number);
          }
        }

        // 5. [수정] 상태에 저장
        setGeneratedStats(statsMap);
        console.log(`Loaded ${result.count} 'ai' stats for upcoming draw ${result.upcomingDrawNo} via API.`);

      } catch (genError: any) {
        console.error("Error fetching generated_numbers stats via API:", genError.message);
        setGeneratedStats(new Map()); // 에러 시 빈 맵으로 초기화
      }
      // --- [수정] 로직 끝 ---

      setIsLoading(false)
    }

    fetchAllData() // 6. 통합된 함수 호출
  }, [])

  useEffect(() => {
    setAnalysisNumbers(numbers)
  }, [numbers])

  // winningNumbers 상태나 analysisNumbers 상태가 변경될 때 분석 함수 재실행
  useEffect(() => {
    if (analysisNumbers.length === 6 && winningNumbers.length > 0) {
      findSimilarDraws(analysisNumbers)
      setMultipleNumbers(findMultiplesFromSelectedNumbers(analysisNumbers))
    }
  }, [analysisNumbers, winningNumbers])

  const findSimilarDraws = (nums: number[]) => {
    // 선택한 번호와 유사한 과거 당첨 번호 찾기 (4개 이상 일치)
    const similar = winningNumbers // 이제 DB에서 가져온 상태 사용
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

            for (const draw of winningNumbers) { // DB 상태 사용
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

          for (const draw of winningNumbers) { // DB 상태 사용
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

        // 이 2쌍둥이 조합이 과거 당첨 번호에 몇 번 등장했는지 확인
        const appearances: { drawNo: number; date: string }[] = []

        for (const draw of winningNumbers) { // DB 상태 사용
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

  return (
    <div className="rounded-xl p-4 sm:p-6 bg-gray-100 dark:bg-[rgb(26,26,26)] ">
      <div className="mb-5">
        <p className="text-xl font-semibold text-black dark:text-white flex items-center gap-2 mb-0">번호 분석 결과</p>
      </div>

      {/* --- [기존] 스켈레톤 UI --- */}
      {isLoading ? (
        // 1. 메인 컨테이너 (로드 완료 시의 <AdvancedAnalysis /> 레이아웃 모방)
        <div className="space-y-6">

          {/* 2. "추첨 번호" 카드 스켈레톤 (AdvancedAnalysis의 첫 번째 카드 모방) */}
          <div className="p-4 bg-gray-200 dark:bg-[rgb(36,36,36)] rounded-lg space-y-4">
            {/* 2-1. 카드 제목 ("추첨 번호") */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded-full" /> {/* 아이콘 */}
              <Skeleton className="h-6 w-32" /> {/* 제목 */}
            </div>

            {/* 2-2. 등급 카드 */}
            <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 space-y-3">
              {/* 2-2-1. 등급 텍스트 및 뱃지 */}
              <div className="flex justify-between items-center gap-3">
                <Skeleton className="h-5 w-full max-w-sm" /> {/* 설명 텍스트 */}
                <Skeleton className="h-8 w-20 rounded-lg" /> {/* 등급 뱃지 */}
              </div>
              {/* 2-2-2. 등급 설명란 */}
              <div className="p-2 bg-white dark:bg-[#464646] rounded-lg space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
              {/* 2-2-3. 번호 표시기 (6개 공) */}
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

            {/* 2-3. 하단 버튼 2개 */}
            <div className="mt-3 flex justify-between">
              <Skeleton className="h-10 w-36 rounded-md" /> {/* "당첨 패턴 보기" 버튼 */}
              <Skeleton className="h-10 w-36 rounded-md" /> {/* "AI 추천 받기" 버튼 */}
            </div>
          </div>

          {/* 3. "당첨 패턴 통계" 카드 스켈레톤 (MultipleNumberAnalysis 카드 모방) */}
          <div className="p-4 bg-gray-200 dark:bg-[rgb(36,36,36)] rounded-lg space-y-3">
            {/* 3-1. 카드 제목 및 필터 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded-full" /> {/* 아이콘 */}
                <Skeleton className="h-6 w-40" /> {/* 제목 */}
              </div>
              <Skeleton className="h-8 w-48 rounded-md" /> {/* 쌍둥이 필터 */}
            </div>

            {/* 3-2. 내용물 카드 */}
            <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 mt-4 space-y-3">
              <Skeleton className="h-5 w-full max-w-md" /> {/* 설명 텍스트 */}

              {/* 3-2-1. 쌍둥이 분석 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
              </div>

              {/* 3-2-2. 페이지네이션 */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-8 w-24" />
              </div>

              {/* 3-2-3. 통계 요약 */}
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </div>
            </div>
          </div>

          {/* 4. 안내 문구 스켈레톤 */}
          <div className="bg-white dark:bg-[rgb(38,38,38)] rounded-lg p-4 mt-6 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>

        </div>
      ) : (
        // --- [기존] ---

        // 데이터 로드 완료 후 실제 컴포넌트 렌더링
        <AdvancedAnalysis
          numbers={analysisNumbers}
          userDrawnNumbers={numbers}
          winningNumbers={winningNumbers} // DB에서 가져온 데이터 전달
          generatedStats={generatedStats} // [신규] API로 가져온 AI 생성 통계 전달
          multipleNumbers={multipleNumbers}
          similarDraws={similarDraws}
          winningNumbersCount={winningNumbers.length}
          getBallColor={getBallColor}
          onNumbersChange={setAnalysisNumbers}
        />
      )}

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