"use client"

import { Panel } from "@/components/common/panel"
import { useTranslation } from "@/components/i18n/locale-provider"
import type { DrawRow } from "@/hooks/use-pick-insights"
import type { RandomComparison, Verdict } from "@/lib/lotto/baseline"
import { cn } from "@/lib/utils"

/** 판정별 배지 색. 차이가 없으면 눈에 띄지 않게 둔다. */
export const VERDICT_TONE: Record<Verdict, string> = {
  within: "bg-surface-2 border-line text-ink-muted",
  above: "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400",
  below: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400",
}

const CELL = "px-3 py-2 whitespace-nowrap"
const NUMERIC = cn(CELL, "text-right tabular-nums")

interface DrawBreakdownProps {
  rows: readonly DrawRow[]
  overall: { ai: RandomComparison | null; control: RandomComparison | null }
}

/**
 * 회차별 성적표
 *
 * 같은 회차 추천은 같은 당첨 번호로 채점되어 함께 오르내린다. 전체 평균 하나로는
 * 회차 운과 차이를 가를 수 없어, 회차마다 무작위 범위와 대조군을 나란히 둔다.
 * 스켈레톤도 이 컴포넌트를 자리표시 값으로 그리므로 글자는 모두 <sk-t> 로 감싼다.
 */
export default function DrawBreakdown({ rows, overall }: DrawBreakdownProps) {
  const { t } = useTranslation()
  const copy = t.admin.aiLab

  const columns = [
    { label: copy.column.draw, numeric: false },
    { label: copy.column.aiCount, numeric: true },
    { label: copy.column.aiMean, numeric: true },
    { label: copy.column.band, numeric: true },
    { label: copy.column.verdict, numeric: false },
    { label: copy.column.wins, numeric: true },
    { label: copy.column.control, numeric: true },
  ]

  return (
      <Panel className="space-y-4">
        <div>
          <h3 className="text-ink text-xl font-bold"><sk-t>{copy.byDraw}</sk-t></h3>
          <p className="text-ink-muted mt-1 text-sm"><sk-t>{copy.byDrawHint}</sk-t></p>
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
              {rows.map((row) => (
                  <ResultRow key={row.drawNo} label={copy.drawNo(row.drawNo)} ai={row.ai} control={row.control} />
              ))}
            </tbody>
            {/* 회차가 하나뿐이면 합계가 그 줄과 같아 따로 두지 않는다. */}
            {rows.length > 1 && (
                <tfoot className="border-line border-t-2">
                  <ResultRow label={copy.total} ai={overall.ai} control={overall.control} isTotal />
                </tfoot>
            )}
          </table>
        </div>

        <div className="text-ink-muted space-y-1 text-xs">
          <p><sk-t>{copy.bandNote}</sk-t></p>
          <p><sk-t>{copy.controlNote}</sk-t></p>
        </div>
      </Panel>
  )
}

interface ResultRowProps {
  label: string
  ai: RandomComparison | null
  control: RandomComparison | null
  isTotal?: boolean
}

function ResultRow({ label, ai, control, isTotal = false }: ResultRowProps) {
  const { t } = useTranslation()
  const copy = t.admin.aiLab

  if (!ai) return null

  return (
      <tr className="border-line border-b last:border-b-0">
        <th scope="row" className={cn(CELL, "text-ink text-left", isTotal ? "font-semibold" : "font-medium")}>
          <sk-t>{label}</sk-t>
        </th>
        <td className={cn(NUMERIC, "text-ink-muted")}><sk-t>{t.history.count(ai.count)}</sk-t></td>
        <td className={cn(NUMERIC, "text-ink font-semibold")}><sk-t>{ai.mean.toFixed(3)}</sk-t></td>
        <td className={cn(NUMERIC, "text-ink-muted")}>
          <sk-t>{copy.band(ai.low.toFixed(3), ai.high.toFixed(3))}</sk-t>
        </td>
        <td className={CELL}>
          <span
              data-sk-tone
              className={cn("inline-block rounded-md border px-2 py-0.5 text-xs font-semibold", VERDICT_TONE[ai.verdict])}
          >
            <sk-t>{copy.verdict[ai.verdict]}</sk-t>
          </span>
        </td>
        <td className={cn(NUMERIC, "text-ink-muted")}>
          <sk-t>{copy.winsValue(ai.winCount, ai.expectedWins.toFixed(1))}</sk-t>
        </td>
        <td className={cn(NUMERIC, "text-ink-muted")}>
          <sk-t>
            {control
                ? copy.controlValue(t.history.count(control.count), control.mean.toFixed(3))
                : copy.noControl}
          </sk-t>
        </td>
      </tr>
  )
}
