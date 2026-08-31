import { Hash } from "lucide-react"
import { Ball } from "@/components/lotto/ball"
import { Panel } from "@/components/common/panel"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FrequencyEntry {
  number: number
  count: number
}

interface PendingFrequencyProps {
  title: string
  description: string
  entries: FrequencyEntry[]
  iconClass: string
}

/** 결과를 기다리는 번호들의 출현 빈도 목록. */
export default function PendingFrequency({ title, description, entries, iconClass }: PendingFrequencyProps) {
  return (
      <Panel className="flex flex-col p-0">
        <div className="border-line border-b p-5">
          <h3 className="text-ink flex items-center gap-2 text-lg font-bold">
            <Hash className={`h-5 w-5 ${iconClass}`} />
            {title}
          </h3>
          <p className="text-ink-muted mt-1 text-sm">{description}</p>
        </div>

        <ScrollArea className="h-[300px] w-full p-4">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
            {entries.length === 0 ? (
                <p className="text-ink-muted col-span-full py-4 text-center text-sm">데이터가 없습니다.</p>
            ) : (
                entries.map(({ number, count }) => (
                    <div
                        key={number}
                        className="bg-surface border-line flex flex-col items-center gap-1 rounded-lg border p-2 shadow-sm"
                    >
                      <Ball number={number} size="sm" className="shadow-sm" />
                      <span className="text-ink-muted text-xs font-medium">{count}회</span>
                    </div>
                ))
            )}
          </div>
        </ScrollArea>
      </Panel>
  )
}
