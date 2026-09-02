"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ComponentProps } from "react"
import { loginHref } from "@/lib/auth/redirect"

type LoginLinkProps = Omit<ComponentProps<typeof Link>, "href">

/**
 * 로그인 화면으로 보내는 링크.
 *
 * 지금 보던 경로를 함께 넘겨, 로그인을 마치면 메인이 아니라 그 자리로 돌아오게 한다.
 * 서버 컴포넌트에서도 쓸 수 있도록 경로 판단을 이 컴포넌트 안에 가둔다.
 */
export default function LoginLink(props: LoginLinkProps) {
  const pathname = usePathname()

  return <Link {...props} href={loginHref(pathname)} />
}
