"use client"

import { Trophy } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import DrawHighlight from "@/components/winning/draw-highlight"
import DrawList from "@/components/winning/draw-list"
import DrawNavigator from "@/components/winning/draw-navigator"
import WinningSkeleton from "@/components/winning/winning-skeleton"
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

  const jump = async (drawNo: number) => {
    const moved = await browser.jumpTo(drawNo)
    if (!moved) {
      toast({ title: "이동할 수 없습니다", description: "존재하지 않는 회차입니다.", variant: "destructive" })
    }
  }

  if (browser.isInitialLoading) return <WinningSkeleton />

  return (
      <div className="container mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader icon={Trophy} title="역대 당첨번호" description="원하는 회차로 이동하여 당첨 번호를 확인하세요." />

        {browser.currentDraw && (
            <DrawHighlight draw={browser.currentDraw} latestDrawNo={browser.latestDrawNo} onNavigate={jump} />
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <DrawNavigator
                latestDrawNo={browser.latestDrawNo}
                currentDrawNo={browser.currentDraw?.drawNo}
                onJump={jump}
            />
          </div>

          <div className="lg:col-span-2">
            <DrawList browser={browser} />
          </div>
        </div>
      </div>
  )
}
