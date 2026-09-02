"use client"

import { Loader2, Monitor, Moon, Settings, Sun, UserMinus } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTranslation } from "@/components/i18n/locale-provider"
import { Panel } from "@/components/common/panel"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { authorizedFetch } from "@/lib/auth/client"
import { clearSessionMark, getRememberLogin, setRememberLogin } from "@/lib/auth/session-persistence"
import { writeLocaleCookie } from "@/lib/i18n/client"
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/locales"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const THEMES = ["light", "dark", "system"] as const
const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } as const

/**
 * 설정
 *
 * 화면 테마와 언어, 자동 로그인 여부, 그리고 탈퇴를 다룬다. 언어는 계정에
 * 저장되므로 기기를 옮겨도 따라온다.
 */
export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { t, locale } = useTranslation()

  const [isMounted, setIsMounted] = useState(false)
  const [remember, setRemember] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  // 테마와 저장소 값은 브라우저에서만 읽을 수 있다.
  useEffect(() => {
    setIsMounted(true)
    setRemember(getRememberLogin())
  }, [])

  const changeRemember = (value: boolean) => {
    setRemember(value)
    setRememberLogin(value)
    toast({ title: t.settings.autoLogin.saved, description: value ? t.settings.autoLogin.on : t.settings.autoLogin.off })
  }

  const changeLanguage = (next: Locale) => {
    writeLocaleCookie(next)

    void authorizedFetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: next }),
    }).catch(() => {
      // 계정 저장이 실패해도 이 브라우저에서는 바뀐 대로 보인다.
    })

    router.refresh()
  }

  /** 탈퇴한 뒤에는 남은 세션을 정리하고 첫 화면으로 돌린다. */
  const withdraw = async () => {
    setIsLeaving(true)

    try {
      const response = await authorizedFetch("/api/account", { method: "DELETE" })
      const data = await response.json()

      if (!data.success) throw new Error(data.message)

      await supabase.auth.signOut()
      clearSessionMark()

      toast({ title: t.settings.account.done })
      router.push("/")
      router.refresh()
    } catch (error) {
      setIsLeaving(false)
      toast({
        variant: "destructive",
        title: t.settings.account.failed,
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-ink flex items-center gap-2 text-2xl font-bold">
            <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {t.settings.title}
          </h1>
          <p className="text-ink-muted mt-1 text-sm">{t.settings.description}</p>
        </div>

        <Panel className="space-y-3">
          <h2 className="text-ink font-semibold">{t.settings.theme.title}</h2>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((value) => {
              const Icon = THEME_ICONS[value]

              return (
                  <button
                      key={value}
                      type="button"
                      onClick={() => setTheme(value)}
                      className={cn(
                          "border-line flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-sm transition-colors",
                          isMounted && theme === value
                              ? "border-accent-line bg-accent-soft text-accent"
                              : "bg-surface text-ink-muted hover:bg-hover",
                      )}
                  >
                    <Icon className="h-5 w-5" />
                    {t.settings.theme[value]}
                  </button>
              )
            })}
          </div>
        </Panel>

        <Panel className="space-y-3">
          <h2 className="text-ink font-semibold">{t.settings.language.title}</h2>
          <p className="text-ink-muted text-sm">{t.settings.language.description}</p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LOCALES.map((option) => (
                <button
                    key={option}
                    type="button"
                    onClick={() => changeLanguage(option)}
                    className={cn(
                        "border-line rounded-lg border px-3 py-3 text-sm transition-colors",
                        locale === option
                            ? "border-accent-line bg-accent-soft text-accent font-medium"
                            : "bg-surface text-ink-muted hover:bg-hover",
                    )}
                >
                  {LOCALE_NAMES[option]}
                </button>
            ))}
          </div>
        </Panel>

        <Panel>
          {/* 제목이 곧 항목 이름이라, 별도 라벨 없이 한 줄에 둔다. */}
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="text-ink font-semibold">{t.settings.autoLogin.title}</span>
            <input
                type="checkbox"
                checked={remember}
                onChange={(event) => changeRemember(event.target.checked)}
                className="border-line h-4 w-4 rounded accent-blue-600"
            />
          </label>
        </Panel>

        <Panel className="space-y-3">
          <h2 className="text-ink font-semibold">{t.settings.account.title}</h2>
          <p className="text-ink-muted text-sm leading-relaxed">{t.settings.account.withdrawDescription}</p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                  variant="destructive"
                  disabled={isLeaving}
                  className="bg-danger hover:bg-danger/90 border-none text-white shadow-none"
              >
                {isLeaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <UserMinus className="mr-2 h-4 w-4" />
                )}
                {isLeaving ? t.settings.account.withdrawing : t.settings.account.withdraw}
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="bg-surface border-line border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-ink">{t.settings.account.confirmTitle}</AlertDialogTitle>
                <AlertDialogDescription className="text-ink-muted leading-relaxed">
                  {t.settings.account.confirmDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-ink border-line bg-transparent">
                  {t.common.cancel}
                </AlertDialogCancel>
                <AlertDialogAction
                    onClick={() => void withdraw()}
                    className="bg-danger hover:bg-danger/90 text-white"
                >
                  {t.settings.account.confirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Panel>
      </div>
  )
}
