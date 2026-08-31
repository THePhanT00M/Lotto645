import { getApiUrl } from "@/lib/api-config"
import { supabase } from "@/lib/supabase/client"
import { saveLottoResult } from "./storage"
import type { DrawSource } from "./types"

const LOG_ENDPOINT = "/api/log-draw"

interface RecordDrawOptions {
  numbers: number[]
  source: DrawSource
  /** 이 번호가 겨냥한 회차 */
  drawNo?: number
}

/**
 * 추첨 결과를 남긴다.
 *
 * 로그인 사용자는 서버에 기록되므로 로컬 저장은 비로그인 사용자만 수행하고,
 * 집계용 서버 로깅은 로그인 여부와 무관하게 항상 시도한다.
 */
export const recordDraw = async ({ numbers, source, drawNo }: RecordDrawOptions): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    saveLottoResult(numbers, { isAiRecommended: source === "ai", drawNo })
  }

  try {
    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`

    await fetch(getApiUrl(LOG_ENDPOINT), {
      method: "POST",
      headers,
      body: JSON.stringify({ numbers, source, userId: session?.user.id }),
    })
  } catch (error) {
    console.error(`추첨 기록 서버 저장 실패 (${source}):`, error)
  }
}

/** 서버에 저장된 내 기록을 삭제한다(소프트 삭제). */
export const deleteServerRecord = async (id: string): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error("로그인이 필요합니다.")

  const response = await fetch(getApiUrl(LOG_ENDPOINT), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ id: Number(id) }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message ?? "서버 기록 삭제에 실패했습니다.")
  }
}
