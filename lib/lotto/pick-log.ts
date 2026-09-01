import { getApiUrl } from "@/lib/api-config"
import { supabase } from "@/lib/supabase/client"
import type { EngineStats, Recommendation } from "./engine"
import { saveLottoResult } from "./storage"
import type { DrawSource } from "./types"

const ENDPOINT = "/api/picks"

interface RecordPickOptions {
  numbers: number[]
  source: DrawSource
  /** 이 번호가 겨냥한 회차 */
  drawNo?: number
  /** AI 추천이라면 그 근거를 함께 남긴다. */
  insight?: { recommendation: Recommendation; stats: EngineStats }
}

/**
 * 생성한 번호를 남긴다.
 *
 * 로그인 사용자는 서버에 기록되므로 로컬 저장은 비로그인 사용자만 수행하고,
 * 집계용 서버 기록은 로그인 여부와 무관하게 항상 시도한다.
 * 저장이 실패해도 화면 동작을 막지 않는다.
 */
export const recordPick = async ({ numbers, source, drawNo, insight }: RecordPickOptions): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    saveLottoResult(numbers, { isAiRecommended: source === "ai", drawNo })
  }

  try {
    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`

    await fetch(getApiUrl(ENDPOINT), {
      method: "POST",
      headers,
      body: JSON.stringify({
        numbers,
        source,
        drawNo,
        insight: insight && {
          score: insight.recommendation.score,
          networkScore: insight.recommendation.networkScore,
          typicality: insight.recommendation.typicality,
          features: insight.recommendation.features,
          maxPastOverlap: insight.recommendation.closestPastDraw?.overlap ?? null,
          model: {
            drawCount: insight.stats.drawCount,
            featureCount: insight.stats.featureCount,
            ensembleSize: insight.stats.ensembleSize,
            accuracy: insight.stats.accuracy,
            trainAccuracy: insight.stats.trainAccuracy,
            brierBefore: insight.stats.brierBefore,
            brierAfter: insight.stats.brierAfter,
            maxPastOverlap: insight.stats.maxPastOverlap,
          },
        },
      }),
    })
  } catch (error) {
    console.error(`번호 기록 저장 실패 (${source}):`, error)
  }
}

/** 서버 기록 삭제 범위 */
type DeleteTarget = { ids: string[] } | { all: true }

/**
 * 서버에 저장된 내 기록을 소프트 삭제한다.
 *
 * 행은 남기고 deleted_at만 채우므로 통계 집계에는 그대로 쓰인다.
 */
export const deleteServerRecords = async (target: DeleteTarget): Promise<number> => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error("로그인이 필요합니다.")

  const body = "all" in target ? { all: true } : { ids: target.ids.map(Number) }

  const response = await fetch(getApiUrl(ENDPOINT), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? "서버 기록 삭제에 실패했습니다.")
  }

  return payload.removed ?? 0
}

/** 이번 회차에 이미 내보낸 추천 정보 */
export interface AvoidResponse {
  combinations: string[]
  numberCounts: Record<number, number>
  total: number
}

/**
 * 이번 회차에 이미 내보낸 추천을 불러온다.
 *
 * 같은 조합을 다시 내지 않고, 이미 여러 번 나간 번호는 덜 고르게 하는 데 쓴다.
 * 실패하면 회피 없이 추천하도록 undefined를 돌려준다.
 */
export const fetchAvoidInfo = async (drawNo: number): Promise<AvoidResponse | undefined> => {
  try {
    const response = await fetch(getApiUrl(`${ENDPOINT}/avoid?drawNo=${drawNo}`))
    const data = await response.json()

    if (!data.success) return undefined

    return {
      combinations: data.combinations ?? [],
      numberCounts: data.numberCounts ?? {},
      total: data.total ?? 0,
    }
  } catch (error) {
    console.error("추천 회피 정보를 불러오지 못했습니다:", error)
    return undefined
  }
}
