"use client"

import { HelpCircle, Sparkles, Save, ShieldQuestion, Calculator } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FAQPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          자주 묻는 질문 (FAQ)
        </h1>
        <p className="text-[#606060] dark:text-[#aaaaaa] text-sm">
          Lotto645 서비스 이용에 대한 궁금증을 해결해 드립니다.
        </p>
      </div>

      {/* 탭 섹션 */}
      <Tabs defaultValue="service" className="space-y-4">
        {/* TabsList: 라이트 모드에선 유튜브 칩 배경 느낌의 연한 회색(#f2f2f2/gray-100) 적용 */}
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-[#0f0f0f] p-1 rounded-lg border border-transparent dark:border-[#272727]">
          <TabsTrigger
            value="service"
            className="text-[#606060] data-[state=active]:bg-white data-[state=active]:text-[#0f0f0f] data-[state=active]:shadow-sm dark:text-[#aaaaaa] dark:data-[state=active]:bg-[#272727] dark:data-[state=active]:text-[#f1f1f1] rounded-md transition-colors font-medium"
          >
            서비스 이용
          </TabsTrigger>
          <TabsTrigger
            value="features"
            className="text-[#606060] data-[state=active]:bg-white data-[state=active]:text-[#0f0f0f] data-[state=active]:shadow-sm dark:text-[#aaaaaa] dark:data-[state=active]:bg-[#272727] dark:data-[state=active]:text-[#f1f1f1] rounded-md transition-colors font-medium"
          >
            추첨 및 분석 기능
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="text-[#606060] data-[state=active]:bg-white data-[state=active]:text-[#0f0f0f] data-[state=active]:shadow-sm dark:text-[#aaaaaa] dark:data-[state=active]:bg-[#272727] dark:data-[state=active]:text-[#f1f1f1] rounded-md transition-colors font-medium"
          >
            데이터 및 저장
          </TabsTrigger>
        </TabsList>

        {/* 1. 서비스 이용 탭 */}
        <TabsContent value="service" className="space-y-4">
          {/* 카드 배경: 라이트 모드 #f9f9f9, 다크 모드 #1e1e1e */}
          <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
            <div className="flex items-center gap-2 mb-4">
              <ShieldQuestion className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">기본 이용 안내</h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-b border-[#e5e5e5] dark:border-[#3f3f3f]">
                <AccordionTrigger className="text-[#0f0f0f] dark:text-[#f1f1f1] hover:no-underline hover:text-blue-600 dark:hover:text-blue-400 text-left">
                  이 사이트는 무료인가요?
                </AccordionTrigger>
                <AccordionContent className="text-[#606060] dark:text-[#aaaaaa] leading-relaxed">
                  네, Lotto645의 모든 기능(번호 추첨, AI 분석, 기록 저장 등)은 회원가입 없이 무료로 이용하실 수 있습니다.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-b border-[#e5e5e5] dark:border-[#3f3f3f]">
                <AccordionTrigger className="text-[#0f0f0f] dark:text-[#f1f1f1] hover:no-underline hover:text-blue-600 dark:hover:text-blue-400 text-left">
                  실제 복권을 구매할 수 있나요?
                </AccordionTrigger>
                <AccordionContent className="text-[#606060] dark:text-[#aaaaaa] leading-relaxed">
                  아니요. 이 서비스는 번호 생성 및 분석 시뮬레이터입니다. 실제 복권 구매는 동행복권 공식 홈페이지나 오프라인 판매점을 이용해 주시기 바랍니다.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-none">
                <AccordionTrigger className="text-[#0f0f0f] dark:text-[#f1f1f1] hover:no-underline hover:text-blue-600 dark:hover:text-blue-400 text-left">
                  당첨 번호는 언제 업데이트 되나요?
                </AccordionTrigger>
                <AccordionContent className="text-[#606060] dark:text-[#aaaaaa] leading-relaxed">
                  매주 토요일 저녁 추첨 방송이 끝난 직후, 공식 데이터를 확인하여 자동으로 업데이트됩니다.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>

        {/* 2. 추첨 및 분석 기능 탭 */}
        <TabsContent value="features" className="space-y-4">
          <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">AI 및 추첨 알고리즘</h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="feat-1" className="border-b border-[#e5e5e5] dark:border-[#3f3f3f]">
                <AccordionTrigger className="text-[#0f0f0f] dark:text-[#f1f1f1] hover:no-underline hover:text-purple-600 dark:hover:text-purple-400 text-left">
                  '로또 추첨기'와 'AI 추천'의 차이는 무엇인가요?
                </AccordionTrigger>
                <AccordionContent className="text-[#606060] dark:text-[#aaaaaa] space-y-2 leading-relaxed">
                  <p>
                    <strong className="text-[#0f0f0f] dark:text-[#f1f1f1]">로또 추첨기:</strong> 물리적인 추첨기를 시뮬레이션하여 1~45번 공을 완전히 무작위(Random)로 섞어서 뽑습니다. 운에 맡기는 방식입니다.
                  </p>
                  <p>
                    <strong className="text-[#0f0f0f] dark:text-[#f1f1f1]">AI 추천:</strong> 과거 당첨 번호의 패턴(홀짝 비율, 번호 합계, 구간 분포, 미출현 기간 등)을 분석하여 통계적으로 균형 잡힌 번호를 추천합니다. 10만 번 이상의 시뮬레이션을 통해 최적의 조합을 찾습니다.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="feat-2" className="border-b border-[#e5e5e5] dark:border-[#3f3f3f]">
                <AccordionTrigger className="text-[#0f0f0f] dark:text-[#f1f1f1] hover:no-underline hover:text-purple-600 dark:hover:text-purple-400 text-left">
                  '수동 추첨기'에서 번호 고정과 제외는 어떻게 하나요?
                </AccordionTrigger>
                <AccordionContent className="text-[#606060] dark:text-[#aaaaaa] leading-relaxed">
                  수동 추첨기 탭에서 [번호 고정]을 선택하여 원하는 번호를 반드시 포함시키거나, [번호 제외]를 통해 원하지 않는 번호를 뺄 수 있습니다. 남은 번호는 자동으로 채울 수 있습니다.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="feat-3" className="border-none">
                <AccordionTrigger className="text-[#0f0f0f] dark:text-[#f1f1f1] hover:no-underline hover:text-purple-600 dark:hover:text-purple-400 text-left">
                  AI 분석 점수와 등급은 신뢰할 수 있나요?
                </AccordionTrigger>
                <AccordionContent className="text-[#606060] dark:text-[#aaaaaa] leading-relaxed">
                  AI 등급(최상~하)은 과거 당첨 통계와의 유사성을 나타내는 지표일 뿐입니다. '최상' 등급이라도 당첨을 보장하지 않으며, '하' 등급이라도 당첨될 수 있습니다. 재미와 참고용으로만 활용해 주세요.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>

        {/* 3. 데이터 및 저장 탭 */}
        <TabsContent value="data" className="space-y-4">
          <div className="bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl p-5 border border-[#e5e5e5] dark:border-[#3f3f3f]">
            <div className="flex items-center gap-2 mb-4">
              <Save className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">데이터 관리</h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="data-1" className="border-b border-[#e5e5e5] dark:border-[#3f3f3f]">
                <AccordionTrigger className="text-[#0f0f0f] dark:text-[#f1f1f1] hover:no-underline hover:text-green-600 dark:hover:text-green-400 text-left">
                  추첨 기록은 어디에 저장되나요?
                </AccordionTrigger>
                <AccordionContent className="text-[#606060] dark:text-[#aaaaaa] leading-relaxed">
                  사용자의 개인정보 보호를 위해, 생성하신 번호 기록은 서버가 아닌 <strong className="text-[#0f0f0f] dark:text-[#f1f1f1]">현재 사용 중인 브라우저(Local Storage)</strong>에만 저장됩니다. 별도의 로그인 없이도 기록을 유지할 수 있습니다.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="data-2" className="border-b border-[#e5e5e5] dark:border-[#3f3f3f]">
                <AccordionTrigger className="text-[#0f0f0f] dark:text-[#f1f1f1] hover:no-underline hover:text-green-600 dark:hover:text-green-400 text-left">
                  저장된 기록이 사라졌어요.
                </AccordionTrigger>
                <AccordionContent className="text-[#606060] dark:text-[#aaaaaa] leading-relaxed">
                  기록은 브라우저에 저장되므로, <strong className="text-[#0f0f0f] dark:text-[#f1f1f1]">브라우저 캐시(쿠키)를 삭제</strong>하거나 <strong className="text-[#0f0f0f] dark:text-[#f1f1f1]">시크릿 모드</strong>를 사용하시면 기록이 사라질 수 있습니다. 중요한 번호는 별도로 메모해 두시길 권장합니다.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="data-3" className="border-none">
                <AccordionTrigger className="text-[#0f0f0f] dark:text-[#f1f1f1] hover:no-underline hover:text-green-600 dark:hover:text-green-400 text-left">
                  '추첨 대기' 상태는 무엇인가요?
                </AccordionTrigger>
                <AccordionContent className="text-[#606060] dark:text-[#aaaaaa] leading-relaxed">
                  번호를 저장할 당시 해당 회차의 당첨 번호가 아직 발표되지 않았음을 의미합니다. 추첨일(토요일) 이후 사이트에 다시 접속하시면 자동으로 당첨 결과를 확인하실 수 있습니다.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>

      {/* 하단 문의 안내 */}
      <div className="bg-blue-50 dark:bg-[#1e1e1e] p-4 rounded-lg flex items-center justify-center gap-3 text-sm text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-[#3f3f3f] mt-8">
        <Calculator className="w-5 h-5 flex-shrink-0" />
        <p>
          더 궁금한 점이 있으신가요? 페이지 하단의 <strong className="font-semibold text-blue-800 dark:text-blue-300">문의하기</strong>를 이용해 주세요.
        </p>
      </div>
    </div>
  )
}