"use client"

import { ShieldAlert } from "lucide-react"
import Link from "next/link"
import LoginLink from "@/components/auth/login-link"
import { useTranslation } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"

/**
 * 관리자 화면에 들어올 수 없을 때 보여주는 안내
 *
 * 로그인한 사람에게는 로그인 버튼을 보이지 않는다. 등급이 모자란 것이지
 * 세션 문제가 아니다.
 */
export default function AccessDenied({ signedIn }: { signedIn: boolean }) {
  const { t } = useTranslation()

  return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
          <ShieldAlert className="text-danger h-8 w-8" />
        </div>

        <h1 className="text-ink text-2xl font-bold">{t.admin.denied.title}</h1>

        <div className="mt-6 flex gap-2">
          {!signedIn && (
              <Button asChild variant="outline" className="bg-surface border-line">
                <LoginLink>{t.nav.login}</LoginLink>
              </Button>
          )}
          <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
            <Link href="/">{t.common.home}</Link>
          </Button>
        </div>
      </div>
  )
}
