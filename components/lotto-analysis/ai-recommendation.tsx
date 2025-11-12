"use client"

import { useState, useEffect } from "react"
import { Sparkles, Save, Check, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveLottoResult } from "@/utils/lotto-storage"
import AINumberDisplay from "@/components/lotto-analysis/ai-number-display"
import { useToast } from "@/hooks/use-toast" // 1. 토스트 훅 임포트

// --- 1단계: 타입 및 헬퍼 함수 (상위 컴포넌트에서 Props로 받음) ---
type Grade = "하" | "중하" | "보통" | "중" | "중상" | "상" | "최상"

type FrequencyMap = Map<number, number>
type StringFrequencyMap = Map<string, number>

// 2. AI 추천에 필요한 모든 통계 데이터를 정의하는 인터페이스
interface LottoAnalytics {
  numberFrequencies: FrequencyMap
  pairFrequencies: StringFrequencyMap
  tripletFrequencies: StringFrequencyMap
  quadrupletLastSeen: StringFrequencyMap
  recentFrequencies: FrequencyMap
  gapMap: FrequencyMap
  weightedNumberList: number[]
  sumStats: { mean: number; stdDev: number }
  oddEvenDistribution: StringFrequencyMap
  sectionDistribution: StringFrequencyMap
  consecutiveDistribution: StringFrequencyMap
  latestDrawNumbers: number[]
  latestDrawNo: number
  winningNumbersSet: Set<string>
}

// 3. 컴포넌트 Props 인터페이스 정의
interface AIRecommendationProps {
  analyticsData: LottoAnalytics
  generatedStats: FrequencyMap // [신규] AI 생성 통계 맵
  // [수정] calculateGrade -> calculateBalanceScore (숫자 반환)
  calculateBalanceScore: (numbers: number[], stats: LottoAnalytics) => number
  // [신규] 점수 -> 등급 변환 함수
  scoreToGrade: (score: number) => Grade
  getGradeColor: (grade: Grade) => string
  getGradeDescription: (grade: Grade) => string
  // AI 생성 헬퍼 함수들
  generateCombination: (weightedList: number[]) => number[]
  // [삭제] getGradeScore는 더 이상 필요 없음
  getPairScore: (numbers: number[], pairMap: StringFrequencyMap) => number
  getTripletScore: (numbers: number[], tripletMap: StringFrequencyMap) => number
  getRecentFrequencyScore: (numbers: number[], recentMap: FrequencyMap) => number
  getGapScore: (numbers: number[], gapMap: FrequencyMap) => number
  getQuadrupletScore: (
    numbers: number[],
    quadrupletLastSeen: StringFrequencyMap,
    latestDrawNo: number,
    recentThreshold: number,
  ) => number
  getAiPopularityScore: (numbers: number[], generatedStats: FrequencyMap) => number // [신규] 인기 점수 함수
  winningNumbersSet: Set<string>
  latestDrawNo: number
  // 콜백 함수들
  onRecommendationGenerated?: (numbers: number[]) => void
  onAnalyzeNumbers?: (numbers: number[]) => void
  isGenerating: boolean // 4. 상위 컴포넌트로부터 생성 시작 여부를 props로 받음
}

export default function AIRecommendation({
                                           analyticsData,
                                           generatedStats, // [신규] prop 받기
                                           calculateBalanceScore, // [수정]
                                           scoreToGrade,          // [신규]
                                           getGradeColor,
                                           getGradeDescription,
                                           generateCombination,
                                           // getGradeScore, // [삭제]
                                           getPairScore,
                                           getTripletScore,
                                           getRecentFrequencyScore,
                                           getGapScore,
                                           getQuadrupletScore,
                                           getAiPopularityScore, // [신규] prop 받기
                                           winningNumbersSet,
                                           latestDrawNo,
                                           onRecommendationGenerated,
                                           onAnalyzeNumbers,
                                           isGenerating,
                                         }: AIRecommendationProps) {
  // 5. 컴포넌트 내부 상태 변수들
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  const [isSaved, setIsSaved] = useState(false) // 6. [중요] 이 상태는 '로컬 저장' 여부만 추적
  const [aiGrade, setAiGrade] = useState<Grade | null>(null) // UI 표시용 등급
  const [aiScore, setAiScore] = useState<number | null>(null) // [신규] DB 저장용 세부 점수
  const { toast } = useToast() // 7. toast 훅 사용 선언

  /**
   * AI 추천 번호 생성 및 *자동 서버 저장*
   * "AI 추천 받기" 버튼 클릭 시 (isGenerating=true) 호출됩니다.
   */
  const generateAIRecommendation = async () => {
    // 1. (수행) 상태 초기화
    setIsSaved(false)
    setRecommendedNumbers([])
    setAiGrade(null)
    setAiScore(null) // [신규] 점수 상태 초기화

    // 2. (수행) UI 멈춤 방지를 위한 비동기 처리
    await new Promise((resolve) => setTimeout(resolve, 0))

    // 3. (수행) 10만번의 시뮬레이션을 통해 최적의 조합을 찾는 Promise 실행
    const finalCombination = await new Promise<number[]>((resolve) => {
      // 3-1. 분석 데이터 및 상수 설정
      const {
        weightedNumberList,
        pairFrequencies,
        tripletFrequencies,
        quadrupletLastSeen,
        recentFrequencies,
        gapMap,
        latestDrawNumbers,
      } = analyticsData

      const RECENT_THRESHOLD = 156 // 4쌍둥이 페널티 기준 (3년)
      const ITERATIONS = 100000 // 10만 번의 조합을 테스트
      const TOP_K = 50 // 상위 50개 조합 저장
      const topCandidates: { combination: number[]; score: number }[] = []

      // 3-2. (수행) 10만번 반복
      for (let i = 0; i < ITERATIONS; i++) {
        const currentNumbers = generateCombination(weightedNumberList)
        const combinationKey = currentNumbers.join("-")

        if (winningNumbersSet.has(combinationKey)) {
          continue
        }

        // --- [수정] 점수 계산 로직 변경 ---
        // 3-2-1. (수정) 밸런스 점수(0~200점)를 직접 계산
        const balanceScore = calculateBalanceScore(currentNumbers, analyticsData)

        // 3-2-2. (기존) 다른 점수들 계산
        const pairScore = getPairScore(currentNumbers, pairFrequencies)
        const tripletScore = getTripletScore(currentNumbers, tripletFrequencies)
        const quadrupletScore = getQuadrupletScore(
          currentNumbers,
          quadrupletLastSeen,
          latestDrawNo,
          RECENT_THRESHOLD,
        )
        const recentScore = getRecentFrequencyScore(currentNumbers, recentFrequencies)
        const gapScore = getGapScore(currentNumbers, gapMap)
        const carryOverCount = currentNumbers.filter(num => latestDrawNumbers.includes(num)).length;
        let carryOverScore = 0;
        if (carryOverCount === 0) carryOverScore = 20;
        else if (carryOverCount === 1) carryOverScore = 15;
        else if (carryOverCount === 2) carryOverScore = -10;
        else carryOverScore = -30;

        // 3-2-2-1. [신규] AI 인기 페널티/보너스 점수 계산
        const aiPopularityScore = getAiPopularityScore(currentNumbers, generatedStats)

        // 3-2-3. (수정) totalScore 가중치 조정 + [신규] AI 인기 점수 추가
        // aiPopularityScore에 가중치 0.1을 부여하고, pairScore 가중치를 0.30 -> 0.20으로 조정
        const totalScore =
          balanceScore * 0.08 +       // 밸런스 점수
          quadrupletScore * 0.1 +     // 4쌍둥이 페널티
          aiPopularityScore * 0.1 +   // [신규] AI 인기 페널티/보너스 (가중치 0.1)
          (pairScore / 150) * 50 * 0.20 + // [수정] 쌍둥이 점수 (가중치 0.30 -> 0.20)
          (tripletScore / 20) * 50 * 0.15 +
          (recentScore / 30) * 50 * 0.05 +
          (gapScore / 600) * 50 * 0.1 +
          (carryOverScore / 20) * 50 * 0.1;
        // ---------------------------------

        // 3-2-4. (기존) 상위 TOP_K 후보군 관리
        if (topCandidates.length < TOP_K) {
          topCandidates.push({ combination: currentNumbers, score: totalScore })
        } else {
          let minScore = topCandidates[0].score
          let minIndex = 0
          for (let j = 1; j < topCandidates.length; j++) {
            if (topCandidates[j].score < minScore) {
              minScore = topCandidates[j].score
              minIndex = j
            }
          }
          if (totalScore > minScore) {
            topCandidates[minIndex] = { combination: currentNumbers, score: totalScore }
          }
        }
      } // End of ITERATIONS loop

      // 3-3. (기존) 최종 조합 선택
      let combination: number[]
      if (topCandidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * topCandidates.length)
        combination = topCandidates[randomIndex].combination
      } else {
        combination = generateCombination(analyticsData.weightedNumberList)
      }

      // 3-4. (기존) 최종 조합 반환
      resolve(combination)
    })

    // --- 4단계: 결과 처리 및 *자동 서버 저장* ---
    // 4-1. [수정] 최종 밸런스 점수(숫자) 계산
    const finalBalanceScore = calculateBalanceScore(finalCombination, analyticsData)
    // 4-2. [신규] 밸런스 점수를 UI용 등급(문자열)으로 변환
    const finalGrade = scoreToGrade(finalBalanceScore)

    // 4-3. (수정) React 상태 업데이트 (UI 등급, DB용 점수 모두)
    setRecommendedNumbers(finalCombination)
    setAiGrade(finalGrade) // (UI용)
    setAiScore(finalBalanceScore) // (DB 저장용)

    // 4-4. [수정] 서버 DB에 자동으로 저장 (통계 수집용)
    try {
      // 4-4-1. /api/log-draw 엔드포인트 호출
      const response = await fetch('/api/log-draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numbers: finalCombination,   // 생성된 번호
          source: 'ai',                // 출처: 'ai'
          score: finalBalanceScore,    // [수정] 1점 단위의 세부 밸런스 점수
          // device_info와 ip_address는 API 서버가 담당
        }),
      });

      if (!response.ok) {
        // 4-4-2. API 호출 실패 시 에러 처리
        const result = await response.json();
        throw new Error(result.message || "서버 통계 저장 실패");
      }

      // 4-4-3. 서버 저장 성공 로그
      console.log("AI 추천 번호가 서버 통계 DB에 자동으로 저장되었습니다.");

    } catch (error: any) {
      // 4-4-4. (중요) 자동 저장이 실패해도 사용자 경험을 막지 않음.
      console.error("자동 서버 저장 실패:", error.message);
      toast({
        title: "서버 통계 자동 저장 실패",
        description: "AI 번호 생성은 완료되었으나, 서버 통계 기록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }

    // 4-5. (기존) 부모 컴포넌트(advanced-analysis)에 생성된 번호 전달
    if (onRecommendationGenerated) {
      onRecommendationGenerated(finalCombination);
    }
  };

  // 10. (기존) 'isGenerating' prop이 true가 되면 AI 추천 로직 실행
  useEffect(() => {
    if (isGenerating) {
      generateAIRecommendation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating])

  /**
   * [신규] "AI 번호 저장" 버튼 클릭 시 *로컬*에만 저장합니다.
   */
  const handleSaveToHistory = () => {
    // 1. (수행) 번호가 6개이고, 아직 (로컬)저장되지 않은 상태인지 확인
    if (recommendedNumbers.length === 6 && !isSaved) {

      // 2. (수행) 로컬 저장소에 저장 (사용자 히스토리 UI용)
      const localSaveSuccess = saveLottoResult(recommendedNumbers, true);

      if (localSaveSuccess) {
        // 3. (수행) 로컬 저장 성공 시, UI를 '저장됨'으로 변경
        setIsSaved(true);
        // 4. (수행) 로컬 저장 성공 토스트 알림
        toast({
          title: "기록 저장 완료",
          description: "AI 추천 번호가 '추첨 기록' 페이지에 저장되었습니다.",
        });
      } else {
        // 5. (수행) 로컬 저장 실패 시 (예: 5초 내 중복)
        toast({
          title: "저장 건너뜀",
          description: "이 번호는 이미 최근에 저장되었습니다.",
          variant: "destructive",
        });
      }
    }
  };

  /**
   * "당첨 패턴 보기" 버튼 클릭 시 (상위 컴포넌트로 이벤트 전달)
   */
  const handleAnalyzeAINumbers = () => {
    if (recommendedNumbers.length === 6 && onAnalyzeNumbers) {
      onAnalyzeNumbers(recommendedNumbers)
    }
  }

  // 11. (기존) AI 추천 번호가 생성되기 전에는 아무것도 렌더링하지 않음
  if (recommendedNumbers.length === 0) {
    return null
  }

  // 12. (기존) AI 추천 번호 카드 렌더링
  return (
    <div className="p-4 bg-gray-200 dark:bg-[rgb(36,36,36)] rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-gray-800 dark:text-gray-200">AI 번호 추천</h3>
        </div>
      </div>
      <div>
        {/* AI 등급 및 번호 표시 영역 */}
        <div className="bg-gray-100 dark:bg-[#363636] rounded-lg p-4 mt-4">
          <div className="flex flex-col mb-3">
            <div className="flex justify-between items-center w-full gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                과거 당첨 패턴과 함께 등장한 번호 분석을 기반으로 생성된 추천 번호입니다.
              </p>
              {/* AI 등급 표시 (UI용) */}
              {aiGrade && (
                <div
                  className={`px-3 py-1.5 rounded-lg font-semibold text-sm whitespace-nowrap ${getGradeColor(
                    aiGrade,
                  )}`}
                >
                  {aiGrade}
                </div>
              )}
            </div>
            {/* AI 등급 설명 */}
            {aiGrade && (
              <div className="text-xs p-2 bg-white dark:bg-[#464646] rounded-lg text-gray-700 dark:text-gray-200 mt-3">
                <p className="font-medium mb-1">추천 등급 안내 (밸런스 점수: {aiScore}점):</p> {/* [수정] 세부 점수 표시 */}
                <p>
                  • {aiGrade}: {getGradeDescription(aiGrade)}
                </p>
              </div>
            )}
          </div>
          {/* AI 추천 번호 표시 */}
          <AINumberDisplay numbers={recommendedNumbers} />

          <div className="mt-4 flex flex-col items-center gap-3 md:flex-row md:justify-between md:items-center md:gap-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              * 이 추천은 과거 데이터 패턴을 기반으로 하며, 당첨을 보장하지 않습니다.
            </div>
          </div>
        </div>
        {/* 버튼 영역 (당첨 패턴 보기 / AI 번호 저장) */}
        <div className="mt-3 flex justify-between">
          <Button
            onClick={handleAnalyzeAINumbers}
            variant="outline"
            className="bg-white dark:bg-[#464646] hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            당첨 패턴 보기
          </Button>
          {isSaved ? (
            // 13. [로컬] 저장이 완료되면 '기록 저장됨' 텍스트 표시
            <div className="text-sm text-green-600 flex items-center justify-center md:w-24 md:justify-end">
              <Check className="w-4 h-4 mr-1" />
              기록 저장됨
            </div>
          ) : (
            // 14. [로컬] 저장 전에는 'AI 번호 저장' 버튼 표시
            <Button
              onClick={handleSaveToHistory} // 15. [신규] 로컬 저장 전용 함수 연결
              className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white whitespace-nowrap"
            >
              <Save className="w-4 h-4 mr-1" />
              AI 번호 저장
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}