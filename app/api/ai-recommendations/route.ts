import type { NextRequest } from "next/server"
import { errorMessage, fail, ok } from "@/lib/api-response"
import { PICK_COUNT } from "@/lib/lotto/constants"
import { getAdminClient } from "@/lib/supabase/admin"

const TABLE = "ai_recommendations"

interface LogBody {
  drawNo: number
  numbers: number[]
  score: number
  networkScore: number
  typicality: number
  features: Record<string, number>
  model: Record<string, number>
  maxPastOverlap: number | null
}

/**
 * POST /api/ai-recommendations
 *
 * 추천 번호와 그 근거가 된 기하 특징, 모델 정보를 남긴다.
 * 나중에 이 표만으로 다시 학습하거나 모델별 성적을 견주기 위한 기록이다.
 */
export async function POST(request: NextRequest) {
  try {
    const body: LogBody = await request.json()

    if (!Array.isArray(body.numbers) || body.numbers.length !== PICK_COUNT || !body.drawNo) {
      return fail("필수 데이터 누락", 400)
    }

    const supabase = getAdminClient()
    const userId = await resolveUserId(request)

    const { error } = await supabase.from(TABLE).insert({
      draw_no: body.drawNo,
      numbers: body.numbers,
      score: body.score,
      network_score: body.networkScore,
      typicality: body.typicality,
      features: body.features,
      model: body.model,
      max_past_overlap: body.maxPastOverlap,
      user_id: userId,
    })

    if (error) throw error

    return ok({ message: "기록되었습니다." })
  } catch (error) {
    console.error("AI 추천 기록 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/**
 * GET /api/ai-recommendations
 *
 * 수집한 추천 기록과 채점 결과를 집계해 돌려준다.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 200)

    const { data, error } = await supabase
        .from(TABLE)
        .select(
            "id, created_at, draw_no, numbers, score, network_score, typicality, features, model, max_past_overlap, matched_count, bonus_matched, prize_rank, scored_at",
        )
        .order("created_at", { ascending: false })
        .limit(Math.min(1000, Math.max(1, limit)))

    if (error) throw error

    return ok({ records: data ?? [] })
  } catch (error) {
    console.error("AI 추천 기록 조회 실패:", errorMessage(error))
    return fail(errorMessage(error))
  }
}

/** 토큰이 있으면 그 사용자의 기록으로 남긴다. */
const resolveUserId = async (request: NextRequest): Promise<string | null> => {
  const header = request.headers.get("Authorization")
  if (!header?.startsWith("Bearer ")) return null

  const { data: { user } } = await getAdminClient().auth.getUser(header.slice("Bearer ".length))
  return user?.id ?? null
}
