"use client"

import { useState, useEffect, useCallback } from "react"
import {
  trainModel,
  loadModel,
  predictNumbers,
  getModelStatus,
  resetModel,
  trainingEvents,
} from "@/utils/deep-learning-model"

type RecommendationQuality = "최상급" | "최상" | "상급" | "상" | "중상" | "중" | "보통" | "기본" | "랜덤" | ""

interface UseDeepLearningRecommendationResult {
  recommendedNumbers: number[]
  isGenerating: boolean
  isSaved: boolean
  setIsSaved: (value: boolean) => void
  recommendationQuality: RecommendationQuality
  generateRecommendedNumbers: () => void
  isModelTrained: boolean
  isTraining: boolean
  trainingProgress: number
  startTraining: () => Promise<void>
  resetTraining: () => void
}

export function useDeepLearningRecommendation(
  onRecommendationGenerated?: (numbers: number[]) => void,
  forceRefresh?: number,
): UseDeepLearningRecommendationResult {
  const [recommendedNumbers, setRecommendedNumbers] = useState<number[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [lastForceRefresh, setLastForceRefresh] = useState(forceRefresh)
  const [recommendationQuality, setRecommendationQuality] = useState<RecommendationQuality>("")

  // 모델 상태
  const [isModelTrained, setIsModelTrained] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // 모델 상태 초기화 및 이벤트 리스너 등록
  useEffect(() => {
    const initModel = async () => {
      try {
        const status = getModelStatus()
        setIsModelTrained(status.isModelTrained)
        setIsTraining(status.isTraining)
        setTrainingProgress(status.trainingProgress)

        // 이미 모델이 초기화되어 있지 않은 경우에만 로드 시도
        if (!status.isModelTrained) {
          console.log("모델 로드 시도 중...")
          const isLoaded = await loadModel()
          if (isLoaded) {
            console.log("훅에서 모델 로드 성공!")
          }
        }
      } catch (err) {
        console.error("모델 초기화 실패:", err)
        setError("모델 초기화 중 오류가 발생했습니다.")
      }
    }

    initModel()

    // 이벤트 리스너 등록
    const onTrainingStart = () => {
      setIsTraining(true)
      setTrainingProgress(0)
    }

    const onTrainingProgress = (progress: number) => {
      setTrainingProgress(progress)
    }

    const onTrainingComplete = () => {
      setIsTraining(false)
      setIsModelTrained(true)
      setTrainingProgress(1)
    }

    const onTrainingError = () => {
      setIsTraining(false)
    }

    const onModelReset = () => {
      setIsModelTrained(false)
      setIsTraining(false)
      setTrainingProgress(0)
    }

    const onError = (err: Error) => {
      setError(err.message)
    }

    const onModelLoaded = (success: boolean) => {
      console.log("모델 로드 이벤트 수신:", success)
      setIsModelTrained(success)
      // 모델 로드 후 자동으로 번호 생성
      if (success) {
        generateRecommendedNumbers()
      }
    }

    trainingEvents.on("trainingStart", onTrainingStart)
    trainingEvents.on("trainingProgress", onTrainingProgress)
    trainingEvents.on("trainingComplete", onTrainingComplete)
    trainingEvents.on("trainingError", onTrainingError)
    trainingEvents.on("modelReset", onModelReset)
    trainingEvents.on("error", onError)
    trainingEvents.on("modelLoaded", onModelLoaded)

    // 클린업 함수
    return () => {
      trainingEvents.off("trainingStart", onTrainingStart)
      trainingEvents.off("trainingProgress", onTrainingProgress)
      trainingEvents.off("trainingComplete", onTrainingComplete)
      trainingEvents.off("trainingError", onTrainingError)
      trainingEvents.off("modelReset", onModelReset)
      trainingEvents.off("error", onError)
      trainingEvents.off("modelLoaded", onModelLoaded)
    }
  }, [])

  // 추천 번호 생성 함수
  const generateRecommendedNumbers = useCallback(async () => {
    console.log("번호 생성 시도, 모델 상태:", { isModelTrained, isTraining })

    if (!isModelTrained) {
      console.warn("모델이 학습되지 않았습니다. 번호 생성을 건너뜁니다.")
      return
    }

    if (isTraining) {
      console.warn("모델이 학습 중입니다. 번호 생성을 건너뜁니다.")
      return
    }

    setIsGenerating(true)
    setIsSaved(false)
    setError(null)

    try {
      const numbers = await predictNumbers()
      setRecommendedNumbers(numbers)
      setRecommendationQuality("최상급")

      if (onRecommendationGenerated) {
        onRecommendationGenerated(numbers)
      }
    } catch (error) {
      console.error("번호 생성 실패:", error)
      setRecommendedNumbers([])
      setRecommendationQuality("")
      setError(error instanceof Error ? error.message : "번호 생성 중 오류가 발생했습니다.")
    } finally {
      setIsGenerating(false)
    }
  }, [isModelTrained, isTraining, onRecommendationGenerated])

  // 모델 학습 시작
  const startTraining = useCallback(async () => {
    if (isTraining) return

    try {
      setError(null)
      const result = await trainModel()
      if (!result.success) {
        setError(result.message)
      }
    } catch (error: any) {
      setError(`학습 실패: ${error.message || error}`)
    }
  }, [isTraining])

  // 모델 초기화
  const resetTraining = useCallback(() => {
    // 상태 초기화
    setRecommendedNumbers([])
    setRecommendationQuality("")
    setIsModelTrained(false)
    setIsTraining(false)
    setTrainingProgress(0)
    setError(null)

    // 모델 리셋
    resetModel()
  }, [])

  // 모델이 학습되었고 추천 번호가 없을 때 자동으로 번호 생성
  useEffect(() => {
    // 학습 완료 후에만 자동 생성
    if (isModelTrained && !isTraining && !isGenerating && recommendedNumbers.length === 0) {
      console.log("모델이 준비되었고 번호가 없습니다. 번호 생성 시작...")
      // 약간의 지연을 두어 상태가 완전히 업데이트되도록 함
      setTimeout(() => {
        generateRecommendedNumbers()
      }, 100)
    }
  }, [isModelTrained, isTraining, isGenerating, recommendedNumbers.length, generateRecommendedNumbers])

  // forceRefresh가 변경될 때만 실행
  useEffect(() => {
    // forceRefresh가 undefined가 아니고, 이전 값과 다를 때만 실행
    if (forceRefresh !== undefined && forceRefresh !== lastForceRefresh) {
      setLastForceRefresh(forceRefresh)
      if (isModelTrained) {
        generateRecommendedNumbers()
      }
    }
  }, [forceRefresh, lastForceRefresh, isModelTrained, generateRecommendedNumbers])

  return {
    recommendedNumbers,
    isGenerating,
    isSaved,
    setIsSaved,
    recommendationQuality,
    generateRecommendedNumbers,
    isModelTrained,
    isTraining,
    trainingProgress,
    startTraining,
    resetTraining,
  }
}
