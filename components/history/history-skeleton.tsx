import HistoryView, { type HistoryViewActions, type HistoryViewState } from "@/components/history/history-view"
import { useTranslation } from "@/components/i18n/locale-provider"
import { DEFAULT_FILTER, groupByDraw, summarizeHistory, type AnalyzedEntry } from "@/lib/lotto/history-summary"
import type { WinningLottoNumbers } from "@/lib/lotto/types"

/*
 * 자리표시 값
 *
 * 글자는 가려지므로 자릿수와 줄 수만 실제와 같으면 된다. 한 페이지(20건)를 다음 추첨과
 * 지난 회차 셋에 다섯 건씩 나눠 두고, 요약과 묶음은 실제 화면과 같은 집계 함수로 만든다.
 */
const ENTRIES_PER_PAGE = 20
const NUMBERS = [3, 18, 25, 29, 31, 40]
const NEXT_DRAW_NO = 1242

const DRAWS: WinningLottoNumbers[] = [1241, 1240, 1239].map((drawNo) => ({
  drawNo,
  date: "2026-09-12",
  numbers: [7, 13, 16, 23, 24, 43],
  bonusNo: 9,
}))

const placeholder = (id: number, drawNo: number, status: AnalyzedEntry["status"]): AnalyzedEntry => ({
  id: `placeholder-${id}`,
  numbers: NUMBERS,
  timestamp: 0,
  drawNo,
  source: "user",
  pickSource: "machine",
  status,
  prizeAmount: null,
})

const pending = (id: number) => placeholder(id, NEXT_DRAW_NO, { kind: "pending", drawNo: NEXT_DRAW_NO })
const scored = (id: number, drawNo: number) =>
    placeholder(id, drawNo, { kind: "matched", drawNo, match: { matchCount: 1, bonusMatch: false, rank: null } })

const PER_DRAW = 5

const ENTRIES: AnalyzedEntry[] = [
  ...Array.from({ length: PER_DRAW }, (_, index) => pending(index)),
  ...DRAWS.flatMap((draw, group) =>
      Array.from({ length: PER_DRAW }, (_, index) => scored((group + 1) * 10 + index, draw.drawNo)),
  ),
]

const STATE: HistoryViewState = {
  summary: summarizeHistory(ENTRIES),
  nextDraw: { drawNo: NEXT_DRAW_NO, date: "2026-09-19", daysLeft: 5, entries: ENTRIES.slice(0, PER_DRAW) },
  groups: groupByDraw(ENTRIES, new Map(DRAWS.map((draw) => [draw.drawNo, draw])), ENTRIES_PER_PAGE),
  filteredCount: ENTRIES.length,
  hasMore: false,
  filter: DEFAULT_FILTER,
  isSelecting: false,
  selectedKeys: new Set(),
}

const noop = () => {}

const ACTIONS: HistoryViewActions = {
  onFilterChange: noop,
  onShowMore: noop,
  onStartSelect: noop,
  onStopSelect: noop,
  onToggleSelect: noop,
  onToggleAll: noop,
  onDeleteSelected: noop,
  onDeleteAll: noop,
  onDelete: noop,
  onCopy: noop,
  onSaveMemo: async () => {},
  onDownload: noop,
}

/**
 * 나의 추첨 기록 자리표시
 *
 * 막대를 따로 그리지 않고 실제 화면(HistoryView)을 자리표시 값으로 그린 뒤 .is-sk 로 글자만 가린다.
 * 화면을 고치면 자리표시가 저절로 따라온다. 안의 버튼은 inert 로 눌리지 않게 막는다.
 */
export default function HistorySkeleton() {
  const { t } = useTranslation()

  return (
      <div role="status" aria-label={t.history.title} aria-busy>
        <div className="is-sk" aria-hidden inert>
          <HistoryView state={STATE} actions={ACTIONS} />
        </div>
      </div>
  )
}
