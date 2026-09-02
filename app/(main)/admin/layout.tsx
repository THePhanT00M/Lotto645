import type { ReactNode } from "react"
import AccessDenied from "@/components/admin/access-denied"
import AdminNav from "@/components/admin/admin-nav"
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

  return (
      <>
        <AdminNav />
        {children}
      </>
  )
}
