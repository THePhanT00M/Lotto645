"use client"

import { Check, Copy, Coins, Layers, ShieldCheck, Users } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"
import { BallRow } from "@/components/lotto/ball-row"
import { Button } from "@/components/ui/button"
import { ALL_NUMBERS } from "@/lib/lotto/constants"
import { COVER_SIZE, COVER_STATS, labelCover } from "@/lib/lotto/cover"
import type { CoverRecommendation } from "@/lib/lotto/engine"

/** 5등·4등 고정 당첨금(원) */
const FIFTH_PRIZE = 5_000
const FOURTH_PRIZE = 50_000

/** 한 장 가격(원) */
const TICKET_PRICE = 1_000

/** 복사 완료 표시를 유지하는 시간(ms) */
const COPIED_MS = 2000

/** 생성 중 자리표시. 실제와 같은 181장 구조에 번호만 순서대로 붙인다. */
const PLACEHOLDER: CoverRecommendation = {
  labels: [...ALL_NUMBERS],
  tickets: labelCover(ALL_NUMBERS),
  meanPercentile: 0.35,
  quietTickets: 115,
}

interface CoverCardProps {
  cover: CoverRecommendation | null
  isGenerating: boolean
}

/** 어떤 당첨 번호에도 한 장은 3개 이상 맞는 181장 묶음을 보여준다. */
export default function CoverCard({ cover, isGenerating }: CoverCardProps) {
  const { t } = useTranslation()

  if (isGenerating) {
    return (
        <div role="status" aria-label={t.analysis.cover.building} aria-busy>
          <div className="is-sk" aria-hidden inert>
            <CoverBody cover={PLACEHOLDER} />
          </div>
        </div>
    )
  }

  if (!cover) return null

  return <CoverBody cover={cover} />
}

/** 카드 본문. 생성 중 자리표시도 이 함수를 쓰므로 글자는 모두 <sk-t> 로 감싼다. */
function CoverBody({ cover }: { cover: CoverRecommendation }) {
  const { t } = useTranslation()
  const copy = t.analysis.cover
  const { tickets, meanPercentile, quietTickets } = cover

  const averageBack = COVER_STATS.averageHits[3] * FIFTH_PRIZE + COVER_STATS.averageHits[4] * FOURTH_PRIZE
  const bestRows = ([3, 4, 5] as const).map((count) => ({ count, share: COVER_STATS.bestShare[count] }))

  return (
      <div className="bg-surface border-line rounded-lg border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-ink font-bold break-keep"><sk-t>{copy.title(COVER_SIZE)}</sk-t></h3>
          </div>
          <CopyButton tickets={tickets} />
        </div>

        <p className="text-ink-muted mt-2 mb-4 text-sm leading-relaxed">
          <sk-t>{copy.intro(COVER_SIZE)}</sk-t>
        </p>

        <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-3">
          <div className="bg-surface-2 rounded-lg p-3">
            <h4 className="text-ink mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <sk-t>{copy.best}</sk-t>
            </h4>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              {bestRows.map(({ count, share }) => (
                  <Metric key={count} label={copy.matched(count)} value={`${(share * 100).toFixed(1)}%`} />
              ))}
            </dl>
          </div>

          <div className="bg-surface-2 rounded-lg p-3">
            <h4 className="text-ink mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <sk-t>{copy.money}</sk-t>
            </h4>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <Metric label={copy.price} value={copy.won(COVER_SIZE * TICKET_PRICE)} />
              <Metric label={copy.fifth} value={copy.tickets(COVER_STATS.averageHits[3].toFixed(2))} />
              <Metric label={copy.fourth} value={copy.tickets(COVER_STATS.averageHits[4].toFixed(2))} />
              <Metric label={copy.back} value={copy.won(Math.round(averageBack / 100) * 100)} />
            </dl>
          </div>

          {meanPercentile !== null && quietTickets !== null && (
              <div className="bg-surface-2 rounded-lg p-3">
                <h4 className="text-ink mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <sk-t>{t.analysis.recommendation.crowd}</sk-t>
                </h4>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <Metric label={copy.crowdMean} value={t.analysis.recommendation.crowdValue(Math.round(meanPercentile * 100))} />
                  <Metric label={copy.crowdQuiet} value={copy.tickets(String(quietTickets))} />
                </dl>
                <p className="text-ink-muted mt-2 text-xs leading-relaxed"><sk-t>{copy.crowdHint}</sk-t></p>
              </div>
          )}
        </div>

        <ol className="bg-surface-2 mt-4 grid max-h-96 grid-cols-1 gap-x-6 gap-y-2 overflow-y-auto rounded-lg p-3 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((numbers, index) => (
              <li key={numbers.join()} className="flex items-center gap-2">
                <span className="text-ink-muted w-7 shrink-0 text-right text-xs tabular-nums">
                  <sk-t data-sk-digits>{index + 1}</sk-t>
                </span>
                <BallRow numbers={numbers} size="sm" className="justify-start gap-1" />
              </li>
          ))}
        </ol>

        <p className="text-ink-muted mt-3 text-right text-[10px]">
          <sk-t>{copy.disclaimer}</sk-t>
        </p>
      </div>
  )
}

/** 181장을 한 줄에 한 장씩 클립보드에 옮긴다. */
function CopyButton({ tickets }: { tickets: readonly number[][] }) {
  const { t } = useTranslation()
  const copy = t.analysis.cover
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const handleCopy = async () => {
    const text = tickets.map((numbers) => numbers.map((n) => String(n).padStart(2, "0")).join(" ")).join("\n")

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), COPIED_MS)
    } catch (error) {
      console.error("번호를 복사하지 못했습니다:", error)
    }
  }

  const Icon = copied ? Check : Copy

  return (
      <Button variant="outline" size="sm" onClick={() => void handleCopy()} className="bg-surface text-ink border-line shrink-0">
        <Icon className="mr-1.5 h-4 w-4" />
        <sk-t>{copied ? copy.copied : copy.copy}</sk-t>
      </Button>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
      <>
        <dt className="text-ink-muted"><sk-t>{label}</sk-t></dt>
        <dd className="text-ink text-right font-medium"><sk-t>{value}</sk-t></dd>
      </>
  )
}
