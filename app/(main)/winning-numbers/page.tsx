"use client"

import { useTranslation } from "@/components/i18n/locale-provider"
import WinningSkeleton from "@/components/winning/winning-skeleton"
import WinningView from "@/components/winning/winning-view"
import { useDrawBrowser } from "@/hooks/use-draw-browser"
import { useToast } from "@/hooks/use-toast"

/**
 * 역대 당첨번호
 *
 * 선택한 회차를 상단에 크게 보여주고, 우측 목록에서 양방향 무한 스크롤로
 * 과거·최신 회차를 오갈 수 있다.
 */
export default function WinningNumbersPage() {
  const browser = useDrawBrowser()
  const { toast } = useToast()
  const { t } = useTranslation()

  const jump = async (drawNo: number) => {
    const moved = await browser.jumpTo(drawNo)
    if (!moved) {
      toast({ title: t.winning.notFoundTitle, description: t.winning.notFound, variant: "destructive" })
    }
  }

  if (browser.isInitialLoading) return <WinningSkeleton />

  return <WinningView browser={browser} onJump={(drawNo) => void jump(drawNo)} />
}
