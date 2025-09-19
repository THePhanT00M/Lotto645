import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Large 404 number */}
        <div className="text-8xl font-bold text-blue-600 mb-4">404</div>

        {/* Error message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h1>

        <p className="text-gray-600 text-lg mb-8">요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.</p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/" className="text-white">홈으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
