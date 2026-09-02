"use client"

import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import AuthField from "@/components/auth/auth-field"
import AuthShell from "@/components/auth/auth-shell"
import SocialLogin, { type SocialProvider } from "@/components/auth/social-login"
import { Button } from "@/components/ui/button"
import { isValidEmail, useAuthForm } from "@/hooks/use-auth-form"
import { useNextPath } from "@/hooks/use-next-path"
import { useToast } from "@/hooks/use-toast"
import { describeAuthError } from "@/lib/auth/error-messages"
import { writeLocaleCookie } from "@/lib/i18n/client"
import { DEFAULT_LOCALE, toLocale } from "@/lib/i18n/locales"
import { registerHref } from "@/lib/auth/redirect"
import { getRememberLogin, setRememberLogin } from "@/lib/auth/session-persistence"
import { supabase } from "@/lib/supabase/client"

/** 로그인 화면과 비밀번호 재설정 화면을 전환한다. */
type View = "login" | "forgot"

/**
 * 로그인
 *
 * 이메일·비밀번호 로그인과 소셜 로그인을 제공하고, 같은 화면에서
 * 비밀번호 재설정 메일 발송으로 전환할 수 있다.
 *
 * 로그인을 마치면 메인이 아니라 로그인 버튼을 누른 화면으로 돌려보낸다.
 */
export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [view, setView] = useState<View>("login")
  const [rememberLogin, setRemember] = useState(true)
  const nextPath = useNextPath()

  // 지난번 선택을 그대로 보여 준다.
  useEffect(() => setRemember(getRememberLogin()), [])

  const form = useAuthForm({ email: "", password: "" })
  const { values, errors, setErrors, isSubmitting, setIsSubmitting, handleChange } = form

  const login = async () => {
    const validation: Record<string, string> = {}
    if (!values.email.trim()) validation.email = "이메일을 입력해주세요."
    else if (!isValidEmail(values.email)) validation.email = "올바른 이메일 형식이 아닙니다."
    if (!values.password) validation.password = "비밀번호를 입력해주세요."

    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }

    setIsSubmitting(true)
    // 로그인으로 세션이 만들어지기 전에 저장해야, 창을 새로 열었을 때 판단할 수 있다.
    setRememberLogin(rememberLogin)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        // 어느 쪽이 틀렸는지 알리지 않되 두 입력 모두 강조한다.
        setErrors({ email: describeAuthError(error, "로그인하지 못했습니다."), password: " " })
        return
      }

      // 계정에 담긴 언어를 이 브라우저에도 옮겨, 다음 화면부터 그 말로 보이게 한다.
      await applyAccountLocale()

      router.push(nextPath)
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "로그인 실패",
        description: describeAuthError(error, "오류가 발생했습니다."),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * 계정에 담긴 언어를 이 브라우저에 적어 둔다.
   *
   * 가입할 때 고른 언어는 그 시점에 계정이 없어 회원 정보에만 실려 있다.
   * 계정 쪽이 아직 기본값이면 그 값을 계정으로 옮겨, 다음부터는 계정만 보면
   * 되게 한다.
   */
  const applyAccountLocale = async () => {
    try {
      const [{ data: { user } }, response] = await Promise.all([supabase.auth.getUser(), fetch("/api/profile")])
      const data = await response.json()
      if (!data.success) return

      const saved = toLocale(data.profile?.language)
      const chosenAtSignUp = toLocale(user?.user_metadata?.language)
      const locale = saved === DEFAULT_LOCALE && chosenAtSignUp !== DEFAULT_LOCALE ? chosenAtSignUp : saved

      if (locale !== saved) {
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: locale }),
        })
      }

      writeLocaleCookie(locale)
    } catch {
      // 언어를 못 읽어도 로그인 자체는 끝났다. 지금 쿠키에 있는 언어로 이어 간다.
    }
  }

  const sendResetMail = async () => {
    if (!values.email.trim()) {
      setErrors({ email: "이메일을 입력해주세요." })
      return
    }

    setIsSubmitting(true)
    try {
      // 서버가 대신 보낸다. 브라우저에서 보내면 링크에 딸린 코드를 풀 검증값이
      // 이 브라우저에만 남아, 메일을 다른 기기에서 열면 열리지 않는다.
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.message)

      toast({ title: "메일을 보냈습니다", description: data.message })
      setView("login")
    } catch (error) {
      setErrors({ email: describeAuthError(error, "메일 전송에 실패했습니다.") })
    } finally {
      setIsSubmitting(false)
    }
  }

  const signInWithProvider = async (provider: SocialProvider) => {
    setRememberLogin(rememberLogin)

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      // 소셜 로그인은 화면을 떠났다가 콜백으로 돌아오므로, 돌아갈 경로도 주소에 실어 보낸다.
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    })

    if (error) {
      toast({ variant: "destructive", title: "로그인 실패", description: error.message })
    }
  }

  const isLogin = view === "login"

  const switchView = (next: View) => {
    setView(next)
    setErrors({})
  }

  return (
      <AuthShell
          description={
            isLogin
                ? "번호 생성 및 추천 서비스를 이용하려면 로그인하세요."
                : "가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다."
          }
      >
        <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault()
              void (isLogin ? login() : sendResetMail())
            }}
        >
          <div className="space-y-5">
            <AuthField
                id="email"
                type="email"
                label="이메일"
                placeholder="example@email.com"
                value={values.email}
                onChange={handleChange}
                disabled={isSubmitting}
                error={errors.email}
            />

            {isLogin && (
                <AuthField
                    id="password"
                    type="password"
                    label="비밀번호"
                    placeholder="비밀번호 입력"
                    value={values.password}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    error={errors.password}
                    action={
                      <Button
                          type="button"
                          variant="link"
                          onClick={() => switchView("forgot")}
                          className="h-auto p-0 text-sm font-medium text-blue-600 dark:text-blue-400"
                      >
                        비밀번호 찾기
                      </Button>
                    }
                />
            )}
          </div>

          {isLogin && (
              <label className="text-ink-muted flex cursor-pointer items-center gap-2 text-sm select-none">
                <input
                    type="checkbox"
                    checked={rememberLogin}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="border-line h-4 w-4 rounded accent-blue-600"
                />
                자동 로그인
              </label>
          )}

          <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-full bg-blue-600 text-[15px] font-medium text-white transition-colors hover:bg-blue-700"
          >
            {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLogin ? (
                "로그인"
            ) : (
                "재설정 링크 보내기"
            )}
          </Button>

          {isLogin && <SocialLogin label="간편 로그인" onSelect={signInWithProvider} />}

          <div className="text-center">
            {isLogin ? (
                <p className="text-ink-muted text-sm">
                  아직 계정이 없으신가요?
                  <Link href={registerHref(nextPath)} className="ml-1 font-medium text-blue-600 dark:text-blue-400">
                    회원가입
                  </Link>
                </p>
            ) : (
                <Button
                    type="button"
                    variant="link"
                    onClick={() => switchView("login")}
                    className="h-auto p-0 font-medium text-blue-600 dark:text-blue-400"
                >
                  로그인으로 돌아가기
                </Button>
            )}
          </div>
        </form>
      </AuthShell>
  )
}
