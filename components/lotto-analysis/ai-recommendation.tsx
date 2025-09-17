"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, RefreshCw, Brain, Cpu, Settings } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import type { MultipleNumberType, SimilarDrawType, CommonProps } from "./types"
import { useLottoRecommendation } from "@/hooks/use-lotto-recommendation"
import { useDeepLearningRecommendation } from "@/hooks/use-deep-learning-recommendation"
import { RecommendationBadge } from "./recommendation-badge"
import { LottoBalls } from "./lotto-balls"
import { SaveRecommendationButton } from "./save-recommendation-button"
import { TrainingProgress } from "./training-progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { winningNumbers } from "@/data/winning-numbers"
import { ModelManagement } from "./model-management"

interface AIRecommendationProps extends CommonProps {
  numbers: number[]
  multipleNumbers: MultipleNumberType[]
  similarDraws: SimilarDrawType[]
  onRecommendationGenerated?: (numbers: number[]) => void
  forceRefresh?: number // 강제 새로고침을 위한 prop 추가
  onApplyToAnalysis?: (numbers: number[]) => void // 분석에 적용하기 위한 함수 추가
}

export default function AIRecommendation({
  numbers,
  multipleNumbers,
  similarDraws,
  getBallColor,
  onRecommendationGenerated,
  forceRefresh,
  onApplyToAnalysis,
}: AIRecommendationProps) {
  const isMobile = useMobile()
  const [activeTab, setActiveTab] = useState<string>("algorithm")
  const [showModelManagement, setShowModelManagement] = useState(false)

  // 알고리즘 기반 추천
  const {
    recommendedNumbers: algorithmNumbers,
    isGenerating: isAlgorithmGenerating,
    isSaved: isAlgorithmSaved,
    setIsSaved: setAlgorithmSaved,
    recommendationQuality: algorithmQuality,
    generateRecommendedNumbers: generateAlgorithmNumbers,
  } = useLottoRecommendation(
    multipleNumbers,
    similarDraws,
    (numbers) => {
      if (activeTab === "algorithm" && onRecommendationGenerated) {
        onRecommendationGenerated(numbers)
      }
    },
    forceRefresh,
  )

  // 딥러닝 기반 추천
  const {
    recommendedNumbers: deepLearningNumbers,
    isGenerating: isDeepLearningGenerating,
    isSaved: isDeepLearningSaved,
    setIsSaved: setDeepLearningSaved,
    recommendationQuality: deepLearningQuality,
    generateRecommendedNumbers: generateDeepLearningNumbers,
    isModelTrained,
    isTraining,
    trainingProgress,
    startTraining,
    resetTraining,
  } = useDeepLearningRecommendation((numbers) => {
    if (activeTab === "deeplearning" && onRecommendationGenerated) {
      onRecommendationGenerated(numbers)
    }
  }, forceRefresh)

  // 현재 활성화된 탭에 따라 표시할 데이터 선택
  const currentNumbers = activeTab === "algorithm" ? algorithmNumbers : deepLearningNumbers
  const isGenerating = activeTab === "algorithm" ? isAlgorithmGenerating : isDeepLearningGenerating
  const isSaved = activeTab === "algorithm" ? isAlgorithmSaved : isDeepLearningSaved
  const setIsSaved = activeTab === "algorithm" ? setAlgorithmSaved : setDeepLearningSaved
  const recommendationQuality = activeTab === "algorithm" ? algorithmQuality : deepLearningQuality
  const generateRecommendedNumbers = activeTab === "algorithm" ? generateAlgorithmNumbers : generateDeepLearningNumbers

  // 탭 변경 핸들러
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // 탭 변경 시 해당 탭의 추천 번호를 onRecommendationGenerated에 전달
    if (value === "algorithm" && algorithmNumbers && algorithmNumbers.length > 0 && onRecommendationGenerated) {
      onRecommendationGenerated(algorithmNumbers)
    } else if (
      value === "deeplearning" &&
      deepLearningNumbers &&
      deepLearningNumbers.length > 0 &&
      onRecommendationGenerated
    ) {
      onRecommendationGenerated(deepLearningNumbers)
    }
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-gray-800">AI 번호 추천</h3>
          {activeTab === "deeplearning" && (
            <Button
              onClick={() => setShowModelManagement(!showModelManagement)}
              variant="ghost"
              size="sm"
              className="ml-2 p-1 h-8 w-8 text-gray-500 hover:text-gray-700"
              title="모델 관리"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
        <Button
          onClick={generateRecommendedNumbers}
          disabled={isGenerating || (activeTab === "deeplearning" && !isModelTrained)}
          size="sm"
          className={activeTab === "algorithm" ? "bg-blue-500 hover:bg-blue-600" : "bg-purple-600 hover:bg-purple-700"}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
          다시 추천
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="algorithm" className="flex items-center">
            <Cpu className="w-4 h-4 mr-1" />
            알고리즘 기반
          </TabsTrigger>
          <TabsTrigger value="deeplearning" className="flex items-center">
            <Brain className="w-4 h-4 mr-1" />
            딥러닝 기반
          </TabsTrigger>
        </TabsList>

        <TabsContent value="algorithm">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex flex-col mb-2">
              <div className="flex justify-between items-center w-full">
                <p className="text-sm text-gray-600 max-w-[75%]">
                  과거 당첨 패턴과 함께 등장한 번호 분석을 기반으로 생성된 추천 번호입니다.
                </p>
                <div className="flex-shrink-0">
                  <RecommendationBadge quality={algorithmQuality} />
                </div>
              </div>
            </div>

            {algorithmQuality && (
              <div className="mb-5 text-xs p-2 bg-gray-50 rounded-md border border-gray-100">
                <p className="font-medium text-gray-700 mb-1">추천 등급 안내:</p>
                <ul className="space-y-1 text-gray-600">
                  {algorithmQuality === "최상급" && (
                    <li>• 최상급: 과거 당첨 패턴과 매우 높은 일치도를 보이는 최적의 조합입니다.</li>
                  )}
                  {algorithmQuality === "최상" && <li>• 최상: 당첨 확률이 높은 우수한 번호 조합입니다.</li>}
                  {algorithmQuality === "상급" && (
                    <li>• 상급: 과거 당첨 패턴과 높은 일치도를 보이는 좋은 조합입니다.</li>
                  )}
                  {algorithmQuality === "상" && <li>• 상: 당첨 패턴 분석에서 좋은 점수를 받은 조합입니다.</li>}
                  {algorithmQuality === "중상" && <li>• 중상: 평균 이상의 당첨 패턴 일치도를 보이는 조합입니다.</li>}
                  {algorithmQuality === "중" && <li>• 중: 평균적인 당첨 패턴 일치도를 보이는 조합입니다.</li>}
                  {algorithmQuality === "보통" && <li>• 보통: 기본적인 당첨 패턴을 따르는 조합입니다.</li>}
                  {algorithmQuality === "기본" && <li>• 기본: 최소한의 당첨 패턴을 반영한 조합입니다.</li>}
                  {algorithmQuality === "랜덤" && <li>• 랜덤: 완전 무작위로 생성된 번호 조합입니다.</li>}
                </ul>
              </div>
            )}

            <div className="mt-4">
              <LottoBalls numbers={algorithmNumbers} getBallColor={getBallColor} />
            </div>

            {/* 분석에 적용 버튼 추가 */}
            {algorithmNumbers.length === 6 && (
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() => onApplyToAnalysis && onApplyToAnalysis(algorithmNumbers)}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Sparkles className="w-4 h-4 mr-1" />이 번호로 분석하기
                </Button>
              </div>
            )}

            {/* 모바일 환경에서 텍스트와 버튼 간격 개선 */}
            <div className={`mt-4 ${isMobile ? "flex flex-col space-y-3" : "flex justify-between items-center"}`}>
              <div className="text-xs text-gray-500">
                * 이 추천은 과거 데이터 패턴을 기반으로 하며, 당첨을 보장하지 않습니다.
              </div>

              <div className={`flex items-center ${isMobile ? "justify-center mt-2" : ""}`}>
                <SaveRecommendationButton
                  numbers={algorithmNumbers}
                  isSaved={isAlgorithmSaved}
                  onSave={() => setAlgorithmSaved(true)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="deeplearning">
          {!isModelTrained && !isTraining ? (
            <div className="bg-white rounded-lg p-4 border border-purple-100 space-y-4">
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  딥러닝 기반 추천을 사용하려면 먼저 모델을 학습시키거나 기존 모델을 가져와야 합니다.
                </p>
                <p className="text-xs text-gray-500">
                  학습에는 과거 당첨 번호 데이터가 사용되며, 브라우저에서 직접 처리됩니다. 학습 시간은 기기 성능에 따라
                  달라질 수 있습니다.
                </p>
              </div>

              <TrainingProgress
                isTraining={isTraining}
                progress={trainingProgress}
                onStartTraining={startTraining}
                onResetTraining={resetTraining}
              />

              {/* 모델 관리 섹션 추가 */}
              {showModelManagement && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">모델 관리</h4>
                  <ModelManagement
                    isModelTrained={isModelTrained}
                    onModelImported={() => {
                      // 모델 가져오기 후 필요한 상태 업데이트는 이벤트 리스너에서 처리됨
                    }}
                  />
                </div>
              )}
            </div>
          ) : isTraining ? (
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <TrainingProgress
                isTraining={isTraining}
                progress={trainingProgress}
                onStartTraining={startTraining}
                onResetTraining={resetTraining}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              {/* 기존 학습 완료된 상태의 내용 */}
              <div className="flex flex-col mb-2">
                <div className="flex justify-between items-center w-full">
                  <p className="text-sm text-gray-600 max-w-[75%]">
                    딥러닝 모델이 학습한 패턴을 기반으로 생성된 추천 번호입니다.
                  </p>
                  <div className="flex-shrink-0">
                    <RecommendationBadge quality={deepLearningQuality} />
                  </div>
                </div>
              </div>

              {/* 기존 내용들... */}
              {deepLearningQuality && (
                <div className="mb-5 text-xs p-2 bg-gray-50 rounded-md border border-gray-100">
                  <p className="font-medium text-gray-700 mb-1">추천 등급 안내:</p>
                  <ul className="space-y-1 text-gray-600">
                    {deepLearningQuality === "최상급" && (
                      <li>• 최상급: 딥러닝 모델이 높은 확신을 가지고 예측한 최적의 번호 조합입니다.</li>
                    )}
                    {deepLearningQuality === "최상" && (
                      <li>• 최상: 딥러닝 모델이 과거 패턴을 분석하여 높은 신뢰도로 예측한 번호입니다.</li>
                    )}
                    {deepLearningQuality === "상급" && (
                      <li>• 상급: 딥러닝 모델이 발견한 패턴에 기반한 우수한 번호 조합입니다.</li>
                    )}
                    {deepLearningQuality === "상" && (
                      <li>• 상: 모델이 학습한 패턴에서 좋은 점수를 받은 번호 조합입니다.</li>
                    )}
                    {deepLearningQuality === "중상" && (
                      <li>• 중상: 평균 이상의 신뢰도를 가진 딥러닝 예측 번호입니다.</li>
                    )}
                    {deepLearningQuality === "중" && <li>• 중: 평균적인 신뢰도를 가진 딥러닝 예측 번호입니다.</li>}
                    {deepLearningQuality === "보통" && (
                      <li>• 보통: 기본적인 패턴을 학습한 딥러닝 모델의 예측입니다.</li>
                    )}
                    {deepLearningQuality === "기본" && (
                      <li>• 기본: 최소한의 패턴을 학습한 딥러닝 모델의 예측입니다.</li>
                    )}
                    {deepLearningQuality === "랜덤" && (
                      <li>• 랜덤: 딥러닝 모델이 다양성을 위해 생성한 무작위에 가까운 번호입니다.</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="mt-4">
                <LottoBalls numbers={deepLearningNumbers} getBallColor={getBallColor} />
              </div>

              {/* 분석에 적용 버튼 */}
              {deepLearningNumbers.length === 6 && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => onApplyToAnalysis && onApplyToAnalysis(deepLearningNumbers)}
                    variant="outline"
                    size="sm"
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />이 번호로 분석하기
                  </Button>
                </div>
              )}

              <div className="mt-4 mb-3 p-2 bg-purple-50 rounded-md border border-purple-100">
                <p className="text-xs font-medium text-purple-800 mb-1">딥러닝 결과 설명:</p>
                <ul className="text-xs space-y-1 text-purple-700">
                  <li>
                    • 이 번호는 과거 {winningNumbers.length}회의 당첨 번호 패턴을 학습한 인공신경망이 생성했습니다.
                  </li>
                  <li>• 모델은 번호 간의 관계, 출현 빈도, 연속성 등 복잡한 패턴을 분석했습니다.</li>
                  <li>• 최근 당첨 번호의 경향을 반영하여 미래 당첨 가능성이 높은 번호를 예측했습니다.</li>
                  <li>• 학습된 모델은 브라우저에 저장되어 있으며, 언제든지 재학습할 수 있습니다.</li>
                </ul>
              </div>

              <div className={`mt-4 ${isMobile ? "flex flex-col space-y-3" : "flex justify-between items-center"}`}>
                <div className="text-xs text-gray-500">
                  * 이 추천은 딥러닝 모델의 학습 결과를 기반으로 하며, 당첨을 보장하지 않습니다.
                </div>

                <div className={`flex items-center gap-2 ${isMobile ? "justify-center mt-2" : ""}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetTraining}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <Brain className="w-4 h-4 mr-1" />
                    모델 재학습
                  </Button>

                  <SaveRecommendationButton
                    numbers={deepLearningNumbers}
                    isSaved={isDeepLearningSaved}
                    onSave={() => setDeepLearningSaved(true)}
                  />
                </div>
              </div>

              {/* 모델 관리 섹션을 조건부로 표시 */}
              {showModelManagement && (
                <div className="border-t mt-4 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">모델 관리</h4>
                  <ModelManagement
                    isModelTrained={isModelTrained}
                    onModelImported={() => {
                      // 모델 가져오기 후 필요한 상태 업데이트는 이벤트 리스너에서 처리됨
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
