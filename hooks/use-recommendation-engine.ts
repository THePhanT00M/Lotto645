"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { buildEngine, type AvoidInfo, type EngineStats, type Recommendation } from "@/lib/lotto/engine"
import type { WorkerRequest, WorkerResponse } from "@/lib/lotto/engine.worker"
import type { WinningLottoNumbers } from "@/lib/lotto/types"

/**
 * 추천 엔진을 워커에서 돌린다.
 *
 * 학습이 0.5초 남짓 걸려 메인 스레드에서 처리하면 그동안 화면이 멈춘다.
 * 워커를 만들 수 없는 환경에서는 같은 엔진을 메인 스레드에서 실행해
 * 기능이 사라지지 않게 한다.
 */
export function useRecommendationEngine(draws: readonly WinningLottoNumbers[]) {
  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef<((result: { recommendation: Recommendation; stats: EngineStats }) => void) | null>(null)
  const rejectRef = useRef<((error: Error) => void) | null>(null)

  /** 워커를 못 쓸 때 쓰는 메인 스레드 엔진 */
  const fallbackRef = useRef<ReturnType<typeof buildEngine> | null>(null)

  /** 학습 요청을 이미 보냈는지. 상태로만 두면 응답 전에 눌린 두 번째 요청이 재학습을 부른다. */
  const trainSentRef = useRef(false)
  const [isTrained, setIsTrained] = useState(false)

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  const ensureWorker = useCallback((): Worker | null => {
    if (workerRef.current) return workerRef.current
    if (typeof Worker === "undefined") return null

    try {
      const worker = new Worker(new URL("../lib/lotto/engine.worker.ts", import.meta.url))

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const message = event.data

        if (message.type === "ready") {
          setIsTrained(true)
          return
        }

        if (message.type === "result") {
          pendingRef.current?.({ recommendation: message.recommendation, stats: message.stats })
          pendingRef.current = null
          rejectRef.current = null
          return
        }

        rejectRef.current?.(new Error(message.message))
        pendingRef.current = null
        rejectRef.current = null
      }

      worker.onerror = () => {
        // 워커가 뜨지 않으면 메인 스레드로 되돌린다.
        workerRef.current?.terminate()
        workerRef.current = null
        trainSentRef.current = false
      }

      workerRef.current = worker
      return worker
    } catch (error) {
      console.error("추천 워커를 만들지 못했습니다. 메인 스레드에서 실행합니다:", error)
      return null
    }
  }, [])

  const post = (worker: Worker, request: WorkerRequest) => worker.postMessage(request)

  const recommend = useCallback(
      async (avoid?: AvoidInfo): Promise<{ recommendation: Recommendation; stats: EngineStats }> => {
        const worker = ensureWorker()

        if (!worker) {
          fallbackRef.current ??= buildEngine(draws)
          const engine = fallbackRef.current
          setIsTrained(true)
          return { recommendation: engine.recommend(avoid), stats: engine.stats }
        }

        if (!trainSentRef.current) {
          trainSentRef.current = true
          post(worker, { type: "train", draws: [...draws] })
        }

        return new Promise((resolve, reject) => {
          pendingRef.current = resolve
          rejectRef.current = reject
          post(worker, { type: "recommend", avoid })
        })
      },
      [draws, ensureWorker],
  )

  return { recommend, isTrained }
}
