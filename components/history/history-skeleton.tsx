import { Skeleton } from "@/components/ui/skeleton"

/** 기록 목록을 불러오는 동안 보여주는 자리표시자. */
export default function HistorySkeleton() {
  return (
      <div className="container mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="bg-panel border-line space-y-4 rounded-xl border p-6">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-7 w-20" />
                </div>
                <div className="flex w-full max-w-xs justify-center gap-3">
                  {Array.from({ length: 6 }, (_, j) => (
                      <Skeleton key={j} className="aspect-square w-full max-w-10 rounded-full" />
                  ))}
                </div>
              </div>
          ))}
        </div>
      </div>
  )
}
