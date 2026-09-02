"use client"

import { Calculator, HelpCircle } from "lucide-react"
import { useTranslation } from "@/components/i18n/locale-provider"
import { PageHeader } from "@/components/common/page-header"
import { Panel, Surface } from "@/components/common/panel"
import { FAQ_SECTIONS, type FaqSection } from "@/components/faq/faq-data"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * 자주 묻는 질문
 *
 * 질문과 답은 문구 사전에 두고, 이 화면은 어느 묶음을 어떻게 그릴지만 맡는다.
 */
export default function FaqPage() {
  const { t } = useTranslation()

  return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader icon={HelpCircle} title={t.faq.title} description={t.faq.description} />

        <Tabs defaultValue={FAQ_SECTIONS[0].key} className="space-y-4">
          <TabsList className="border-line grid w-full grid-cols-3 rounded-lg border bg-gray-100 p-1 dark:bg-[#0f0f0f]">
            {FAQ_SECTIONS.map((section) => (
                <TabsTrigger
                    key={section.key}
                    value={section.key}
                    className="text-ink-muted data-[state=active]:text-ink rounded-md font-medium transition-colors data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#272727]"
                >
                  {t.faq[section.key].tabLabel}
                </TabsTrigger>
            ))}
          </TabsList>

          {FAQ_SECTIONS.map((section) => (
              <TabsContent key={section.key} value={section.key}>
                <FaqPanel section={section} />
              </TabsContent>
          ))}
        </Tabs>

        <div className="border-accent-line bg-accent-soft text-accent mt-8 flex items-center justify-center gap-3 rounded-lg border p-4 text-sm">
          <Calculator className="h-5 w-5 flex-shrink-0" />
          <p>{t.faq.contactHint}</p>
        </div>
      </div>
  )
}

function FaqPanel({ section }: { section: FaqSection }) {
  const { t } = useTranslation()
  const { title, items } = t.faq[section.key]
  const Icon = section.icon

  return (
      <Panel className="space-y-4">
        <h2 className="text-ink flex items-center gap-2 font-semibold">
          <Icon className={`h-5 w-5 ${section.accentClass}`} />
          {title}
        </h2>

        <Surface>
          <Accordion type="single" collapsible className="w-full">
            {items.map((item, index) => (
                <AccordionItem
                    key={item.question}
                    value={`${section.key}-${index}`}
                    className="border-line last:border-b-0"
                >
                  <AccordionTrigger className="text-ink text-left text-sm font-semibold hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-ink-muted text-sm leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        </Surface>
      </Panel>
  )
}
