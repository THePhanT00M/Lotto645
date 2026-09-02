"use client"

import { ChevronDown, Download } from "lucide-react"
import { useRef, useState } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"
import PaperPattern from "@/components/analysis/paper-pattern"
import { rankStyle } from "@/components/common/rank-badge"
import { Ball } from "@/components/lotto/ball"
import { Button } from "@/components/ui/button"
import type { PickInsight } from "@/hooks/use-pick-insights"
import { FEATURE_KEYS } from "@/lib/lotto/features"
import { cn } from "@/lib/utils"

/** 내려받을 스냅샷 이미지의 가로 크기 */
const SNAPSHOT_WIDTH = 720

interface RecordCardProps {
  record: PickInsight
}

/**
 * 추천 기록 한 건.
 *
 * 접혀 있을 때는 번호와 결과만 보이고, 펼치면 저장해 둔 기하 특징으로
 * 그 추천이 용지에서 어떤 모양이었는지 다시 그려 준다.
 */
export default function RecordCard({ record }: RecordCardProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const snapshotRef = useRef<HTMLDivElement>(null)

  return (
      <div className="bg-surface border-line overflow-hidden rounded-lg border">
        <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            className="hover:bg-hover flex w-full flex-col gap-3 p-3 text-left transition-colors sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <ChevronDown className={cn("text-ink-muted h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
            <span className="text-accent bg-accent-soft border-accent-line rounded-md border px-2 py-1 text-xs font-semibold">
              {t.lotto.drawNo(record.draw_no)}
            </span>
            <div className="flex flex-wrap gap-1">
              {record.numbers.map((number) => (
                  <Ball key={number} number={number} size="xs" />
              ))}
            </div>
          </div>

          <div className="text-ink-muted flex flex-wrap items-center gap-3 pl-7 text-xs sm:pl-0">
            <span>{t.admin.record.score(`${(record.score * 100).toFixed(1)}%`)}</span>
            <span>{t.admin.record.overlap(t.admin.record.count(record.max_past_overlap ?? 0))}</span>
            {record.scored_at ? (
                <span className={cn("rounded-md border px-2 py-0.5 font-semibold", rankStyle(record.prize_rank))}>
                  {t.admin.record.matchedCount(record.matched_count ?? 0)} · {record.prize_rank === null ? t.lotto.miss : t.lotto.rank(record.prize_rank)}
                </span>
            ) : (
                <span className="text-accent bg-accent-soft border-accent-line rounded-md border px-2 py-0.5">
                  {t.admin.record.awaiting}
                </span>
            )}
          </div>
        </button>

        {isOpen && (
            <div className="border-line grid grid-cols-1 items-start gap-4 border-t p-4 md:grid-cols-2">
              <div className="bg-surface-2 rounded-lg p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-ink text-sm font-semibold">{t.admin.record.snapshot}</h4>
                  <SnapshotButton target={snapshotRef} record={record} />
                </div>
                {/* PNG로 저장할 때 이 영역을 그대로 그린다. 배경은 저장 시 따로 깔아 준다. */}
                <div ref={snapshotRef}>
                  <PaperPattern numbers={record.numbers} className="w-full" />
                </div>
                <p className="text-ink-muted mt-2 text-center text-xs">
                  {t.admin.record.recommendedAt(new Date(record.created_at).toLocaleString())}
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-surface-2 rounded-lg p-3">
                  <h4 className="text-ink mb-2 text-sm font-semibold">{t.admin.record.scores}</h4>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    <Row label={t.admin.record.finalScore} value={`${(record.score * 100).toFixed(1)}%`} />
                    <Row label={t.admin.record.networkScore} value={`${(record.network_score * 100).toFixed(1)}%`} />
                    <Row label={t.admin.record.typicality} value={`${(record.typicality * 100).toFixed(1)}%`} />
                    <Row label={t.admin.record.maxOverlap} value={t.admin.record.count(record.max_past_overlap ?? 0)} />
                  </dl>
                </div>

                {record.model && (
                    <div className="bg-surface-2 rounded-lg p-3">
                      <h4 className="text-ink mb-2 text-sm font-semibold">{t.admin.record.model}</h4>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                        <Row label={t.admin.record.trainedDraws} value={t.admin.record.draws(record.model.drawCount?.toLocaleString() ?? "-")} />
                        <Row label={t.admin.record.ensemble} value={t.admin.record.count(record.model.ensembleSize ?? 0)} />
                        <Row
                            label={t.admin.record.accuracy}
                            value={record.model.accuracy != null ? `${(record.model.accuracy * 100).toFixed(1)}%` : "-"}
                        />
                        <Row
                            label={t.admin.record.brier}
                            value={
                              record.model.brierAfter != null
                                  ? `${record.model.brierBefore?.toFixed(3) ?? "-"} → ${record.model.brierAfter.toFixed(3)}`
                                  : "-"
                            }
                        />
                      </dl>
                    </div>
                )}

                <div className="bg-surface-2 rounded-lg p-3">
                  <h4 className="text-ink mb-2 text-sm font-semibold">{t.admin.record.geometry(FEATURE_KEYS.length)}</h4>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    {FEATURE_KEYS.map((key) => (
                        <Row key={key} label={t.features[key]} value={formatFeature(record.features?.[key])} />
                    ))}
                  </dl>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
      <>
        <dt className="text-ink-muted truncate">{label}</dt>
        <dd className="text-ink text-right font-medium">{value}</dd>
      </>
  )
}

const formatFeature = (value: number | undefined): string => {
  if (value === undefined) return "-"
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

/**
 * 용지 스냅샷을 PNG로 내려받는다.
 *
 * SVG를 그대로 저장하면 CSS 변수로 잡은 색이 빠지므로, 계산된 색을 인라인으로
 * 옮겨 붙인 뒤 캔버스에 그려 내보낸다.
 */
function SnapshotButton({ target, record }: { target: React.RefObject<HTMLDivElement | null>; record: PickInsight }) {
  const [isSaving, setIsSaving] = useState(false)

  const save = async () => {
    const svg = target.current?.querySelector("svg")
    if (!svg) return

    setIsSaving(true)
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement
      inlineComputedColors(svg, clone)

      const viewBox = svg.viewBox.baseVal
      const ratio = viewBox.height / viewBox.width
      const width = SNAPSHOT_WIDTH
      const height = Math.round(width * ratio)

      clone.setAttribute("width", String(width))
      clone.setAttribute("height", String(height))

      const source = new XMLSerializer().serializeToString(clone)
      const image = new Image()
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`
      await image.decode()

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext("2d")
      if (!context) return

      // 배경이 비면 어두운 화면에서 글씨가 보이지 않는다.
      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)

      const link = document.createElement("a")
      link.href = canvas.toDataURL("image/png")
      link.download = `lotto-${record.draw_no}-${record.numbers.join("-")}.png`
      link.click()
    } catch (error) {
      console.error("스냅샷 저장 실패:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
      <Button
          variant="ghost"
          size="custom"
          onClick={save}
          disabled={isSaving}
          className="text-ink-muted hover:text-ink h-7 px-2 text-xs"
      >
        <Download className="mr-1 h-3.5 w-3.5" />
        PNG
      </Button>
  )
}

/** 원본에서 계산된 색을 복제본의 같은 자리에 인라인으로 적어 넣는다. */
const inlineComputedColors = (source: SVGSVGElement, clone: SVGSVGElement) => {
  const sourceNodes = source.querySelectorAll("*")
  const cloneNodes = clone.querySelectorAll("*")

  sourceNodes.forEach((node, index) => {
    const style = getComputedStyle(node)
    const target = cloneNodes[index] as SVGElement | undefined
    if (!target) return

    target.setAttribute("fill", style.fill)
    target.setAttribute("stroke", style.stroke)
    if (style.strokeWidth) target.setAttribute("stroke-width", style.strokeWidth)
    target.removeAttribute("class")
  })
}
