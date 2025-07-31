"use client"
import { Button } from "@/components/ui/button"
import { Trash2, Calendar, Clock, Edit2, Check, X, MessageSquare, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { getBallColor } from "@/utils/lotto-utils"
import { Textarea } from "@/components/ui/textarea"
import type { LottoResult } from "@/types/lotto"

interface HistoryCardProps {
  result: LottoResult
  isEditing: boolean
  memoText: string
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onMemoChange: (text: string) => void
  onDelete: (id: string) => void
}

export function HistoryCard({
  result,
  isEditing,
  memoText,
  onEdit,
  onCancel,
  onSave,
  onMemoChange,
  onDelete,
}: HistoryCardProps) {
  const date = new Date(result.timestamp)
  const formattedDate = format(date, "yyyy년 MM월 dd일", { locale: ko })
  const formattedTime = format(date, "a h:mm", { locale: ko })

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center">
            <div className="flex items-center text-gray-500 text-sm mr-2">
              <Clock className="w-4 h-4 mr-1" />
              <span>{formattedTime}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(result.id)}
              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 h-auto"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* AI 추천 번호 표시 */}
        {result.isAiRecommended && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Sparkles className="w-3 h-3 mr-1" />
              AI 추천 번호
            </span>
          </div>
        )}

        <div className="flex flex-nowrap overflow-x-auto py-2 justify-center gap-4">
          {result.numbers.map((number) => (
            <div
              key={number}
              className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex-shrink-0 flex items-center justify-center text-black font-bold text-xs sm:text-sm md:text-lg shadow-md"
              style={{ backgroundColor: getBallColor(number) }}
            >
              {number}
            </div>
          ))}
        </div>

        {/* Memo Section */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                placeholder="메모를 입력하세요..."
                value={memoText}
                onChange={(e) => onMemoChange(e.target.value)}
                className="w-full text-sm resize-none min-h-[80px]"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={onCancel} className="text-gray-500 bg-transparent">
                  <X className="w-4 h-4 mr-1" />
                  취소
                </Button>
                <Button size="sm" onClick={onSave} className="bg-green-500 hover:bg-green-600">
                  <Check className="w-4 h-4 mr-1" />
                  저장
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {result.memo ? (
                <div className="flex justify-between items-start">
                  <div className="text-gray-700 text-sm bg-gray-50 p-3 rounded-md flex-1">{result.memo}</div>
                  <Button variant="ghost" size="sm" onClick={onEdit} className="ml-2 text-gray-400 hover:text-gray-600">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="text-gray-400 hover:text-gray-600 w-full justify-center"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  메모 추가하기
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
