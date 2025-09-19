"use client"

import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Brain, RefreshCw, RotateCcw, TrendingUp } from "lucide-react"
import { useState } from "react"

interface TrainingMetrics {
  loss?: number
  accuracy?: number
  valLoss?: number
  valAccuracy?: number
  learningRate?: number
}

interface TrainingProgressProps {
  isTraining: boolean
  progress: number
  metrics?: TrainingMetrics
  onStartTraining: () => void
  onResetTraining: () => void
  onShowDetails?: () => void
}

export function TrainingProgress({
                                   isTraining,
                                   progress,
                                   metrics,
                                   onStartTraining,
                                   onResetTraining,
                                   onShowDetails,
                                 }: TrainingProgressProps) {
  const progressPercent = Math.round(progress * 100)
  const [showMetrics, setShowMetrics] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Brain className="w-4 h-4 mr-1 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isTraining ? "딥러닝 모델 학습 중..." : "딥러닝 모델 학습"}
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">{progressPercent}%</span>
          {metrics && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowMetrics(!showMetrics)}>
              <TrendingUp className="w-3 h-3 mr-1" />
              {showMetrics ? "간략히" : "상세"}
            </Button>
          )}
        </div>
      </div>

      <Progress
        value={progressPercent}
        className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-600"
      />

      {showMetrics && metrics && (
        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">학습 손실:</span>
            <span className="font-mono dark:text-gray-300">{metrics.loss?.toFixed(4) || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">학습 정확도:</span>
            <span className="font-mono dark:text-gray-300">
              {metrics.accuracy ? (metrics.accuracy * 100).toFixed(2) + "%" : "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">검증 손실:</span>
            <span className="font-mono dark:text-gray-300">{metrics.valLoss?.toFixed(4) || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">검증 정확도:</span>
            <span className="font-mono dark:text-gray-300">
              {metrics.valAccuracy ? (metrics.valAccuracy * 100).toFixed(2) + "%" : "N/A"}
            </span>
          </div>
          {metrics.learningRate && (
            <div className="flex justify-between col-span-2">
              <span className="text-gray-600 dark:text-gray-400">학습률:</span>
              <span className="font-mono dark:text-gray-300">{metrics.learningRate.toExponential(4)}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between gap-2">
        <Button
          size="sm"
          variant={isTraining ? "outline" : "default"}
          disabled={isTraining}
          onClick={onStartTraining}
          className={
            isTraining
              ? "text-gray-400 dark:text-gray-500"
              : "bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 dark:text-white"
          }
        >
          {isTraining ? (
            <>
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              학습 중...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-1" />
              {progress === 0 ? "학습 시작" : "재학습"}
            </>
          )}
        </Button>

        <div className="flex gap-2">
          {onShowDetails && progress > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={onShowDetails}
              className="text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 bg-transparent"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              학습 결과
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            disabled={isTraining || progress === 0}
            onClick={onResetTraining}
            className="text-red-500 dark:text-red-400 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300 bg-transparent"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            초기화
          </Button>
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {isTraining
          ? "학습이 완료될 때까지 기다려주세요. 이 과정은 몇 분 정도 소요될 수 있습니다."
          : progress === 0
            ? "딥러닝 모델을 학습시키면 과거 당첨 패턴을 분석하여 더 정확한 번호를 추천받을 수 있습니다."
            : progress === 1
              ? "학습이 완료되었습니다. 이제 딥러닝 기반 번호 추천을 사용할 수 있습니다."
              : "학습이 일부 진행되었습니다. 학습을 완료하거나 초기화할 수 있습니다."}
      </div>
    </div>
  )
}
