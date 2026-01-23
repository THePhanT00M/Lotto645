'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react" // AlertCircle 아이콘 추가
import Link from "next/link"
import Logo from "@/components/header/logo"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()

  // 상태 관리
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  // 에러 메시지 상태 관리
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // 입력 핸들러 (입력 시 해당 필드의 에러 초기화)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))

    // 사용자가 입력을 시작하면 해당 필드의 에러 메시지 삭제
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[id]
        return newErrors
      })
    }
  }

  // 이메일 회원가입 로직
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { [key: string]: string } = {}

    // 유효성 검사 수행
    if (!formData.name.trim()) newErrors.name = "이름을 입력해주세요."
    if (!formData.email.trim()) {
      newErrors.email = "이메일을 입력해주세요."
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다."
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요."
    } else if (formData.password.length < 6) {
      newErrors.password = "비밀번호는 최소 6자 이상이어야 합니다."
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다."
    }

    // 에러가 있으면 상태 업데이트 후 중단
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data.user) {
        toast({
          title: "회원가입 신청 완료",
          description: "이메일 인증 링크가 전송되었습니다.",
        })
        router.push("/login")
      }
    } catch (error: any) {
      // 서버 에러(중복 이메일 등) 발생 시 이메일 필드 아래에 표시
      setErrors({ email: error.message || "회원가입 중 오류가 발생했습니다." })
    } finally {
      setIsLoading(false)
    }
  }

  // 에러 메시지 컴포넌트
  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null
    return (
        <div className="flex items-center mt-1.5 text-red-500 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs font-medium">{message}</span>
        </div>
    )
  }

  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#0f0f0f] font-sans p-4 transition-colors duration-200">
        <div className="w-full max-w-[448px] bg-white dark:bg-[#1f1f1f] rounded-xl shadow-md dark:shadow-none p-8 sm:p-12 space-y-8 transition-colors duration-200">

          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <Logo variant="auth" className="scale-110" />
            </div>
            <p className="text-[15px] text-gray-600 dark:text-[#aaaaaa] leading-relaxed">
              Lotto645를 시작하려면 계정을 만드세요.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-5">
              {/* 이름 입력 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">이름</Label>
                <Input
                    id="name"
                    placeholder="홍길동"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={cn(
                        "h-12 border-gray-300 dark:border-[#3f3f3f] focus:ring-2 rounded-lg bg-white dark:bg-[#121212] transition-all",
                        errors.name && "border-red-500 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500"
                    )}
                />
                <ErrorMessage message={errors.name} />
              </div>

              {/* 이메일 입력 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">이메일</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="user@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={cn(
                        "h-12 border-gray-300 dark:border-[#3f3f3f] focus:ring-2 rounded-lg bg-white dark:bg-[#121212] transition-all",
                        errors.email && "border-red-500 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500"
                    )}
                />
                <ErrorMessage message={errors.email} />
              </div>

              {/* 비밀번호 입력 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">비밀번호</Label>
                <div className="relative">
                  <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="비밀번호 입력"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={cn(
                          "h-12 pr-10 border-gray-300 dark:border-[#3f3f3f] focus:ring-2 rounded-lg bg-white dark:bg-[#121212] transition-all",
                          errors.password && "border-red-500 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500"
                      )}
                  />
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-10 w-10 px-0 hover:bg-transparent text-gray-500 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                <ErrorMessage message={errors.password} />
              </div>

              {/* 비밀번호 확인 입력 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">비밀번호 확인</Label>
                <div className="relative">
                  <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="비밀번호 확인"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={cn(
                          "h-12 pr-10 border-gray-300 dark:border-[#3f3f3f] focus:ring-2 rounded-lg bg-white dark:bg-[#121212] transition-all",
                          errors.confirmPassword && "border-red-500 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500"
                      )}
                  />
                  <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-10 w-10 px-0 hover:bg-transparent text-gray-500 cursor-pointer"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                <ErrorMessage message={errors.confirmPassword} />
              </div>
            </div>

            <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-[15px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full cursor-pointer transition-colors"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "계정 만들기"}
            </Button>

            {/* ... (소셜 로그인 및 하단 링크 섹션은 이전과 동일) */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-gray-200 dark:bg-[#3f3f3f]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#1f1f1f] px-4 text-gray-500 dark:text-gray-400">
                또는 다음으로 회원가입
              </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-gray-300 dark:border-[#3f3f3f] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-white rounded-lg bg-white dark:bg-[#121212] cursor-pointer transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
              <Button
                  type="button"
                  variant="outline"
                  className="h-11 border-gray-300 dark:border-[#3f3f3f] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-white rounded-lg bg-white dark:bg-[#121212] cursor-pointer transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-.96 3.64-.82 1.57.06 2.75.63 3.54 1.51-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Apple
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-[#aaaaaa]">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors ml-1">
                  로그인
                </Link>
              </p>
            </div>
          </form>
        </div>
        <div className="mt-8 text-xs text-gray-500">© {new Date().getFullYear()} Lotto645. All rights reserved.</div>
      </div>
  )
}