"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { entryKey, type AnalyzedEntry, type HistoryEntry } from "@/lib/lotto/history-summary"
import { deleteServerRecords, fetchMyPicks, updateServerMemo } from "@/lib/lotto/pick-log"
import type { DrawPrize } from "@/lib/lotto/prizes"
import { fetchAllDraws, fetchDrawPrizes } from "@/lib/lotto/queries"
import { indexDrawsByNo, resolveDrawStatus } from "@/lib/lotto/rank"
import { clearLottoHistory, deleteLottoResult, getLottoHistory, updateLottoMemo } from "@/lib/lotto/storage"
import type { WinningLottoNumbers } from "@/lib/lotto/types"

export type { AnalyzedEntry, HistoryEntry } from "@/lib/lotto/history-summary"

/**
 * 로컬(localStorage)과 서버(로그인 사용자) 기록을 합쳐 당첨 여부와 당첨금까지 판정한다.
 */
export function useDrawHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [draws, setDraws] = useState<WinningLottoNumbers[]>([])
  const [prizes, setPrizes] = useState<DrawPrize[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const [allDraws, myPicks, allPrizes] = await Promise.all([fetchAllDraws(), fetchMyPicks(), fetchDrawPrizes()])

      const local: HistoryEntry[] = getLottoHistory().map((item) => ({ ...item, source: "local" }))
      const server: HistoryEntry[] = myPicks.map((item) => ({ ...item, source: "user" }))

      if (cancelled) return

      setDraws(allDraws)
      setPrizes(allPrizes)
      setEntries([...local, ...server].sort((a, b) => b.timestamp - a.timestamp))
      setIsLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const analyzed = useMemo<AnalyzedEntry[]>(() => {
    if (draws.length === 0) return entries.map((entry) => ({ ...entry, status: null, prizeAmount: null }))

    const drawsByNo = indexDrawsByNo(draws)
    const latestDraw = draws.reduce((latest, draw) => (draw.drawNo > latest.drawNo ? draw : latest), draws[0])
    const prizesByDraw = new Map(prizes.map((prize) => [prize.drawNo, prize]))

    return entries.map((entry) => {
      const status = resolveDrawStatus(entry, drawsByNo, latestDraw)
      const rank = status.kind === "matched" ? status.match.rank : null
      const prizeAmount = rank === null ? null : prizesByDraw.get(status.drawNo)?.amounts[rank - 1] ?? null

      return { ...entry, status, prizeAmount }
    })
  }, [draws, entries, prizes])

  /** 기록 한 건을 삭제한다. 서버 기록은 소프트 삭제로 처리된다. */
  const remove = useCallback(async (entry: HistoryEntry) => {
    if (entry.source === "user") {
      await deleteServerRecords({ ids: [entry.id] })
    } else if (!deleteLottoResult(entry.id)) {
      return
    }

    const key = entryKey(entry)
    setEntries((prev) => prev.filter((item) => entryKey(item) !== key))
  }, [])

  /**
   * 고른 기록을 한 번에 삭제한다.
   *
   * 서버 기록은 한 번의 요청으로 묶어 보내고, 로컬 기록은 이 기기에서만 지운다.
   */
  const removeMany = useCallback(async (targets: readonly HistoryEntry[]): Promise<number> => {
    if (targets.length === 0) return 0

    const serverIds = targets.filter((entry) => entry.source === "user").map((entry) => entry.id)
    const localIds = targets.filter((entry) => entry.source === "local").map((entry) => entry.id)

    if (serverIds.length > 0) await deleteServerRecords({ ids: serverIds })
    for (const id of localIds) deleteLottoResult(id)

    const removed = new Set(targets.map(entryKey))
    setEntries((prev) => prev.filter((entry) => !removed.has(entryKey(entry))))

    return targets.length
  }, [])

  /** 목록에 있는 기록을 모두 지운다. 서버 기록은 소프트 삭제로 남는다. */
  const clearAll = useCallback(async (): Promise<number> => {
    const total = entries.length

    if (entries.some((entry) => entry.source === "user")) await deleteServerRecords({ all: true })
    clearLottoHistory()
    setEntries([])

    return total
  }, [entries])

  /** 메모를 바꾼다. 서버 기록은 서버에, 로컬 기록은 이 기기에 저장한다. 빈 값이면 지운다. */
  const updateMemo = useCallback(async (entry: HistoryEntry, memo: string) => {
    const trimmed = memo.trim()

    if (entry.source === "user") await updateServerMemo(entry.id, trimmed)
    else if (!updateLottoMemo(entry.id, trimmed)) throw new Error("메모를 저장하지 못했습니다.")

    const key = entryKey(entry)
    setEntries((prev) => prev.map((item) => (entryKey(item) === key ? { ...item, memo: trimmed || undefined } : item)))
  }, [])

  return { entries: analyzed, draws, isLoading, remove, removeMany, clearAll, updateMemo }
}
