"use client"

import { CalendarClock, CheckSquare, Coins, Download, History, Square, Target, Trash2, Trophy, X } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import { StatTile } from "@/components/admin/stat-tiles"
import { EmptyState } from "@/components/common/empty-state"
import { Notice } from "@/components/common/notice"
import { PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import HistoryItem from "@/components/history/history-item"
import { useTranslation } from "@/components/i18n/locale-provider"
import { Ball } from "@/components/lotto/ball"
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
import { Input } from "@/components/ui/input"
import { EXPECTED_MATCHED } from "@/lib/lotto/baseline"
import { MAX_NUMBER, MIN_NUMBER } from "@/lib/lotto/constants"
import {
  entryKey,
  type AnalyzedEntry,
  type DrawGroup,
  type HistoryFilter,
  type HistorySummary,
  type NextDraw,
  type StatusFilter,
} from "@/lib/lotto/history-summary"
import type { DrawSource } from "@/lib/lotto/types"
import { cn } from "@/lib/utils"

/** 다음 추첨 카드에 미리 보여 줄 번호 수 */
const NEXT_PREVIEW = 4

const STATUS_FILTERS: StatusFilter[] = ["all", "pending", "won", "lost"]
const SOURCES: DrawSource[] = ["ai", "machine", "manual"]

export interface HistoryViewState {
  summary: HistorySummary
  nextDraw: NextDraw | null
  /** 거른 기록을 페이지만큼만 담은 회차 묶음 */
  groups: DrawGroup[]
  filteredCount: number
  hasMore: boolean
  filter: HistoryFilter
  isSelecting: boolean
  selectedKeys: ReadonlySet<string>
}

export interface HistoryViewActions {
  onFilterChange: (filter: HistoryFilter) => void
  onShowMore: () => void
  onStartSelect: () => void
  onStopSelect: () => void
  onToggleSelect: (entry: AnalyzedEntry) => void
  onToggleAll: () => void
  onDeleteSelected: () => void | Promise<void>
  onDeleteAll: () => void | Promise<void>
  onDelete: (entry: AnalyzedEntry) => void
  onCopy: (entry: AnalyzedEntry) => void
  onSaveMemo: (entry: AnalyzedEntry, memo: string) => Promise<void>
  onDownload: () => void
}

/**
 * 나의 추첨 기록 화면 본문
 *
 * 스켈레톤도 이 함수를 자리표시 값으로 부른다(history-skeleton). 화면을 고치면
 * 자리표시가 저절로 따라오도록, 글자는 모두 <sk-t> 로 감싼다.
 */
export default function HistoryView({ state, actions }: { state: HistoryViewState; actions: HistoryViewActions }) {
  const { t } = useTranslation()
  const { summary, nextDraw, groups, filteredCount, hasMore, filter, isSelecting, selectedKeys } = state
  const selectedCount = selectedKeys.size
  const hasEntries = summary.total > 0

  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={History}
            title={t.history.title}
            description={t.history.description}
            actions={
              hasEntries && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={actions.onDownload} className="bg-surface border-line">
                      <Download className="mr-2 h-4 w-4" />
                      <sk-t>{t.history.download}</sk-t>
                    </Button>
                    {isSelecting ? (
                        <Button variant="outline" onClick={actions.onStopSelect} className="bg-surface border-line">
                          <X className="mr-2 h-4 w-4" />
                          <sk-t>{t.history.cancelSelect}</sk-t>
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={actions.onStartSelect} className="bg-surface border-line">
                          <CheckSquare className="mr-2 h-4 w-4" />
                          <sk-t>{t.history.startSelect}</sk-t>
                        </Button>
                    )}
                    <ConfirmDialog
                        trigger={
                          <Button
                              data-sk-tone
                              variant="destructive"
                              className="bg-danger hover:bg-danger/90 border-none text-white shadow-none"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <sk-t>{t.history.deleteAll}</sk-t>
                          </Button>
                        }
                        title={t.history.confirmAllTitle}
                        description={`${t.history.confirmAllDescription} ${t.history.confirmServerNote}`}
                        onConfirm={actions.onDeleteAll}
                    />
                  </div>
              )
            }
        />

        {isSelecting && (
            <Panel className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="custom" onClick={actions.onToggleAll} className="text-ink-muted h-8 px-2 text-sm">
                  {selectedCount > 0 && selectedCount === filteredCount ? (
                      <CheckSquare className="mr-1.5 h-4 w-4" />
                  ) : (
                      <Square className="mr-1.5 h-4 w-4" />
                  )}
                  <sk-t>
                    {selectedCount > 0 && selectedCount === filteredCount ? t.history.clearSelection : t.history.selectAll}
                  </sk-t>
                </Button>
                <span className="text-ink-muted text-sm"><sk-t>{t.history.selectedCount(selectedCount)}</sk-t></span>
              </div>

              <ConfirmDialog
                  trigger={
                    <Button
                        variant="destructive"
                        disabled={selectedCount === 0}
                        className="bg-danger hover:bg-danger/90 h-9 border-none text-white shadow-none"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <sk-t>{t.history.deleteSelected}</sk-t>
                    </Button>
                  }
                  title={t.history.confirmSelectedCountTitle(selectedCount)}
                  description={t.history.confirmServerNote}
                  onConfirm={actions.onDeleteSelected}
              />
            </Panel>
        )}

        <SummaryTiles summary={summary} />

        {nextDraw && <NextDrawCard nextDraw={nextDraw} />}

        {hasEntries && <MyStats summary={summary} />}

        {hasEntries && (
            <FilterBar
                filter={filter}
                summary={summary}
                filteredCount={filteredCount}
                onChange={actions.onFilterChange}
            />
        )}

        {!hasEntries ? (
            <EmptyState icon={History} message={t.history.empty} />
        ) : groups.length === 0 ? (
            <EmptyState icon={History} message={t.history.emptyFiltered} />
        ) : (
            <div className="space-y-8">
              {groups.map((group) => (
                  <section key={group.drawNo ?? "unknown"} className="space-y-3">
                    <DrawGroupHeader group={group} />

                    {group.entries.map((entry) => (
                        <HistoryItem
                            key={entryKey(entry)}
                            entry={entry}
                            draw={group.draw}
                            isSelected={isSelecting ? selectedKeys.has(entryKey(entry)) : undefined}
                            onToggleSelect={isSelecting ? () => actions.onToggleSelect(entry) : undefined}
                            onDelete={() => actions.onDelete(entry)}
                            onCopy={() => actions.onCopy(entry)}
                            onSaveMemo={(memo) => actions.onSaveMemo(entry, memo)}
                        />
                    ))}
                  </section>
              ))}

              {hasMore && (
                  <Button variant="outline" onClick={actions.onShowMore} className="bg-surface border-line w-full">
                    <sk-t>{t.history.showMore}</sk-t>
                  </Button>
              )}
            </div>
        )}

        <Notice title={t.history.noticeTitle}>
          <ul className="text-ink-muted mt-1 list-inside list-disc space-y-1 opacity-90">
            <li><sk-t>{t.history.noticeLocal}</sk-t></li>
            <li><sk-t>{t.history.noticeServer}</sk-t></li>
            <li><sk-t>{t.history.noticePrize}</sk-t></li>
            <li><sk-t>{t.history.noticeSoftDelete}</sk-t></li>
            <li><sk-t>{t.history.noticePending}</sk-t></li>
          </ul>
        </Notice>
      </div>
  )
}

function SummaryTiles({ summary }: { summary: HistorySummary }) {
  const { t } = useTranslation()
  const { comparison } = summary
  const rankParts = summary.rankCounts
      .map((count, index) => (count > 0 ? t.history.rankCount(index + 1, count) : null))
      .filter((part): part is string => part !== null)
      .join(" · ")

  return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
            icon={History}
            label={t.history.totalSaved}
            value={summary.total.toLocaleString()}
            hint={t.history.totalHint(summary.localCount, summary.serverCount)}
        />
        <StatTile
            icon={Trophy}
            label={t.history.winners}
            value={summary.winCount.toLocaleString()}
            valueClass="text-green-600 dark:text-green-500"
            hint={rankParts || t.history.noWins}
        />
        <StatTile
            icon={Coins}
            label={t.history.prizeTotal}
            value={t.history.won(summary.prizeTotal.toLocaleString())}
            valueClass="text-amber-600 dark:text-amber-400"
            hint={t.history.prizeHint}
        />
        <StatTile
            icon={Target}
            label={t.history.averageMatched}
            value={comparison ? comparison.mean.toFixed(3) : "—"}
            valueClass="text-blue-600 dark:text-blue-400"
            hint={
              comparison
                  ? t.history.averageHint(EXPECTED_MATCHED.toFixed(3), t.history.verdict[comparison.verdict])
                  : t.history.averagePending
            }
        />
      </div>
  )
}

function NextDrawCard({ nextDraw }: { nextDraw: NextDraw }) {
  const { t } = useTranslation()
  const [, month, day] = nextDraw.date.split("-").map(Number)
  const preview = nextDraw.entries.slice(0, NEXT_PREVIEW)
  const rest = nextDraw.entries.length - preview.length

  return (
      <Panel className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-ink text-lg font-bold"><sk-t>{t.history.nextTitle(nextDraw.drawNo)}</sk-t></h3>
            <span data-sk-tone className="rounded-md bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
              <sk-t>{t.history.dDay(nextDraw.daysLeft)}</sk-t>
            </span>
          </div>
          <span className="text-ink-muted text-sm">
            <sk-t>{t.history.nextDate(month, day)} · {t.history.nextCount(nextDraw.entries.length)}</sk-t>
          </span>
        </div>

        {preview.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-ink-muted text-sm"><sk-t>{t.history.nextEmpty}</sk-t></p>
              <Button data-sk-tone asChild className="bg-blue-600 text-white hover:bg-blue-700">
                <Link href="/"><sk-t>{t.history.nextCta}</sk-t></Link>
              </Button>
            </div>
        ) : (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {preview.map((entry) => (
                  <div key={entryKey(entry)} className="flex gap-1">
                    {entry.numbers.map((number) => <Ball key={number} number={number} size="xs" />)}
                  </div>
              ))}
              {rest > 0 && <span className="text-ink-muted text-sm"><sk-t>{t.history.nextMore(rest)}</sk-t></span>}
            </div>
        )}
      </Panel>
  )
}

function MyStats({ summary }: { summary: HistorySummary }) {
  const { t } = useTranslation()

  return (
      <Panel className="space-y-4">
        <div>
          <h3 className="text-ink text-xl font-bold"><sk-t>{t.history.statsTitle}</sk-t></h3>
          <p className="text-ink-muted mt-1 text-sm"><sk-t>{t.history.statsHint}</sk-t></p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-2">
            {summary.buckets.map(({ matchCount, count, ratio, expected }) => (
                <div key={matchCount} className="flex items-center gap-3">
                  <div className="text-ink-muted w-14 shrink-0 text-sm"><sk-t>{t.history.matched(matchCount)}</sk-t></div>
                  <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-[#3f3f3f]">
                    <div
                        data-sk-tone
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                        style={{ width: `${ratio * 100}%` }}
                    />
                    {/* 무작위로 샀을 때의 기대 위치 */}
                    <div
                        data-sk-tone
                        className="absolute top-0 h-full w-0.5 bg-amber-500"
                        style={{ left: `${Math.min(100, expected * 100)}%` }}
                    />
                  </div>
                  <div className="text-ink-muted w-16 shrink-0 text-right text-xs tabular-nums">
                    <sk-t>{t.history.count(count)}</sk-t>
                  </div>
                </div>
            ))}
            <p className="text-ink-muted text-xs"><sk-t>{t.history.markHint}</sk-t></p>
          </div>

          <div>
            <h4 className="text-ink mb-3 text-sm font-semibold"><sk-t>{t.history.favorites}</sk-t></h4>
            <div className="flex flex-wrap gap-3">
              {summary.favorites.map(({ number, count }) => (
                  <div key={number} className="flex flex-col items-center gap-1">
                    <Ball number={number} size="sm" />
                    <span className="text-ink-muted text-xs"><sk-t>{t.history.favoriteCount(count)}</sk-t></span>
                  </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>
  )
}

interface FilterBarProps {
  filter: HistoryFilter
  summary: HistorySummary
  filteredCount: number
  onChange: (filter: HistoryFilter) => void
}

function FilterBar({ filter, summary, filteredCount, onChange }: FilterBarProps) {
  const { t } = useTranslation()
  const countOf = (key: StatusFilter) => (key === "all" ? summary.total : summary.statusCounts[key])

  const changeNumber = (raw: string) => {
    const value = Number(raw)
    onChange({ ...filter, number: Number.isInteger(value) && value >= MIN_NUMBER && value <= MAX_NUMBER ? value : null })
  }

  return (
      <div className="space-y-2">
        <Panel className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((key) => {
              const isActive = filter.status === key
              return (
                  <button
                      key={key}
                      type="button"
                      aria-pressed={isActive}
                      data-sk-tone={isActive || undefined}
                      onClick={() => onChange({ ...filter, status: key })}
                      className={cn(
                          "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                          isActive
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "bg-surface border-line text-ink-muted hover:text-ink",
                      )}
                  >
                    <sk-t>{t.history.filterStatus[key]} {countOf(key).toLocaleString()}</sk-t>
                  </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
                value={filter.source}
                onChange={(event) => onChange({ ...filter, source: event.target.value as HistoryFilter["source"] })}
                aria-label={t.history.filterSourceLabel}
                className="bg-surface border-line text-ink h-9 rounded-md border px-2 text-sm"
            >
              <option value="all">{t.history.filterSourceLabel}: {t.history.filterSourceAll}</option>
              {SOURCES.map((source) => (
                  <option key={source} value={source}>{t.history.source[source]}</option>
              ))}
            </select>
            <Input
                type="number"
                inputMode="numeric"
                min={MIN_NUMBER}
                max={MAX_NUMBER}
                value={filter.number ?? ""}
                onChange={(event) => changeNumber(event.target.value)}
                placeholder={t.history.numberSearch}
                aria-label={t.history.numberSearch}
                className="bg-surface border-line h-9 w-44"
            />
          </div>
        </Panel>

        <p className="text-ink-muted px-1 text-right text-xs">
          <sk-t>{t.history.filteredCount(filteredCount, summary.total)}</sk-t>
        </p>
      </div>
  )
}

/**
 * 회차 구분 머리말
 *
 * 회차가 바뀌는 자리에 선을 긋고, 그 회차의 당첨 번호와 건수·당첨을 함께 보여 준다.
 * 당첨 번호를 머리말에 두면 카드마다 어느 번호가 맞았는지 바로 견줄 수 있다.
 */
function DrawGroupHeader({ group }: { group: DrawGroup }) {
  const { t } = useTranslation()

  return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span data-sk-tone className="text-accent bg-accent-soft border-accent-line rounded-md border px-2.5 py-1 text-sm font-bold">
          <sk-t>{group.drawNo === null ? t.history.unassignedDraw : t.lotto.drawNo(group.drawNo)}</sk-t>
        </span>

        {group.draw && (
            <div className="flex items-center gap-1">
              {group.draw.numbers.map((number) => <Ball key={number} number={number} size="xs" />)}
              <span className="text-ink-muted px-0.5 text-xs">+</span>
              <Ball number={group.draw.bonusNo} size="xs" />
            </div>
        )}

        <span className="text-ink-muted text-sm"><sk-t>{t.history.count(group.total)}</sk-t></span>

        {group.winCount > 0 && (
            <span className="flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
              <Trophy className="h-3.5 w-3.5" />
              <sk-t>{t.history.winnersInDraw(group.winCount)} · {t.history.won(group.prizeTotal.toLocaleString())}</sk-t>
            </span>
        )}

        <div className="bg-line h-px min-w-8 flex-1" />
      </div>
  )
}

interface ConfirmDialogProps {
  trigger: ReactNode
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
