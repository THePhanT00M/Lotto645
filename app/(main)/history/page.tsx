"use client"

import { useState, useEffect } from "react"
import { getLottoHistory, clearLottoHistory, updateLottoResult, deleteLottoResult } from "@/utils/lotto-storage"
import type { LottoResult } from "@/types/lotto"
import { Button } from "@/components/ui/button"
import { Trash2, Filter, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format, isToday, isYesterday } from "date-fns"
import { ko } from "date-fns/locale"
import { HistoryCard } from "@/components/history/history-card"
import { FilterPanel } from "@/components/history/filter-panel"
import { EmptyHistory, NoFilterResults, LoadingState } from "@/components/history/empty-states"
import { LottoAnalysis } from "@/components/history/lotto-analysis"

export default function HistoryPage() {
  const [history, setHistory] = useState<LottoResult[]>([])
  const [filteredHistory, setFilteredHistory] = useState<LottoResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [memoText, setMemoText] = useState("")
  const [showAiAnalysis, setShowAiAnalysis] = useState(false)

  // Filter states
  const [showOnlyAiRecommended, setShowOnlyAiRecommended] = useState(false)
  const [filterNumbers, setFilterNumbers] = useState<number[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  useEffect(() => {
    // Load history from localStorage
    const loadHistory = () => {
      setIsLoading(true)
      const data = getLottoHistory()
      setHistory(data)
      setFilteredHistory(data)
      setIsLoading(false)
    }

    loadHistory()
  }, [])

  // Apply filters whenever filter conditions change
  useEffect(() => {
    applyFilters()
  }, [history, showOnlyAiRecommended, filterNumbers])

  const applyFilters = () => {
    let filtered = [...history]

    // Filter for AI recommended numbers
    if (showOnlyAiRecommended) {
      filtered = filtered.filter((item) => item.isAiRecommended)
    }

    // Filter for specific numbers
    if (filterNumbers.length > 0) {
      filtered = filtered.filter((item) => filterNumbers.every((num) => item.numbers.includes(num)))
    }

    setFilteredHistory(filtered)
  }

  const toggleFilterNumber = (num: number) => {
    if (filterNumbers.includes(num)) {
      setFilterNumbers(filterNumbers.filter((n) => n !== num))
    } else {
      setFilterNumbers([...filterNumbers, num])
    }
  }

  const clearFilters = () => {
    setShowOnlyAiRecommended(false)
    setFilterNumbers([])
  }

  const handleClearHistory = () => {
    if (window.confirm("모든 추첨 기록을 삭제하시겠습니까?")) {
      clearLottoHistory()
      setHistory([])
      setFilteredHistory([])
      toast({
        title: "기록 삭제 완료",
        description: "모든 추첨 기록이 삭제되었습니다.",
      })
    }
  }

  const startEditing = (id: string, currentMemo = "") => {
    setEditingId(id)
    setMemoText(currentMemo)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setMemoText("")
  }

  const saveMemo = (id: string) => {
    const success = updateLottoResult(id, { memo: memoText.trim() })

    if (success) {
      // Update local state to reflect the change
      const updatedHistory = history.map((item) => (item.id === id ? { ...item, memo: memoText.trim() } : item))
      setHistory(updatedHistory)

      toast({
        title: "메모 저장 완료",
        description: "메모가 성공적으로 저장되었습니다.",
      })
    } else {
      toast({
        title: "메모 저장 실패",
        description: "메모 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }

    setEditingId(null)
  }

  const handleDeleteEntry = (id: string) => {
    if (window.confirm("이 추첨 기록을 삭제하시겠습니까?")) {
      const success = deleteLottoResult(id)

      if (success) {
        // Update local state to reflect the deletion
        const updatedHistory = history.filter((item) => item.id !== id)
        setHistory(updatedHistory)

        toast({
          title: "기록 삭제 완료",
          description: "선택한 추첨 기록이 삭제되었습니다.",
        })
      } else {
        toast({
          title: "기록 삭제 실패",
          description: "기록 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    }
  }

  // Group history items by date
  const groupedHistory = filteredHistory.reduce<Record<string, LottoResult[]>>((groups, item) => {
    const date = new Date(item.timestamp)
    let groupKey: string

    if (isToday(date)) {
      groupKey = "today"
    } else if (isYesterday(date)) {
      groupKey = "yesterday"
    } else {
      // Use the actual date as the group key for other dates
      groupKey = format(date, "yyyy년 MM월 dd일", { locale: ko })
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {})

  const getGroupTitle = (key: string): string => {
    if (key === "today") return "오늘"
    if (key === "yesterday") return "어제"
    return key // For other dates, the key itself is already the formatted date
  }

  const hasActiveFilters = showOnlyAiRecommended || filterNumbers.length > 0
  const noFilteredResults = filteredHistory.length === 0 && hasActiveFilters

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header with filter toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">추첨 기록</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`${isFilterOpen ? "bg-blue-50 text-blue-600 border-blue-200" : ""}`}
          >
            <Filter className="w-4 h-4 mr-1" />
            필터
            {hasActiveFilters && (
              <span className="ml-1 w-4 h-4 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
                {(showOnlyAiRecommended ? 1 : 0) + (filterNumbers.length > 0 ? 1 : 0)}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAiAnalysis(!showAiAnalysis)}
            className={`${showAiAnalysis ? "bg-purple-50 text-purple-600 border-purple-200" : ""}`}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            번호 분석
          </Button>

          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 bg-transparent"
              onClick={handleClearHistory}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              기록 삭제
            </Button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {isFilterOpen && (
        <FilterPanel
          showOnlyAiRecommended={showOnlyAiRecommended}
          filterNumbers={filterNumbers}
          onToggleAiRecommended={() => setShowOnlyAiRecommended(!showOnlyAiRecommended)}
          onToggleFilterNumber={toggleFilterNumber}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {/* Analysis panel */}
      {showAiAnalysis && <LottoAnalysis history={history} />}

      {/* Main content */}
      {isLoading ? (
        <LoadingState />
      ) : history.length === 0 ? (
        <EmptyHistory />
      ) : noFilteredResults ? (
        <NoFilterResults onClearFilters={clearFilters} />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(
            ([group, items]) =>
              items.length > 0 && (
                <div key={group} className="space-y-4">
                  <h2 className="text-lg font-medium text-gray-700 border-b pb-2">{getGroupTitle(group)}</h2>
                  <div className="space-y-4">
                    {items.map((result) => (
                      <HistoryCard
                        key={result.id}
                        result={result}
                        isEditing={editingId === result.id}
                        memoText={editingId === result.id ? memoText : result.memo || ""}
                        onEdit={() => startEditing(result.id, result.memo || "")}
                        onCancel={cancelEditing}
                        onSave={() => saveMemo(result.id)}
                        onMemoChange={(text) => setMemoText(text)}
                        onDelete={handleDeleteEntry}
                      />
                    ))}
                  </div>
                </div>
              ),
          )}
        </div>
      )}
    </div>
  )
}
