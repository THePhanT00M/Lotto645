"use client"
import { useState } from "react"
import LottoMachine from "@/components/lotto-machine"
import NumberSelector from "@/components/number-selector"
import LottoAnalysis from "@/components/lotto-analysis"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState("machine") // 현재 활성화된 탭 상태 추가

  const handleDrawComplete = (numbers: number[]) => {
    setDrawnNumbers(numbers)
  }

  // 초기화 핸들러 함수
  const handleReset = () => {
    setDrawnNumbers([])
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-8">
        {/* Main Lotto Machine */}
        <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-xl p-4 sm:p-6">
          <Tabs defaultValue="machine" className="w-full" onValueChange={(value) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-200 dark:bg-[#262626] p-1 rounded-sm">
              <TabsTrigger
                value="machine"
                className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-500 dark:text-[rgb(163,163,163)] data-[state=active]:dark:bg-black"
              >
                로또 추첨기
              </TabsTrigger>
              <TabsTrigger
                value="selector"
                className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-gray-500 dark:text-[rgb(163,163,163)] data-[state=active]:dark:bg-black"
              >
                수동 추첨기
              </TabsTrigger>
            </TabsList>

            <TabsContent value="machine" className="flex flex-col items-center">
              <LottoMachine onDrawComplete={handleDrawComplete} onReset={handleReset} />
            </TabsContent>

            <TabsContent value="selector">
              <NumberSelector onSelectComplete={handleDrawComplete} onReset={handleReset} drawnNumbers={drawnNumbers} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Analysis Section - Only show when numbers are drawn */}
        {drawnNumbers.length === 6 && (
          <LottoAnalysis numbers={drawnNumbers} key={`analysis-${activeTab}-${drawnNumbers.join("-")}`} />
        )}

        {/* Tips Section */}
        <div className="bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-xl p-4 sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">로또 정보</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white dark:bg-[rgb(38,38,38)] rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 dark:text-gray-400 mb-2">기본 정보</h3>
              <p className="text-gray-700 dark:text-gray-200 mb-2">
                로또 6/45는 1부터 45까지의 숫자 중 6개를 선택하는 복권입니다.
              </p>
              <p className="text-gray-700 dark:text-gray-200 mb-2">당첨번호는 매주 토요일 저녁에 추첨됩니다.</p>
              <p className="text-gray-700 dark:text-gray-200 mb-2">
                복권 구매는 <span className="text-red-600 dark:text-red-400">만 19세 이상만</span> 가능합니다.
              </p>
              <p className="text-gray-700 dark:text-gray-200">1등 당첨 확률은 약 8,145,060분의 1입니다.</p>
            </div>

            <div className="bg-white dark:bg-[rgb(38,38,38)] rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 dark:text-gray-400 mb-2">이용 안내</h3>
              <p className="text-gray-700 dark:text-gray-200 mb-2">
                <span className="font-medium">로또 추첨기</span> 탭에서는 완전히 랜덤한 번호를 추첨할 수 있습니다.
              </p>
              <p className="text-gray-700 dark:text-gray-200">
                <span className="font-medium">수동</span> 탭에서는 번호를 직접 선택하거나 자동 생성할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
