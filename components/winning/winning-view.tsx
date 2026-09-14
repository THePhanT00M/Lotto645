"use client"

import { Trophy } from "lucide-react"
import { useTranslation } from "@/components/i18n/locale-provider"
import { PageHeader } from "@/components/common/page-header"
import DrawHighlight from "@/components/winning/draw-highlight"
import DrawList, { type DrawBrowser } from "@/components/winning/draw-list"
import DrawNavigator from "@/components/winning/draw-navigator"

interface WinningViewProps {
  browser: DrawBrowser
  onJump: (drawNo: number) => void
}

/**
 * 역대 당첨번호 화면 본문
 *
 * 스켈레톤도 이 함수를 자리표시 값으로 부른다(winning-skeleton). 화면을 고치면
 * 자리표시가 저절로 따라오도록, 글자는 모두 <sk-t> 로 감싼다.
 */
export default function WinningView({ browser, onJump }: WinningViewProps) {
  const { t } = useTranslation()

  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader icon={Trophy} title={t.winning.title} description={t.winning.description} />

        {browser.currentDraw && (
            <DrawHighlight draw={browser.currentDraw} latestDrawNo={browser.latestDrawNo} onNavigate={onJump} />
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <DrawNavigator
                latestDrawNo={browser.latestDrawNo}
                currentDrawNo={browser.currentDraw?.drawNo}
                onJump={onJump}
            />
          </div>

          <div className="lg:col-span-2">
            <DrawList browser={browser} />
          </div>
        </div>
      </div>
  )
}
