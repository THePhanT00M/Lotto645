"use client"

import { Button } from "@/components/ui/button"
import { Calendar, Search } from "lucide-react"
import Link from "next/link"

type EmptyHistoryProps = {}

export function EmptyHistory({}: EmptyHistoryProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Calendar className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">추첨 기록이 없습니다</h2>
      <p className="text-gray-500 mb-6">로또 번호를 추첨하면 여기에 자동으로 기록됩니다.</p>
      <Link href="/">
        <Button className="bg-blue-500 hover:bg-blue-600 px-6">로또 추첨하러 가기</Button>
      </Link>
    </div>
  )
}

interface NoFilterResultsProps {
  onClearFilters: () => void
}

export function NoFilterResults({ onClearFilters }: NoFilterResultsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Search className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">검색 결과가 없습니다</h2>
      <p className="text-gray-500 mb-6">현재 필터 조건에 맞는 추첨 기록이 없습니다.</p>
      <Button onClick={onClearFilters} className="bg-blue-500 hover:bg-blue-600 px-6">
        필터 초기화
      </Button>
    </div>
  )
}

type LoadingStateProps = {}

export function LoadingState({}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500">기록을 불러오는 중...</p>
    </div>
  )
}
