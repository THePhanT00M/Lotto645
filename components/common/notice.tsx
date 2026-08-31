import { AlertTriangle } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

const TONE_STYLES = {
  info: "bg-accent-soft border-accent-line text-ink-muted",
  warning:
      "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200",
  danger:
      "bg-[#fff0f0] dark:bg-[#2a1515] border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400",
} as const

interface NoticeProps {
  title: string
  tone?: keyof typeof TONE_STYLES
  children: ReactNode
}

/** 주의사항·안내 문구 박스. */
export function Notice({ title, tone = "info", children }: NoticeProps) {
  return (
      <div className={cn("flex items-start gap-3 rounded-lg border p-4 text-sm", TONE_STYLES[tone])}>
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-ink font-semibold">{title}</p>
          {children}
        </div>
      </div>
  )
}
