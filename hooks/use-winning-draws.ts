"use client"

import { useEffect, useMemo, useState } from "react"
import { buildAnalytics, type LottoAnalytics } from "@/lib/lotto/analytics"
import { fetchAllDraws, fetchLatestDraw } from "@/lib/lotto/queries"
import type { WinningLottoNumbers } from "@/lib/lotto/types"

interface WinningDrawsState {
  draws: WinningLottoNumbers[]
  analytics: LottoAnalytics
  isLoading: boolean
}

/** 전체 당첨 이력을 한 번 불러와 분석 지표까지 계산해 둔다. */
export function useWinningDraws(): WinningDrawsState {
  const [draws, setDraws] = useState<WinningLottoNumbers[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetchAllDraws().then((data) => {
      if (cancelled) return
      setDraws(data)
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const analytics = useMemo(() => buildAnalytics(draws), [draws])

  return { draws, analytics, isLoading }
}

/** 다음 추첨 회차 번호. 기록을 남길 때 어느 회차를 겨냥했는지 표시하는 데 쓴다. */
export function useUpcomingDrawNo(): number | undefined {
  const [drawNo, setDrawNo] = useState<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    fetchLatestDraw().then((latest) => {
      if (!cancelled && latest) setDrawNo(latest.drawNo + 1)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return drawNo
}
