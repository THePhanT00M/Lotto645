"use client"

import { CheckSquare, History, Square, Trash2, Trophy, X } from "lucide-react"
import { useMemo, useState } from "react"
import { EmptyState } from "@/components/common/empty-state"
import { Notice } from "@/components/common/notice"
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
    if (entry.source === "user" && !confirm("해당 추첨번호를 삭제하시겠습니까?")) return

    try {
      await remove(entry)
      toast({
        title: "삭제 완료",
        description: entry.source === "user" ? "서버에서 추첨 기록이 삭제되었습니다." : "로컬 기록이 삭제되었습니다.",
      })
    } catch (error) {
      toast({ title: "삭제 실패", description: describeError(error), variant: "destructive" })
    }
  }

  const handleDeleteSelected = async () => {
    try {
      const removed = await removeMany(selectedEntries)
      stopSelecting()
      toast({ title: "삭제 완료", description: `${removed}건을 삭제했습니다.` })
    } catch (error) {
      toast({ title: "삭제 실패", description: describeError(error), variant: "destructive" })
    }
  }

  const handleClearAll = async () => {
    try {
      const removed = await clearAll()
      stopSelecting()
      toast({ title: "전체 삭제 완료", description: `${removed}건을 삭제했습니다.` })
    } catch (error) {
      toast({ title: "삭제 실패", description: describeError(error), variant: "destructive" })
    }
  }

  if (isLoading) return <HistorySkeleton />

  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={History}
            title="나의 추첨 기록"
            description="기기 및 서버에 저장된 기록을 확인하고 당첨 결과를 확인하세요."
            actions={
              entries.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {isSelecting ? (
                        <Button variant="outline" onClick={stopSelecting} className="bg-surface border-line">
                          <X className="mr-2 h-4 w-4" />
                          선택 취소
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => setIsSelecting(true)} className="bg-surface border-line">
                          <CheckSquare className="mr-2 h-4 w-4" />
                          선택 삭제
                        </Button>
                    )}

                    <ConfirmDialog
                        trigger={
                          <Button variant="destructive" className="bg-danger hover:bg-danger/90 border-none text-white shadow-none">
                            <Trash2 className="mr-2 h-4 w-4" />
                            전체 삭제
                          </Button>
                        }
                        title="모든 기록을 삭제하시겠습니까?"
                        description="이 기기에 저장된 기록과 서버에 저장된 '내 기록'이 모두 목록에서 사라집니다. 서버 기록은 실제로 지우지 않고 삭제 표시만 남깁니다."
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
                  {allSelected ? "전체 해제" : "전체 선택"}
                </Button>
                <span className="text-ink-muted text-sm">{selectedEntries.length}건 선택됨</span>
              </div>

              <ConfirmDialog
                  trigger={
                    <Button
                        variant="destructive"
                        disabled={selectedEntries.length === 0}
                        className="bg-danger hover:bg-danger/90 h-9 border-none text-white shadow-none"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      선택 항목 삭제
                    </Button>
                  }
                  title={`선택한 ${selectedEntries.length}건을 삭제하시겠습니까?`}
                  description="서버에 저장된 기록은 실제로 지우지 않고 삭제 표시만 남깁니다."
                  onConfirm={handleDeleteSelected}
              />
            </Panel>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatCard icon={History} label="총 저장된 기록" value={entries.length} />
          <StatCard icon={Trophy} label="당첨된 기록 (5등 이상)" value={winCount} />
        </div>

        {entries.length === 0 ? (
            <EmptyState icon={History} message="저장된 추첨 기록이 없습니다." />
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

        <Notice title="안내사항">
          <ul className="text-ink-muted mt-1 list-inside list-disc space-y-1 opacity-90">
            <li>
              <strong className="font-semibold text-amber-800 dark:text-amber-400">로컬 기록</strong>은 현재 브라우저에만
              저장되며 기기를 변경하거나 캐시 삭제 시 사라집니다.
            </li>
            <li>
              <strong className="font-semibold text-blue-800 dark:text-blue-400">내 기록</strong>은 서버에 저장되어 로그인
              시 언제 어디서든 확인 및 삭제가 가능합니다.
            </li>
            <li>삭제한 서버 기록은 목록에서 사라지지만, 통계 집계를 위해 삭제 표시만 남긴 채 보관됩니다.</li>
            <li>추첨 대기 상태의 기록은 실제 추첨 완료 후 다시 접속하시면 결과가 자동 업데이트됩니다.</li>
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
  return (
      <div className="flex items-center gap-2.5">
        <span className="text-accent bg-accent-soft border-accent-line rounded-md border px-2.5 py-1 text-sm font-bold">
          {group.drawNo === null ? "회차 미지정" : `${group.drawNo}회차`}
        </span>

        <span className="text-ink-muted text-sm">{group.entries.length}건</span>

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
  return (
      <AlertDialog>
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        <AlertDialogContent className="bg-surface border-line border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink">{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-muted">{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-ink border-line bg-transparent">취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onConfirm()} className="bg-danger hover:bg-danger/90 text-white">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  )
}

const describeError = (error: unknown): string =>
    error instanceof Error ? error.message : "잠시 후 다시 시도해주세요."
