import { getApiUrl } from "@/lib/api-config"
import { supabase } from "@/lib/supabase/client"
import type { AvoidInfo, EngineStats, Recommendation } from "./engine"

const ENDPOINT = "/api/ai-recommendations"

/**
 * AI 추천 결과를 특징·모델 정보와 함께 남긴다.
 *
 * 나중에 이 기록만으로 다시 학습하거나 모델 버전별 성적을 견주기 위한 것이라,
 * 저장이 실패해도 화면 동작을 막지 않는다.
 */
export const logRecommendation = async (
    recommendation: Recommendation,
    stats: EngineStats,
    drawNo: number,
): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`

    await fetch(getApiUrl(ENDPOINT), {
      method: "POST",
      headers,
      body: JSON.stringify({
        drawNo,
        numbers: recommendation.numbers,
        score: recommendation.score,
        networkScore: recommendation.networkScore,
        typicality: recommendation.typicality,
        features: recommendation.features,
        maxPastOverlap: recommendation.closestPastDraw?.overlap ?? null,
        model: {
          drawCount: stats.drawCount,
          featureCount: stats.featureCount,
          ensembleSize: stats.ensembleSize,
          accuracy: stats.accuracy,
          trainAccuracy: stats.trainAccuracy,
          brierBefore: stats.brierBefore,
          brierAfter: stats.brierAfter,
          maxPastOverlap: stats.maxPastOverlap,
        },
      }),
    })
  } catch (error) {
    console.error("AI 추천 기록 저장 실패:", error)
  }
}

/**
 * 이번 회차에 이미 내보낸 추천을 불러온다.
 *
 * 같은 조합을 다시 내지 않고, 이미 여러 번 나간 번호는 덜 고르게 하는 데 쓴다.
 * 실패하면 회피 없이 추천하도록 null을 돌려준다.
 */
export const fetchAvoidInfo = async (drawNo: number): Promise<AvoidInfo | undefined> => {
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
