"use client"

import { useState, useEffect, useRef } from "react"
import {
  Brain,
  Play,
  Square,
  RotateCcw,
  Activity,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Terminal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import * as tf from "@tensorflow/tfjs"
import "@tensorflow/tfjs-backend-webgpu"

// --- 1. 타입 정의 ---
type TrainingStatus = "idle" | "initializing" | "training" | "paused" | "completed" | "error"

interface TrainingLog {
  epoch: number
  loss: number
  accuracy: number
}

// --- 2. 스켈레톤 UI (Admin 스타일 적용) ---
function LearningPageSkeleton() {
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl space-y-6 animate-pulse">
      <div className="flex flex-col space-y-2">
        <Skeleton className="h-8 w-64 bg-gray-200 dark:bg-[#272727]" />
        <Skeleton className="h-4 w-96 bg-gray-200 dark:bg-[#272727]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-gray-200 dark:bg-[#272727]" />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-3">
          <Skeleton className="h-[400px] rounded-xl bg-gray-200 dark:bg-[#272727]" />
        </div>
        <div className="md:col-span-4">
          <Skeleton className="h-[400px] rounded-xl bg-gray-200 dark:bg-[#272727]" />
        </div>
      </div>
    </div>
  )
}

// --- 3. 메인 페이지 컴포넌트 ---
export default function DeepLearningPage() {
  const [status, setStatus] = useState<TrainingStatus>("initializing")
  const [backendName, setBackendName] = useState<string>("unknown")
  const [currentEpoch, setCurrentEpoch] = useState(0)
  const [totalEpochs, setTotalEpochs] = useState(100)
  const [currentLoss, setCurrentLoss] = useState<number | null>(null)
  const [logs, setLogs] = useState<TrainingLog[]>([])
  const [modelSummary, setModelSummary] = useState<string[]>([])
  const stopTrainingRef = useRef(false)

  // 3-1. 초기화: WebGPU 백엔드 설정
  useEffect(() => {
    const initTensorFlow = async () => {
      try {
        await tf.ready()
        if (tf.findBackend('webgpu')) {
          await tf.setBackend('webgpu')
        }
        setBackendName(tf.getBackend())
        setStatus("idle")

        // 모델 구조 요약
        const summary: string[] = []
        createModel().summary(undefined, undefined, (line) => summary.push(line))
        setModelSummary(summary)

      } catch (error) {
        console.error("TFJS Init Error:", error)
        setStatus("error")
      }
    }
    setTimeout(initTensorFlow, 1000)
  }, [])

  // 3-2. 모델 생성 (Transformer + Dense Feature)
  const createModel = () => {
    const WINDOW_SIZE = 50
    const NUM_NUMBERS = 45
    const NUM_FEATURES = 5

    const numberInput = tf.input({ shape: [WINDOW_SIZE, NUM_NUMBERS], name: 'number_sequence' })
    const featureInput = tf.input({ shape: [WINDOW_SIZE, NUM_FEATURES], name: 'stat_features' })

    // A. Sequence Feature Extraction
    let x1 = tf.layers.conv1d({ filters: 64, kernelSize: 3, activation: 'relu', padding: 'same' }).apply(numberInput) as tf.SymbolicTensor
    x1 = tf.layers.lstm({ units: 128, returnSequences: false }).apply(x1) as tf.SymbolicTensor

    // B. Statistical Feature Extraction
    let x2 = tf.layers.lstm({ units: 64, returnSequences: false }).apply(featureInput) as tf.SymbolicTensor

    // C. Concatenate & Output
    const combined = tf.layers.concatenate().apply([x1, x2]) as tf.SymbolicTensor
    let output = tf.layers.dense({ units: 256, activation: 'relu' }).apply(combined) as tf.SymbolicTensor
    output = tf.layers.dropout({ rate: 0.3 }).apply(output) as tf.SymbolicTensor
    output = tf.layers.dense({ units: 45, activation: 'sigmoid' }).apply(output) as tf.SymbolicTensor

    const model = tf.model({ inputs: [numberInput, featureInput], outputs: output })
    model.compile({ optimizer: tf.train.adam(0.001), loss: 'binaryCrossentropy', metrics: ['accuracy'] })
    return model
  }

  // 3-3. 학습 시작
  const handleStartTraining = async () => {
    if (status === "training") return
    setStatus("training")
    stopTrainingRef.current = false
    setLogs([])

    try {
      const model = createModel()
      // Dummy Data (실제 데이터 연동 필요)
      const dummyX1 = tf.randomNormal([100, 50, 45])
      const dummyX2 = tf.randomNormal([100, 50, 5])
      const dummyY = tf.randomUniform([100, 45])

      await model.fit([dummyX1, dummyX2], dummyY, {
        batchSize: 32,
        epochs: totalEpochs,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            if (stopTrainingRef.current) {
              model.stopTraining = true
              return
            }
            setCurrentEpoch(epoch + 1)
            setCurrentLoss(logs?.loss || 0)
            setLogs(prev => [...prev.slice(-19), {
              epoch: epoch + 1,
              loss: logs?.loss || 0,
              accuracy: logs?.acc || 0
            }])
            await tf.nextFrame()
          }
        }
      })

      setStatus(stopTrainingRef.current ? "paused" : "completed")
      dummyX1.dispose(); dummyX2.dispose(); dummyY.dispose()
    } catch (err) {
      setStatus("error")
    }
  }

  if (status === "initializing") return <LearningPageSkeleton />

  return (
    // [수정] 다른 Admin 페이지와 동일한 컨테이너 클래스 적용
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl space-y-6">

      {/* 헤더 섹션 (Admin 스타일) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            딥러닝 모델 학습
          </h1>
          <p className="text-[#606060] dark:text-[#aaaaaa] text-sm">
            WebGPU를 활용하여 Transformer 하이브리드 모델을 브라우저에서 직접 학습시킵니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={backendName === 'webgpu' ? "default" : "secondary"} className="text-xs">
            Backend: {backendName.toUpperCase()}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.location.reload()}
            className="bg-white dark:bg-[#272727] border-[#e5e5e5] dark:border-[#3f3f3f] text-[#0f0f0f] dark:text-[#f1f1f1]"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 상태 요약 카드 그리드 (Admin 스타일) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 상태 카드 1 */}
        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f] p-5">
          <div className="text-sm font-medium text-[#606060] dark:text-[#aaaaaa] flex items-center justify-between mb-2">
            현재 상태 <Activity className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
            {status === "idle" && "대기 중"}
            {status === "training" && "학습 진행 중"}
            {status === "completed" && "학습 완료"}
            {status === "paused" && "일시 정지"}
            {status === "error" && "오류 발생"}
          </div>
        </div>

        {/* 상태 카드 2 */}
        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f] p-5">
          <div className="text-sm font-medium text-[#606060] dark:text-[#aaaaaa] flex items-center justify-between mb-2">
            진행률 (Epoch) <Brain className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] mb-2">
            {currentEpoch} / {totalEpochs}
          </div>
          <Progress value={(currentEpoch / totalEpochs) * 100} className="h-2 bg-[#e5e5e5] dark:bg-[#3f3f3f]" indicatorClassName="bg-blue-600 dark:bg-blue-400" />
        </div>

        {/* 상태 카드 3 */}
        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f] p-5">
          <div className="text-sm font-medium text-[#606060] dark:text-[#aaaaaa] flex items-center justify-between mb-2">
            손실값 (Loss) <AlertCircle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {currentLoss ? currentLoss.toFixed(4) : "-"}
          </div>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-1">낮을수록 정확함</p>
        </div>

        {/* 상태 카드 4 */}
        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f] p-5">
          <div className="text-sm font-medium text-[#606060] dark:text-[#aaaaaa] flex items-center justify-between mb-2">
            가속기 <Cpu className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-500 flex items-center gap-2">
            {backendName === 'webgpu' ? <CheckCircle2 className="h-5 w-5" /> : null}
            {backendName.toUpperCase()}
          </div>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-1">브라우저 가속 사용</p>
        </div>
      </div>

      {/* 메인 컨트롤 및 로그 영역 */}
      <div className="grid gap-6 md:grid-cols-7">

        {/* 왼쪽: 컨트롤 패널 (3/7) */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f] h-full flex flex-col">
            <div className="p-5 border-b border-[#e5e5e5] dark:border-[#3f3f3f]">
              <h3 className="font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">학습 설정</h3>
              <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">모델 파라미터 제어</p>
            </div>

            <div className="p-5 flex-1 space-y-5">
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-[#0f0f0f] dark:text-[#f1f1f1]">
                  <span>목표 Epoch</span>
                  <span className="font-bold">{totalEpochs}</span>
                </div>
                <div className="flex gap-2">
                  {[50, 100, 500, 1000].map(val => (
                    <Button
                      key={val}
                      variant={totalEpochs === val ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTotalEpochs(val)}
                      disabled={status === "training"}
                      className={totalEpochs === val
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-white dark:bg-[#272727] border-[#e5e5e5] dark:border-[#3f3f3f] text-[#0f0f0f] dark:text-[#f1f1f1] hover:bg-gray-50 dark:hover:bg-[#333]"
                      }
                    >
                      {val}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator className="bg-[#e5e5e5] dark:bg-[#3f3f3f]" />

              <div className="flex flex-col gap-3">
                {status === "training" ? (
                  <Button
                    variant="destructive"
                    onClick={() => stopTrainingRef.current = true}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Square className="mr-2 h-4 w-4 fill-current" /> 학습 중지
                  </Button>
                ) : (
                  <Button
                    onClick={handleStartTraining}
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-sm"
                  >
                    <Play className="mr-2 h-4 w-4 fill-current" /> 학습 시작
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 로그 패널 (4/7) */}
        <div className="md:col-span-4">
          <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f] h-[500px] flex flex-col">
            <div className="p-5 border-b border-[#e5e5e5] dark:border-[#3f3f3f] flex justify-between items-center">
              <div>
                <h3 className="font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">실시간 학습 로그</h3>
                <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">TensorFlow.js 연산 기록</p>
              </div>
              <Terminal className="w-5 h-5 text-[#606060] dark:text-[#aaaaaa]" />
            </div>

            <div className="flex-1 p-0 overflow-hidden bg-black rounded-b-xl relative">
              <div className="absolute inset-0 p-4 font-mono text-xs overflow-y-auto custom-scrollbar space-y-1">
                {modelSummary.length > 0 && (
                  <div className="mb-4 text-gray-500 border-b border-gray-800 pb-2">
                    {modelSummary.map((line, i) => <div key={i}>{line}</div>)}
                  </div>
                )}

                {status === "idle" && logs.length === 0 && (
                  <div className="text-gray-500 italic mt-2">Ready to start training...</div>
                )}

                {logs.map((log, idx) => (
                  <div key={idx} className="flex gap-4 text-green-400">
                    <span className="w-20 text-blue-400">Epoch {log.epoch}</span>
                    <span className="w-32">Loss: {log.loss.toFixed(6)}</span>
                    <span className="text-yellow-400">Acc: {log.accuracy.toFixed(4)}</span>
                  </div>
                ))}

                {status === "training" && (
                  <div className="animate-pulse text-green-500 mt-2">_</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}