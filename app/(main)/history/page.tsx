"use client"

import { History, Trash2, Trophy } from "lucide-react"
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
import { useDrawHistory } from "@/hooks/use-draw-history"
import { useToast } from "@/hooks/use-toast"
import type { HistoryEntry } from "@/hooks/use-draw-history"

/**
 * 나의 추첨 기록
 *
 * 브라우저에 저장된 로컬 기록과 로그인 사용자의 서버 기록을 함께 보여주고,
 * 각 기록이 겨냥한 회차의 당첨 결과를 대조해 등수를 표시한다.
 */
export default function HistoryPage() {
  const { entries, isLoading, winCount, hasLocalEntries, remove, clearLocal } = useDrawHistory()
  const { toast } = useToast()

  const handleDelete = async (entry: HistoryEntry) => {
    // 서버 기록은 다른 기기에서도 사라지므로 한 번 더 확인받는다.
    if (entry.source === "user" && !confirm("해당 추첨번호를 삭제하시겠습니까?")) return

    try {
      await remove(entry)
      toast({
        title: "삭제 완료",
        description: entry.source === "user" ? "서버에서 추첨 기록이 삭제되었습니다." : "로컬 기록이 삭제되었습니다.",
      })
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      })
    }
  }

  const handleClearLocal = () => {
    clearLocal()
    toast({ title: "로컬 기록 삭제 완료", description: "기기에 저장된 모든 기록이 삭제되었습니다." })
  }

  if (isLoading) return <HistorySkeleton />

  return (
      <div className="container mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={History}
            title="나의 추첨 기록"
            description="기기 및 서버에 저장된 기록을 확인하고 당첨 결과를 확인하세요."
            actions={hasLocalEntries ? <ClearLocalButton onConfirm={handleClearLocal} /> : undefined}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatCard icon={History} label="총 저장된 기록" value={entries.length} />
          <StatCard icon={Trophy} label="당첨된 기록 (5등 이상)" value={winCount} />
        </div>

        <div className="space-y-4">
          {entries.length === 0 ? (
              <EmptyState icon={History} message="저장된 추첨 기록이 없습니다." />
          ) : (
              entries.map((entry) => (
                  <HistoryItem key={`${entry.source}-${entry.id}`} entry={entry} onDelete={() => handleDelete(entry)} />
              ))
          )}
        </div>

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
            <li>추첨 대기 상태의 기록은 실제 추첨 완료 후 다시 접속하시면 결과가 자동 업데이트됩니다.</li>
          </ul>
        </Notice>
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

function ClearLocalButton({ onConfirm }: { onConfirm: () => void }) {
  return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="bg-danger hover:bg-danger/90 w-full border-none text-white shadow-none sm:w-auto">
            <Trash2 className="mr-2 h-4 w-4" />
            로컬 기록 전체 삭제
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-surface border-line border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink">로컬 기록을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-muted">
              브라우저에 저장된 기록만 삭제되며, 서버에 저장된 &lsquo;내 기록&rsquo;은 유지됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-ink border-line bg-transparent">취소</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} className="bg-danger hover:bg-danger/90 text-white">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  )
}
