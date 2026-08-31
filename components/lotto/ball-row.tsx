import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { Ball, EmptyBall } from "./ball"

type BallSize = ComponentProps<typeof Ball>["size"]

interface BallRowProps {
  numbers: readonly number[]
  size?: BallSize
  /** 함께 표시할 보너스 번호. 지정하면 "+" 구분자와 함께 뒤에 붙는다. */
  bonusNo?: number
  /** 이 개수에 못 미치는 만큼 빈 자리를 채운다. */
  slots?: number
  className?: string
  ballClassName?: string
}

/** 번호 여러 개를 한 줄로 늘어놓는다. 당첨 번호·추첨 결과 표시에 공통으로 쓴다. */
export function BallRow({ numbers, size = "md", bonusNo, slots, className, ballClassName }: BallRowProps) {
  const emptyCount = slots ? Math.max(0, slots - numbers.length) : 0

  return (
      <div className={cn("flex flex-nowrap items-center justify-center gap-2", className)}>
        {numbers.map((number) => (
            <Ball key={number} number={number} size={size} className={ballClassName} />
        ))}

        {Array.from({ length: emptyCount }, (_, index) => (
            <EmptyBall key={`empty-${index}`} size={size} className={ballClassName} />
        ))}

        {bonusNo !== undefined && (
            <>
              <span className="text-ink-muted mx-1 font-medium">+</span>
              <Ball number={bonusNo} size={size} className={ballClassName} />
            </>
        )}
      </div>
  )
}
