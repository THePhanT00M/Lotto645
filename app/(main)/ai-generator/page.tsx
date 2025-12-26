"use client"

import { useState, useEffect } from "react"
import {
  Brain,
  Sparkles,
  Zap,
  Loader2,
  AlertCircle,
  Trophy,
  CheckCircle2,
  BarChart3,
  ChevronRight,
  Database,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import * as tf from "@tensorflow/tfjs"
import { supabase } from "@/lib/supabaseClient"
import { getBallColor } from "@/utils/lotto-utils"
import type { WinningLottoNumbers } from "@/types/lotto"

interface ModelRecord {
  id: number
  version: string
  accuracy: number
  loss: number
  epochs: number
  created_at: string
}

export default function PredictionPage() {
  const { toast } = useToast()
  const [models, setModels] = useState<ModelRecord[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>("")
  const [isLoadingModels, setIsLoadingModels] = useState(true)
  const [isPredicting, setIsPredicting] = useState(false)
  const [predictionResult, setPredictionResult] = useState<number[] | null>(null)
  const [predictionProbs, setPredictionProbs] = useState<{ number: number, prob: number }[]>([])
  const [progressStep, setProgressStep] = useState(0) // 0: Idle, 1: Data, 2: Model, 3: Calc, 4: Done

  // 1. 모델 목록 불러오기
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const { data, error } = await supabase
          .from('lotto_models')
          .select('id, version, accuracy, loss, epochs, created_at')
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data) {
          setModels(data)
          if (data.length > 0) {
            setSelectedModelId(String(data[0].id))
          }
        }
      } catch (err) {
        console.error("Error fetching models:", err)
        toast({
          variant: "destructive",
          title: "모델 로드 실패",
          description: "학습된 모델 목록을 가져올 수 없습니다.",
        })
      } finally {
        setIsLoadingModels(false)
      }
    }
    fetchModels()
  }, [toast])

  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  const handlePredict = async () => {
    if (!selectedModelId) return
    setIsPredicting(true)
    setPredictionResult(null)
    setProgressStep(1) // Step 1: 데이터 로드

    try {
      // --- Step 1: 데이터 로드 및 전처리 ---
      const { data: recentDraws, error: dataError } = await supabase
        .from("winning_numbers")
        .select("*")
        .order("drawNo", { ascending: false })
        .limit(100)

      if (dataError || !recentDraws || recentDraws.length < 100) {
        throw new Error("과거 데이터(최소 50회차)가 부족합니다.")
      }

      const draws = (recentDraws as WinningLottoNumbers[]).reverse()

      // 데이터 전처리 (Tensor 변환)
      const x1Data = []
      const x2Data = []
      const seqBatch = draws.map(d => {
        const oneHot = Array(45).fill(0)
        d.numbers.forEach(num => { if (num >= 1 && num <= 45) oneHot[num - 1] = 1 })
        return oneHot
      })
      x1Data.push(seqBatch)

      const featBatch = draws.map(d => {
        const sum = d.numbers.reduce((a, b) => a + b, 0)
        const oddCount = d.numbers.filter(n => n % 2 !== 0).length
        const highCount = d.numbers.filter(n => n >= 23).length
        const span = Math.max(...d.numbers) - Math.min(...d.numbers)
        return [sum / 255, oddCount / 6, highCount / 6, span / 44, (d.bonusNo || 0) / 45]
      })
      x2Data.push(featBatch)

      const x1 = tf.tensor3d(x1Data)
      const x2 = tf.tensor3d(x2Data)

      await new Promise(r => setTimeout(r, 800)) // UX용 딜레이
      setProgressStep(2) // Step 2: 모델 로드

      // --- Step 2: 모델 로드 ---
      const { data: modelRecord, error: modelError } = await supabase
        .from('lotto_models')
        .select('model_artifacts')
        .eq('id', selectedModelId)
        .single()

      if (modelError || !modelRecord) throw new Error("모델 데이터를 찾을 수 없습니다.")

      const artifacts = modelRecord.model_artifacts
      const weightBuffer = base64ToArrayBuffer(artifacts.weightData)
      const model = await tf.loadLayersModel(tf.io.fromMemory(
        artifacts.modelTopology,
        artifacts.weightSpecs,
        weightBuffer
      ))

      await new Promise(r => setTimeout(r, 800))
      setProgressStep(3) // Step 3: 예측 연산

      // --- Step 3: 예측 실행 ---
      const prediction = model.predict([x1, x2]) as tf.Tensor
      const probabilities = await prediction.data()

      const resultWithProb = Array.from(probabilities).map((prob, index) => ({
        number: index + 1,
        prob: prob
      }))

      const top6 = [...resultWithProb]
        .sort((a, b) => b.prob - a.prob)
        .slice(0, 6)

      const finalNumbers = top6.map(item => item.number).sort((a, b) => a - b)

      // Cleanup
      x1.dispose()
      x2.dispose()
      prediction.dispose()
      model.dispose()

      await new Promise(r => setTimeout(r, 600))
      setPredictionResult(finalNumbers)
      setPredictionProbs(top6)
      setProgressStep(4) // 완료

      toast({
        title: "예측 완료!",
        description: "AI가 새로운 번호를 생성했습니다.",
      })

    } catch (err: any) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: err.message || "예측 중 문제가 발생했습니다.",
      })
      setProgressStep(0)
    } finally {
      setIsPredicting(false)
    }
  }

  // 선택된 모델 정보
  const currentModel = models.find(m => String(m.id) === selectedModelId)

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-8">
      {/* 1. 헤더 (그대로 유지) */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          AI 번호 예측
        </h1>
        <p className="text-[#606060] dark:text-[#aaaaaa] text-sm">
          학습된 딥러닝 모델을 불러와 다음 회차의 당첨 번호를 예측합니다.
        </p>
      </div>

      {/* 2. 메인 컨텐츠 (UI 재구성) */}
      <div className="max-w-3xl mx-auto space-y-8">

        {/* 컨트롤 패널 */}
        <Card className="border-none shadow-md bg-white dark:bg-[#1e1e1e] ring-1 ring-gray-200 dark:ring-[#3f3f3f]">
          <CardHeader className="pb-4 border-b border-gray-100 dark:border-[#2f2f2f]">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-500" />
                  예측 모델 설정
                </CardTitle>
                <CardDescription>
                  분석에 사용할 AI 모델 버전을 선택하세요.
                </CardDescription>
              </div>
              {currentModel && (
                <Badge variant="outline" className="h-8 px-3 text-xs font-mono bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                  ACC: {(currentModel.accuracy * 100).toFixed(1)}%
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {isLoadingModels ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ) : models.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">모델 버전 선택</label>
                    <Select value={selectedModelId} onValueChange={setSelectedModelId} disabled={isPredicting}>
                      <SelectTrigger className="h-12 bg-gray-50 dark:bg-[#272727] border-gray-200 dark:border-[#3f3f3f]">
                        <SelectValue placeholder="모델을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={String(model.id)}>
                            {model.version} (Epochs: {model.epochs})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">상세 정보</label>
                    <div className="flex items-center gap-4 h-12 px-4 bg-gray-50 dark:bg-[#272727] rounded-md border border-gray-200 dark:border-[#3f3f3f] text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span>Loss: <span className="text-red-500 font-mono">{currentModel?.loss?.toFixed(4)}</span></span>
                      </div>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-2">
                        <span>Date: <span className="font-mono">{currentModel ? new Date(currentModel.created_at).toLocaleDateString() : '-'}</span></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 진행 상태 표시기 (Stepper) */}
                {isPredicting && (
                  <div className="py-2 space-y-3">
                    <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                      <span className={progressStep >= 1 ? "text-blue-600 dark:text-blue-400" : ""}>데이터 준비</span>
                      <span className={progressStep >= 2 ? "text-blue-600 dark:text-blue-400" : ""}>엔진 로드</span>
                      <span className={progressStep >= 3 ? "text-blue-600 dark:text-blue-400" : ""}>확률 분석</span>
                    </div>
                    <Progress value={progressStep * 33.3} className="h-2" />
                  </div>
                )}

                <Button
                  onClick={handlePredict}
                  disabled={isPredicting}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-200"
                >
                  {isPredicting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AI 분석 실행 중...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      번호 예측 시작하기
                    </div>
                  )}
                </Button>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>모델 없음</AlertTitle>
                <AlertDescription>
                  학습된 모델이 없습니다. 관리자 페이지에서 먼저 학습을 진행해 주세요.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 결과 섹션 */}
        {predictionResult && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border-2 border-blue-100 dark:border-blue-900 bg-white dark:bg-[#1e1e1e] overflow-hidden shadow-xl">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

              <CardHeader className="text-center pt-8 pb-2">
                <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI 추천 번호</CardTitle>
                <CardDescription>
                  분석 결과, 다음 회차에서 가장 당첨 확률이 높은 조합입니다.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col items-center py-8 space-y-8">
                {/* 번호 공 */}
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-lg mx-auto">
                  {predictionResult.map((num, idx) => (
                    <div
                      key={num}
                      className="group relative flex flex-col items-center"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg transform transition-transform hover:scale-110"
                        style={{ backgroundColor: getBallColor(num) }}
                      >
                        {num}
                      </div>
                      {/* 확률 툴팁 (호버 시 표시) */}
                      <div className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-gray-500 bg-white dark:bg-gray-800 px-1 rounded border border-gray-200 dark:border-gray-700 shadow-sm pointer-events-none whitespace-nowrap z-10">
                        {((predictionProbs.find(p => p.number === num)?.prob || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="w-full max-w-md" />

                {/* 확률 상세 분석 */}
                <div className="w-full max-w-md space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    번호별 예측 확률 분석
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {predictionProbs
                      .sort((a, b) => b.prob - a.prob)
                      .slice(0, 6)
                      .map((item) => (
                        <div key={item.number} className="space-y-1">
                          <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getBallColor(item.number) }} />
                            {item.number}번
                          </span>
                            <span className="font-mono text-gray-500">{(item.prob * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={item.prob * 100} className="h-1.5 bg-gray-100 dark:bg-gray-800" />
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-gray-50 dark:bg-[#252525] border-t border-gray-100 dark:border-[#2f2f2f] p-4 flex justify-center">
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  본 결과는 과거 데이터 패턴에 기반한 AI 예측값으로, 당첨을 보장하지 않습니다.
                </p>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}