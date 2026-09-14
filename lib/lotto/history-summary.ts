import { compareWithRandom, matchProbability, tallyByDraw, type RandomComparison, type ScoredPick } from "./baseline"
import { PICK_COUNT } from "./constants"
import type { DrawStatus } from "./rank"
import type { DrawSource, LottoResult, RecordSource, WinningLottoNumbers } from "./types"

/**
 * 나의 추첨 기록 집계
 *
 * 화면이 그리는 요약·거르기·회차 묶음·다음 추첨을 계산한다. 화면과 스켈레톤이
 * 같은 모양의 값을 넘겨받도록 계산을 화면 밖에 둔다.
 */

/** 저장 위치 정보를 붙인 기록 */
export interface HistoryEntry extends LottoResult {
  source: RecordSource
}

/** 당첨 판정과 당첨금까지 붙인 기록 */
export interface AnalyzedEntry extends HistoryEntry {
  status: DrawStatus | null
  /** 당첨이면 그 회차 그 등수의 1인당 당첨금(원, 세전). 모르면 null. */
  prizeAmount: number | null
}

/** 목록에서 기록을 가리키는 키. 로컬과 서버에 같은 id 가 있을 수 있다. */
export const entryKey = (entry: HistoryEntry): string => `${entry.source}-${entry.id}`

/** 번호를 만든 경로. 경로를 남기기 전의 로컬 기록은 AI 추천인지만 안다. */
export const sourceOf = (entry: LottoResult): DrawSource | null =>
    entry.pickSource ?? (entry.isAiRecommended ? "ai" : null)

export type StatusFilter = "all" | "pending" | "won" | "lost"

export interface HistoryFilter {
  status: StatusFilter
  source: DrawSource | "all"
  /** 이 번호가 들어간 기록만. null 이면 거르지 않는다. */
  number: number | null
}

export const DEFAULT_FILTER: HistoryFilter = { status: "all", source: "all", number: null }

/** 기록 한 건의 결과. 데이터가 없는 구 회차는 null. */
export const statusOf = (entry: AnalyzedEntry): Exclude<StatusFilter, "all"> | null => {
  if (entry.status?.kind === "pending") return "pending"
  if (entry.status?.kind !== "matched") return null
  return entry.status.match.rank !== null ? "won" : "lost"
}

export const filterEntries = (
    entries: readonly AnalyzedEntry[] | null | undefined,
    filter: HistoryFilter,
): AnalyzedEntry[] =>
    (Array.isArray(entries) ? entries : []).filter(
        (entry) =>
            (filter.status === "all" || statusOf(entry) === filter.status) &&
            (filter.source === "all" || sourceOf(entry) === filter.source) &&
            (filter.number === null || entry.numbers.includes(filter.number)),
    )

export interface DrawGroup {
  /** 회차를 지정하지 않고 저장한 구 기록은 null 로 모은다. */
  drawNo: number | null
  /** 그 회차 당첨 번호. 추첨 전이거나 회차가 없으면 null. */
  draw: WinningLottoNumbers | null
  /** 보이는 만큼만 담은 기록 */
  entries: AnalyzedEntry[]
  /** 이 회차의 전체 건수·당첨·당첨금. 보이는 건수와 상관없이 회차 전체로 센다. */
  total: number
  winCount: number
  prizeTotal: number
}

/**
 * 기록을 회차별로 묶는다.
 *
 * 최신 회차가 위로 오고, 회차 없이 저장된 구 기록은 맨 아래로 모은다.
 * 회차 안에서는 목록이 이미 최신순이므로 들어온 순서를 그대로 둔다.
 * 한 회차에 기록이 몰릴 수 있어, 보여 줄 건수(limit)는 회차가 아니라 기록으로 센다.
 */
export const groupByDraw = (
    entries: readonly AnalyzedEntry[],
    drawsByNo: ReadonlyMap<number, WinningLottoNumbers>,
    limit: number = Number.POSITIVE_INFINITY,
): DrawGroup[] => {
  const buckets = new Map<number | null, AnalyzedEntry[]>()

  for (const entry of entries) {
    const drawNo = entry.drawNo ?? null
    const bucket = buckets.get(drawNo)
    if (bucket) bucket.push(entry)
    else buckets.set(drawNo, [entry])
  }

  const groups = [...buckets]
      .map(([drawNo, items]) => ({
        drawNo,
        draw: drawNo === null ? null : drawsByNo.get(drawNo) ?? null,
        entries: items,
        total: items.length,
        winCount: items.filter((entry) => statusOf(entry) === "won").length,
        prizeTotal: items.reduce((sum, entry) => sum + (entry.prizeAmount ?? 0), 0),
      }))
      .sort((a, b) => (b.drawNo ?? -1) - (a.drawNo ?? -1))

  let remaining = limit
  return groups.flatMap((group) => {
    if (remaining <= 0) return []
    const visible = group.entries.slice(0, remaining)
    remaining -= visible.length
    return [{ ...group, entries: visible }]
  })
}

export interface HistorySummary {
  total: number
  localCount: number
  serverCount: number
  /** 당첨 번호와 대조를 마친 기록 수 */
  scored: number
  /** 결과별 기록 수 */
  statusCounts: Record<Exclude<StatusFilter, "all">, number>
  /** 1~5등 당첨 건수. 인덱스 0 이 1등이다. */
  rankCounts: number[]
  winCount: number
  /** 받은 당첨금 합계(원, 세전) */
  prizeTotal: number
  /** 평균 적중을 무작위 범위와 견준 결과. 채점된 기록이 없으면 null. */
  comparison: RandomComparison | null
  /** 적중 개수별 건수와 무작위 기대 비율 */
  buckets: { matchCount: number; count: number; ratio: number; expected: number }[]
  /** 자주 고른 번호 */
  favorites: { number: number; count: number }[]
}

/** 자주 고른 번호로 보여 줄 개수 */
const FAVORITE_COUNT = 6

export const summarizeHistory = (entries: readonly AnalyzedEntry[] | null | undefined): HistorySummary => {
  const rows = Array.isArray(entries) ? entries : []
  const matched = rows.flatMap((entry) => (entry.status?.kind === "matched" ? [{ entry, match: entry.status.match, drawNo: entry.status.drawNo }] : []))

  const rankCounts = [0, 0, 0, 0, 0]
  for (const { match } of matched) if (match.rank !== null) rankCounts[match.rank - 1]++

  // 같은 회차 기록은 같은 당첨 번호로 채점되므로, 번호가 몰린 정도까지 반영해 무작위와 견준다.
  const scoredPicks: ScoredPick[] = matched.map(({ entry, match, drawNo }) => ({
    draw_no: drawNo,
    numbers: entry.numbers,
    matched_count: match.matchCount,
    prize_rank: match.rank,
  }))

  const buckets = Array.from({ length: PICK_COUNT + 1 }, (_, matchCount) => {
    const count = matched.filter(({ match }) => match.matchCount === matchCount).length
    return { matchCount, count, ratio: matched.length === 0 ? 0 : count / matched.length, expected: matchProbability(matchCount) }
  })

  const numberCounts = new Map<number, number>()
  for (const entry of rows) for (const number of entry.numbers) numberCounts.set(number, (numberCounts.get(number) ?? 0) + 1)

  return {
    total: rows.length,
    localCount: rows.filter((entry) => entry.source === "local").length,
    serverCount: rows.filter((entry) => entry.source === "user").length,
    scored: matched.length,
    statusCounts: {
      pending: rows.filter((entry) => statusOf(entry) === "pending").length,
      won: rows.filter((entry) => statusOf(entry) === "won").length,
      lost: rows.filter((entry) => statusOf(entry) === "lost").length,
    },
    rankCounts,
    winCount: rankCounts.reduce((sum, count) => sum + count, 0),
    prizeTotal: rows.reduce((sum, entry) => sum + (entry.prizeAmount ?? 0), 0),
    comparison: compareWithRandom(tallyByDraw(scoredPicks)),
    buckets,
    favorites: [...numberCounts]
        .sort((a, b) => b[1] - a[1] || a[0] - b[0])
        .slice(0, FAVORITE_COUNT)
        .map(([number, count]) => ({ number, count })),
  }
}

export interface NextDraw {
  drawNo: number
  /** YYYY-MM-DD */
  date: string
  /** 오늘부터 추첨일까지 남은 날 */
  daysLeft: number
  /** 이 회차를 겨냥한 기록 */
  entries: AnalyzedEntry[]
}

const parseDate = (date: string): Date => {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/** 가장 최근 회차 다음 회차의 추첨일과, 그 회차를 겨냥한 기록. 당첨 이력이 없으면 null. */
export const nextDrawOf = (
    entries: readonly AnalyzedEntry[] | null | undefined,
    draws: readonly WinningLottoNumbers[] | null | undefined,
    today: Date = new Date(),
): NextDraw | null => {
  const history = Array.isArray(draws) ? draws : []
  if (history.length === 0) return null

  const latest = history.reduce((a, b) => (b.drawNo > a.drawNo ? b : a))
  const drawDate = parseDate(latest.date)
  drawDate.setDate(drawDate.getDate() + 7)

  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const daysLeft = Math.round((drawDate.getTime() - start.getTime()) / 86_400_000)
  const drawNo = latest.drawNo + 1

  const pad = (value: number) => String(value).padStart(2, "0")

  return {
    drawNo,
    date: `${drawDate.getFullYear()}-${pad(drawDate.getMonth() + 1)}-${pad(drawDate.getDate())}`,
    daysLeft,
    entries: (Array.isArray(entries) ? entries : []).filter(
        (entry) => entry.status?.kind === "pending" && entry.status.drawNo === drawNo,
    ),
  }
}
