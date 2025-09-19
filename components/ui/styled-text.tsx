import type React from "react"
import { cn } from "@/lib/utils"

interface StyledTextProps {
  children: React.ReactNode
  className?: string
  variant?: "body" | "caption" | "heading"
}

export function StyledText({ children, className, variant = "body" }: StyledTextProps) {
  const baseStyles = {
    body: "text-sm text-gray-700 dark:text-gray-200 mb-2",
    caption: "text-md font-medium text-gray-400 dark:text-gray-400 mb-2",
    heading: "text-xl font-semibold text-gray-800 dark:text-white",
  }

  return <p className={cn(baseStyles[variant], className)}>{children}</p>
}

interface StyledCardProps {
  children: React.ReactNode
  className?: string
}

export function StyledCard({ children, className }: StyledCardProps) {
  return <div className={cn("bg-white dark:bg-[rgb(38,38,38)] rounded-lg p-4", className)}>{children}</div>
}

interface StyledContainerProps {
  children: React.ReactNode
  className?: string
}

export function StyledContainer({ children, className }: StyledContainerProps) {
  return <div className={cn("bg-gray-100 dark:bg-[rgb(26,26,26)] rounded-xl p-4 sm:p-6", className)}>{children}</div>
}
