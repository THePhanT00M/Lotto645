import { useTranslation } from "@/components/i18n/locale-provider"
import { Panel } from "@/components/common/panel"
import { LINE, SkeletonLine, SkeletonLines } from "@/components/common/skeleton-text"
import { Skeleton } from "@/components/ui/skeleton"
import { PICK_COUNT } from "@/lib/lotto/constants"
import { FEATURE_KEYS } from "@/lib/lotto/features"
import { cn } from "@/lib/utils"

/** 자리표시로 보여줄 기록 개수. 첫 화면에 들어오는 만큼만 잡는다. */
const RECORD_PLACEHOLDERS = 5

/**
 * AI 추천 데이터 화면 자리표시
 *
 * 실제 화면과 같은 컨테이너(Panel)·같은 여백으로 그린다. 큰 사각형으로 때우면
 * 데이터가 들어오는 순간 높이가 튀어 화면이 흔들린다. 분포 막대와 특징 평균은
 * 항목 수가 데이터와 무관하게 정해져 있으므로 실제 개수만큼 그대로 잡는다.
 */
export default function AiLabSkeleton() {
  const { t } = useTranslation()

  return (
      <div
          role="status"
          aria-label={t.admin.aiLab.loading}
          className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col space-y-2">
            <div className="flex h-8 items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-6 w-44" />
            </div>
            <SkeletonLine width="w-80 max-w-full" line={LINE.sm} bar="h-3.5" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {["w-20", "w-16", "w-12", "w-24"].map((valueWidth) => (
              <Panel key={valueWidth}>
                <div className="flex h-5 items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-md" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
                <SkeletonLine className="mt-3" width={valueWidth} line={LINE.xl3} bar="h-7" />
                <SkeletonLine className="mt-1" width="w-24" />
              </Panel>
          ))}
        </div>

        {/* 채점된 기록이 하나도 없으면 실제로는 빠지는 블록이지만, 쌓인 데이터가 있는 쪽이 보통이다. */}
        <Panel className="space-y-4">
          <PanelHeading titleWidth="w-40" descriptionWidth="w-72" />

          <div className="space-y-3">
            {Array.from({ length: PICK_COUNT + 1 }, (_, index) => (
                <div key={index} className="flex items-center gap-3">
                  {/* 좌우 칸 너비는 실제와 같게 고정해야 가운데 막대 길이가 어긋나지 않는다. */}
                  <div className="w-16">
                    <Skeleton className="h-3.5 w-8" />
                  </div>
                  <Skeleton className="h-7 flex-1 rounded-full" />
                  <div className="flex w-32 justify-end">
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                </div>
            ))}
          </div>

          <SkeletonLine width="w-56 max-w-full" />
        </Panel>

        <Panel className="space-y-4">
          <SkeletonLine width="w-24" line={LINE.xl} bar="h-5" />
          <SkeletonLine width="w-64 max-w-full" line={LINE.sm} bar="h-3.5" />

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {FEATURE_KEYS.map((key) => (
                <div key={key} className={cn("flex items-center justify-between gap-2", LINE.sm)}>
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-10" />
                </div>
            ))}
          </dl>
        </Panel>

        <Panel className="space-y-4">
          <PanelHeading titleWidth="w-24" descriptionWidth="w-64" />

          <div className="space-y-2">
            {Array.from({ length: RECORD_PLACEHOLDERS }, (_, index) => (
                <RecordRowSkeleton key={index} />
            ))}
          </div>
        </Panel>

        <div className="bg-accent-soft border-accent-line flex items-start gap-3 rounded-lg border p-4">
          <Skeleton className="mt-0.5 h-5 w-5 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-1">
            <SkeletonLine width="w-28" line={LINE.sm} bar="h-3.5" />

            {/* 목록 항목 하나가 한 덩어리다. 줄 사이는 붙고 항목 사이에만 간격이 있다. */}
            <div className="space-y-1">
              <SkeletonLines line={LINE.sm} bar="h-3.5" widths={["w-full"]} narrowWidths={["w-3/5"]} narrowUntil="md" />
              <SkeletonLines line={LINE.sm} bar="h-3.5" widths={["w-11/12"]} />
              <SkeletonLines line={LINE.sm} bar="h-3.5" widths={["w-4/5"]} narrowWidths={["w-2/5"]} narrowUntil="md" />
            </div>
          </div>
        </div>
      </div>
  )
}

/** 패널 제목과 그 아래 한 줄 설명 */
function PanelHeading({ titleWidth, descriptionWidth }: { titleWidth: string; descriptionWidth: string }) {
  return (
      <div>
        <SkeletonLine width={titleWidth} line={LINE.xl} bar="h-5" />
        <SkeletonLine className="mt-1" width={`${descriptionWidth} max-w-full`} line={LINE.sm} bar="h-3.5" />
      </div>
  )
}

/** 접혀 있는 기록 한 줄. 펼치기 전 모습만 잡으면 된다. */
function RecordRowSkeleton() {
  return (
      <div className="bg-surface border-line rounded-lg border">
        <div className="flex w-full flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 shrink-0 rounded-md" />
            <Skeleton className="h-6 w-12 rounded-md" />
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: PICK_COUNT }, (_, index) => (
                  <Skeleton key={index} className="h-7 w-7 rounded-full" />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pl-7 sm:pl-0">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-[22px] w-20 rounded-md" />
          </div>
        </div>
      </div>
  )
}
