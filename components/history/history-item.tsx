"use client"

import { Copy, Database, HardDrive, NotebookPen, Trash2, type LucideIcon } from "lucide-react"
import { useState, type FormEvent, type ReactNode } from "react"
import { Surface } from "@/components/common/panel"
import { RankBadge } from "@/components/common/rank-badge"
import { useTranslation } from "@/components/i18n/locale-provider"
import { Ball } from "@/components/lotto/ball"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sourceOf, type AnalyzedEntry } from "@/lib/lotto/history-summary"
import type { DrawSource, WinningLottoNumbers } from "@/lib/lotto/types"
import { cn } from "@/lib/utils"

/** 메모 최대 길이. 서버(app/api/picks)도 같은 길이로 자른다. */
const MAX_MEMO_LENGTH = 100

/**
 * 저장 시각 (예: 2026-09-14 11:38)
 *
 * 스켈레톤은 서버에서 먼저 그려지므로, 브라우저 언어나 시간대에 따라 글이 달라지면
 * 하이드레이션이 어긋난다. 시간대와 형식을 고정해 어디서 그려도 같은 글이 나오게 한다.
 */
const SAVED_AT = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

const STORAGE_TONE = {
  user: "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/40 dark:text-blue-300",
  local: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/40 dark:text-amber-300",
} as const

const SOURCE_TONE: Record<DrawSource, string> = {
  ai: "border-purple-100 bg-purple-50 text-purple-700 dark:border-purple-800/50 dark:bg-purple-900/30 dark:text-purple-300",
  machine: "border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-800/50 dark:bg-sky-900/30 dark:text-sky-300",
  manual: "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/30 dark:text-emerald-300",
}

interface HistoryItemProps {
  entry: AnalyzedEntry
  /** 이 기록이 겨냥한 회차의 당첨 번호. 추첨 전이면 null 이고 번호를 강조하지 않는다. */
  draw: WinningLottoNumbers | null
  /** 선택 모드일 때 체크 상태. 지정하지 않으면 체크박스를 그리지 않는다. */
  isSelected?: boolean
  onToggleSelect?: () => void
  onDelete: () => void
  onCopy: () => void
  onSaveMemo: (memo: string) => Promise<void>
}

/**
 * 추첨 기록 한 건
 *
 * 추첨이 끝난 회차면 맞은 번호만 또렷하게 두고 나머지는 흐리게 해, 등수와 함께
 * 어느 번호가 맞았는지를 바로 보여 준다. 보너스 번호를 골랐으면 테를 두른다.
 */
export default function HistoryItem({
  entry,
  draw,
  isSelected,
  onToggleSelect,
  onDelete,
  onCopy,
  onSaveMemo,
}: HistoryItemProps) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const source = sourceOf(entry)
  const numbers = [...entry.numbers].sort((a, b) => a - b)

  return (
      <Surface className={cn("space-y-3", isSelected && "border-blue-400 ring-1 ring-blue-500/20 dark:border-blue-700")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {onToggleSelect && (
                <input
                    type="checkbox"
                    checked={Boolean(isSelected)}
                    onChange={onToggleSelect}
                    aria-label={t.history.selectAria(numbers.join(", "))}
                    className="border-line mr-1 h-4 w-4 rounded accent-blue-600"
                />
            )}
            <Tag icon={entry.source === "user" ? Database : HardDrive} className={STORAGE_TONE[entry.source]}>
              {entry.source === "user" ? t.history.mine : t.history.local}
            </Tag>
            {source && <Tag className={SOURCE_TONE[source]}>{t.history.source[source]}</Tag>}
            <span className="text-ink-muted text-xs tabular-nums"><sk-t>{SAVED_AT.format(entry.timestamp)}</sk-t></span>
          </div>

          <div className="flex items-center gap-2">
            {entry.prizeAmount !== null && (
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  <sk-t>{t.history.won(entry.prizeAmount.toLocaleString())}</sk-t>
                </span>
            )}
            {entry.status && <RankBadge status={entry.status} showComparedDraw={entry.drawNo === undefined} />}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {numbers.map((number) => {
              const isHit = draw?.numbers.includes(number) ?? false
              const isBonus = draw?.bonusNo === number

              return (
                  <Ball
                      key={number}
                      number={number}
                      size="sm"
                      className={cn(
                          draw && !isHit && !isBonus && "opacity-30",
                          isBonus && "ring-offset-surface ring-2 ring-amber-400 ring-offset-1",
                      )}
                  />
              )
            })}
          </div>

          <div className="flex gap-1.5">
            <ActionButton icon={Copy} label={t.history.copy} onClick={onCopy} />
            <ActionButton icon={NotebookPen} label={t.history.memo} onClick={() => setIsEditing(true)} />
            <ActionButton icon={Trash2} label={t.common.delete} onClick={onDelete} danger />
          </div>
        </div>

        {isEditing ? (
            <MemoEditor
                initial={entry.memo ?? ""}
                onCancel={() => setIsEditing(false)}
                onSave={async (memo) => {
                  await onSaveMemo(memo)
                  setIsEditing(false)
                }}
            />
        ) : (
            entry.memo && (
                <p className="text-ink-muted bg-surface-2 rounded-md px-3 py-2 text-sm break-words">
                  <sk-t>{entry.memo}</sk-t>
                </p>
            )
        )}
      </Surface>
  )
}

function Tag({ icon: Icon, className, children }: { icon?: LucideIcon; className: string; children: ReactNode }) {
  return (
      <span data-sk-tone className={cn("flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", className)}>
        {Icon && <Icon className="mr-1 h-3 w-3" />}
        <sk-t>{children}</sk-t>
      </span>
  )
}

interface ActionButtonProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  danger?: boolean
}

function ActionButton({ icon: Icon, label, onClick, danger = false }: ActionButtonProps) {
  return (
      <Button
          variant="ghost"
          size="custom"
          onClick={onClick}
          className={cn(
              "h-8 border bg-transparent px-2 text-xs",
              danger ? "text-danger border-danger/20 hover:bg-danger/10" : "text-ink-muted border-line hover:text-ink",
          )}
      >
        <Icon className="mr-1 h-3.5 w-3.5" />
        <sk-t>{label}</sk-t>
      </Button>
  )
}

interface MemoEditorProps {
  initial: string
  onSave: (memo: string) => Promise<void>
  onCancel: () => void
}

function MemoEditor({ initial, onSave, onCancel }: MemoEditorProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(initial)
  const [isSaving, setIsSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      await onSave(draft)
    } catch {
      // 알림은 페이지가 띄운다. 쓴 글이 남도록 입력칸은 그대로 둔다.
    } finally {
      setIsSaving(false)
    }
  }

  return (
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MAX_MEMO_LENGTH}
            placeholder={t.history.memoPlaceholder}
            aria-label={t.history.memo}
            autoFocus
            className="bg-surface border-line h-9 flex-1"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={isSaving} className="h-9 bg-blue-600 text-white hover:bg-blue-700">
            {t.history.memoSave}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="bg-surface border-line h-9">
            {t.history.memoCancel}
          </Button>
        </div>
      </form>
  )
}
