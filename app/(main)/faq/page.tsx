"use client"

import { Calculator, HelpCircle } from "lucide-react"
import { PageHeader } from "@/components/common/page-header"
import { Panel } from "@/components/common/panel"
import { FAQ_SECTIONS, type FaqSection } from "@/components/faq/faq-data"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * 자주 묻는 질문
 *
 * 질문 내용은 `faq-data.ts`에 모아 두고 이 화면은 렌더링만 담당한다.
 */
export default function FaqPage() {
  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
            icon={HelpCircle}
            title="자주 묻는 질문 (FAQ)"
            description="Lotto645 서비스 이용에 대한 궁금증을 해결해 드립니다."
        />

        <Tabs defaultValue={FAQ_SECTIONS[0].value} className="space-y-4">
          <TabsList className="border-line grid w-full grid-cols-3 rounded-lg border bg-gray-100 p-1 dark:bg-[#0f0f0f]">
            {FAQ_SECTIONS.map((section) => (
                <TabsTrigger
                    key={section.value}
                    value={section.value}
                    className="text-ink-muted data-[state=active]:text-ink rounded-md font-medium transition-colors data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#272727]"
                >
                  {section.tabLabel}
                </TabsTrigger>
            ))}
          </TabsList>

          {FAQ_SECTIONS.map((section) => (
              <TabsContent key={section.value} value={section.value}>
                <FaqPanel section={section} />
              </TabsContent>
          ))}
        </Tabs>

        <div className="border-accent-line bg-accent-soft text-accent mt-8 flex items-center justify-center gap-3 rounded-lg border p-4 text-sm">
          <Calculator className="h-5 w-5 flex-shrink-0" />
          <p>
            더 궁금한 점이 있으신가요? 페이지 하단의 <strong className="font-semibold">문의하기</strong>를 이용해 주세요.
          </p>
        </div>
      </div>
  )
}

function FaqPanel({ section }: { section: FaqSection }) {
  const { icon: Icon, accentClass } = section

  return (
      <Panel>
        <div className="mb-4 flex items-center gap-2">
          <Icon className={`h-5 w-5 ${accentClass}`} />
          <h2 className="text-ink text-lg font-bold">{section.title}</h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {section.items.map((item, index) => (
              <AccordionItem
                  key={item.question}
                  value={`${section.value}-${index}`}
                  className={index === section.items.length - 1 ? "border-none" : "border-line border-b"}
              >
                <AccordionTrigger className="text-ink text-left hover:no-underline">{item.question}</AccordionTrigger>
                <AccordionContent className="text-ink-muted space-y-2 leading-relaxed">
                  {item.answer.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                  ))}
                </AccordionContent>
              </AccordionItem>
          ))}
        </Accordion>
      </Panel>
  )
}
