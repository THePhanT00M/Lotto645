"use client"

import { Panel } from "@/components/common/panel"
import { useTranslation } from "@/components/i18n/locale-provider"
import type { CoverDrawRow, CoverSummary } from "@/hooks/use-cover-bundles"
import { COVER_SIZE, COVER_STATS } from "@/lib/lotto/cover"
import { cn } from "@/lib/utils"

const CELL = "px-3 py-2 whitespace-nowrap"
const NUMERIC = cn(CELL, "text-right tabular-nums")

/** 한 장 가격(원) */
const TICKET_PRICE = 1_000

/**
 * 3개 보장 묶음 성적표
 *
 * 묶음마다 가장 잘 맞은 한 장과 5등·4등 장 수, 당첨금을 회차별로 모은다. 3개 미만 묶음은 보장이
 * 깨졌다는 뜻이라 따로 센다. 스켈레톤도 이 컴포넌트를 자리표시 값으로 그리므로 글자는 <sk-t> 로 감싼다.
 */
export default function CoverBundles({ summary }: { summary: CoverSummary }) {
  const { t } = useTranslation()
  const copy = t.admin.aiLab.cover

  const columns = [
    { label: t.admin.aiLab.column.draw, numeric: false },
    { label: copy.column.bundles, numeric: true },
    { label: copy.column.belowThree, numeric: true },
    { label: copy.column.best(3), numeric: true },
    { label: copy.column.best(4), numeric: true },
    { label: copy.column.best(5), numeric: true },
    { label: copy.column.fifth(COVER_STATS.averageHits[3].toFixed(2)), numeric: true },
    { label: copy.column.fourth(COVER_STATS.averageHits[4].toFixed(2)), numeric: true },
    { label: copy.column.back, numeric: true },
  ]

  return (
      <Panel className="space-y-4">
        <div>
          <h3 className="text-ink text-xl font-bold"><sk-t>{copy.title}</sk-t></h3>
          <p className="text-ink-muted mt-1 text-sm"><sk-t>{copy.hint(COVER_SIZE)}</sk-t></p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-line text-ink-muted border-b text-xs">
                {columns.map(({ label, numeric }) => (
                    <th key={label} scope="col" className={cn(numeric ? NUMERIC : cn(CELL, "text-left"), "font-medium")}>
                      <sk-t>{label}</sk-t>
                    </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.draws.map((row) => (
                  <BundleRow key={row.drawNo} label={t.admin.aiLab.drawNo(row.drawNo ?? 0)} row={row} />
              ))}
            </tbody>
            {/* 회차가 하나뿐이면 합계가 그 줄과 같아 따로 두지 않는다. */}
            {summary.draws.length > 1 && summary.overall && (
                <tfoot className="border-line border-t-2">
                  <BundleRow label={t.admin.aiLab.total} row={summary.overall} isTotal />
                </tfoot>
            )}
          </table>
        </div>

        <div className="text-ink-muted space-y-1 text-xs">
          <p>
            <sk-t>
              {copy.expectedNote(
                  (COVER_STATS.bestShare[3] * 100).toFixed(1),
                  (COVER_STATS.bestShare[4] * 100).toFixed(1),
                  ((COVER_STATS.bestShare[5] + COVER_STATS.bestShare[6]) * 100).toFixed(2),
              )}
            </sk-t>
          </p>
          <p><sk-t>{copy.backNote((COVER_SIZE * TICKET_PRICE).toLocaleString())}</sk-t></p>
        </div>
      </Panel>
  )
}

function BundleRow({ label, row, isTotal = false }: { label: string; row: CoverDrawRow; isTotal?: boolean }) {
  const { t } = useTranslation()
  const copy = t.admin.aiLab.cover

  const share = (count: number) => (row.scored === 0 ? copy.notScored : copy.share(count, ((count / row.scored) * 100).toFixed(1)))
  const average = (value: number | null) => (value === null ? copy.notScored : value.toFixed(2))

  return (
      <tr className="border-line border-b last:border-b-0">
        <th scope="row" className={cn(CELL, "text-ink text-left", isTotal ? "font-semibold" : "font-medium")}>
          <sk-t>{label}</sk-t>
        </th>
        <td className={cn(NUMERIC, "text-ink-muted")}><sk-t>{copy.bundleCount(row.bundles, row.scored)}</sk-t></td>
        <td className={cn(NUMERIC, row.belowThree > 0 ? "font-semibold text-red-600 dark:text-red-400" : "text-ink-muted")}>
          <sk-t>{row.scored === 0 ? copy.notScored : row.belowThree}</sk-t>
        </td>
        <td className={cn(NUMERIC, "text-ink")}><sk-t>{share(row.best[0])}</sk-t></td>
        <td className={cn(NUMERIC, "text-ink")}><sk-t>{share(row.best[1])}</sk-t></td>
        <td className={cn(NUMERIC, "text-ink")}><sk-t>{share(row.best[2])}</sk-t></td>
        <td className={cn(NUMERIC, "text-ink font-semibold")}><sk-t>{average(row.fifth)}</sk-t></td>
        <td className={cn(NUMERIC, "text-ink font-semibold")}><sk-t>{average(row.fourth)}</sk-t></td>
        <td className={cn(NUMERIC, "text-ink-muted")}>
          <sk-t>{row.back === null ? copy.notScored : copy.won(Math.round(row.back))}</sk-t>
        </td>
      </tr>
  )
}
