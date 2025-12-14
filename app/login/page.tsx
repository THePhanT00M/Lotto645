'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Logo from "@/components/header/logo"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [currentView, setCurrentView] = useState<"login" | "forgot">("login")

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#0f0f0f] font-sans p-4 transition-colors duration-200">
      <div className="w-full max-w-[448px] bg-white dark:bg-[#1f1f1f] rounded-xl shadow-md dark:shadow-none p-8 sm:p-12 space-y-8 transition-colors duration-200">

        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <Logo variant="auth" className="scale-110" />
          </div>

          <div className="space-y-2 relative">
            {currentView === "forgot" && (
              <Button
                variant="ghost"
                onClick={() => setCurrentView("login")}
                className="absolute left-0 top-0 -ml-2 p-2 h-auto text-muted-foreground hover:bg-transparent hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {currentView === "login" ? "로그인" : "비밀번호 재설정"}
            </h2>
            <p className="text-[15px] text-gray-600 dark:text-[#aaaaaa] leading-relaxed">
              {currentView === "login"
                ? "AI 기반 로또 분석과 번호 추천 서비스를 이용하려면 로그인하세요."
                : "가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다."}
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                className="h-12 border-gray-300 dark:border-[#3f3f3f] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg bg-white dark:bg-[#121212] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
              />
            </div>

            {currentView !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    비밀번호
                  </Label>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                    onClick={() => setCurrentView("forgot")}
                  >
                    비밀번호 찾기
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호 입력"
                    className="h-12 pr-10 border-gray-300 dark:border-[#3f3f3f] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg bg-white dark:bg-[#121212] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-10 w-10 px-0 hover:bg-transparent text-gray-500 dark:text-gray-400 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            className="w-full h-11 text-[15px] font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-full shadow-none cursor-pointer transition-colors"
          >
            {currentView === "login" ? "로그인" : "재설정 링크 보내기"}
          </Button>

          {currentView !== "forgot" && (
            <>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full bg-gray-200 dark:bg-[#3f3f3f]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-[#1f1f1f] px-4 text-gray-500 dark:text-gray-400">
                    간편 로그인
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-11 border-gray-300 dark:border-[#3f3f3f] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-white rounded-lg bg-white dark:bg-[#121212] cursor-pointer transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  variant="outline"
                  className="h-11 border-gray-300 dark:border-[#3f3f3f] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-gray-700 dark:text-white rounded-lg bg-white dark:bg-[#121212] cursor-pointer transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-.96 3.64-.82 1.57.06 2.75.63 3.54 1.51-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  Apple
                </Button>
              </div>
            </>
          )}

          <div className="text-center">
            {currentView === "login" && (
              <p className="text-sm text-gray-600 dark:text-[#aaaaaa]">
                아직 계정이 없으신가요?{" "}
                <Link
                  href="/register"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ml-1 transition-colors"
                >
                  회원가입
                </Link>
              </p>
            )}
            {currentView === "forgot" && (
              <p className="text-sm text-gray-600 dark:text-[#aaaaaa]">
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  onClick={() => setCurrentView("login")}
                >
                  로그인으로 돌아가기
                </Button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer info (Optional for YouTube style) */}
      <div className="mt-8 text-xs text-gray-500 dark:text-gray-500">
        © {new Date().getFullYear()} Lotto645. All rights reserved.
      </div>
    </div>
  )
}