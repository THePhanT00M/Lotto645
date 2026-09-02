import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * 실제 글줄이 차지하는 높이.
 *
 * 막대 높이만 맞추면 줄 간격만큼 짧아져 자리표시가 결과보다 낮게 잡히고,
 * 데이터가 들어오는 순간 화면이 밀린다. 줄 높이는 실제 글자와 같게 두고
 * 그 안에 막대를 가운데로 놓는다.
 */
export const LINE = {
  /** text-xs */
  xs: "h-4",
  /** text-xs leading-relaxed */
  xsRelaxed: "h-[19.5px]",
  /** text-sm */
  sm: "h-5",
  /** text-sm leading-relaxed */
  smRelaxed: "h-[22.75px]",
  /** text-xl */
  xl: "h-7",
  /** text-3xl */
  xl3: "h-9",
} as const

/** narrowWidths 로 넣은 줄을 감추기 시작하는 지점 */
const NARROW_HIDDEN = {
  md: "md:hidden",
  lg: "lg:hidden",
} as const

const ALIGN = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
} as const

interface SkeletonLineProps {
  /** 막대 너비 (Tailwind 클래스) */
  width: string
  /** 한 줄이 차지하는 높이 */
  line?: string
  /** 줄 안에 놓는 막대 높이 */
  bar?: string
  align?: keyof typeof ALIGN
  className?: string
}

/** 글줄 한 칸. */
export function SkeletonLine({ width, line = LINE.xs, bar = "h-3", align = "start", className }: SkeletonLineProps) {
  return (
      <div className={cn("flex items-center", line, ALIGN[align], className)}>
        <Skeleton className={cn(bar, width)} />
      </div>
  )
}

interface SkeletonLinesProps {
  /** 줄마다의 막대 너비. 조금씩 달리해야 글줄처럼 보인다. */
  widths: readonly string[]
  /**
   * 좁은 화면에서만 늘어나는 줄.
   *
   * 같은 문장이라도 폭이 좁으면 더 여러 줄로 감긴다. 넓은 화면 기준으로만
   * 잡아 두면 모바일에서 자리표시가 짧아져 결과가 들어올 때 화면이 밀린다.
   */
  narrowWidths?: readonly string[]
  /** 좁은 줄이 사라지는 지점. 문장 길이에 따라 다시 감기지 않는 폭이 다르다. */
  narrowUntil?: keyof typeof NARROW_HIDDEN
  line?: string
  bar?: string
  className?: string
}

/** 문단 자리. */
export function SkeletonLines({
                                widths,
                                narrowWidths = [],
                                narrowUntil = "lg",
                                line,
                                bar,
                                className,
                              }: SkeletonLinesProps) {
  return (
      <div className={className}>
        {widths.map((width, index) => (
            <SkeletonLine key={index} width={width} line={line} bar={bar} />
        ))}
        {narrowWidths.map((width, index) => (
            <SkeletonLine key={`narrow-${index}`} width={width} line={line} bar={bar} className={NARROW_HIDDEN[narrowUntil]} />
        ))}
      </div>
  )
}
