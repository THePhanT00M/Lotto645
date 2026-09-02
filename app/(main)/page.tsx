"use client"

import { AlertTriangle, CheckCircle2, Info, MousePointerClick, Shuffle, Trophy } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"
import AnalysisPanel from "@/components/analysis/analysis-panel"
import { Panel, Surface } from "@/components/common/panel"
import { SectionHeading } from "@/components/common/page-header"
import LottoMachine from "@/components/lotto/machine"
import NumberSelector from "@/components/lotto/number-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUpcomingDrawNo } from "@/hooks/use-winning-draws"
import { FIRST_PRIZE_ODDS, PICK_COUNT } from "@/lib/lotto/constants"

/**
 * 메인 화면
 *
 * 구성
 *   - 로또 추첨기 : 공이 도는 추첨통을 시뮬레이션해 완전 무작위로 6개를 뽑는다.
 *   - 수동 추첨기 : 번호를 직접 고르거나 일부만 고정하고 나머지를 자동으로 채운다.
 *   - 번호 분석   : 6개가 채워지면 과거 당첨 이력과 대조하고 AI 추천을 받을 수 있다.
 */
export default function HomePage() {
  const { t } = useTranslation()
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([])
  // 지금 뽑는 번호가 어느 회차를 겨냥하는지 기록에 남기기 위해 한 번만 조회한다.
  const upcomingDrawNo = useUpcomingDrawNo()

  const resetNumbers = () => setDrawnNumbers([])

  return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <div className="space-y-8">
          <Panel>
            <Tabs defaultValue="machine" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2 rounded-lg bg-gray-200 p-1 dark:bg-[#262626]">
                <TabsTrigger value="machine" className={TAB_TRIGGER_CLASS}>
                  <Shuffle className="h-4 w-4" />
                  {t.home.tabs.machine}
                </TabsTrigger>
                <TabsTrigger value="selector" className={TAB_TRIGGER_CLASS}>
                  <MousePointerClick className="h-4 w-4" />
                  {t.home.tabs.manual}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="machine" className="mt-2 flex flex-col items-center">
                <LottoMachine
                    onDrawComplete={setDrawnNumbers}
                    onReset={resetNumbers}
                    targetDrawNo={upcomingDrawNo}
                />
              </TabsContent>

              <TabsContent value="selector" className="mt-2">
                <NumberSelector
                    onSelectComplete={setDrawnNumbers}
                    onReset={resetNumbers}
                    drawnNumbers={drawnNumbers}
                    targetDrawNo={upcomingDrawNo}
                />
              </TabsContent>
            </Tabs>
          </Panel>

          {drawnNumbers.length === PICK_COUNT && (
              <AnalysisPanel numbers={drawnNumbers} key={drawnNumbers.join("-")} />
          )}

          <LottoGuide />
        </div>
      </div>
  )
}

const TAB_TRIGGER_CLASS =
    "text-ink-muted flex items-center justify-center gap-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm dark:data-[state=active]:bg-black dark:data-[state=active]:text-white"

/** 로또 규칙과 추첨기 사용법 안내. */
function LottoGuide() {
  const { t } = useTranslation()

  return (
      <Panel className="space-y-4">
        <SectionHeading icon={Info} title={t.home.guide.title} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Surface className="space-y-3">
            <h3 className="text-ink flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              {t.home.guide.basics.title}
            </h3>
            <ul className="text-ink-muted space-y-2 text-sm">
              <GuideItem>{t.home.guide.basics.range}</GuideItem>
              <GuideItem>{t.home.guide.basics.schedule}</GuideItem>
              <GuideItem>
                <span className="flex flex-wrap items-center gap-1">
                  {t.home.guide.basics.oddsLabel}
                  <span className="flex items-center rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                    <Trophy className="mr-1 h-3 w-3" /> 1 / {FIRST_PRIZE_ODDS.toLocaleString()}
                  </span>
                </span>
              </GuideItem>
            </ul>
          </Surface>

          <Surface className="space-y-3">
            <h3 className="text-ink flex items-center gap-2 font-semibold">
              <MousePointerClick className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              {t.home.guide.usage.title}
            </h3>
            <div className="text-ink-muted space-y-3 text-sm">
              <div>
                <span className="text-ink mb-1 block font-semibold">{t.home.guide.usage.machine}</span>
                <p className="leading-relaxed">{t.home.guide.usage.machineDescription}</p>
              </div>
              <div className="border-line border-t pt-3">
                <span className="text-ink mb-1 block font-semibold">{t.home.guide.usage.manual}</span>
                <p className="leading-relaxed">{t.home.guide.usage.manualDescription}</p>
              </div>
            </div>
          </Surface>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-[#fff0f0] p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-[#2a1515] dark:text-red-400">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-300">{t.home.guide.warning.title}</p>
            <p className="mt-1 leading-relaxed opacity-90">{t.home.guide.warning.body}</p>
          </div>
        </div>
      </Panel>
  )
}

function GuideItem({ children }: { children: React.ReactNode }) {
  return (
      <li className="flex items-start gap-2">
        <span className="mt-1 block h-1 w-1 flex-shrink-0 rounded-full bg-gray-400 dark:bg-gray-600" />
        <span>{children}</span>
      </li>
  )
}
