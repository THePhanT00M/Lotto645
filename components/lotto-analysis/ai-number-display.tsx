"use client"

import { getBallColor } from "@/utils/lotto-utils"

interface AINumberDisplayProps {
  numbers: number[]
  title?: string
}

export default function AINumberDisplay({ numbers, title }: AINumberDisplayProps) {
  if (numbers.length === 0) return null

  const sortedNumbers = [...numbers].sort((a, b) => a - b)

  return (
    <div className="pt-4 pb-4 pl-2 pr-2 bg-gray-100 dark:bg-[#363636] rounded-lg">
      <div className="flex max-w-xs mx-auto gap-2">
        {sortedNumbers.map((number) => (
          <div
            key={number}
            className="w-full aspect-[1/1] rounded-full flex items-center justify-center text-black font-bold text-sm sm:text-base"
            style={{ backgroundColor: getBallColor(number) }}
          >
            {number}
          </div>
        ))}
      </div>
    </div>
  )
}
