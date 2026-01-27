"use client"

import { useState } from "react"
import {
  Info,
  AlertTriangle,
  Trophy,
  MousePointerClick,
  Shuffle,
  CheckCircle2
} from "lucide-react"
import LottoMachine from "@/components/lotto-machine"
import NumberSelector from "@/components/number-selector"
import LottoAnalysis from "@/components/lotto-analysis"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  // 1. 상태 초기화 (추첨 번호 및 탭 상태)
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState("machine")

  // 2. 추첨 완료 핸들러
  const handleDrawComplete = (numbers: number[]) => {
    setDrawnNumbers(numbers)
  }

  // 3. 초기화 핸들러
  const handleReset = () => {
    setDrawnNumbers([])
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="space-y-8">

        {/* 4. 메인 추첨기 섹션 (카드 스타일 적용) */}
        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
          <Tabs defaultValue="machine" className="w-full" onValueChange={(value) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-200 dark:bg-[#262626] p-1 rounded-lg">
              <TabsTrigger
                value="machine"
                className="flex items-center justify-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-500 dark:text-[#a3a3a3] data-[state=active]:dark:bg-black data-[state=active]:dark:text-white transition-all"
              >
                <Shuffle className="w-4 h-4" />
                로또 추첨기
              </TabsTrigger>
              <TabsTrigger
                value="selector"
                className="flex items-center justify-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-500 dark:text-[#a3a3a3] data-[state=active]:dark:bg-black data-[state=active]:dark:text-white transition-all"
              >
                <MousePointerClick className="w-4 h-4" />
                수동 추첨기
              </TabsTrigger>
            </TabsList>

            <TabsContent value="machine" className="flex flex-col items-center mt-2">
              <LottoMachine onDrawComplete={handleDrawComplete} onReset={handleReset} />
            </TabsContent>

            <TabsContent value="selector" className="mt-2">
              <NumberSelector onSelectComplete={handleDrawComplete} onReset={handleReset} drawnNumbers={drawnNumbers} />
            </TabsContent>
          </Tabs>
        </div>

        {/* 5. 분석 섹션 (번호가 있을 때만 표시) */}
        {drawnNumbers.length === 6 && (
          <LottoAnalysis
            numbers={drawnNumbers}
            key={drawnNumbers.join("-")}
          />
        )}

        {/* 6. 로또 정보 및 안내 섹션 */}
        <div className="bg-gray-100 dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f] space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">로또 정보</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 기본 정보 카드 */}
            <div className="bg-white dark:bg-[#262626] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#3f3f3f] space-y-3">
              <h3 className="text-md font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                기본 정보
              </h3>
              <ul className="space-y-2 text-sm text-[#606060] dark:text-[#aaaaaa]">
                <li className="flex items-start gap-2">
                  <span className="block mt-1 w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600 flex-shrink-0" />
                  <span>로또 6/45는 1부터 45까지의 숫자 중 6개를 선택하는 복권입니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="block mt-1 w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600 flex-shrink-0" />
                  <span>당첨번호는 매주 <strong>토요일 저녁</strong>에 추첨됩니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="block mt-1 w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-600 flex-shrink-0" />
                  <span className="flex items-center gap-1">
                    1등 당첨 확률:
                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded text-xs font-medium flex items-center">
                      <Trophy className="w-3 h-3 mr-1" /> 1 / 8,145,060
                    </span>
                  </span>
                </li>
              </ul>
            </div>

            {/* 이용 안내 카드 */}
            <div className="bg-white dark:bg-[#262626] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#3f3f3f] space-y-3">
              <h3 className="text-md font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                이용 안내
              </h3>
              <div className="space-y-3 text-sm text-[#606060] dark:text-[#aaaaaa]">
                <div>
                  <span className="font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] block mb-1">로또 추첨기</span>
                  <p className="leading-relaxed">물리적 추첨 방식을 시뮬레이션하여 완전히 랜덤한 번호를 생성합니다.</p>
                </div>
                <div className="border-t border-[#e5e5e5] dark:border-[#3f3f3f] pt-3">
                  <span className="font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] block mb-1">수동 추첨기</span>
                  <p className="leading-relaxed">원하는 번호를 직접 선택하거나, 특정 번호를 고정/제외하고 나머지를 자동 생성할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </div>

          {/* 주의사항 (강조 스타일) */}
          <div className="bg-[#fff0f0] dark:bg-[#2a1515] p-4 rounded-lg flex items-start gap-3 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-300">주의사항</p>
              <p className="mt-1 opacity-90">
                복권 구매는 <strong className="underline decoration-red-400 underline-offset-2">만 19세 이상만</strong> 가능합니다. 과도한 복권 몰입은 도박 중독을 유발할 수 있으니 건전한 여가 생활로 즐겨주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}