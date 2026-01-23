import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
      // 전체 배경: 유튜브 라이트(흰색) / 다크(#0F0F0F) 적용
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white dark:bg-[#0f0f0f] transition-colors">
        <div className="flex flex-col items-center max-w-lg w-full text-center">
          <h1 className="mb-6 text-[120px] sm:text-[150px] font-black leading-none text-gray-100 dark:text-[#272727] select-none tracking-tighter">
            404
          </h1>

          <div className="space-y-6 relative z-10">
            {/* 메인 텍스트 메시지 */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                페이지를 찾을 수 없습니다.
              </h2>
              {/* 유튜브 보조 텍스트 색상(#606060 / #AAAAAA) 적용 */}
              <p className="text-[15px] text-[#606060] dark:text-[#aaaaaa] leading-relaxed font-medium">
                요청하신 주소가 올바르지 않거나 삭제되었습니다.
              </p>
            </div>

            <div className="pt-2">
              <Button
                  asChild
                  className="rounded-full px-8 h-11 font-semibold text-sm bg-[#0f0f0f] text-white hover:bg-[#272727] dark:bg-white dark:text-[#0f0f0f] dark:hover:bg-[#e5e5e5] transition-all shadow-sm"
              >
                <Link href="/">홈으로 이동</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
  )
}