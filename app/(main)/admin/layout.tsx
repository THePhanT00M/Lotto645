import { ShieldAlert } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { getAdminAccess } from "@/lib/auth/admin"

/**
 * 관리자 화면 공통 레이아웃
 *
 * 하위 화면은 전체 사용자의 기록과 발송 기능을 다루므로, 여기서 한 번에
 * 등급을 확인하고 미달이면 화면 자체를 그리지 않는다. 개별 화면이 각자
 * 검사하면 새 화면을 추가할 때 빠뜨리기 쉽다.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const access = await getAdminAccess()

  if (access.status !== "ok") return <AccessDenied signedIn={access.status === "denied"} />

  return <>{children}</>
}

/** 로그인한 사람에게는 로그인 버튼을 보이지 않는다. 등급이 모자란 것이지 세션 문제가 아니다. */
function AccessDenied({ signedIn }: { signedIn: boolean }) {
  return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
          <ShieldAlert className="text-danger h-8 w-8" />
        </div>

        <h1 className="text-ink text-2xl font-bold">접근 권한이 없습니다</h1>

        <div className="mt-6 flex gap-2">
          {!signedIn && (
              <Button asChild variant="outline" className="bg-surface border-line">
                <Link href="/login">로그인</Link>
              </Button>
          )}
          <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
            <Link href="/">홈으로</Link>
          </Button>
        </div>
      </div>
  )
}
