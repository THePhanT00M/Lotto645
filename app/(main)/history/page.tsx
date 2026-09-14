"use client"

import { useMemo, useState } from "react"
import HistorySkeleton from "@/components/history/history-skeleton"
import HistoryView from "@/components/history/history-view"
import { useTranslation } from "@/components/i18n/locale-provider"
import { useDrawHistory } from "@/hooks/use-draw-history"
import { useToast } from "@/hooks/use-toast"
import {
  DEFAULT_FILTER,
  entryKey,
  filterEntries,
  groupByDraw,
  nextDrawOf,
  sourceOf,
  summarizeHistory,
  type AnalyzedEntry,
  type HistoryFilter,
} from "@/lib/lotto/history-summary"
import { indexDrawsByNo } from "@/lib/lotto/rank"

/** 한 번에 보여 주는 기록 수. 한 회차에 기록이 몰릴 수 있어 회차가 아니라 기록으로 센다. */
const ENTRIES_PER_PAGE = 20

/**
 * 나의 추첨 기록
 *
 * 브라우저에 저장된 로컬 기록과 로그인 사용자의 서버 기록을 함께 보여 준다.
 * 회차별로 당첨 번호와 대조해 맞은 번호·등수·당첨금을 붙이고, 다음 추첨을 겨냥한
 * 번호와 내 성적을 요약한다. 서버 기록을 지울 때는 행을 남기고 삭제 표시만 바꾼다.
 */
export default function HistoryPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { entries, draws, isLoading, remove, removeMany, clearAll, updateMemo } = useDrawHistory()

  const [filter, setFilter] = useState<HistoryFilter>(DEFAULT_FILTER)
  const [pages, setPages] = useState(1)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  const drawsByNo = useMemo(() => indexDrawsByNo(draws), [draws])
  const summary = useMemo(() => summarizeHistory(entries), [entries])
  const nextDraw = useMemo(() => nextDrawOf(entries, draws), [entries, draws])
  const filtered = useMemo(() => filterEntries(entries, filter), [entries, filter])
  const shownCount = pages * ENTRIES_PER_PAGE
  const groups = useMemo(() => groupByDraw(filtered, drawsByNo, shownCount), [filtered, drawsByNo, shownCount])

  const fail = (title: string, error: unknown) =>
      toast({ title, description: error instanceof Error ? error.message : t.auth.errors.unknown, variant: "destructive" })

  const changeFilter = (next: HistoryFilter) => {
    setFilter(next)
    setPages(1)
  }

  const stopSelecting = () => {
    setIsSelecting(false)
    setSelectedKeys(new Set())
  }

  const toggleSelect = (entry: AnalyzedEntry) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      const key = entryKey(entry)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // 전체 선택은 지금 걸러 보고 있는 기록에만 적용한다.
  const toggleAll = () => {
    const allKeys = filtered.map(entryKey)
    setSelectedKeys(allKeys.length > 0 && allKeys.every((key) => selectedKeys.has(key)) ? new Set() : new Set(allKeys))
  }

  const handleDelete = async (entry: AnalyzedEntry) => {
    // 서버 기록은 다른 기기에서도 사라지므로 한 번 더 확인받는다.
    if (entry.source === "user" && !confirm(t.history.confirmOneTitle)) return

    try {
      await remove(entry)
      toast({ title: t.history.deleted })
    } catch (error) {
      fail(t.history.deleteFailed, error)
    }
  }

  const handleDeleteSelected = async () => {
    try {
      const removed = await removeMany(filtered.filter((entry) => selectedKeys.has(entryKey(entry))))
      stopSelecting()
      toast({ title: t.history.deletedCount(removed) })
    } catch (error) {
      fail(t.history.deleteFailed, error)
    }
  }

  const handleDeleteAll = async () => {
    try {
      const removed = await clearAll()
      stopSelecting()
      toast({ title: t.history.deletedCount(removed) })
    } catch (error) {
      fail(t.history.deleteFailed, error)
    }
  }

  const handleCopy = async (entry: AnalyzedEntry) => {
    try {
      await navigator.clipboard.writeText([...entry.numbers].sort((a, b) => a - b).join(", "))
      toast({ title: t.history.copied })
    } catch (error) {
      fail(t.history.copyFailed, error)
    }
  }

  // 실패하면 다시 던져, 입력칸이 닫히지 않고 쓴 글이 남게 한다.
  const handleSaveMemo = async (entry: AnalyzedEntry, memo: string) => {
    try {
      await updateMemo(entry, memo)
      toast({ title: t.history.memoSaved })
    } catch (error) {
      fail(t.history.memoFailed, error)
      throw error
    }
  }

  const handleDownload = () => {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `lotto-history-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <HistorySkeleton />

  return (
      <HistoryView
          state={{
            summary,
            nextDraw,
            groups,
            filteredCount: filtered.length,
            hasMore: filtered.length > shownCount,
            filter,
            isSelecting,
            selectedKeys,
          }}
          actions={{
            onFilterChange: changeFilter,
            onShowMore: () => setPages((prev) => prev + 1),
            onStartSelect: () => setIsSelecting(true),
            onStopSelect: stopSelecting,
            onToggleSelect: toggleSelect,
            onToggleAll: toggleAll,
            onDeleteSelected: handleDeleteSelected,
            onDeleteAll: handleDeleteAll,
            onDelete: (entry) => void handleDelete(entry),
            onCopy: (entry) => void handleCopy(entry),
            onSaveMemo: handleSaveMemo,
            onDownload: handleDownload,
          }}
      />
  )
}

/** 지금 걸러 보고 있는 기록을 CSV 로 만든다. 엑셀이 한글을 읽도록 BOM 을 붙인다. */
const toCsv = (entries: readonly AnalyzedEntry[]): string => {
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`
  const header = ["draw_no", "numbers", "made_by", "stored", "saved_at", "matched", "bonus", "rank", "prize", "memo"]

  const rows = entries.map((entry) => {
    const match = entry.status?.kind === "matched" ? entry.status.match : null
    return [
      entry.drawNo ?? entry.status?.drawNo ?? "",
      quote([...entry.numbers].sort((a, b) => a - b).join(" ")),
      sourceOf(entry) ?? "",
      entry.source,
      new Date(entry.timestamp).toISOString(),
      match?.matchCount ?? "",
      match ? (match.bonusMatch ? "Y" : "N") : "",
      match?.rank ?? "",
      entry.prizeAmount ?? "",
      quote(entry.memo ?? ""),
    ].join(",")
  })

  return `﻿${[header.join(","), ...rows].join("\n")}`
}
