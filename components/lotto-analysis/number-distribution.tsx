"use client"

import { PieChart } from "lucide-react"
import type { CommonProps } from "./types"

interface NumberDistributionProps extends CommonProps {
  numbers: number[]
}

export default function NumberDistribution({ numbers, getBallColor }: NumberDistributionProps) {
  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center mb-3">
        <PieChart className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="font-medium text-gray-800">번호 분포 시각화</h3>
      </div>
      <div className="h-8 bg-gray-200 rounded-full overflow-hidden flex">
        {(() => {
          const ranges = [
            { name: "1-10", count: 0, color: "#fbc400" },
            { name: "11-20", count: 0, color: "#69c8f2" },
            { name: "21-30", count: 0, color: "#ff7272" },
            { name: "31-40", count: 0, color: "#aaa" },
            { name: "41-45", count: 0, color: "#b0d840" },
          ]

          numbers.forEach((num) => {
            if (num >= 1 && num <= 10) ranges[0].count++
            else if (num >= 11 && num <= 20) ranges[1].count++
            else if (num >= 21 && num <= 30) ranges[2].count++
            else if (num >= 31 && num <= 40) ranges[3].count++
            else if (num >= 41 && num <= 45) ranges[4].count++
          })

          return ranges.map((range, index) => (
            <div
              key={index}
              className="h-full flex items-center justify-center text-xs font-medium text-white"
              style={{
                width: `${(range.count / 6) * 100}%`,
                backgroundColor: range.color,
                display: range.count > 0 ? "flex" : "none",
              }}
            >
              {range.count > 0 && `${range.name}: ${range.count}`}
            </div>
          ))
        })()}
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1 text-xs text-center">
        <div className="text-[#fbc400] font-medium">1-10</div>
        <div className="text-[#69c8f2] font-medium">11-20</div>
        <div className="text-[#ff7272] font-medium">21-30</div>
        <div className="text-[#aaa] font-medium">31-40</div>
        <div className="text-[#b0d840] font-medium">41-45</div>
      </div>
    </div>
  )
}
