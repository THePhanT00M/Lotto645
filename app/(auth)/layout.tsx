import type { ReactNode } from "react"
import AuthBodyBackground from "@/components/layout/auth-body-background"

/** 헤더·푸터 없이 인증 화면만 보여주는 레이아웃. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
      <>
        <AuthBodyBackground />
        {children}
      </>
  )
}
