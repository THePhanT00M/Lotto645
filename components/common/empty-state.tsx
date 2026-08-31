import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  message: string
}

/** 목록이 비었을 때 보여주는 안내 영역. */
export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
      <div className="bg-panel border-line flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
        <Icon className="mb-4 h-12 w-12 text-gray-300 dark:text-[#3f3f3f]" />
        <p className="text-ink-muted text-lg font-medium">{message}</p>
      </div>
  )
}
