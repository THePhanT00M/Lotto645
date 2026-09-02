"use client"

import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import AuthField from "@/components/auth/auth-field"
import AuthShell from "@/components/auth/auth-shell"
import SocialLogin, { type SocialProvider } from "@/components/auth/social-login"
import { Button } from "@/components/ui/button"
import { isValidEmail, useAuthForm } from "@/hooks/use-auth-form"
import { useNextPath } from "@/hooks/use-next-path"
import { useToast } from "@/hooks/use-toast"
import { describeAuthError } from "@/lib/auth/error-messages"
import { loginHref } from "@/lib/auth/redirect"
import { supabase } from "@/lib/supabase/client"

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
  const nextPath = useNextPath()

  const form = useAuthForm({ name: "", email: "", password: "", confirmPassword: "" })
  const { values, errors, setErrors, isSubmitting, setIsSubmitting, handleChange } = form

  const register = async () => {
    const validation = validate(values)
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
          data: { full_name: values.name },
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      })

      if (error) throw error

      // 이미 가입된 이메일이면 Supabase가 identities를 비워서 돌려준다.
      if (data.user?.identities?.length === 0) {
        setErrors({ email: "이미 등록된 이메일입니다." })
        return
      }

      toast({ title: "회원가입 신청 완료", description: "이메일 인증 링크가 전송되었습니다." })
      router.push(loginHref(nextPath))
    } catch (error) {
      const isWeakPassword = typeof error === "object" && error !== null && "code" in error && error.code === "weak_password"
      const message = describeAuthError(error, "회원가입 중 오류가 발생했습니다.")

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
      toast({ variant: "destructive", title: "회원가입 실패", description: error.message })
    }
  }

  return (
      <AuthShell description="Lotto645를 시작하려면 계정을 만드세요.">
        <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault()
              void register()
            }}
        >
          <div className="space-y-5">
            <AuthField
                id="name"
                label="이름"
                placeholder="홍길동"
                value={values.name}
                onChange={handleChange}
                disabled={isSubmitting}
                error={errors.name}
            />
            <AuthField
                id="email"
                type="email"
                label="이메일"
                placeholder="user@company.com"
                value={values.email}
                onChange={handleChange}
                disabled={isSubmitting}
                error={errors.email}
            />
            <AuthField
                id="password"
                type="password"
                label="비밀번호"
                placeholder="비밀번호 입력"
                value={values.password}
                onChange={handleChange}
                disabled={isSubmitting}
                error={errors.password}
            />
            <AuthField
                id="confirmPassword"
                type="password"
                label="비밀번호 확인"
                placeholder="비밀번호 확인"
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
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "계정 만들기"}
          </Button>

          <SocialLogin label="또는 다음으로 회원가입" onSelect={signUpWithProvider} />

          <p className="text-ink-muted text-center text-sm">
            이미 계정이 있으신가요?
            <Link href={loginHref(nextPath)} className="ml-1 font-medium text-blue-600 dark:text-blue-400">
              로그인
            </Link>
          </p>
        </form>
      </AuthShell>
  )
}

/** 가입 폼 입력값을 검사해 필드별 에러를 만든다. */
const validate = (values: { name: string; email: string; password: string; confirmPassword: string }) => {
  const errors: Record<string, string> = {}

  if (!values.name.trim()) errors.name = "이름을 입력해주세요."

  if (!values.email.trim()) errors.email = "이메일을 입력해주세요."
  else if (!isValidEmail(values.email)) errors.email = "올바른 이메일 형식이 아닙니다."

  if (!values.password) errors.password = "비밀번호를 입력해주세요."
  else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`
  }

  if (values.password !== values.confirmPassword) errors.confirmPassword = "비밀번호가 일치하지 않습니다."

  return errors
}
