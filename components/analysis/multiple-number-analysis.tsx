"use client"

import { BarChart3, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useMemo, useState } from "react"
import { Ball } from "@/components/lotto/ball"
import { MULTIPLE_SIZES, type MultipleNumber, type MultipleSize } from "@/lib/lotto/analytics"
import { useTranslation } from "@/components/i18n/locale-provider"
import { cn } from "@/lib/utils"

const PAGE_SIZE_OPTIONS = [15, 30, 50] as const

interface MultipleNumberAnalysisProps {
  multiples: MultipleNumber[]
}

/** 선택한 번호의 부분 조합이 과거에 얼마나 함께 당첨됐는지 보여준다. */
export default function MultipleNumberAnalysis({ multiples }: MultipleNumberAnalysisProps) {
  const { t } = useTranslation()
  const [size, setSize] = useState<MultipleSize>(5)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])

  const filtered = useMemo(() => multiples.filter((item) => item.size === size), [multiples, size])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  /** 조합 크기별로 과거에 실제 당첨된 적 있는 조합 수 */
  const hitCounts = useMemo(
      () =>
          MULTIPLE_SIZES.map((each) => ({
            size: each,
            count: multiples.filter((item) => item.size === each && item.count > 0).length,
          })),
      [multiples],
  )

  const changeSize = (next: MultipleSize) => {
    setSize(next)
    setPage(0)
  }

  return (
      <div className="bg-surface border-line rounded-lg border p-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center sm:gap-0">
          <div className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
            <h3 className="text-ink font-bold">{t.analysis.patternTitle}</h3>
          </div>

          <div className="border-line flex self-end overflow-hidden rounded-md border sm:self-auto">
            {MULTIPLE_SIZES.map((each) => (
                <button
                    key={each}
                    type="button"
                    onClick={() => changeSize(each)}
                    className={cn(
                        "px-2 py-1 text-xs transition-colors",
                        size === each
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-surface text-ink-muted",
                    )}
                >
                  {t.common.multiple(each)}
                </button>
            ))}
          </div>
        </div>

        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          {t.analysis.comboHint}
        </p>

        <div className="mt-4 grid max-h-[500px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 md:grid-cols-3">
          {visible.map((item) => (
              <MultipleCard key={item.numbers.join("-")} item={item} />
          ))}
        </div>

        {filtered.length > pageSize && (
            <Pagination
                page={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setPage}
                onPageSizeChange={(next) => {
                  setPageSize(next)
                  setPage(0)
                }}
            />
        )}

        <div className="border-accent-line bg-accent-soft mt-3 grid grid-cols-2 gap-2 rounded-md border p-3 text-center text-sm md:grid-cols-4">
          {hitCounts.map(({ size: each, count }) => (
              <div key={each}>
                <div className="font-medium text-blue-700 dark:text-blue-400">{t.common.multiple(each)}</div>
                <div className="text-ink-muted">{t.analysis.comboHit(count)}</div>
              </div>
          ))}
        </div>
      </div>
  )
}

/** 조합 하나와 그 등장 이력 카드. */
function MultipleCard({ item }: { item: MultipleNumber }) {
  const { t } = useTranslation()
  const hasHit = item.count > 0

  return (
      <div
          className={cn(
              "flex flex-col rounded-lg border p-3",
              hasHit
                  ? "border-blue-100 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-900/20"
                  : "bg-surface-2 border-line",
          )}
      >
        <div className="mb-2 flex flex-wrap justify-center gap-1">
          {item.numbers.map((number) => (
              <Ball key={number} number={number} size="xs" />
          ))}
        </div>

        <div
            className={cn(
                "text-center text-xs font-medium",
                hasHit ? "text-blue-600 dark:text-blue-400" : "text-ink-muted",
            )}
        >
          {hasHit ? t.analysis.together(item.count) : t.analysis.neverTogether}
        </div>

        {hasHit && (
            <div className="text-ink-muted mt-2 max-h-24 overflow-y-auto rounded-md bg-white p-1 text-xs dark:bg-black">
              {item.appearances.map((appearance) => (
                  <div
                      key={appearance.drawNo}
                      className="border-line flex items-center justify-between border-b py-0.5 last:border-0"
                  >
                    <span>{t.analysis.appearedDraw(appearance.drawNo)}</span>
                    <span>{appearance.date}</span>
                  </div>
              ))}
            </div>
        )}
      </div>
  )
}

interface PaginationProps {
  page: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

function Pagination({ page, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }: PaginationProps) {
  const { t } = useTranslation()
  const first = page * pageSize + 1
  const last = Math.min((page + 1) * pageSize, totalItems)

  return (
      <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <div className="text-ink-muted text-xs">
          {t.analysis.showing(first, last, totalItems)}
        </div>

        <div className="flex items-center">
          <PageButton onClick={() => onPageChange(0)} disabled={page === 0} label={t.analysis.firstPage}>
            <ChevronsLeft className="h-4 w-4" />
          </PageButton>
          <PageButton onClick={() => onPageChange(page - 1)} disabled={page === 0} label={t.analysis.previousPage}>
            <ChevronLeft className="h-4 w-4" />
          </PageButton>

          <span className="text-ink min-w-[60px] px-2 text-center text-sm">
            {page + 1} / {totalPages}
          </span>

          <PageButton onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1} label={t.analysis.nextPage}>
            <ChevronRight className="h-4 w-4" />
          </PageButton>
          <PageButton onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1} label={t.analysis.lastPage}>
            <ChevronsRight className="h-4 w-4" />
          </PageButton>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-ink-muted text-xs">{t.analysis.perPage}</span>
          <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="border-line bg-surface text-ink rounded border p-1 text-xs"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t.analysis.perPageOption(option)}
                </option>
            ))}
          </select>
        </div>
      </div>
  )
}

function PageButton({
                      onClick,
                      disabled,
                      label,
                      children,
                    }: {
  onClick: () => void
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  return (
      <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="text-ink-muted rounded p-1 transition-colors hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-[#3f3f3f]"
      >
        {children}
      </button>
  )
}
