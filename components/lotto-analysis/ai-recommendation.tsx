"use client"

import { Sparkles } from "lucide-react"

export default function AIRecommendation() {
  return (
    <div className="p-4 bg-gray-200 dark:bg-[rgb(36,36,36)] rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-gray-800 dark:text-gray-200">AI 번호 추천</h3>
        </div>
      </div>
    </div>
  )
}
