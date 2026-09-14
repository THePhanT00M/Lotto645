"use client"

import { VERDICT_TONE } from "@/components/admin/draw-breakdown"
import { Panel } from "@/components/common/panel"
import { useTranslation } from "@/components/i18n/locale-provider"
import { Ball } from "@/components/lotto/ball"
import {
  drawsToDetect,
  PROSPECTIVE_START_DRAW,
  VERDICT_INTERVAL,
  VERDICT_Z,
  type SignalTrack,
} from "@/lib/lotto/prospective"
import { cn } from "@/lib/utils"

const CELL = "px-3 py-2 whitespace-nowrap"
const NUMERIC = cn(CELL, "text-right tabular-nums")

/** 무작위보다 이만큼 높은 신호가 기준을 넘는 데 드는 회차를 안내한다. */
const EXAMPLE_UPLIFT = 0.1

/**
 * 사전 등록 신호 성적표
 *
 * 과거 시험에서 고른 신호를 앞으로의 회차로만 채점한다. 판정은 정해 둔 간격마다만 내리고,
 * 그 전까지는 보류로 둔다. 스켈레톤도 이 컴포넌트를 자리표시 값으로 그리므로 글자는 <sk-t> 로 감싼다.
 */
export default function ProspectiveSignals({ tracks }: { tracks: readonly SignalTrack[] }) {
  const { t } = useTranslation()
  const copy = t.admin.aiLab

  const columns = [
    { label: copy.prospectiveColumn.signal, numeric: false },
    { label: copy.prospectiveColumn.draws, numeric: true },
    { label: copy.prospectiveColumn.mean, numeric: true },
    { label: copy.column.band, numeric: true },
    { label: copy.column.verdict, numeric: false },
    { label: copy.prospectiveColumn.latest, numeric: true },
    { label: copy.prospectiveColumn.next, numeric: false },
  ]

  return (
      <Panel className="space-y-4">
        <div>
          <h3 className="text-ink text-xl font-bold"><sk-t>{copy.prospective}</sk-t></h3>
          <p className="text-ink-muted mt-1 text-sm"><sk-t>{copy.prospectiveHint(PROSPECTIVE_START_DRAW)}</sk-t></p>
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
              {tracks.map((track) => (
                  <tr key={track.key} className="border-line border-b last:border-b-0">
                    <th scope="row" className={cn(CELL, "text-ink text-left font-medium")}>
                      <sk-t>{copy.signal[track.key]}</sk-t>
                    </th>
                    <td className={cn(NUMERIC, "text-ink-muted")}><sk-t>{copy.tracked(track.draws)}</sk-t></td>
                    <td className={cn(NUMERIC, "text-ink font-semibold")}>
                      <sk-t>{track.mean === null ? copy.noControl : track.mean.toFixed(3)}</sk-t>
                    </td>
                    <td className={cn(NUMERIC, "text-ink-muted")}>
                      <sk-t>
                        {track.low === null || track.high === null
                            ? copy.noControl
                            : copy.band(track.low.toFixed(3), track.high.toFixed(3))}
                      </sk-t>
                    </td>
                    <td className={CELL}>
                      <span
                          data-sk-tone
                          className={cn(
                              "inline-block rounded-md border px-2 py-0.5 text-xs font-semibold",
                              VERDICT_TONE[track.verdict === "pending" ? "within" : track.verdict],
                          )}
                      >
                        <sk-t>
                          {track.verdict === "pending"
                              ? copy.pending(track.draws, track.checkpoint + VERDICT_INTERVAL)
                              : copy.verdict[track.verdict]}
                        </sk-t>
                      </span>
                    </td>
                    <td className={cn(NUMERIC, "text-ink-muted")}>
                      <sk-t>{track.latest ? copy.latestValue(track.latest.drawNo, track.latest.matched) : copy.noControl}</sk-t>
                    </td>
                    <td className={CELL}>
                      <div className="flex gap-1">
                        {track.next?.numbers.map((number) => <Ball key={number} number={number} size="xs" />)}
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-ink-muted space-y-1 text-xs">
          <p><sk-t>{copy.prospectiveNote(VERDICT_INTERVAL, VERDICT_Z.toFixed(2))}</sk-t></p>
          <p><sk-t>{copy.powerNote(drawsToDetect(EXAMPLE_UPLIFT))}</sk-t></p>
        </div>
      </Panel>
  )
}
