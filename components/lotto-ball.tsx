"use client"

import { getBallColor } from "@/utils/lotto-utils"

interface LottoBallProps {
  number: number
  customSize?: string
  onClick?: () => void
  isSelected?: boolean
  isDisabled?: boolean
}

export default function LottoBall({
  number,
  customSize = "w-12 h-12",
  onClick,
  isSelected = false,
  isDisabled = false,
}: LottoBallProps) {
  const ballColor = getBallColor(number)

  const baseClasses = `${customSize} rounded-full flex items-center justify-center flex-shrink-0 font-bold transition-all duration-200 select-none`
  const interactiveClasses = onClick
    ? isDisabled
      ? "opacity-40 cursor-not-allowed"
      : isSelected
        ? "ring-4 ring-offset-2 ring-offset-white ring-blue-500 cursor-pointer"
        : "hover:scale-105 cursor-pointer"
    : ""

  return (
    <div
      className={`${baseClasses} ${interactiveClasses}`}
      style={{ backgroundColor: ballColor }}
      onClick={isDisabled ? undefined : onClick}
      role={onClick ? "button" : undefined}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
    >
      <span className="text-black text-lg">{number}</span>
    </div>
  )
}
