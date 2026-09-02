"use client"

import { KeyRound, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import AuthField from "@/components/auth/auth-field"
import AuthShell from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { useAuthForm } from "@/hooks/use-auth-form"
import { useTranslation } from "@/components/i18n/locale-provider"
import { useToast } from "@/hooks/use-toast"
import { authErrorKey } from "@/lib/auth/error-messages"
import { supabase } from "@/lib/supabase/client"

/** Supabase 가 요구하는 최소 길이 */
const MIN_PASSWORD_LENGTH = 8

/** 주소창과 방문 기록에 토큰이 남지 않게 지운다. */
const clearTokenFromUrl = () => window.history.replaceState(null, "", window.location.pathname)

type Stage = "checking" | "ready" | "expired"

/**
 * 비밀번호 변경
 *
 * 메일로 받은 재설정 링크를 누르면 도착하는 화면이다. 링크에 실려 온 토큰으로
 * 이미 로그인된 상태가 되므로, 예전 비밀번호를 묻지 않고 새 비밀번호만 받는다.
 * 로그인한 사람이 설정에서 직접 들어와도 같은 화면을 쓴다.
 */
export default function UpdatePasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [stage, setStage] = useState<Stage>("checking")
  // 어느 계정의 비밀번호를 바꾸는지 보여 준다. 링크가 만료된 채 이미 로그인해
  // 있으면 엉뚱한 계정을 바꿀 수 있어, 눈으로 먼저 확인하게 한다.
  const [account, setAccount] = useState<string | null>(null)

  const form = useAuthForm({ password: "", confirmPassword: "" })
  const { values, errors, setErrors, isSubmitting, setIsSubmitting, handleChange } = form

  useEffect(() => {
    let cancelled = false

    const start = async () => {
      // 링크에 실려 온 토큰을 먼저 직접 읽어 세션으로 세운다. 라이브러리가 주소를
      // 알아서 읽어 주기를 기다리면, 이미 로그인해 있던 사람은 그 세션이 먼저
      // 잡혀 '남의 링크로 내 비밀번호를 바꾸는' 상태가 된다.
      const hash = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = hash.get("access_token")
      const refreshToken = hash.get("refresh_token")

      if (accessToken && refreshToken && hash.get("type") === "recovery") {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (cancelled) return

        clearTokenFromUrl()
        setStage(error ? "expired" : "ready")
        if (!error) await readAccount()
        return
      }

      // 라이브러리가 먼저 읽어 갔거나, 로그인한 사람이 직접 들어온 경우.
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return

      clearTokenFromUrl()
      setStage(session ? "ready" : "expired")
      if (session) setAccount(session.user.email ?? null)
    }

    const readAccount = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!cancelled) setAccount(user?.email ?? null)
    }

    void start()
    return () => {
      cancelled = true
    }
  }, [])

  const save = async () => {
    const validation: Record<string, string> = {}
    if (values.password.length < MIN_PASSWORD_LENGTH) {
      validation.password = t.auth.validation.passwordLength(MIN_PASSWORD_LENGTH)
    }
    if (values.password !== values.confirmPassword) {
      validation.confirmPassword = t.auth.validation.passwordMismatch
    }

    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.updateUser({ password: values.password })
      if (error) throw error

      toast({ title: t.auth.updatePassword.done, description: t.auth.updatePassword.doneDescription })
      router.push("/account/profile")
      router.refresh()
    } catch (error) {
      setErrors({ password: t.auth.errors[authErrorKey(error)], confirmPassword: " " })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (stage === "checking") {
    return (
        <AuthShell description={t.auth.updatePassword.checking}>
          <div className="flex justify-center py-4">
            <Loader2 className="text-ink-muted h-6 w-6 animate-spin" />
          </div>
        </AuthShell>
    )
  }

  if (stage === "expired") {
    return (
        <AuthShell description={t.auth.updatePassword.expired}>
          <div className="space-y-4 text-center">
            <p className="text-ink-muted text-sm leading-relaxed">
              {t.auth.updatePassword.expiredDescription}
            </p>

            <Button
                asChild
                className="h-11 w-full rounded-full bg-blue-600 text-[15px] font-medium text-white hover:bg-blue-700"
            >
              <Link href="/login">{t.auth.updatePassword.goToLogin}</Link>
            </Button>
          </div>
        </AuthShell>
    )
  }

  return (
      <AuthShell
          description={
            account ? (
                <>
                  {t.auth.updatePassword.forAccount(account)}
                </>
            ) : (
                t.auth.updatePassword.description
            )
          }
      >
        <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault()
              void save()
            }}
        >
          <div className="space-y-5">
            <AuthField
                id="password"
                type="password"
                label={t.auth.updatePassword.newPassword}
                placeholder={t.auth.updatePassword.newPasswordPlaceholder(MIN_PASSWORD_LENGTH)}
                value={values.password}
                onChange={handleChange}
                disabled={isSubmitting}
                error={errors.password}
            />

            <AuthField
                id="confirmPassword"
                type="password"
                label={t.auth.updatePassword.confirm}
                placeholder={t.auth.updatePassword.confirmPlaceholder}
                value={values.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                error={errors.confirmPassword}
            />
          </div>

          <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-full bg-blue-600 text-[15px] font-medium text-white transition-colors hover:bg-blue-700"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
            {t.auth.updatePassword.submit}
          </Button>
        </form>
      </AuthShell>
  )
}
