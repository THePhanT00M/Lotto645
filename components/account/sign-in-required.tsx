import { LogIn } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

/** 로그인이 필요한 화면에 들어왔을 때 보여주는 안내. */
export default function SignInRequired() {
  return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <div className="bg-accent-soft mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <LogIn className="text-accent h-8 w-8" />
        </div>

        <h1 className="text-ink text-2xl font-bold">로그인이 필요합니다</h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          계정 정보를 보려면 먼저 로그인해 주세요.
        </p>

        <div className="mt-6 flex gap-2">
          <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
            <Link href="/login">로그인</Link>
          </Button>
          <Button asChild variant="outline" className="bg-surface border-line">
            <Link href="/">홈으로</Link>
          </Button>
        </div>
      </div>
  )
}
