"use client"

import { cva, type VariantProps } from "class-variance-authority"
import type { ReactNode } from "react"
import { getBallColor } from "@/lib/lotto/colors"
import { cn } from "@/lib/utils"

const ball = cva(
    "relative flex flex-shrink-0 items-center justify-center rounded-full font-bold text-black select-none",
    {
      variants: {
        size: {
          xs: "h-7 w-7 text-xs",
          sm: "h-8 w-8 text-xs",
          md: "h-10 w-10 text-sm",
          lg: "h-12 w-12 text-lg",
          /** 화면 크기에 따라 커지는 결과 표시용 */
          responsive: "h-10 w-10 text-sm sm:h-12 sm:w-12 sm:text-base",
          /** 컨테이너 폭을 채우는 정사각형. 그리드 안에서 사용한다. */
          fluid: "aspect-square w-full text-xs sm:text-sm",
        },
        interactive: {
          true: "cursor-pointer transition-transform hover:scale-105",
          false: "",
        },
      },
      defaultVariants: { size: "md", interactive: false },
    },
)

interface BallProps extends VariantProps<typeof ball> {
  number: number
  className?: string
  onClick?: () => void
  disabled?: boolean
  selected?: boolean
  /** 우상단에 겹쳐 표시할 배지 (고정·제외 표시 등) */
  badge?: ReactNode
}

/** 번호 하나를 나타내는 공. 번호 구간에 따라 배경색이 정해진다. */
export function Ball({ number, size, className, onClick, disabled, selected, badge }: BallProps) {
  const content = (
      <>
        {number}
        {badge}
      </>
  )

  const classes = cn(
      ball({ size, interactive: Boolean(onClick) && !disabled }),
      disabled && "cursor-not-allowed opacity-40",
      selected && "ring-4 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-black",
      className,
  )
  const style = { backgroundColor: getBallColor(number) }

  if (!onClick) {
    return (
        <div className={classes} style={style}>
          {content}
        </div>
    )
  }

  return (
      <button type="button" className={classes} style={style} onClick={onClick} disabled={disabled} aria-pressed={selected}>
        {content}
      </button>
  )
}

/** 공 위에 얹는 작은 상태 배지 (자물쇠, 체크 등). */
export function BallBadge({ className, children }: { className?: string; children: ReactNode }) {
  return (
      <span
          className={cn(
              "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-white",
              className,
          )}
      >
        {children}
      </span>
  )
}

/** 아직 번호가 정해지지 않은 자리. */
export function EmptyBall({ size, className }: Pick<BallProps, "size" | "className">) {
  return (
      <div
          className={cn(ball({ size }), "border-2 border-dashed border-gray-300 bg-transparent dark:border-[#3f3f3f]", className)}
          aria-hidden
      />
  )
}
