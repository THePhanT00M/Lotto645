import Link from "next/link"
import { cn } from "@/lib/utils"

/** 로고가 놓이는 맥락 */
type LogoVariant = "default" | "inverse" | "auth"

interface LogoProps {
  variant?: LogoVariant
  className?: string
}

/** 서비스 로고. 인증 화면에서는 링크 없이 가운데 정렬로 쓴다. */
export default function Logo({ variant = "default", className }: LogoProps) {
  const mark = (
      <span
          className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              variant === "inverse" ? "bg-white" : "border-line bg-surface border",
              variant === "auth" ? "mx-auto mb-3" : "mr-3",
          )}
      >
        <span className={cn("h-4 w-4 rounded-sm", variant === "inverse" ? "bg-black" : "bg-black dark:bg-white")} />
      </span>
  )

  const title = (
      <h1
          className={cn(
              "text-xl font-semibold",
              variant === "inverse" ? "text-white" : "text-black dark:text-white",
          )}
      >
        Lotto645
      </h1>
  )

  if (variant === "auth") {
    return (
        <div className={cn("text-center", className)}>
          {mark}
          {title}
        </div>
    )
  }

  return (
      <Link href="/" className={cn("flex items-center", className)}>
        {mark}
        {title}
      </Link>
  )
}
