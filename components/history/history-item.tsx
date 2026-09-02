"use client"

import { Calendar, Database, HardDrive, Sparkles, Trash2 } from "lucide-react"
import { RankBadge } from "@/components/common/rank-badge"
import { Panel } from "@/components/common/panel"
import { BallRow } from "@/components/lotto/ball-row"
import { Button } from "@/components/ui/button"
import type { AnalyzedEntry } from "@/hooks/use-draw-history"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/components/i18n/locale-provider"

interface HistoryItemProps {
  entry: AnalyzedEntry
  onDelete: () => void
  /** 선택 모드일 때 체크 상태. 지정하지 않으면 체크박스를 그리지 않는다. */
  isSelected?: boolean
  onToggleSelect?: () => void
}

/** 추첨 기록 한 건. 출처·회차·당첨 결과와 번호를 함께 보여준다. */
export default function HistoryItem({ entry, onDelete, isSelected, onToggleSelect }: HistoryItemProps) {
  const { t } = useTranslation()
  const isServerRecord = entry.source === "user"
  const isSelectable = onToggleSelect !== undefined

  return (
      <Panel className={cn("relative", isSelected && "border-blue-300 ring-1 ring-blue-500/20 dark:border-blue-800")}>
        <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex w-full items-center justify-between md:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              {isSelectable && (
                  <input
                      type="checkbox"
                      checked={Boolean(isSelected)}
                      onChange={onToggleSelect}
                      aria-label={t.history.selectAria(entry.numbers.join(", "))}
                      className="border-line mr-1 h-4 w-4 rounded accent-blue-600"
                  />
              )}
              {isServerRecord ? (
                  <Tag className="border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/40 dark:text-blue-300">
                    <Database className="mr-1 h-3 w-3" />{t.history.mine}
                  </Tag>
              ) : (
                  <Tag className="border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/40 dark:text-amber-300">
                    <HardDrive className="mr-1 h-3 w-3" />{t.history.local}
                  </Tag>
              )}

              <Tag className="text-ink border-transparent bg-black/5 dark:bg-white/10">
                <Calendar className="text-ink-muted mr-1.5 h-3.5 w-3.5" />
                {new Date(entry.timestamp).toLocaleString()}
              </Tag>

              {entry.isAiRecommended && (
                  <Tag className="border-purple-100 bg-purple-50 text-purple-700 dark:border-purple-800/50 dark:bg-purple-900/30 dark:text-purple-300">
                    <Sparkles className="mr-1 h-3 w-3" />{t.history.ai}
                  </Tag>
              )}
            </div>

            <DeleteButton onClick={onDelete} className="md:hidden" />
          </div>

          {/* 회차는 목록의 그룹 머리말이 알려주므로 카드에서는 당첨 결과만 보여준다. */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {entry.status && <RankBadge status={entry.status} showComparedDraw={entry.drawNo === undefined} />}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <BallRow
              numbers={entry.numbers}
              size="fluid"
              className="w-full max-w-xs gap-3"
              ballClassName="max-w-10 shadow-sm"
          />
          <DeleteButton onClick={onDelete} className="hidden md:inline-flex" />
        </div>
      </Panel>
  )
}

function Tag({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
      <span className={`flex items-center rounded-md border px-2 py-1 text-xs font-medium ${className}`}>
        {children}
      </span>
  )
}

function DeleteButton({ onClick, className }: { onClick: () => void; className?: string }) {
  const { t } = useTranslation()
  return (
      <Button
          variant="ghost"
          size="custom"
          onClick={onClick}
          className={`text-danger border-danger/20 hover:bg-danger/10 shrink-0 border bg-transparent px-2 py-1 text-xs ${className}`}
      >
        <Trash2 className="mr-1 h-3.5 w-3.5" />
        {t.common.delete}
      </Button>
  )
}
