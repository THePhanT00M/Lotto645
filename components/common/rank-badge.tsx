import type { DrawStatus, Rank } from "@/lib/lotto/rank"
import { rankLabel } from "@/lib/lotto/rank"
import { cn } from "@/lib/utils"

/** 등수별 배지 색. 파스텔 배경 + 진한 텍스트로 라이트/다크 모두 읽히게 한다. */
const RANK_STYLES: Record<string, string> = {
  "1": "text-[#0f0f0f] bg-[#fff8c5] border-[#f1e05a] dark:text-[#f1f1f1] dark:bg-[#5c4d00] dark:border-[#8b7500]",
  "2": "text-[#0f0f0f] bg-[#ffebd4] border-[#ffcc99] dark:text-[#f1f1f1] dark:bg-[#5e3000] dark:border-[#995c00]",
  "3": "text-[#0f0f0f] bg-[#dff0d8] border-[#d6e9c6] dark:text-[#f1f1f1] dark:bg-[#1e3a1e] dark:border-[#2b542c]",
  "4": "text-[#0f0f0f] bg-[#d9edf7] border-[#bce8f1] dark:text-[#f1f1f1] dark:bg-[#103046] dark:border-[#1a4a6e]",
  "5": "text-[#0f0f0f] bg-[#f3e5f5] border-[#e1bee7] dark:text-[#f1f1f1] dark:bg-[#341b3a] dark:border-[#5c2b66]",
}

const MISS_STYLE = "text-ink-muted bg-panel border-line"
const PENDING_STYLE = "text-accent bg-accent-soft border-accent-line"

/** 등수 하나를 나타내는 배지 스타일 클래스를 반환한다. */
export const rankStyle = (rank: Rank): string => (rank === null ? MISS_STYLE : RANK_STYLES[String(rank)])

interface RankBadgeProps {
  status: DrawStatus
  /** 회차 정보 없이 최신 회차로 추정 비교한 경우 "N회 기준"을 덧붙인다. */
  showComparedDraw?: boolean
  className?: string
}

/** 기록 한 건의 당첨 상태를 배지로 보여준다. */
export function RankBadge({ status, showComparedDraw = false, className }: RankBadgeProps) {
  const base = "rounded-md border px-3 py-1 text-sm font-semibold"

  if (status.kind === "pending") {
    return <div className={cn(base, PENDING_STYLE, className)}>추첨 대기</div>
  }

  if (status.kind === "missing") {
    return <div className={cn(base, MISS_STYLE, className)}>데이터 없음</div>
  }

  const label = rankLabel(status.match.rank)

  return (
      <div className={cn(base, rankStyle(status.match.rank), className)}>
        {showComparedDraw ? `${status.drawNo}회 기준: ${label}` : `결과: ${label}`}
      </div>
  )
}
