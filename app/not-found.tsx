import Link from "next/link"
import { Button } from "@/components/ui/button"

/** 존재하지 않는 주소로 들어왔을 때 보여주는 화면. */
export default function NotFound() {
  return (
      <div className="bg-canvas flex min-h-screen flex-col items-center justify-center px-4 transition-colors">
        <div className="flex w-full max-w-lg flex-col items-center text-center">
          <h1 className="mb-6 text-[120px] leading-none font-black tracking-tighter text-gray-100 select-none sm:text-[150px] dark:text-[#272727]">
            404
          </h1>

          <div className="relative z-10 space-y-6">
            <div className="space-y-3">
              <h2 className="text-ink text-2xl font-bold">페이지를 찾을 수 없습니다.</h2>
              <p className="text-ink-muted text-[15px] leading-relaxed font-medium">
                요청하신 주소가 올바르지 않거나 삭제되었습니다.
              </p>
            </div>

            <Button
                asChild
                className="h-11 rounded-full bg-[#0f0f0f] px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#272727] dark:bg-white dark:text-[#0f0f0f] dark:hover:bg-[#e5e5e5]"
            >
              <Link href="/">홈으로 이동</Link>
            </Button>
          </div>
        </div>
      </div>
  )
}
