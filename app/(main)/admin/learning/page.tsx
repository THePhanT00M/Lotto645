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
  Terminal,
  Settings2,
  Lightbulb,
  Trophy,
  Target,
  TrendingDown,
  Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import * as tf from "@tensorflow/tfjs"
import "@tensorflow/tfjs-backend-webgpu"
import { supabase } from "@/lib/supabaseClient"
import { WinningLottoNumbers } from "@/types/lotto"
import { useIsMobile } from "@/hooks/use-mobile"

/**
 * 로그 데이터 타입 정의 (시스템 로그와 학습 로그를 통합 관리)
 */
interface LogEntry {
  type: "system" | "training"
  message?: string
  epoch?: number
  loss?: number
  accuracy?: number
  timestamp: string
}

type TrainingStatus = "idle" | "initializing" | "training" | "paused" | "completed" | "error" | "loading_data"

function LearningPageSkeleton() {
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6 animate-pulse w-full">
      <div className="flex flex-col space-y-2">
        <Skeleton className="h-8 w-full max-w-[200px] bg-gray-200 dark:bg-[#272727]" />
        <Skeleton className="h-4 w-full max-w-[450px] bg-gray-200 dark:bg-[#272727]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-gray-200 dark:bg-[#272727] w-full" />
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-xl bg-gray-200 dark:bg-[#272727]" />
      <div className="grid grid-cols-1 md:grid-cols-7 gap-6 w-full">
        <div className="col-span-1 md:col-span-2 w-full">
          <Skeleton className="h-[520px] rounded-xl bg-gray-200 dark:bg-[#272727] w-full" />
        </div>
        <div className="col-span-1 md:col-span-5 w-full">
          <Skeleton className="h-[520px] rounded-xl bg-gray-200 dark:bg-[#272727] w-full" />
        </div>
      </div>
    </div>
  )
}

export default function DeepLearningPage() {
  const isMobile = useIsMobile()
  const [status, setStatus] = useState<TrainingStatus>("initializing")
  const [backendName, setBackendName] = useState<string>("unknown")
  const [totalEpochs, setTotalEpochs] = useState(100)
  const [batchSize, setBatchSize] = useState(32)
  const [learningRate, setLearningRate] = useState(0.001)
  const [currentEpoch, setCurrentEpoch] = useState(0)
  const [currentLoss, setCurrentLoss] = useState<number | null>(null)
  const [currentAcc, setCurrentAcc] = useState<number | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [modelSummary, setModelSummary] = useState<string[]>([])
  const [dataCount, setDataCount] = useState(0)
  const tensorsRef = useRef<{ x1: tf.Tensor, x2: tf.Tensor, y: tf.Tensor } | null>(null)
  const stopTrainingRef = useRef(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const getTimestamp = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  }

  const addLog = (entry: Omit<LogEntry, "timestamp">) => {
    setLogs(prev => [...prev.slice(-99), { ...entry, timestamp: getTimestamp() }])
  }

  useEffect(() => {
    // 1. TensorFlow.js 엔진 및 WebGPU 가속 상태 확인 및 초기화 시퀀스
    const initTensorFlow = async () => {
      try {
        addLog({ type: "system", message: "딥러닝 시스템 부팅 프로세스 시작..." })
        await new Promise(r => setTimeout(r, 600))

        addLog({ type: "system", message: "TensorFlow.js 엔진 초기화 중..." })
        await tf.ready()

        addLog({ type: "system", message: "가속 장치(WebGPU/WebGL) 검색 중..." })
        if (tf.findBackend('webgpu')) {
          await tf.setBackend('webgpu')
        }
        const currentBackend = tf.getBackend()
        setBackendName(currentBackend)
        addLog({ type: "system", message: `가속기 설정 완료: ${currentBackend.toUpperCase()}` })

        addLog({ type: "system", message: "CNN-LSTM 하이브리드 모델 로딩 중..." })
        const summary: string[] = []
        createModel(learningRate).summary(undefined, undefined, (line) => summary.push(line))
        setModelSummary(summary)

        await new Promise(r => setTimeout(r, 400))
        addLog({ type: "system", message: "시스템 준비 완료. 학습 대기 중..." })
        setStatus("idle")
      } catch (error) {
        console.error("TFJS Init Error:", error)
        addLog({ type: "system", message: "오류: 시스템 초기화 실패." })
        setStatus("error")
      }
    }
    initTensorFlow()
  }, [])

  useEffect(() => {
    // 2. 모바일 환경이 아닐 때만 시스템 로그 영역 자동 스크롤 활성화
    if (logsEndRef.current && !isMobile) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs, isMobile])

  const createModel = (lr: number) => {
    const WINDOW_SIZE = 50
    const NUM_NUMBERS = 45
    const NUM_FEATURES = 5

    const numberInput = tf.input({ shape: [WINDOW_SIZE, NUM_NUMBERS], name: 'number_sequence' })
    const featureInput = tf.input({ shape: [WINDOW_SIZE, NUM_FEATURES], name: 'stat_features' })

    let x1 = tf.layers.conv1d({ filters: 64, kernelSize: 3, activation: 'relu', padding: 'same' }).apply(numberInput) as tf.SymbolicTensor
    x1 = tf.layers.lstm({ units: 128, returnSequences: false }).apply(x1) as tf.SymbolicTensor

    let x2 = tf.layers.lstm({ units: 64, returnSequences: false }).apply(featureInput) as tf.SymbolicTensor

    const combined = tf.layers.concatenate().apply([x1, x2]) as tf.SymbolicTensor
    let output = tf.layers.dense({ units: 256, activation: 'relu' }).apply(combined) as tf.SymbolicTensor
    output = tf.layers.dropout({ rate: 0.3 }).apply(output) as tf.SymbolicTensor
    output = tf.layers.dense({ units: 45, activation: 'sigmoid' }).apply(output) as tf.SymbolicTensor

    const model = tf.model({ inputs: [numberInput, featureInput], outputs: output })
    model.compile({ optimizer: tf.train.adam(lr), loss: 'binaryCrossentropy', metrics: ['accuracy'] })
    return model
  }

  const fetchAndProcessData = async () => {
    setStatus("loading_data")
    addLog({ type: "system", message: "데이터베이스 접속 중..." })
    try {
      const { data, error } = await supabase
        .from("winning_numbers")
        .select("*")
        .order("drawNo", { ascending: true })

      if (error || !data || data.length < 60) {
        throw new Error("데이터가 부족하거나 가져올 수 없습니다.")
      }

      const draws = data as WinningLottoNumbers[]
      setDataCount(draws.length)
      addLog({ type: "system", message: `데이터 로드 완료: ${draws.length}개의 회차 분석 중...` })
      return processData(draws)
    } catch (err) {
      console.error(err)
      addLog({ type: "system", message: "데이터 로드 중 오류가 발생했습니다." })
      setStatus("error")
      return null
    }
  }

  const processData = (draws: WinningLottoNumbers[]) => {
    const WINDOW_SIZE = 50
    const x1Data = []
    const x2Data = []
    const yData = []

    for (let i = 0; i < draws.length - WINDOW_SIZE; i++) {
      const windowDraws = draws.slice(i, i + WINDOW_SIZE)
      const targetDraw = draws[i + WINDOW_SIZE]

      const seqBatch = windowDraws.map(d => {
        const oneHot = Array(45).fill(0)
        d.numbers.forEach(num => {
          if (num >= 1 && num <= 45) oneHot[num - 1] = 1
        })
        return oneHot
      })
      x1Data.push(seqBatch)

      const featBatch = windowDraws.map(d => {
        const sum = d.numbers.reduce((a, b) => a + b, 0)
        const oddCount = d.numbers.filter(n => n % 2 !== 0).length
        const highCount = d.numbers.filter(n => n >= 23).length
        const span = Math.max(...d.numbers) - Math.min(...d.numbers)

        return [
          sum / 255,
          oddCount / 6,
          highCount / 6,
          span / 44,
          (d.bonusNo || 0) / 45
        ]
      })
      x2Data.push(featBatch)

      const targetOneHot = Array(45).fill(0)
      targetDraw.numbers.forEach(num => {
        if (num >= 1 && num <= 45) targetOneHot[num - 1] = 1
      })
      yData.push(targetOneHot)
    }

    addLog({ type: "system", message: "텐서(Tensor) 변환 및 학습 데이터 세트 구성 완료." })
    return {
      x1: tf.tensor3d(x1Data),
      x2: tf.tensor3d(x2Data),
      y: tf.tensor2d(yData)
    }
  }

  const handleStartTraining = async () => {
    if (status === "training") return

    if (tensorsRef.current) {
      tensorsRef.current.x1.dispose()
      tensorsRef.current.x2.dispose()
      tensorsRef.current.y.dispose()
      tensorsRef.current = null
    }

    setLogs(prev => prev.filter(l => l.type === "system")) // 기존 시스템 로그는 유지
    stopTrainingRef.current = false

    const tensorData = await fetchAndProcessData()
    if (!tensorData) return

    tensorsRef.current = tensorData
    setStatus("training")
    addLog({ type: "system", message: "훈련 프로세스 시작. 가속 엔진 구동..." })

    try {
      const model = createModel(learningRate)
      const { x1, x2, y } = tensorData

      await model.fit([x1, x2], y, {
        batchSize: batchSize,
        epochs: totalEpochs,
        shuffle: true,
        validationSplit: 0.1,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            if (stopTrainingRef.current) {
              model.stopTraining = true
              addLog({ type: "system", message: "사용자에 의해 학습이 중단되었습니다." })
              return
            }
            const loss = logs?.loss || 0
            const acc = logs?.acc || 0

            setCurrentEpoch(epoch + 1)
            setCurrentLoss(loss)
            setCurrentAcc(acc)

            addLog({
              type: "training",
              epoch: epoch + 1,
              loss: loss,
              accuracy: acc
            })
            await tf.nextFrame()
          }
        }
      })

      if (!stopTrainingRef.current) {
        addLog({ type: "system", message: "모든 학습 과정이 성공적으로 완료되었습니다." })
        setStatus("completed")
      } else {
        setStatus("paused")
      }
    } catch (err) {
      console.error(err)
      addLog({ type: "system", message: "학습 중 심각한 오류가 발생했습니다." })
      setStatus("error")
    }
  }

  if (status === "initializing" && logs.length === 0) return <LearningPageSkeleton />

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6 w-full">
      <div className="flex flex-col space-y-2">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            딥러닝 모델 학습
          </h1>
          <p className="text-[#606060] dark:text-[#aaaaaa] text-sm">
            WebGPU를 활용하여 Transformer 하이브리드 모델을 브라우저에서 직접 학습시킵니다.
          </p>
        </div>
      </div>

      {/* 통계 카드 섹션 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f] p-5 w-full">
          <div className="text-sm font-medium text-[#606060] dark:text-[#aaaaaa] flex items-center justify-between mb-2">
            현재 상태 <Activity className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
            {status === "idle" && "대기 중"}
            {status === "initializing" && "부팅 중..."}
            {status === "loading_data" && "데이터 로딩 중..."}
            {status === "training" && "학습 진행 중"}
            {status === "completed" && "학습 완료"}
            {status === "paused" && "일시 정지"}
            {status === "error" && "오류 발생"}
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f] p-5 w-full">
          <div className="text-sm font-medium text-[#606060] dark:text-[#aaaaaa] flex items-center justify-between mb-2">
            진행률 (Epoch) <Brain className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] mb-2">
            {currentEpoch} / {totalEpochs}
          </div>
          <Progress value={(currentEpoch / totalEpochs) * 100} className="h-2 bg-[#e5e5e5] dark:bg-[#3f3f3f]" indicatorClassName="bg-blue-600 dark:bg-blue-400" />
        </div>

        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f] p-5 w-full">
          <div className="text-sm font-medium text-[#606060] dark:text-[#aaaaaa] flex items-center justify-between mb-2">
            손실값 (Loss) <AlertCircle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {currentLoss ? currentLoss.toFixed(4) : "-"}
          </div>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-1">낮을수록 정확함</p>
        </div>

        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl border border-[#e5e5e5] dark:border-[#3f3f3f] p-5 w-full">
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

      <Card className="bg-gray-100 dark:bg-[#1e1e1e] border-gray-200 dark:border-[#3f3f3f] w-full shadow-sm">
        <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left w-full">
            <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg shrink-0">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">모델 학습 제어</h3>
              <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">설정된 파라미터를 기반으로 AI 엔진을 구동하여 패턴을 분석합니다.</p>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            {status === "training" || status === "loading_data" ? (
              <Button variant="destructive" onClick={() => stopTrainingRef.current = true} disabled={status === "loading_data"} className="w-full sm:min-w-[140px] h-11 bg-red-600 hover:bg-red-700 text-white shadow-sm">
                <Square className="mr-2 h-4 w-4 fill-current" /> 학습 중지
              </Button>
            ) : (
              <Button onClick={handleStartTraining} disabled={status === "initializing"} className="w-full sm:min-w-[140px] h-11 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-sm">
                <Play className="mr-2 h-4 w-4 fill-current" /> 학습 시작
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {status === 'completed' && (
        <Alert className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 w-full">
          <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
          <AlertTitle className="ml-2 text-green-800 dark:text-green-400 font-bold text-lg">
            학습이 성공적으로 완료되었습니다!
          </AlertTitle>
          <AlertDescription className="ml-2 mt-2 text-green-700 dark:text-green-300">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-10">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>최종 정확도: <strong>{(currentAcc! * 100).toFixed(2)}%</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                <span>최종 손실값: <strong>{currentLoss?.toFixed(6)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span>사용된 데이터: <strong>{dataCount - 50} 세트</strong></span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-7 gap-6 w-full">
        {/* 학습 설정 */}
        <div className="col-span-1 md:col-span-2 space-y-6 w-full">
          <Card className="flex flex-col h-full bg-gray-100 dark:bg-[#1e1e1e] border-gray-200 dark:border-[#3f3f3f] w-full">
            <CardHeader className="py-4 border-b border-gray-200 dark:border-[#3f3f3f]">
              <CardTitle className="text-base flex items-center gap-2 text-[#0f0f0f] dark:text-[#f1f1f1]">
                <Settings2 className="w-5 h-5" />
                학습 설정
              </CardTitle>
            </CardHeader>
            <div className="p-5 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#0f0f0f] dark:text-[#f1f1f1]">반복 횟수 (Epochs)</Label>
                <Select value={String(totalEpochs)} onValueChange={(val) => setTotalEpochs(Number(val))} disabled={status === "training" || status === "loading_data" || status === "initializing"}>
                  <SelectTrigger className="w-full bg-white dark:bg-[#272727] border-[#e5e5e5] dark:border-[#3f3f3f]">
                    <SelectValue placeholder="Epoch 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 Epochs</SelectItem>
                    <SelectItem value="100">100 Epochs</SelectItem>
                    <SelectItem value="500">500 Epochs</SelectItem>
                    <SelectItem value="1000">1000 Epochs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#0f0f0f] dark:text-[#f1f1f1]">배치 크기</Label>
                <Select value={String(batchSize)} onValueChange={(val) => setBatchSize(Number(val))} disabled={status === "training" || status === "loading_data" || status === "initializing"}>
                  <SelectTrigger className="w-full bg-white dark:bg-[#272727] border-[#e5e5e5] dark:border-[#3f3f3f]">
                    <SelectValue placeholder="Batch 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16">16</SelectItem>
                    <SelectItem value="32">32</SelectItem>
                    <SelectItem value="64">64</SelectItem>
                    <SelectItem value="128">128</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#0f0f0f] dark:text-[#f1f1f1]">학습률</Label>
                <Select value={String(learningRate)} onValueChange={(val) => setLearningRate(Number(val))} disabled={status === "training" || status === "loading_data" || status === "initializing"}>
                  <SelectTrigger className="w-full bg-white dark:bg-[#272727] border-[#e5e5e5] dark:border-[#3f3f3f]">
                    <SelectValue placeholder="LR 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.01">0.01</SelectItem>
                    <SelectItem value="0.001">0.001</SelectItem>
                    <SelectItem value="0.0001">0.0001</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        {/* 시스템 로그 (터미널 스타일) */}
        <div className="col-span-1 md:col-span-5 w-full">
          <Card className="flex flex-col h-[520px] bg-gray-100 dark:bg-[#1e1e1e] border-gray-200 dark:border-[#3f3f3f] w-full">
            <CardHeader className="py-4 border-b border-gray-200 dark:border-[#3f3f3f]">
              <CardTitle className="text-base flex items-center gap-2 text-[#0f0f0f] dark:text-[#f1f1f1]">
                <Terminal className="w-4 h-4" /> 시스템 터미널 로그
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-4 bg-black/95 rounded-b-xl text-green-400 font-mono text-xs md:text-sm">
              <div className="space-y-1">
                {logs.length === 0 && (
                  <div className="text-gray-500 italic animate-pulse">커널 시퀀스 대기 중...</div>
                )}
                {logs.map((log, index) => (
                  <div key={index} className="flex gap-2 break-all hover:bg-white/5 items-start">
                    <span className="text-gray-500 shrink-0 text-[10px] md:text-xs font-sans">[{log.timestamp}]</span>
                    {log.type === "system" ? (
                      <span className="text-yellow-400 shrink-0 font-bold">[SYSTEM]</span>
                    ) : (
                      <span className="text-blue-400 shrink-0 font-bold">[EPOCH {log.epoch}]</span>
                    )}
                    <span className={log.type === "system" ? "text-white" : "text-green-400"}>
                      {log.type === "system" ? (
                        log.message
                      ) : (
                        `Loss: ${log.loss?.toFixed(6)} | Accuracy: ${log.accuracy?.toFixed(4)}`
                      )}
                    </span>
                  </div>
                ))}
                {(status === "training" || status === "initializing" || status === "loading_data") && (
                  <div className="animate-pulse text-green-500 mt-2">_</div>
                )}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>

      {/* 도움말 섹션 */}
      <div className="mt-8 w-full">
        <Card className="bg-white dark:bg-[#1e1e1e] border-[#e5e5e5] dark:border-[#3f3f3f] w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">
              <Lightbulb className="w-5 h-5 text-yellow-500" /> 학습 파라미터 가이드
            </CardTitle>
            <CardDescription>AI 모델의 성능을 최적화하기 위한 설정값 도움말입니다.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-full">
              <div className="flex flex-col h-full space-y-3 p-4 bg-gray-50 dark:bg-[#272727] rounded-lg">
                <div className="flex items-center gap-2 font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]">
                  <Target className="w-4 h-4 text-blue-500" /> 최대 반복 횟수 (Epochs)
                </div>
                <div className="text-sm text-[#606060] dark:text-[#aaaaaa] leading-relaxed flex-1">
                  전체 데이터를 몇 번 반복해서 학습할지 결정합니다.
                </div>
                <div className="mt-auto pt-2 text-xs text-[#606060] dark:text-[#aaaaaa] leading-relaxed">
                  <span className="font-bold text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded mr-2 inline-block">TIP</span>
                  최대 반복 횟수가 너무 많으면 과적합이 발생할 수 있고, 너무 적으면 학습 부족으로 정확도가 낮아집니다. 보통 100회로 시작하는 것이 권장됩니다.
                </div>
              </div>
            </div>
            <div className="h-full">
              <div className="flex flex-col h-full space-y-3 p-4 bg-gray-50 dark:bg-[#272727] rounded-lg">
                <div className="flex items-center gap-2 font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]">
                  <Settings2 className="w-4 h-4 text-purple-500" /> 배치 크기 (Batch Size)
                </div>
                <div className="text-sm text-[#606060] dark:text-[#aaaaaa] leading-relaxed flex-1">
                  한 번의 연산에 사용할 데이터 묶음의 크기입니다.
                </div>
                <div className="mt-auto pt-2 text-xs text-[#606060] dark:text-[#aaaaaa] leading-relaxed">
                  <span className="font-bold text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded mr-2 inline-block">TIP</span>
                  배치 크기가 크면 정밀도가 낮아지거나 메모리 부족이 발생할 수 있고, 너무 작으면 학습 효율이 떨어져 시간이 길어집니다. 32 또는 64가 권장값입니다.
                </div>
              </div>
            </div>
            <div className="h-full">
              <div className="flex flex-col h-full space-y-3 p-4 bg-gray-50 dark:bg-[#272727] rounded-lg">
                <div className="flex items-center gap-2 font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]">
                  <Zap className="w-4 h-4 text-yellow-500" /> 학습률 (Learning Rate)
                </div>
                <div className="text-sm text-[#606060] dark:text-[#aaaaaa] leading-relaxed flex-1">
                  모델이 오차를 줄여나가는 보폭의 크기입니다.
                </div>
                <div className="mt-auto pt-2 text-xs text-[#606060] dark:text-[#aaaaaa] leading-relaxed">
                  <span className="font-bold text-[10px] bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 rounded mr-2 inline-block">TIP</span>
                  학습률이 너무 크면 오버슈팅(overshooting) 현상이 발생하여 최적값을 찾지 못할 수 있고, 너무 작으면 학습 시간이 길어집니다. 0.001이 권장값입니다.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}