"use client"

import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/components/i18n/locale-provider"
import AuthField from "@/components/auth/auth-field"
import AuthShell from "@/components/auth/auth-shell"
import SocialLogin, { type SocialProvider } from "@/components/auth/social-login"
import { Button } from "@/components/ui/button"
import { isValidEmail, useAuthForm } from "@/hooks/use-auth-form"
import { useNextPath } from "@/hooks/use-next-path"
import { useToast } from "@/hooks/use-toast"
import { authErrorKey } from "@/lib/auth/error-messages"
import type { Messages } from "@/lib/i18n/messages/types"
import { loginHref } from "@/lib/auth/redirect"
import { writeLocaleCookie } from "@/lib/i18n/client"
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/locales"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

/** Supabase가 요구하는 최소 비밀번호 길이 */
const MIN_PASSWORD_LENGTH = 6

/**
 * 회원가입
 *
 * 이메일 가입은 인증 메일 발송으로 끝나고, 소셜 가입은 로그인과 같은
 * OAuth 흐름을 그대로 탄다.
 */
export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t, locale } = useTranslation()
  const nextPath = useNextPath()

  /**
   * 고른 언어를 바로 적용한다.
   *
   * 가입 화면 자체가 그 말로 바뀌어야 무엇을 적는 칸인지 알 수 있다. 계정에는
   * 가입이 끝난 뒤에야 담을 수 있으므로, 고른 값을 회원 정보에도 함께 실어
   * 첫 로그인 때 계정으로 옮긴다.
   */
  const changeLanguage = (next: Locale) => {
    writeLocaleCookie(next)
    router.refresh()
  }

  const form = useAuthForm({ name: "", email: "", password: "", confirmPassword: "" })
  const { values, errors, setErrors, isSubmitting, setIsSubmitting, handleChange } = form

  const register = async () => {
    const validation = validate(values, t.auth.validation)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.name, language: locale },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      })

      if (error) throw error

      // 이미 가입된 이메일이면 Supabase가 identities를 비워서 돌려준다.
      if (data.user?.identities?.length === 0) {
        setErrors({ email: t.auth.errors.userAlreadyExists })
        return
      }

      toast({ title: t.auth.register.done, description: t.auth.register.doneDescription })
      router.push(loginHref(nextPath))
    } catch (error) {
      const isWeakPassword = typeof error === "object" && error !== null && "code" in error && error.code === "weak_password"
      const message = t.auth.errors[authErrorKey(error)]

      // 비밀번호 규칙은 비밀번호 칸에, 나머지는 이메일 칸에 붙여야 눈이 간다.
      setErrors(isWeakPassword ? { password: message } : { email: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const signUpWithProvider = async (provider: SocialProvider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })

    if (error) {
      toast({ variant: "destructive", title: t.auth.register.failed, description: error.message })
    }
  }

  return (
      <AuthShell description={t.auth.register.description}>
        <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault()
              void register()
            }}
        >
          <div className="space-y-2">
            <span className="text-ink block text-sm font-medium">{t.auth.languageLabel}</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LOCALES.map((option) => (
                  <button
                      key={option}
                      type="button"
                      onClick={() => changeLanguage(option)}
                      className={cn(
                          "border-line rounded-lg border px-2 py-2 text-sm transition-colors",
                          locale === option
                              ? "border-accent-line bg-accent-soft text-accent font-medium"
                              : "bg-surface text-ink-muted hover:bg-hover",
                      )}
                  >
                    {LOCALE_NAMES[option]}
                  </button>
              ))}
            </div>
            <p className="text-ink-muted text-xs">{t.auth.languageHint}</p>
          </div>

          <div className="space-y-5">
            <AuthField
                id="name"
                label={t.auth.register.name}
                placeholder={t.auth.register.namePlaceholder}
                value={values.name}
                onChange={handleChange}
                disabled={isSubmitting}
                error={errors.name}
            />
            <AuthField
                id="email"
                type="email"
                label={t.auth.login.email}
                placeholder="user@company.com"
                value={values.email}
                onChange={handleChange}
                disabled={isSubmitting}
                error={errors.email}
            />
            <AuthField
                id="password"
                type="password"
                label={t.auth.login.password}
                placeholder={t.auth.login.passwordPlaceholder}
                value={values.password}
                onChange={handleChange}
                disabled={isSubmitting}
                error={errors.password}
            />
            <AuthField
                id="confirmPassword"
                type="password"
                label={t.auth.register.passwordConfirm}
                placeholder={t.auth.register.passwordConfirm}
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
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t.auth.register.submit}
          </Button>

          <SocialLogin label={t.auth.register.social} onSelect={signUpWithProvider} />

          <p className="text-ink-muted text-center text-sm">
            {t.auth.register.haveAccount}
            <Link href={loginHref(nextPath)} className="ml-1 font-medium text-blue-600 dark:text-blue-400">
              {t.auth.register.login}
            </Link>
          </p>
        </form>
      </AuthShell>
  )
}

/** 가입 폼 입력값을 검사해 필드별 에러를 만든다. */
/** 입력을 확인한다. 문구는 화면에서 그때의 언어로 받아 온다. */
const validate = (
    values: { name: string; email: string; password: string; confirmPassword: string },
    messages: Messages["auth"]["validation"],
) => {
  const errors: Record<string, string> = {}

  if (!values.name.trim()) errors.name = messages.name

  if (!values.email.trim()) errors.email = messages.email
  else if (!isValidEmail(values.email)) errors.email = messages.emailFormat

  if (!values.password) errors.password = messages.password
  else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = messages.passwordLength(MIN_PASSWORD_LENGTH)
  }

  if (values.password !== values.confirmPassword) errors.confirmPassword = messages.passwordMismatch

  return errors
}
