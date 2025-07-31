"use client"
import { Button } from "@/components/ui/button"
import { saveLottoResult } from "@/utils/lotto-storage"
import { useToast } from "@/hooks/use-toast"

interface SaveRecommendationButtonProps {
  numbers: number[]
  isSaved: boolean
  onSave: () => void
}

export function SaveRecommendationButton({ numbers, isSaved, onSave }: SaveRecommendationButtonProps) {
  const { toast } = useToast()

  const handleSave = () => {
    if (numbers.length === 6) {
      saveLottoResult(numbers, true) // Pass true for isAiRecommended
      toast({
        title: "추천 번호 저장 완료",
        description: "AI 추천 번호가 기록에 저장되었습니다.",
      })
      onSave()
    }
  }

  if (isSaved) {
    return (
      <div className="text-sm text-green-600 flex items-center w-24 justify-end">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 mr-1"
        >
          <path d="M20 6 9 17l-5-5"></path>
        </svg>
        기록 저장됨
      </div>
    )
  }

  return (
    <Button onClick={handleSave} size="sm" className="bg-green-500 hover:bg-green-600">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-1"
      >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
      추천 번호 저장
    </Button>
  )
}
