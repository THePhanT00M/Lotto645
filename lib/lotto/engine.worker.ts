/// <reference lib="webworker" />

import { buildEngine, type AvoidInfo, type EngineStats, type Recommendation, type RecommendationEngine } from "./engine"
import type { WinningLottoNumbers } from "./types"

/**
 * 추천 엔진을 백그라운드에서 돌리는 워커
 *
 * 학습에 0.5초 남짓 걸려 메인 스레드에서 돌리면 그동안 화면이 멈춘다.
 * 엔진은 순수 계산만 하므로 워커로 그대로 옮길 수 있다.
 */

export type WorkerRequest =
    | { type: "train"; draws: WinningLottoNumbers[] }
    | { type: "recommend"; avoid?: AvoidInfo }

export type WorkerResponse =
    | { type: "ready"; stats: EngineStats }
    | { type: "result"; recommendation: Recommendation; stats: EngineStats }
    | { type: "error"; message: string }

let engine: RecommendationEngine | null = null

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  try {
    const request = event.data

    if (request.type === "train") {
      engine = buildEngine(request.draws)
      post({ type: "ready", stats: engine.stats })
      return
    }

    if (request.type === "recommend") {
      if (!engine) throw new Error("학습이 끝나지 않았습니다.")
      post({ type: "result", recommendation: engine.recommend(request.avoid), stats: engine.stats })
    }
  } catch (error) {
    post({ type: "error", message: error instanceof Error ? error.message : "알 수 없는 오류" })
  }
}

const post = (message: WorkerResponse) => self.postMessage(message)
