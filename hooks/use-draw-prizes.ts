"use client"

import { useEffect, useState } from "react"
import type { DrawPrize } from "@/lib/lotto/prizes"
import { fetchDrawPrizes } from "@/lib/lotto/queries"

/**
 * 회차별 등수 당첨자 수를 한 번 불러온다.
 *
 * AI 추천이 사람들이 몰리는 조합을 배우는 데 쓴다. 불러오지 못하면 빈 배열로 두고,
 * 엔진은 인기 없이 과거 회차 회피만 한다.
 */
export function useDrawPrizes() {
  const [prizes, setPrizes] = useState<DrawPrize[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetchDrawPrizes().then((data) => {
      if (cancelled) return
      setPrizes(data)
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { prizes, isLoading }
}
