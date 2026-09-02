"use client"

import { LogIn } from "lucide-react"
import Link from "next/link"
import LoginLink from "@/components/auth/login-link"
import { useTranslation } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"

/** 로그인이 필요한 화면에 들어왔을 때 보여주는 안내. */
export default function SignInRequired() {
  const { t } = useTranslation()

  return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <div className="bg-accent-soft mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <LogIn className="text-accent h-8 w-8" />
        </div>

        <h1 className="text-ink text-2xl font-bold">{t.auth.signInRequired.title}</h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          {t.auth.signInRequired.description}
        </p>

        <div className="mt-6 flex gap-2">
          <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
            <LoginLink>{t.nav.login}</LoginLink>
          </Button>
          <Button asChild variant="outline" className="bg-surface border-line">
            <Link href="/">{t.common.home}</Link>
          </Button>
        </div>
      </div>
  )
}
