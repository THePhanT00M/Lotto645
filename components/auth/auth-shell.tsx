import type { ReactNode } from "react"
import Logo from "@/components/layout/header/logo"

interface AuthShellProps {
  /** 로고 아래에 놓는 안내 문구 */
  description: ReactNode
  children: ReactNode
}

/** 로그인·회원가입 화면을 감싸는 카드 레이아웃. */
export default function AuthShell({ description, children }: AuthShellProps) {
  return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-auth-canvas p-4 transition-colors duration-200">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-auth-card p-8 shadow-md transition-colors duration-200 sm:p-12 dark:shadow-none">
          <div className="space-y-4 text-center">
            <div className="mb-6 flex justify-center">
              <Logo variant="auth" className="scale-110" />
            </div>
            <p className="text-ink-muted text-[15px] leading-relaxed">{description}</p>
          </div>

          {children}
        </div>

        <p className="text-ink-muted mt-8 text-xs">
          © {new Date().getFullYear()} Lotto645. All rights reserved.
        </p>
      </div>
  )
}
