import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white dark:bg-black">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6">
          <h1 className="text-9xl font-black text-gray-100 dark:text-white select-none">404</h1>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">페이지를 찾을 수 없습니다</h2>
            <p className="text-gray-500 dark:text-gray-400">요청하신 주소가 올바르지 않거나 삭제되었습니다.</p>
          </div>
          <Button asChild className="rounded-full px-8 h-12 bg-black text-white dark:bg-white dark:text-black">
            <Link href="/">홈으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
