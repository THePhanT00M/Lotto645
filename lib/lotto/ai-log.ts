import { getApiUrl } from "@/lib/api-config"
import { supabase } from "@/lib/supabase/client"
import type { EngineStats, Recommendation } from "./engine"

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
