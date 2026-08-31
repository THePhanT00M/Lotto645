"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { deleteServerRecord } from "@/lib/lotto/draw-log"
import { fetchAllDraws, fetchUserRecords } from "@/lib/lotto/queries"
import { indexDrawsByNo, resolveDrawStatus, type DrawStatus } from "@/lib/lotto/rank"
import { clearLottoHistory, deleteLottoResult, getLottoHistory } from "@/lib/lotto/storage"
import { supabase } from "@/lib/supabase/client"
import type { LottoResult, RecordSource, WinningLottoNumbers } from "@/lib/lotto/types"

/** 저장 위치 정보를 붙인 기록 */
export interface HistoryEntry extends LottoResult {
  source: RecordSource
}

/** 당첨 판정까지 끝난 기록 */
export interface AnalyzedEntry extends HistoryEntry {
  status: DrawStatus | null
}

/**
 * 로컬(localStorage)과 서버(로그인 사용자) 기록을 합쳐 당첨 여부까지 판정한다.
 */
export function useDrawHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [draws, setDraws] = useState<WinningLottoNumbers[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const [allDraws, { data: { session } }] = await Promise.all([fetchAllDraws(), supabase.auth.getSession()])

      const local: HistoryEntry[] = getLottoHistory().map((item) => ({ ...item, source: "local" }))
      const server: HistoryEntry[] = session
          ? (await fetchUserRecords(session.user.id)).map((item) => ({ ...item, source: "user" }))
          : []

      if (cancelled) return

      setDraws(allDraws)
      setEntries([...local, ...server].sort((a, b) => b.timestamp - a.timestamp))
      setIsLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const analyzed = useMemo<AnalyzedEntry[]>(() => {
    if (draws.length === 0) return entries.map((entry) => ({ ...entry, status: null }))

    const drawsByNo = indexDrawsByNo(draws)
    const latestDraw = draws.reduce((latest, draw) => (draw.drawNo > latest.drawNo ? draw : latest), draws[0])

    return entries.map((entry) => ({ ...entry, status: resolveDrawStatus(entry, drawsByNo, latestDraw) }))
  }, [draws, entries])

  /** 5등 이상 당첨된 기록 수 */
  const winCount = useMemo(
      () => analyzed.filter((entry) => entry.status?.kind === "matched" && entry.status.match.rank !== null).length,
      [analyzed],
  )

  const hasLocalEntries = useMemo(() => entries.some((entry) => entry.source === "local"), [entries])

  /** 기록 한 건을 삭제한다. 서버 기록은 소프트 삭제로 처리된다. */
  const remove = useCallback(async (entry: HistoryEntry) => {
    if (entry.source === "user") {
      await deleteServerRecord(entry.id)
    } else if (!deleteLottoResult(entry.id)) {
      return
    }

    setEntries((prev) => prev.filter((item) => item.id !== entry.id))
  }, [])

  /** 이 기기에 저장된 기록만 모두 지운다. 서버 기록은 남는다. */
  const clearLocal = useCallback(() => {
    clearLottoHistory()
    setEntries((prev) => prev.filter((entry) => entry.source === "user"))
  }, [])

  return { entries: analyzed, isLoading, winCount, hasLocalEntries, remove, clearLocal }
}
