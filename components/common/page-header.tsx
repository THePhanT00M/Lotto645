import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  description?: ReactNode
  /** 제목 우측에 배치할 액션 버튼 등 */
  actions?: ReactNode
}

/** 페이지 상단의 아이콘 + 제목 + 설명 블록. */
export function PageHeader({ icon: Icon, title, description, actions }: PageHeaderProps) {
  return (
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col space-y-2">
          <h1 className="text-ink flex items-center gap-2 text-2xl font-bold">
            <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {title}
          </h1>
          {description && <p className="text-ink-muted text-sm">{description}</p>}
        </div>
        {actions}
      </div>
  )
}

interface SectionHeadingProps {
  icon: LucideIcon
  title: string
  /** 제목 우측 컨트롤 */
  children?: ReactNode
}

/** 패널 안에서 쓰는 섹션 제목. */
export function SectionHeading({ icon: Icon, title, children }: SectionHeadingProps) {
  return (
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-ink text-lg font-bold">{title}</h2>
        </div>
        {children}
      </div>
  )
}
