import type { ComponentPropsWithoutRef } from "react"
import { cn } from "@/lib/utils"

/**
 * 페이지를 구성하는 기본 카드.
 *
 * `bg-gray-100 dark:bg-[#1e1e1e] rounded-xl p-5 border ...` 조합이
 * 20곳 넘게 반복되던 것을 한 컴포넌트로 모았다.
 */
export function Panel({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("bg-panel border-line rounded-xl border p-5", className)} {...props} />
}

/** 패널 위에 한 단계 더 얹는 카드. */
export function Surface({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("bg-surface border-line rounded-lg border p-4", className)} {...props} />
}
