"use client"

import { CheckSquare, History, Square, Trash2, Trophy, X } from "lucide-react"
import { useMemo, useState } from "react"
import { EmptyState } from "@/components/common/empty-state"
import { Notice } from "@/components/common/notice"
import { useTranslation } from "@/components/i18n/locale-provider"
import { PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import HistoryItem from "@/components/history/history-item"
import HistorySkeleton from "@/components/history/history-skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useDrawHistory, type AnalyzedEntry } from "@/hooks/use-draw-history"
import { useToast } from "@/hooks/use-toast"

/** 목록에서 기록을 가리키는 키. 로컬과 서버에 같은 id가 있을 수 있다. */
const keyOf = (entry: AnalyzedEntry) => `${entry.source}-${entry.id}`

interface DrawGroup {
  /** 회차를 지정하지 않고 저장한 구 기록은 null 로 모은다. */
  drawNo: number | null
  entries: AnalyzedEntry[]
  /** 그 회차에서 5등 이상 당첨된 건수 */
  winCount: number
}

/**
 * 기록을 회차별로 묶는다.
 *
 * 최신 회차가 위로 오고, 회차 없이 저장된 구 기록은 맨 아래로 모은다.
 * 회차 안에서는 목록이 이미 최신순이므로 들어온 순서를 그대로 둔다.
 */
const groupByDraw = (entries: AnalyzedEntry[]): DrawGroup[] => {
  const buckets = new Map<number | null, AnalyzedEntry[]>()

  for (const entry of entries) {
    const drawNo = entry.drawNo ?? null
    const bucket = buckets.get(drawNo)

    if (bucket) bucket.push(entry)
    else buckets.set(drawNo, [entry])
  }

  return [...buckets]
      .map(([drawNo, items]) => ({
        drawNo,
        entries: items,
        winCount: items.filter((entry) => entry.status?.kind === "matched" && entry.status.match.rank !== null).length,
      }))
      .sort((a, b) => (b.drawNo ?? -1) - (a.drawNo ?? -1))
}

/**
 * 나의 추첨 기록
 *
 * 브라우저에 저장된 로컬 기록과 로그인 사용자의 서버 기록을 함께 보여주고,
 * 각 기록이 겨냥한 회차의 당첨 결과를 대조해 등수를 표시한다.
 * 서버 기록을 지울 때는 행을 남기고 삭제 표시만 바꾼다.
 */
export default function HistoryPage() {
  const { t } = useTranslation()
  const { entries, isLoading, winCount, remove, removeMany, clearAll } = useDrawHistory()
  const { toast } = useToast()

  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  const selectedEntries = useMemo(
      () => entries.filter((entry) => selectedKeys.has(keyOf(entry))),
      [entries, selectedKeys],
  )

  const allSelected = entries.length > 0 && selectedEntries.length === entries.length

  const groups = useMemo(() => groupByDraw(entries), [entries])

  const toggleSelect = (entry: AnalyzedEntry) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      const key = keyOf(entry)

      if (next.has(key)) next.delete(key)
      else next.add(key)

      return next
    })
  }

  const toggleAll = () => {
    setSelectedKeys(allSelected ? new Set() : new Set(entries.map(keyOf)))
  }

  const stopSelecting = () => {
    setIsSelecting(false)
    setSelectedKeys(new Set())
  }

  const handleDelete = async (entry: AnalyzedEntry) => {
    // 서버 기록은 다른 기기에서도 사라지므로 한 번 더 확인받는다.
    if (entry.source === "user" && !confirm(t.history.confirmOneTitle)) return

    try {
      await remove(entry)
      toast({ title: t.history.deleted })
    } catch (error) {
      toast({ title: t.history.deleteFailed, description: describeError(error), variant: "destructive" })
    }
  }

  const handleDeleteSelected = async () => {
    try {
      const removed = await removeMany(selectedEntries)
      stopSelecting()
      toast({ title: t.history.deletedCount(removed) })
    } catch (error) {
      toast({ title: t.history.deleteFailed, description: describeError(error), variant: "destructive" })
    }
  }

  const handleClearAll = async () => {
    try {
      const removed = await clearAll()
      stopSelecting()
      toast({ title: t.history.deletedCount(removed) })
    } catch (error) {
      toast({ title: t.history.deleteFailed, description: describeError(error), variant: "destructive" })
    }
  }

  if (isLoading) return <HistorySkeleton />

  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={History}
            title={t.history.title}
            description={t.history.description}
            actions={
              entries.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {isSelecting ? (
                        <Button variant="outline" onClick={stopSelecting} className="bg-surface border-line">
                          <X className="mr-2 h-4 w-4" />
                          {t.history.cancelSelect}
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => setIsSelecting(true)} className="bg-surface border-line">
                          <CheckSquare className="mr-2 h-4 w-4" />
                          {t.history.startSelect}
                        </Button>
                    )}

                    <ConfirmDialog
                        trigger={
                          <Button variant="destructive" className="bg-danger hover:bg-danger/90 border-none text-white shadow-none">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t.history.deleteAll}
                          </Button>
                        }
                        title={t.history.confirmAllTitle}
                        description={`${t.history.confirmAllDescription} ${t.history.confirmServerNote}`}
                        onConfirm={handleClearAll}
                    />
                  </div>
              )
            }
        />

        {isSelecting && (
            <Panel className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="custom" onClick={toggleAll} className="text-ink-muted h-8 px-2 text-sm">
                  {allSelected ? <CheckSquare className="mr-1.5 h-4 w-4" /> : <Square className="mr-1.5 h-4 w-4" />}
                  {allSelected ? t.history.clearSelection : t.history.selectAll}
                </Button>
                <span className="text-ink-muted text-sm">{t.history.selectedCount(selectedEntries.length)}</span>
              </div>

              <ConfirmDialog
                  trigger={
                    <Button
                        variant="destructive"
                        disabled={selectedEntries.length === 0}
                        className="bg-danger hover:bg-danger/90 h-9 border-none text-white shadow-none"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t.history.deleteSelected}
                    </Button>
                  }
                  title={t.history.confirmSelectedCountTitle(selectedEntries.length)}
                  description={t.history.confirmServerNote}
                  onConfirm={handleDeleteSelected}
              />
            </Panel>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatCard icon={History} label={t.history.totalSaved} value={entries.length} />
          <StatCard icon={Trophy} label={t.history.winners} value={winCount} />
        </div>

        {entries.length === 0 ? (
            <EmptyState icon={History} message={t.history.empty} />
        ) : (
            <div className="space-y-8">
              {groups.map((group) => (
                  <section key={group.drawNo ?? "unknown"} className="space-y-4">
                    <DrawGroupHeader group={group} />

                    {group.entries.map((entry) => (
                        <HistoryItem
                            key={keyOf(entry)}
                            entry={entry}
                            onDelete={() => handleDelete(entry)}
                            isSelected={isSelecting ? selectedKeys.has(keyOf(entry)) : undefined}
                            onToggleSelect={isSelecting ? () => toggleSelect(entry) : undefined}
                        />
                    ))}
                  </section>
              ))}
            </div>
        )}

        <Notice title={t.history.noticeTitle}>
          <ul className="text-ink-muted mt-1 list-inside list-disc space-y-1 opacity-90">
            <li>{t.history.noticeLocal}</li>
            <li>{t.history.noticeServer}</li>
            <li>{t.history.noticeSoftDelete}</li>
            <li>{t.history.noticePending}</li>
          </ul>
        </Notice>
      </div>
  )
}

/**
 * 회차 구분 머리말
 *
 * 목록이 길어지면 카드마다 붙은 회차 표시만으로는 경계가 눈에 들어오지 않아,
 * 회차가 바뀌는 자리에 선을 긋고 그 회차의 건수와 당첨 수를 함께 보여준다.
 */
function DrawGroupHeader({ group }: { group: DrawGroup }) {
  const { t } = useTranslation()

  return (
      <div className="flex items-center gap-2.5">
        <span className="text-accent bg-accent-soft border-accent-line rounded-md border px-2.5 py-1 text-sm font-bold">
          {group.drawNo === null ? t.history.unassignedDraw : t.lotto.drawNo(group.drawNo)}
        </span>

        <span className="text-ink-muted text-sm">{t.history.count(group.entries.length)}</span>

        {group.winCount > 0 && (
            <span className="flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
              <Trophy className="h-3.5 w-3.5" />
              당첨 {group.winCount}건
            </span>
        )}

        <div className="bg-line h-px flex-1" />
      </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof History; label: string; value: number }) {
  return (
      <Panel>
        <div className="text-ink-muted mb-2 flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="font-medium">{label}</span>
        </div>
        <div className="text-ink text-3xl font-bold">
          {value}
          <span className="text-ink-muted ml-1 text-sm font-normal">건</span>
        </div>
      </Panel>
  )
}

interface ConfirmDialogProps {
  trigger: React.ReactNode
  title: string
  description: string
  onConfirm: () => void | Promise<void>
}

function ConfirmDialog({ trigger, title, description, onConfirm }: ConfirmDialogProps) {
  const { t } = useTranslation()

  return (
      <AlertDialog>
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        <AlertDialogContent className="bg-surface border-line border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink">{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-muted">{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-ink border-line bg-transparent">{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onConfirm()} className="bg-danger hover:bg-danger/90 text-white">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  )
}

const describeError = (error: unknown): string =>
    error instanceof Error ? error.message : "잠시 후 다시 시도해주세요."
