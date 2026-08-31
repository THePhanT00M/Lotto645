import { Trophy } from "lucide-react"
import { DrawListSkeleton } from "@/components/winning/draw-list"
import { Skeleton } from "@/components/ui/skeleton"

/** 당첨번호 페이지 초기 로딩 화면. 실제 레이아웃과 같은 골격을 유지한다. */
export default function WinningSkeleton() {
  return (
      <div className="container mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-5 w-64" />
        </div>

        <div className="bg-panel border-line relative overflow-hidden rounded-xl border p-5 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute top-0 right-0 p-4 opacity-5">
            <Trophy className="h-32 w-32" />
          </div>
          <div className="mb-8 flex items-center justify-between">
            <Skeleton className="h-10 w-24 rounded-md" />
            <div className="flex flex-col items-center">
              <Skeleton className="mb-2 h-9 w-24" />
              <Skeleton className="h-8 w-32 rounded-full" />
            </div>
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
          <div className="mx-auto flex w-full max-w-md justify-center gap-3">
            {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} className="aspect-square w-full max-w-11 rounded-full" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <Skeleton className="h-[122px] rounded-xl" />
            <Skeleton className="h-[260px] rounded-xl" />
          </div>
          <div className="lg:col-span-2">
            <div className="bg-panel border-line flex h-[650px] flex-col rounded-xl border">
              <div className="border-line flex h-[69px] items-center border-b p-4">
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex-1 overflow-hidden p-2">
                <DrawListSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
