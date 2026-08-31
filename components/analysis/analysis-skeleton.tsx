import { Skeleton } from "@/components/ui/skeleton"

/** 분석 데이터를 불러오는 동안 실제 레이아웃과 같은 자리를 잡아 둔다. */
export function AnalysisSkeleton() {
  return (
      <div className="space-y-6">
        <div className="bg-surface space-y-4 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="bg-surface-2 space-y-3 rounded-lg p-4">
            <Skeleton className="h-5 w-full max-w-sm" />
            <BallRowSkeleton />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-10 w-36 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>

        <div className="bg-surface space-y-3 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-48 rounded-md" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
  )
}

/** 공 6개 자리를 잡는 스켈레톤. */
export function BallRowSkeleton({ count = 6 }: { count?: number }) {
  return (
      <div className="mx-auto flex max-w-xs gap-2">
        {Array.from({ length: count }, (_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-full" />
        ))}
      </div>
  )
}
