"use client"

import { KeyRound, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import AuthField from "@/components/auth/auth-field"
import AuthShell from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { useAuthForm } from "@/hooks/use-auth-form"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"

/** Supabase 가 요구하는 최소 길이 */
const MIN_PASSWORD_LENGTH = 8

/** 주소에 실려 온 토큰이 세션으로 바뀌기를 기다리는 시간 */
const SESSION_WAIT_MS = 1500

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
  const [stage, setStage] = useState<Stage>("checking")

  const form = useAuthForm({ password: "", confirmPassword: "" })
  const { values, errors, setErrors, isSubmitting, setIsSubmitting, handleChange } = form

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return

      if (session) {
        setStage("ready")
        // 주소창에 토큰이 남지 않게 지운다. 화면을 공유하거나 기록이 남을 수 있다.
        window.history.replaceState(null, "", window.location.pathname)
        return
      }

      // 주소에서 토큰을 읽어 세션으로 바꾸는 데 잠깐 걸린다. 한 번 더 본다.
      await new Promise((resolve) => setTimeout(resolve, SESSION_WAIT_MS))
      if (cancelled) return

      const { data: { session: retried } } = await supabase.auth.getSession()
      if (cancelled) return

      setStage(retried ? "ready" : "expired")
      if (retried) window.history.replaceState(null, "", window.location.pathname)
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [])

  const save = async () => {
    const validation: Record<string, string> = {}
    if (values.password.length < MIN_PASSWORD_LENGTH) {
      validation.password = `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`
    }
    if (values.password !== values.confirmPassword) {
      validation.confirmPassword = "비밀번호가 일치하지 않습니다."
    }

    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.updateUser({ password: values.password })
      if (error) throw error

      toast({ title: "비밀번호를 바꿨습니다.", description: "새 비밀번호로 이용해 주세요." })
      router.push("/account/profile")
      router.refresh()
    } catch (error) {
      setErrors({
        password: error instanceof Error ? error.message : "비밀번호를 바꾸지 못했습니다.",
        confirmPassword: " ",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (stage === "checking") {
    return (
        <AuthShell description="링크를 확인하는 중입니다.">
          <div className="flex justify-center py-4">
            <Loader2 className="text-ink-muted h-6 w-6 animate-spin" />
          </div>
        </AuthShell>
    )
  }

  if (stage === "expired") {
    return (
        <AuthShell description="링크가 만료되었거나 이미 사용된 링크입니다.">
          <div className="space-y-4 text-center">
            <p className="text-ink-muted text-sm leading-relaxed">
              재설정 링크는 한 번만 쓸 수 있고 일정 시간이 지나면 만료됩니다.
              <br />
              로그인 화면에서 다시 요청해 주세요.
            </p>

            <Button
                asChild
                className="h-11 w-full rounded-full bg-blue-600 text-[15px] font-medium text-white hover:bg-blue-700"
            >
              <Link href="/login">로그인으로 가기</Link>
            </Button>
          </div>
        </AuthShell>
    )
  }

  return (
      <AuthShell description="새로 쓸 비밀번호를 입력해 주세요.">
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
                label="새 비밀번호"
                placeholder={`${MIN_PASSWORD_LENGTH}자 이상`}
                value={values.password}
                onChange={handleChange}
                disabled={isSubmitting}
                error={errors.password}
            />

            <AuthField
                id="confirmPassword"
                type="password"
                label="새 비밀번호 확인"
                placeholder="한 번 더 입력"
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
            비밀번호 바꾸기
          </Button>
        </form>
      </AuthShell>
  )
}
