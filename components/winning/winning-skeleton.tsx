import { useTranslation } from "@/components/i18n/locale-provider"
import type { DrawBrowser } from "@/components/winning/draw-list"
import WinningView from "@/components/winning/winning-view"
import { PAGE_SIZE } from "@/hooks/use-draw-browser"
import type { WinningLottoNumbers } from "@/lib/lotto/types"

/*
 * 자리표시 값
 *
 * 글자는 가려지므로 자릿수와 줄 수만 실제와 같으면 된다. 목록은 처음 불러오는 한 페이지만큼
 * 채우고, 회차는 지금과 같은 네 자리로 둔다.
 */
const PLACEHOLDER_DRAWS: WinningLottoNumbers[] = Array.from({ length: PAGE_SIZE }, (_, index) => ({
  drawNo: 1241 - index,
  date: "2026-09-12",
  numbers: [12, 18, 25, 29, 31, 40],
  bonusNo: 19,
}))

const noop = () => {}

const BROWSER: DrawBrowser = {
  draws: PLACEHOLDER_DRAWS,
  currentDraw: PLACEHOLDER_DRAWS[0],
  setCurrentDraw: noop,
  latestDrawNo: PLACEHOLDER_DRAWS[0].drawNo,
  isInitialLoading: false,
  isLoadingOlder: false,
  isLoadingNewer: false,
  hasMoreOlder: true,
  hasMoreNewer: false,
  jumpTo: async () => true,
  listRef: { current: null },
  topTriggerRef: { current: null },
  bottomTriggerRef: { current: null },
  registerItem: noop,
}

/**
 * 당첨번호 페이지 첫 로딩 화면
 *
 * 막대를 따로 그리지 않고 실제 화면(WinningView)을 자리표시 값으로 그린 뒤 .is-sk 로 글자만 가린다.
 */
export default function WinningSkeleton() {
  const { t } = useTranslation()

  return (
      <div role="status" aria-label={t.winning.title} aria-busy>
        <div className="is-sk" aria-hidden inert>
          <WinningView browser={BROWSER} onJump={noop} />
        </div>
      </div>
  )
}
