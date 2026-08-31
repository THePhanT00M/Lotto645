"use client"

import { Check, Lock, X } from "lucide-react"
import { BallBadge } from "@/components/lotto/ball"
import { getBallColor } from "@/lib/lotto/colors"
import { ALL_NUMBERS } from "@/lib/lotto/constants"
import { cn } from "@/lib/utils"

interface NumberGridProps {
  selected: readonly number[]
  fixed: readonly number[]
  excluded: readonly number[]
  onToggle: (number: number) => void
  isDisabled: (number: number) => boolean
}

/** 1~45 번호판. 선택·고정·제외 상태를 색과 배지로 구분한다. */
export default function NumberGrid({ selected, fixed, excluded, onToggle, isDisabled }: NumberGridProps) {
  return (
      <div className="grid grid-cols-5 place-items-center gap-2 sm:grid-cols-9 sm:gap-3">
        {ALL_NUMBERS.map((number) => {
          const isFixed = fixed.includes(number)
          const isExcluded = excluded.includes(number)
          const isSelected = selected.includes(number)
          // 고정·제외는 자체 색을 쓰고, 순수 선택만 공 색상으로 채운다.
          const isPlainSelected = isSelected && !isFixed

          return (
              <button
                  key={number}
                  type="button"
                  onClick={() => onToggle(number)}
                  disabled={isDisabled(number)}
                  className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all sm:text-base",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      stateClass({ isFixed, isExcluded, isPlainSelected }),
                  )}
                  style={isPlainSelected ? { backgroundColor: getBallColor(number) } : undefined}
              >
                {number}
                {isFixed && (
                    <BallBadge className="bg-green-500">
                      <Lock className="h-2.5 w-2.5" />
                    </BallBadge>
                )}
                {isExcluded && (
                    <BallBadge className="bg-red-500">
                      <X className="h-2.5 w-2.5" />
                    </BallBadge>
                )}
                {isPlainSelected && (
                    <BallBadge className="bg-blue-600">
                      <Check className="h-2.5 w-2.5" />
                    </BallBadge>
                )}
              </button>
          )
        })}
      </div>
  )
}

const stateClass = ({
                      isFixed,
                      isExcluded,
                      isPlainSelected,
                    }: {
  isFixed: boolean
  isExcluded: boolean
  isPlainSelected: boolean
}) => {
  if (isFixed) return "bg-green-200 dark:bg-green-900/50"
  if (isExcluded) return "bg-red-200 dark:bg-red-900/50"
  if (isPlainSelected) return "text-black"
  return "bg-surface text-ink hover:bg-gray-200 dark:hover:bg-[#646464]"
}
