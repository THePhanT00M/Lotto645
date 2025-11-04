import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-gray-100 dark:bg-[rgb(26,26,26)]", // 1. 스켈레톤 기본 배경색 (light: gray-100, dark: gray-800)
        "relative overflow-hidden", // 2. 자식(before) 요소를 가두기 위함

        // 3. Shimmer 효과를 위한 가상 요소 (왼쪽->오른쪽으로 이동하는 빛)
        "before:absolute before:inset-0",

        // [수정] 빛의 그라데이션 정의
        // (Light 모드): 반투명한 흰색을 사용
        "before:bg-gradient-to-r before:from-transparent before:via-black/7 before:to-transparent",
        // (Dark 모드): 반투명한 밝은 회색을 사용
        "dark:before:via-white/10",

        // 4. 애니메이션 속성
        "before:bg-[length:200%_100%]", // 그라데이션 크기를 2배로
        "before:bg-no-repeat",
        "before:animate-shimmer", // tailwind.config.ts에 정의된 shimmer 애니메이션

        className
      )}
      {...props}
    />
  )
}

export { Skeleton }