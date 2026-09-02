"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/i18n/locale-provider"

/** 존재하지 않는 주소로 들어왔을 때 보여주는 화면. */
export default function NotFound() {
  const { t } = useTranslation()
  return (
      <div className="bg-canvas flex min-h-screen flex-col items-center justify-center px-4 transition-colors">
        <div className="flex w-full max-w-lg flex-col items-center text-center">
          <h1 className="mb-6 text-[120px] leading-none font-black tracking-tighter text-gray-100 select-none sm:text-[150px] dark:text-[#272727]">
            404
          </h1>

          <div className="relative z-10 space-y-6">
            <div className="space-y-3">
              <h2 className="text-ink text-2xl font-bold">{t.notFound.title}</h2>
              <p className="text-ink-muted text-[15px] leading-relaxed font-medium">
                {t.notFound.description}
              </p>
            </div>

            <Button
                asChild
                className="h-11 rounded-full bg-[#0f0f0f] px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#272727] dark:bg-white dark:text-[#0f0f0f] dark:hover:bg-[#e5e5e5]"
            >
              <Link href="/">{t.notFound.goHome}</Link>
            </Button>
          </div>
        </div>
      </div>
  )
}
