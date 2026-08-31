import type { LucideIcon } from "lucide-react"
import { Panel } from "@/components/common/panel"

interface StatTileProps {
  icon: LucideIcon
  label: string
  value: string
  valueClass?: string
  hint?: string
}

/** 상단 요약 수치 한 칸. */
export function StatTile({ icon: Icon, label, value, valueClass = "text-ink", hint }: StatTileProps) {
  return (
      <Panel>
        <div className="text-ink-muted flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4" />
          {label}
        </div>
        <div className={`mt-3 text-3xl font-bold ${valueClass}`}>{value}</div>
        {hint && <p className="text-ink-muted mt-1 text-xs">{hint}</p>}
      </Panel>
  )
}
