"use client"

import { useEffect, useMemo, useState } from "react"
import { fetchAllDraws, fetchLatestDraw } from "@/lib/lotto/queries"
import type { WinningLottoNumbers } from "@/lib/lotto/types"

interface WinningDrawsState {
  draws: WinningLottoNumbers[]
  /** 이력에서 가장 최근 회차 번호. 데이터가 없으면 0. */
  latestDrawNo: number
  isLoading: boolean
}

/** 전체 당첨 이력을 한 번 불러온다. */
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

  // 이력이 회차순으로 정렬돼 있다고 가정하지 않는다.
  const latestDrawNo = useMemo(
      () => draws.reduce((latest, draw) => Math.max(latest, draw.drawNo), 0),
      [draws],
  )

  return { draws, latestDrawNo, isLoading }
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
