import { Panel } from "@/components/common/panel"
import { LINE, SkeletonLine } from "@/components/common/skeleton-text"
import { Skeleton } from "@/components/ui/skeleton"

/** 프로필을 불러오는 동안 실제 화면과 같은 골격으로 자리를 잡아 둔다. */
export default function ProfileSkeleton() {
  return (
      <div className="space-y-6">
        <div>
          <div className="flex h-8 items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-6 w-20" />
          </div>
          <SkeletonLine className="mt-1" width="w-64 max-w-full" line={LINE.sm} bar="h-3.5" />
        </div>

        <Panel className="overflow-hidden p-0">
          <Skeleton className="aspect-[5/1] w-full rounded-none" />

          <div className="px-5 pb-5">
            <div className="-mt-10 flex items-end justify-between gap-3">
              <Skeleton className="ring-panel h-20 w-20 shrink-0 rounded-full ring-4" />
              <div className="flex items-center gap-1.5 pb-1">
                <Skeleton className="h-[22px] w-12 rounded-md" />
                <Skeleton className="h-[22px] w-14 rounded-md" />
              </div>
            </div>

            <div className="mt-3">
              <SkeletonLine width="w-24" line={LINE.xl} bar="h-5" />
              <SkeletonLine width="w-52 max-w-full" line={LINE.sm} bar="h-3.5" />
              <SkeletonLine className="mt-1" width="w-28" />
            </div>

            <div className="border-line mt-5 space-y-5 border-t pt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {["nickname", "phone"].map((field) => (
                    <div key={field} className="space-y-1.5">
                      <SkeletonLine width="w-12" line={LINE.sm} bar="h-3.5" />
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Skeleton className="h-10 w-20 rounded-md" />
              </div>
            </div>
          </div>
        </Panel>
      </div>
  )
}
